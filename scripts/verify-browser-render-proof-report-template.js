#!/usr/bin/env node
const assert = require('assert/strict');
const { execFileSync } = require('child_process');

function generate(args = []) {
  return JSON.parse(execFileSync(process.execPath, [
    'scripts/generate-browser-render-proof-report-template.js',
    ...args,
  ], { encoding: 'utf8' }));
}

function verifyBaseTemplate(report, head) {
  assert.equal(report.schemaVersion, 'orders.browser_render_proof.v1', 'template schemaVersion mismatch');
  assert.equal(report.status, 'incomplete', 'template must not claim proven status');
  assert.equal(report.channel, 'flipflop', 'template default channel must be first FlipFlop proof lane');
  assert.equal(report.proofMode, 'service_scoped_proxy', 'template default proof mode must be service scoped');
  assert.equal(report.ordersEvidenceCommit, head, 'template must bind to current immutable Orders commit');
  assert.equal(report.centralReadModelBacked, false, 'template must not claim central read-model proof before evidence is filled');
  assert.equal(report.routes.length, 2, 'template must include customer and admin routes');
  assert.equal(report.routes[0].surface, 'customer_cabinet', 'template must include customer cabinet route first');
  assert.equal(report.routes[1].surface, 'admin_cabinet', 'template must include admin cabinet route second');
  assert.equal(report.routes.every((route) => route.url.includes('flipflop.alfares.cz')), true, 'template routes must target FlipFlop by default');
  assert.equal(report.routes.every((route) => route.httpStatus >= 100 && route.httpStatus < 600), true, 'template route HTTP statuses must be schema-compatible');
  assert.equal(report.routes.every((route) => route.dataSourceStatus >= 100 && route.dataSourceStatus < 600), true, 'template route data-source statuses must be schema-compatible');
  assert.equal(report.routes.every((route) => route.artifact.redacted === true), true, 'template artifacts must be marked redacted');
  assert.equal(JSON.stringify(report).includes('[MISSING:'), true, 'template must keep missing evidence placeholders');
  assert.equal(report.result.summary.includes('[MISSING:'), true, 'template result must stay incomplete');
}

const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const pathReport = generate();
const hashReport = generate(['--artifact-mode=sha256']);

verifyBaseTemplate(pathReport, head);
verifyBaseTemplate(hashReport, head);
assert.equal(pathReport.routes.every((route) => typeof route.artifact.path === 'string'), true, 'path template must use artifact paths');
assert.equal(pathReport.routes.every((route) => route.artifact.sha256 === undefined), true, 'path template must not include placeholder artifact hashes');
assert.equal(hashReport.routes.every((route) => /^[0-9a-f]{64}$/.test(route.artifact.sha256)), true, 'sha256 template must use schema-compatible artifact hashes');
assert.equal(hashReport.routes.every((route) => route.artifact.path === undefined), true, 'sha256 template must not reference artifact files');

process.stdout.write(`${JSON.stringify({
  schemaVersion: 'orders.browser_render_proof_template_verifier.v1',
  status: 'template_verified_incomplete',
  ordersEvidenceCommit: pathReport.ordersEvidenceCommit,
  routeCount: pathReport.routes.length,
  artifactModesVerified: ['path', 'sha256'],
  mutation: false,
  browserSessionUsed: false,
  providerCall: false,
  databaseRead: false,
  tokenValuesReadOrPrinted: false,
}, null, 2)}\n`);
