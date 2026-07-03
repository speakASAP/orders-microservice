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
  'Bounded channel evidence proven, real-provider gates remain',
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
  'Browser-B channel gate reconciliation refined route/deploy evidence: FlipFlop routes returned HTTP `200` but deployed commit is `[UNKNOWN: mutable latest tag]`; Heureka source/deployed `358fba9` and Aukro source/deployed `08ad5ce` remain aligned; Bazos source `1ccb93d` is ahead of deployed `9059605`; Allegro source `ae9d381` is ahead of deployed `4ff3987`; protected order APIs returned HTTP `401` where authentication is required.',
  'Anonymous FlipFlop browser-render preflight is blocked, not proven: artifact `/tmp/flipflop-browser-render-preflight-2026-07-03T09-34-31-524Z.json` SHA-256 `450f71e08497c99f545176d97ce047ace28496f66e0b263b182570c781fc22eb`; public `/orders` and `/admin/orders` HTML returned HTTP `200`, anonymous backing APIs `/api/orders` and `/api/admin/orders` returned HTTP `401`, and empty-profile Chromium found no rendered lifecycle labels/stages.',
  'Fresh gated FlipFlop route smoke returned HTTP `200` for `https://flipflop.alfares.cz/orders` and `https://flipflop.alfares.cz/admin/orders` with no browser session, lifecycle mutation, provider call, DB read, or token output. This is route readiness only, not rendered lifecycle proof.',
  'FlipFlop first browser lane readiness is recorded in `docs/orchestrator/2026-07-03-flipflop-browser-proof-readiness-evidence.md`',
  'This is readiness evidence only, not rendered lifecycle proof.',
  'Browser-render proof must be submitted as sanitized `orders.browser_render_proof.v1` JSON and validated by `verify:browser-render-proof-report`',
  'Channel create/reservation evidence boundary from `verify:channel-lifecycle-runtime-evidence`:',
  'FlipFlop: `live_create_reservation_smoke_proven`.',
  'Heureka: `live_create_replay_reservation_cleanup_smoke_proven`.',
  'Aukro: `live_synthetic_create_reservation_cleanup_proven_source_cabinet_stats_proven`.',
  'Bazos: `synthetic_create_reservation_smoke_proven_provider_webhook_unknown`.',
  'Allegro: `buyer_route_live_isolation_proven_real_order_smoke_missing`.',
  'checked-in fixtures prove the contract accepts a sanitized FlipFlop service-scoped report and rejects a sensitive-key report',
  'Browser proof report guard now rejects anonymous/public-shell evidence: `invalid-public-shell-route.json` must fail because route-only HTML, anonymous DOM snapshots, and backing API `401`/`403` responses cannot prove rendered lifecycle propagation.',
];

const baselineMarkers = [
  'Current Orders evidence baseline: this document is enforced by `verify:completion-audit` in `npm test`; repository `HEAD` is the authoritative current commit.',
];

const missingGateMarkers = [
  'Merge-order review approval for the FlipFlop validation-only browser lane.',
  'Approved safe human buyer/admin session or explicitly approved service-scoped browser proxy proof.',
  'Rendered customer/admin UI evidence after an Orders lifecycle mutation, submitted as sanitized `orders.browser_render_proof.v1` and validated with `BROWSER_RENDER_PROOF_REPORT_PATH`.',
  'Real subject-bound Allegro buyer order row and buyer bearer before Allegro buyer cabinet lifecycle can be called live-complete.',
  'Provider-backed Bazos marketplace webhook/order source decision.',
  'Warehouse/Allegro shipment-status runtime enablement approvals:',
  'Browser-render proof and provider-backed late shipment lifecycle proof are still missing.',
  'Status: incomplete.',
  'Therefore the active goal must remain open.',
];

for (const marker of baselineMarkers) assertIncludes(audit, marker, 'completion audit baseline');
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
  audit.includes('Rendered customer/admin UI evidence after an Orders lifecycle mutation, submitted as sanitized `orders.browser_render_proof.v1` and validated with `BROWSER_RENDER_PROOF_REPORT_PATH`.') &&
    audit.includes('Warehouse/Allegro shipment-status runtime enablement approvals:'),
  true,
  'completion audit must preserve both browser-render and shipment-status remaining gates',
);

const result = {
  schemaVersion: 'orders.completion_audit_verification.v1',
  status: 'incomplete_goal_gates_preserved',
  checkedAt: new Date().toISOString(),
  baselineMarkersVerified: baselineMarkers.length,
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
