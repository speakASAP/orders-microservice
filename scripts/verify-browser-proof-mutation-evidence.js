#!/usr/bin/env node
const assert = require('assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const fixturePath = `reports/validation/lifecycle-mutation-smoke/fixture-${process.pid}.json`;
const missingPath = `reports/validation/lifecycle-mutation-smoke/missing-${process.pid}.json`;

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function run(args = [], options = {}) {
  return execFileSync(process.execPath, [
    'scripts/prepare-browser-proof-mutation-evidence.js',
    ...args,
  ], {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    ...options,
  });
}

const fixture = {
  ok: true,
  mode: 'live_synthetic_lifecycle_mutation',
  generatedAt: '2026-07-03T10:00:00.000Z',
  mutation: true,
  approvalIdPresent: true,
  confirmation: 'CREATE_PAY_WAREHOUSE_READ',
  channel: 'flipflop',
  serviceName: 'flipflop-service',
  externalOrderIdHash: '0123456789ab',
  catalogProductIdHash: 'abcdef012345',
  warehouseIdHash: '123456abcdef',
  result: {
    createHttpStatus: 201,
    orderIdPresent: true,
    orderIdHash: 'fedcba654321',
    initialWarehouseReserved: true,
    paymentHttpStatus: 200,
    warehouseHttpStatus: 200,
    customerLifecycleHttpStatus: 200,
    adminLifecycleHttpStatus: 200,
    customerSawWarehouseCollecting: true,
    adminSawWarehouseCollecting: true,
    customerScopedCountPositive: true,
    adminAggregateStageCountPositive: true,
    tokenValuesPrinted: false,
    rawOrderRowsPrinted: false,
  },
  blockers: [],
};

fs.mkdirSync(path.dirname(fixturePath), { recursive: true });
const fixtureJson = `${JSON.stringify(fixture, null, 2)}\n`;
fs.writeFileSync(fixturePath, fixtureJson);

try {
  const ready = JSON.parse(run([`--artifact-path=${fixturePath}`]));
  assert.equal(ready.schemaVersion, 'orders.browser_proof_mutation_evidence.v1');
  assert.equal(ready.status, 'mutation_artifact_ready');
  assert.equal(ready.mutationEvidence.source, 'smoke:lifecycle-mutation');
  assert.equal(ready.mutationEvidence.artifactPath, fixturePath);
  assert.equal(ready.mutationEvidence.artifactHash, `sha256:${sha256(fixtureJson)}`);
  assert.equal(ready.mutationEvidence.expectedLifecycleStage, 'warehouse_collecting');
  assert.equal(ready.mutation, false);
  assert.equal(ready.browserSessionUsed, false);
  assert.equal(ready.providerCall, false);
  assert.equal(ready.databaseRead, false);
  assert.equal(ready.tokenValuesReadOrPrinted, false);
  assert.deepEqual(ready.blockers, []);

  let missingRejected = false;
  try {
    run([`--artifact-path=${missingPath}`]);
  } catch (error) {
    missingRejected = true;
    const gated = JSON.parse(String(error.stdout));
    assert.equal(error.status, 2);
    assert.equal(gated.status, 'mutation_artifact_gated');
    assert.equal(gated.blockers.includes('[MISSING: lifecycle mutation smoke artifact file]'), true);
  }
  assert.equal(missingRejected, true, 'missing mutation artifact must be gated');

  assert.throws(
    () => run(['--artifact-path=../unsafe.json']),
    /artifact path must not traverse directories|artifact path must be reports\/validation\/lifecycle-mutation-smoke\/<file>\.json/,
    'unsafe mutation artifact path must be rejected',
  );

  process.stdout.write(`${JSON.stringify({
    schemaVersion: 'orders.browser_proof_mutation_evidence_verifier.v1',
    status: 'mutation_evidence_helper_verified',
    fixturePath,
    mutation: false,
    browserSessionUsed: false,
    providerCall: false,
    databaseRead: false,
    tokenValuesReadOrPrinted: false,
  }, null, 2)}\n`);
} finally {
  if (fs.existsSync(fixturePath)) fs.unlinkSync(fixturePath);
}
