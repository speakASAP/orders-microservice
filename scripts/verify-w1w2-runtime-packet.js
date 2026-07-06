#!/usr/bin/env node
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const packetPath = path.join(root, 'docs/orchestrator/2026-07-05-w1w2-synthetic-lifecycle-runtime-packet.md');
const reportPath = path.join(root, 'reports/validation/VAL-W7-W1W2-runtime-packet-prepared-2026-07-05.md');
const smokePath = path.join(root, 'scripts/smoke-lifecycle-mutation-propagation.js');
const contractPath = path.join(root, 'docs/orchestrator/2026-07-05-runtime-gate-packet-contracts.md');

function read(file) {
  assert.equal(fs.existsSync(file), true, path.relative(root, file) + ' is missing');
  return fs.readFileSync(file, 'utf8');
}

function assertIncludes(source, marker, label) {
  assert.equal(source.includes(marker), true, label + ' missing marker: ' + marker);
}

const packet = read(packetPath);
const report = read(reportPath);
const smoke = read(smokePath);
const contract = read(contractPath);

const ipsMarkers = [
  'Vision ->',
  'Goal Impact ->',
  'System ->',
  'Feature ->',
  'Task ->',
  'Execution Plan ->',
  'Coding Prompt ->',
  'Code ->',
  'Validation ->',
];
for (const marker of ipsMarkers) assertIncludes(packet, marker, 'packet IPS chain');
for (const marker of ipsMarkers) assertIncludes(report, marker, 'report IPS chain');

const packetMarkers = [
  'status: prepared-owner-approved-packet-not-executed',
  'packetId: W1W2-SYNTHETIC-LIFECYCLE-PACKET-2026-07-05',
  'runtime_execution_status: not_executed',
  'mutation: false',
  'provider_call: false',
  'deploy: false',
  'RUN_LIVE_LIFECYCLE_MUTATION_SMOKE=1',
  'LIFECYCLE_MUTATION_SMOKE_APPROVAL_ID=W1W2-SYNTHETIC-LIFECYCLE-PACKET-2026-07-05',
  'LIFECYCLE_MUTATION_SMOKE_CONFIRM=CREATE_PAY_WAREHOUSE_READ',
  'orders.create.v1:flipflop:lifecycle-mutation:<runRef>',
  'warehouse_collecting',
  'initialWarehouseReserved=true',
  'payment update HTTP status is `200`',
  'Warehouse fulfillment update HTTP status is `200`',
  'customer lifecycle read HTTP status is `200`',
  'admin lifecycle read HTTP status is `200`',
  '[MISSING: cleanup route/policy for synthetic lifecycle smoke rows]',
  '[MISSING: final operator decision to run the live W1/W2 smoke with all three env gates]',
  '[UNKNOWN: current runtime stock state for the default synthetic product until execution-time preflight]',
  'raw bearer tokens or secret values',
  'raw customer/order/payment/provider/tracking payloads',
  'raw DB rows',
  'This packet does not change that behavior.',
  'did not run any live mutation',
];
for (const marker of packetMarkers) assertIncludes(packet, marker, 'prepared W1/W2 packet');

const smokeMarkers = [
  "RUN_LIVE_LIFECYCLE_MUTATION_SMOKE === '1'",
  'LIFECYCLE_MUTATION_SMOKE_APPROVAL_ID',
  "LIFECYCLE_MUTATION_SMOKE_CONFIRM=CREATE_PAY_WAREHOUSE_READ",
  "status: 'collecting'",
  "lifecycleStage=warehouse_collecting",
  'customerSawWarehouseCollecting',
  'adminSawWarehouseCollecting',
  'externalOrderIdHash: hash(externalOrderId)',
  'catalogProductIdHash: hash(catalogProductId)',
  'warehouseIdHash: hash(warehouseId)',
];
for (const marker of smokeMarkers) assertIncludes(smoke, marker, 'smoke script gate/readback');

assertIncludes(contract, '## W1/W2 Live Synthetic Create Pay Warehouse Read Packet', 'runtime gate contract');
assertIncludes(contract, '[RESOLVED: W1/W2 live buyer-bound synthetic lifecycle packet executed and verified]', 'runtime gate contract W1/W2 resolved gate');
assertIncludes(report, 'status: packet_prepared_not_executed', 'preparation report');
assertIncludes(report, 'mutation: false', 'preparation report boundary');
assertIncludes(report, 'tokenValuesReadOrPrinted: false', 'preparation report boundary');

const forbiddenClaims = [
  'runtime_execution_status: executed',
  'mutation: true',
  'provider_call: true',
  'deploy: true',
  'live smoke passed',
  'live mutation executed',
];
for (const marker of forbiddenClaims) {
  assert.equal(packet.includes(marker), false, 'packet must not claim: ' + marker);
  assert.equal(report.includes(marker), false, 'report must not claim: ' + marker);
}

const result = {
  ok: true,
  verifier: 'orders-w1w2-runtime-packet.v1',
  packetPrepared: true,
  packetId: 'W1W2-SYNTHETIC-LIFECYCLE-PACKET-2026-07-05',
  runtimeMutation: false,
  providerCall: false,
  deploy: false,
  browserSessionUsed: false,
  tokenValuesReadOrPrinted: false,
  liveExecutionStillRequiresEnvGates: true,
};
process.stdout.write(JSON.stringify(result, null, 2) + '\n');
