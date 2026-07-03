#!/usr/bin/env node
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const contractPath = path.join(root, 'docs/orchestrator/2026-07-03-browser-render-proof-report-contract.md');
const reportPath = String(process.env.BROWSER_RENDER_PROOF_REPORT_PATH || '').trim();
const validFixturePath = path.join(root, 'docs/orchestrator/browser-render-proof-report-fixtures/valid-flipflop-service-scoped.json');
const invalidSensitiveFixturePath = path.join(root, 'docs/orchestrator/browser-render-proof-report-fixtures/invalid-sensitive-key.json');
const requiredPolicyFlags = [
  'noTokenValues',
  'noCookies',
  'noCustomerPii',
  'noRawOrderRows',
  'noDatabaseDump',
  'noPaymentReference',
  'noTrackingValues',
  'noProviderPayload',
  'artifactsRedacted',
];
const allowedStatuses = new Set(['proven', 'incomplete', 'blocked']);
const allowedProofModes = new Set(['safe_human_session', 'service_scoped_proxy']);
const allowedRefreshMechanisms = new Set(['manual_refresh', 'visible_polling_30s', 'full_reload', 'api_backed_render_probe']);
const allowedSurfaces = new Set(['customer_cabinet', 'admin_cabinet', 'admin_dashboard']);
const forbiddenSensitiveKeys = new Set([
  'token',
  'tokens',
  'cookie',
  'cookies',
  'bearer',
  'authorization',
  'password',
  'secret',
  'rawOrderRows',
  'databaseDump',
  'providerPayload',
  'trackingNumber',
  'paymentReference',
  'customerEmail',
  'customerPhone',
  'customerAddress',
]);
const sensitiveValuePattern = /(bearer\s+[a-z0-9._-]+|session=|cookie:|@[a-z0-9.-]+\.[a-z]{2,}|\+?\d[\d\s().-]{8,}\d)/i;
const nonPiiValueTrailPattern = /(checkedAt|ordersEvidenceCommit|artifactHash|sha256|url|renderedLifecycleStage)$/;

function read(file) {
  assert.equal(fs.existsSync(file), true, `${path.relative(root, file)} is missing`);
  return fs.readFileSync(file, 'utf8');
}

function assertIncludes(source, marker, label) {
  assert.equal(source.includes(marker), true, `${label} missing marker: ${marker}`);
}

function assertNoSensitiveKeysOrValues(value, trail = 'report') {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoSensitiveKeysOrValues(entry, `${trail}[${index}]`));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      assert.equal(forbiddenSensitiveKeys.has(key), false, `sensitive key is not allowed at ${trail}.${key}`);
      assertNoSensitiveKeysOrValues(child, `${trail}.${key}`);
    }
    return;
  }
  if (typeof value === 'string') {
    if (nonPiiValueTrailPattern.test(trail)) return;
    assert.equal(sensitiveValuePattern.test(value), false, `sensitive-looking value is not allowed at ${trail}`);
  }
}

function validateContract() {
  const contract = read(contractPath);
  [
    'Schema version: `orders.browser_render_proof.v1`',
    '`status`: one of `proven`, `incomplete`, or `blocked`.',
    '`proofMode`: one of `safe_human_session` or `service_scoped_proxy`.',
    '`centralReadModelBacked`: boolean proving the rendered state came from Orders lifecycle read model or a channel API backed by it.',
    '`BROWSER_RENDER_PROOF_REPORT_PATH=/path/to/report.json`',
    '[MISSING: approved safe buyer/admin session source or explicit service-scoped browser proxy proof for FlipFlop validation-only lane.]',
    '[MISSING: rendered customer/admin UI lifecycle stage after approved mutation or approved existing mutation artifact.]',
  ].forEach((marker) => assertIncludes(contract, marker, 'browser render proof report contract'));
}

function validateFixtures() {
  const validFixture = validateReport(read(validFixturePath));
  assert.equal(validFixture.status, 'proven', 'valid browser proof fixture must be proven');
  assert.equal(validFixture.channel, 'flipflop', 'valid browser proof fixture must cover first FlipFlop lane');
  assert.throws(
    () => validateReport(read(invalidSensitiveFixturePath)),
    /sensitive key is not allowed/,
    'invalid sensitive-key fixture must be rejected',
  );
  return {
    validFixture: path.relative(root, validFixturePath),
    invalidSensitiveFixture: path.relative(root, invalidSensitiveFixturePath),
  };
}

