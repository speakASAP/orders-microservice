#!/usr/bin/env node
const assert = require('assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const defaultArtifactPath = 'reports/validation/lifecycle-mutation-smoke/report-latest.json';
const allowedMutationArtifactPathPattern = /^reports\/validation\/(lifecycle-mutation-smoke|orders-browser-render-proof)\/[a-z0-9._/-]+\.json$/;

function readArg(name, fallback) {
  const prefix = `--${name}=`;
  const arg = process.argv.slice(2).find((entry) => entry.startsWith(prefix));
  return arg ? arg.slice(prefix.length).trim() : fallback;
}

function normalizeArtifactPath(artifactPath) {
  assert.equal(Boolean(artifactPath), true, 'artifact path must not be empty');
  assert.equal(path.isAbsolute(artifactPath), false, 'artifact path must be relative');
  assert.equal(artifactPath.includes('..'), false, 'artifact path must not traverse directories');
  assert.equal(
    allowedMutationArtifactPathPattern.test(artifactPath),
    true,
    'artifact path must be reports/validation/lifecycle-mutation-smoke/<file>.json or reports/validation/orders-browser-render-proof/<file>.json',
  );
  return artifactPath;
}

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`artifact JSON must parse: ${error.message}`);
  }
}

function isTruthy(value) {
  return value === true || value === 'true';
}

function collectBlockers(report) {
  const blockers = [];
  if (report.ok !== true) blockers.push('[MISSING: lifecycle mutation smoke artifact ok=true]');
  if (report.mode !== 'live_synthetic_lifecycle_mutation') {
    blockers.push('[MISSING: lifecycle mutation smoke artifact mode=live_synthetic_lifecycle_mutation]');
  }
  if (report.mutation !== true) blockers.push('[MISSING: lifecycle mutation smoke artifact mutation=true]');
  if (report.channel !== 'flipflop') blockers.push('[MISSING: lifecycle mutation smoke artifact channel=flipflop]');
  if (report.serviceName !== 'flipflop-service') blockers.push('[MISSING: lifecycle mutation smoke artifact serviceName=flipflop-service]');
  if (report.approvalIdPresent !== true) blockers.push('[MISSING: lifecycle mutation smoke approval id present]');
  if (report.confirmation !== 'CREATE_PAY_WAREHOUSE_READ') {
    blockers.push('[MISSING: lifecycle mutation smoke confirmation CREATE_PAY_WAREHOUSE_READ]');
  }
  if (Array.isArray(report.blockers) && report.blockers.length > 0) {
    blockers.push('[MISSING: lifecycle mutation smoke artifact blockers empty]');
  }
  const result = report.result || {};
  if (result.createHttpStatus !== 201) blockers.push('[MISSING: lifecycle mutation smoke create HTTP 201]');
  if (result.paymentHttpStatus !== 200) blockers.push('[MISSING: lifecycle mutation smoke payment HTTP 200]');
  if (result.warehouseHttpStatus !== 200) blockers.push('[MISSING: lifecycle mutation smoke warehouse HTTP 200]');
  if (result.customerLifecycleHttpStatus !== 200) blockers.push('[MISSING: lifecycle mutation smoke customer lifecycle HTTP 200]');
  if (result.adminLifecycleHttpStatus !== 200) blockers.push('[MISSING: lifecycle mutation smoke admin lifecycle HTTP 200]');
  if (!isTruthy(result.initialWarehouseReserved)) blockers.push('[MISSING: lifecycle mutation smoke initial warehouse reservation]');
  if (!isTruthy(result.customerSawWarehouseCollecting)) blockers.push('[MISSING: lifecycle mutation smoke customer warehouse_collecting]');
  if (!isTruthy(result.adminSawWarehouseCollecting)) blockers.push('[MISSING: lifecycle mutation smoke admin warehouse_collecting]');
  if (!isTruthy(result.customerScopedCountPositive)) blockers.push('[MISSING: lifecycle mutation smoke customer scoped count]');
  if (!isTruthy(result.adminAggregateStageCountPositive)) blockers.push('[MISSING: lifecycle mutation smoke admin aggregate stage count]');
  if (result.tokenValuesPrinted !== false || report.tokenValuesPrinted === true) {
    blockers.push('[MISSING: lifecycle mutation smoke tokenValuesPrinted=false]');
  }
  if (result.rawOrderRowsPrinted !== false || report.rawOrderRowsPrinted === true) {
    blockers.push('[MISSING: lifecycle mutation smoke rawOrderRowsPrinted=false]');
  }
  return blockers;
}

const artifactPath = normalizeArtifactPath(readArg('artifact-path', defaultArtifactPath));
const absoluteArtifactPath = path.join(process.cwd(), artifactPath);

let report = null;
let artifactHash = null;
let blockers = [];
if (!fs.existsSync(absoluteArtifactPath) || !fs.statSync(absoluteArtifactPath).isFile()) {
  blockers.push('[MISSING: lifecycle mutation smoke artifact file]');
} else {
  const raw = fs.readFileSync(absoluteArtifactPath, 'utf8');
  report = parseJson(raw);
  artifactHash = `sha256:${sha256File(absoluteArtifactPath)}`;
  blockers = collectBlockers(report);
}

const ready = blockers.length === 0;
const result = {
  schemaVersion: 'orders.browser_proof_mutation_evidence.v1',
  status: ready ? 'mutation_artifact_ready' : 'mutation_artifact_gated',
  checkedAt: new Date().toISOString(),
  mutationEvidence: {
    source: 'smoke:lifecycle-mutation',
    approvalId: ready ? '[MISSING: approved lifecycle mutation smoke approval id]' : '[MISSING: lifecycle mutation smoke approval id]',
    summary: ready
      ? 'Sanitized lifecycle mutation smoke reached warehouse_collecting in customer and admin Orders lifecycle read models.'
      : '[MISSING: ready lifecycle mutation smoke artifact]',
    artifactPath,
    artifactHash: artifactHash || '[MISSING: sha256 artifact hash]',
    expectedLifecycleStage: 'warehouse_collecting',
  },
  evidencePolicy: {
    noTokenValues: true,
    noCustomerPii: true,
    noRawOrderRows: true,
    noDatabaseDump: true,
    noPaymentReference: true,
    noTrackingValues: true,
    noProviderPayload: true,
  },
  mutation: false,
  browserSessionUsed: false,
  providerCall: false,
  databaseRead: false,
  tokenValuesReadOrPrinted: false,
  blockers,
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exit(ready ? 0 : 2);
