#!/usr/bin/env node
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const auditPath = path.join(root, 'docs/orchestrator/2026-07-03-orders-lifecycle-completion-audit.md');
const statusPath = path.join(root, 'docs/orchestrator/STATUS.md');
const statePath = path.join(root, 'docs/IMPLEMENTATION_STATE.md');

function read(file) {
  assert.equal(fs.existsSync(file), true, `${path.relative(root, file)} is missing`);
  return fs.readFileSync(file, 'utf8');
}

function assertIncludes(source, marker, label) {
  assert.equal(source.includes(marker), true, `${label} missing marker: ${marker}`);
}

const audit = read(auditPath);
const status = read(statusPath);
const state = read(statePath);

const requirementMarkers = [
  'Every sellable order checks Warehouse stock and reserves on creation',
  'Order creation fails closed if Warehouse reservation is unavailable',
  'Orders store item list, per-item price, totals, shipping cost, and delivery address',
  'Paid order triggers Warehouse fulfillment handoff',
  'Orders lifecycle read model exposes customer/admin status',
  'Customer cabinet shows updated order lifecycle',
  'Admin cabinet/statistics show updated lifecycle and delivery status',
  'Lifecycle stages include ordered/unpaid, paid/not delivered, Warehouse collecting/forming/formed, handed to delivery, in delivery, received/not received/returned',
  'Delivery provider/shipment status updates drive late lifecycle',
  'Cross-repo IPS-backed plan and subagent orchestration are recorded',
  'No secrets, tokens, raw order rows, customer payloads, DB rows, tracking values, or provider payloads are printed in validation',
];

const proofMarkers = [
  'create HTTP `201`',
  'Warehouse reservation true',
  'payment update HTTP `200`',
  'Warehouse fulfillment update HTTP `200`',
  'customer lifecycle read HTTP `200`',
  'admin lifecycle read HTTP `200`',
  'both customer/admin read-models saw `warehouse_collecting`',
  'Orders service identity lifecycle list endpoints return HTTP `200` for FlipFlop, Allegro, Aukro, Bazos, and Heureka.',
];

const missingGateMarkers = [
  'Merge-order review approval for the FlipFlop validation-only browser lane.',
  'Approved safe human buyer/admin session or explicitly approved service-scoped browser proxy proof.',
  'Rendered customer/admin UI evidence after an Orders lifecycle mutation.',
  'Real subject-bound Allegro buyer order row and buyer bearer before Allegro buyer cabinet lifecycle can be called live-complete.',
  'Provider-backed Bazos marketplace webhook/order source decision.',
  'Warehouse/Allegro shipment-status runtime enablement approvals:',
  'Browser-render proof and provider-backed late shipment lifecycle proof are still missing.',
  'Status: incomplete.',
  'Therefore the active goal must remain open.',
];

for (const marker of requirementMarkers) assertIncludes(audit, marker, 'completion audit requirements');
for (const marker of proofMarkers) assertIncludes(audit, marker, 'completion audit proof boundary');
for (const marker of missingGateMarkers) assertIncludes(audit, marker, 'completion audit missing gates');

assertIncludes(status, 'Completion Audit Recorded', 'STATUS');
assertIncludes(status, 'Decision: active goal remains incomplete.', 'STATUS');
assertIncludes(state, 'Requirement-by-requirement completion audit is recorded', 'IMPLEMENTATION_STATE');

assert.equal(
  /Status:\s*complete\./i.test(audit),
  false,
  'completion audit must not mark the active lifecycle goal complete while browser/provider gates are missing',
);
assert.equal(
  audit.includes('Rendered customer/admin UI evidence after an Orders lifecycle mutation.') &&
    audit.includes('Warehouse/Allegro shipment-status runtime enablement approvals:'),
  true,
  'completion audit must preserve both browser-render and shipment-status remaining gates',
);

const result = {
  schemaVersion: 'orders.completion_audit_verification.v1',
  status: 'incomplete_goal_gates_preserved',
  checkedAt: new Date().toISOString(),
  requirementMarkersVerified: requirementMarkers.length,
  proofMarkersVerified: proofMarkers.length,
  missingGateMarkersVerified: missingGateMarkers.length,
  goalCompleteClaimPresent: false,
  mutation: false,
  browserSessionUsed: false,
  providerCall: false,
  databaseRead: false,
  tokenValuesReadOrPrinted: false,
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