function validateReport(rawReport) {
  const report = JSON.parse(rawReport);
  assertNoSensitiveKeysOrValues(report);
  assert.equal(report.schemaVersion, 'orders.browser_render_proof.v1', 'report schemaVersion mismatch');
  assert.equal(allowedStatuses.has(report.status), true, 'report status must be proven, incomplete, or blocked');
  assert.equal(typeof report.channel, 'string', 'report channel is required');
  assert.equal(allowedProofModes.has(report.proofMode), true, 'report proofMode is invalid');
  assert.equal(typeof report.checkedAt, 'string', 'report checkedAt is required');
  assert.equal(Number.isNaN(Date.parse(report.checkedAt)), false, 'report checkedAt must be parseable');
  assert.equal(typeof report.ordersEvidenceCommit, 'string', 'report ordersEvidenceCommit is required');
  assert.equal(report.mutationEvidence && typeof report.mutationEvidence === 'object', true, 'report mutationEvidence is required');
  assert.equal(typeof report.mutationEvidence.summary, 'string', 'report mutationEvidence.summary is required');
  assert.equal(Array.isArray(report.routes), true, 'report routes must be an array');
  assert.equal(report.routes.length > 0, true, 'report routes must not be empty');
  assert.equal(allowedRefreshMechanisms.has(report.refreshMechanism), true, 'report refreshMechanism is invalid');
  assert.equal(typeof report.centralReadModelBacked, 'boolean', 'report centralReadModelBacked must be boolean');
  assert.equal(report.evidencePolicy && typeof report.evidencePolicy === 'object', true, 'report evidencePolicy is required');
  for (const flag of requiredPolicyFlags) {
    assert.equal(report.evidencePolicy[flag], true, `report evidencePolicy.${flag} must be true`);
  }
  for (const [index, route] of report.routes.entries()) {
    assert.equal(typeof route.url, 'string', `route ${index} url is required`);
    assert.equal(typeof route.httpStatus, 'number', `route ${index} httpStatus must be numeric`);
    assert.equal(route.httpStatus >= 100 && route.httpStatus < 600, true, `route ${index} httpStatus must be valid`);
    assert.equal(allowedSurfaces.has(route.surface), true, `route ${index} surface is invalid`);
    assert.equal(typeof route.renderedLifecycleLabel, 'string', `route ${index} renderedLifecycleLabel is required`);
    assert.equal(typeof route.renderedLifecycleStage, 'string', `route ${index} renderedLifecycleStage is required`);
    assert.equal(route.artifact && typeof route.artifact === 'object', true, `route ${index} artifact is required`);
    assert.equal(route.artifact.redacted, true, `route ${index} artifact.redacted must be true`);
    assert.equal(Boolean(route.artifact.sha256 || route.artifact.path), true, `route ${index} artifact sha256 or path is required`);
  }
  if (report.status === 'proven') {
    assert.equal(report.centralReadModelBacked, true, 'proven report must be centralReadModelBacked');
    assert.equal(report.routes.some((route) => route.httpStatus >= 200 && route.httpStatus < 400), true, 'proven report needs a 2xx/3xx route');
    assert.equal(report.routes.some((route) => route.renderedLifecycleLabel.trim()), true, 'proven report needs rendered lifecycle label');
    assert.equal(report.routes.some((route) => route.renderedLifecycleStage.trim()), true, 'proven report needs rendered lifecycle stage');
  }
  return report;
}

validateContract();
const fixtureValidation = validateFixtures();
let reportValidation = {
  status: 'report_not_supplied',
  mutation: false,
  browserSessionUsed: false,
  providerCall: false,
  databaseRead: false,
  tokenValuesReadOrPrinted: false,
  blockers: ['[MISSING: BROWSER_RENDER_PROOF_REPORT_PATH]'],
};

if (reportPath) {
  const absolute = path.isAbsolute(reportPath) ? reportPath : path.join(root, reportPath);
  const report = validateReport(read(absolute));
  reportValidation = {
    status: 'report_validated',
    reportStatus: report.status,
    channel: report.channel,
    proofMode: report.proofMode,
    routeCount: report.routes.length,
    centralReadModelBacked: report.centralReadModelBacked,
    mutation: false,
    providerCall: false,
    databaseRead: false,
    tokenValuesReadOrPrinted: false,
    blockers: report.status === 'proven' ? [] : ['[MISSING: proven rendered lifecycle report]'],
  };
}

const result = {
  schemaVersion: 'orders.browser_render_proof_report_verifier.v1',
  status: reportValidation.status === 'report_validated' && reportValidation.reportStatus === 'proven'
    ? 'browser_render_proof_report_proven'
    : 'browser_render_proof_report_gated',
  checkedAt: new Date().toISOString(),
  contractVerified: true,
  fixtureValidation,
  reportValidation,
  remainingGates: [
    'approved safe buyer/admin session or explicit service-scoped browser proxy proof approval',
    'rendered customer/admin UI lifecycle stage after approved mutation or approved existing mutation artifact',
  ],
};
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
