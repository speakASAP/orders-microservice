#!/usr/bin/env node
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const auditPath = path.join(root, 'docs/orchestrator/2026-07-03-orders-lifecycle-completion-audit.md');
const statusPath = path.join(root, 'docs/orchestrator/STATUS.md');
const statePath = path.join(root, 'docs/IMPLEMENTATION_STATE.md');
const channelDecisionPath = path.join(root, 'reports/validation/channel-lifecycle-runtime-evidence/channel-deploy-browser-smoke-decision-current.json');

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
const channelDecision = JSON.parse(read(channelDecisionPath));

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
  'Channel deploy/browser-smoke reconciliation refined current evidence: FlipFlop `main` contains `3110c6a` and routes return HTTP `200`, but runtime uses mutable `latest`; Heureka source/runtime is `358fba9` but `/heureka/dashboard/orders` remains HTTP `404`; Bazos runtime `9059605` contains `26af3ae` and protected routes return HTTP `401`; Allegro `529a71d` is superseded by patch-equivalent `4ff3987` and runtime `ae9d381` is later; Aukro `f6502bb` is superseded by patch-equivalent `08ad5ce` and runtime `68784d7` includes it.',
  'Anonymous FlipFlop browser-render preflight is blocked, not proven: artifact `/tmp/flipflop-browser-render-preflight-2026-07-03T09-34-31-524Z.json` SHA-256 `450f71e08497c99f545176d97ce047ace28496f66e0b263b182570c781fc22eb`; public `/orders` and `/admin/orders` HTML returned HTTP `200`, anonymous backing APIs `/api/orders` and `/api/admin/orders` returned HTTP `401`, and empty-profile Chromium found no rendered lifecycle labels/stages.',
  'Fresh gated FlipFlop route smoke returned HTTP `200` for `https://flipflop.alfares.cz/orders` and `https://flipflop.alfares.cz/admin/orders` with no browser session, lifecycle mutation, provider call, DB read, or token output. This is route readiness only, not rendered lifecycle proof.',
  'FlipFlop first browser lane readiness is recorded in `docs/orchestrator/2026-07-03-flipflop-browser-proof-readiness-evidence.md`',
  'This is readiness evidence only, not rendered lifecycle proof.',
  'Browser-render proof must be submitted as sanitized `orders.browser_render_proof.v1` JSON and validated by `verify:browser-render-proof-report`',
  'Channel create/reservation evidence boundary from `verify:channel-lifecycle-runtime-evidence`:',
  'FlipFlop: `live_create_reservation_and_browser_lifecycle_proven`.',
  'Heureka: `live_create_replay_reservation_cleanup_proven_browser_blocked_orders_api_404`.',
  'Aukro: `live_synthetic_create_reservation_cleanup_proven_cabinet_apis_live_lifecycle_data_blocked`.',
  'Bazos: `synthetic_create_reservation_smoke_proven_provider_source_live_fail_closed`.',
  'Allegro: `buyer_route_live_isolation_proven_real_order_and_central_lifecycle_blocked`.',
  'checked-in fixtures prove the contract accepts a sanitized FlipFlop service-scoped report and rejects a sensitive-key report',
  'Browser proof report guard now rejects anonymous/public-shell evidence: `invalid-public-shell-route.json` must fail because route-only HTML, anonymous DOM snapshots, and backing API `401`/`403` responses cannot prove rendered lifecycle propagation.',
  'Browser proof report guard now requires both customer and admin rendered surfaces for `status=proven`: at least one `customer_cabinet` route plus at least one `admin_cabinet` or `admin_dashboard` route.',
  'Browser proof report guard now requires `mutationEvidence.expectedLifecycleStage` for `status=proven`, and every customer/admin route must render that exact canonical lifecycle stage.',
  'Browser proof report verifier now rejects `invalid-mismatched-stage.json`, proving customer/admin lifecycle stage divergence cannot close the rendered proof gate.',
  'Browser proof report verifier now rejects `invalid-unknown-channel.json`, proving arbitrary channel names cannot close the rendered proof gate; allowed channels are `flipflop`, `heureka`, `bazos`, `aukro`, and `allegro`.',
  'Browser proof report verifier now rejects `invalid-proof-mode-mismatch.json`, proving reports cannot mix `proofMode` and route `authContext` semantics.',
  'Browser proof report verifier now rejects `invalid-head-commit.json`, proving `ordersEvidenceCommit=HEAD` cannot close the rendered proof gate; proven reports must use an immutable 40-character git commit hash.',
  'Browser proof report verifier now rejects `invalid-expected-commit-mismatch.json`, proving a supplied real report must match `BROWSER_RENDER_PROOF_EXPECTED_COMMIT` exactly.',
];

const baselineMarkers = [
  'Current Orders evidence baseline: this document is enforced by `verify:completion-audit` in `npm test`; repository `HEAD` is the authoritative current commit.',
];


assert.equal(channelDecision.schemaVersion, 'orders.channel_deploy_browser_smoke_decision.v1', 'channel deploy/browser smoke decision schema mismatch');
assert.equal(channelDecision.status, 'partial_smoke_ready_with_merge_equivalents_and_data_gates', 'channel deploy/browser smoke decision status mismatch');
assert.equal(channelDecision.policy.readOnlyProbe, true, 'channel decision must be read-only evidence');
assert.equal(channelDecision.policy.channelSourceEdits, false, 'channel decision must not include channel source edits');
assert.equal(channelDecision.policy.deploys, false, 'channel decision must not include deploys');
assert.equal(channelDecision.policy.runtimeMutations, false, 'channel decision must not include runtime mutations');
assert.equal(channelDecision.channels.allegro.mergeNeededForExpectedCommit, false, 'Allegro stale worker commit must not require direct merge');
assert.equal(channelDecision.channels.allegro.integratedEquivalentCommit, '4ff3987', 'Allegro integrated equivalent commit mismatch');
assert.equal(channelDecision.channels.aukro.mergeNeededForExpectedCommit, false, 'Aukro stale worker commit must not require direct merge');
assert.equal(channelDecision.channels.aukro.integratedEquivalentCommit, '08ad5ce', 'Aukro integrated equivalent commit mismatch');
assert.equal(channelDecision.channels.flipflop.proofStatus, 'service_scoped_proxy_browser_proof_proven_direct_human_blocked', 'FlipFlop proof status mismatch');
assert.equal(channelDecision.channels.heureka.proofStatus, 'browser_proof_blocked_orders_route_or_api_unavailable', 'Heureka proof status mismatch');
assert.equal(channelDecision.channels.bazos.proofStatus, 'source_ui_verified_provider_backed_order_source_blocked', 'Bazos proof status mismatch');

const missingGateMarkers = [
  'Direct safe-human FlipFlop browser proof if product requires it beyond the already proven service-scoped proxy proof.',
  'Heureka dashboard orders route/API fix or approved alternative proof path.',
  'Aukro approved live order row linked to a current non-stale canonical Orders lifecycle stage.',
  'Real subject-bound Allegro buyer order row and buyer bearer before Allegro buyer cabinet lifecycle can be called live-complete.',
  'Provider-backed Bazos marketplace webhook/order source decision and persisted item snapshot contract.',
  'Warehouse/Allegro shipment-status runtime enablement gates:',
  'FlipFlop service-scoped browser-render proof is proven, but remaining channel browser/data/auth proofs and provider-backed late shipment lifecycle proof are still missing.',
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
  audit.includes('Heureka dashboard orders route/API fix or approved alternative proof path.') &&
    audit.includes('Warehouse/Allegro shipment-status runtime enablement gates:'),
  true,
  'completion audit must preserve both channel browser/data/auth and shipment-status remaining gates',
);

const result = {
  schemaVersion: 'orders.completion_audit_verification.v1',
  status: 'incomplete_goal_gates_preserved',
  checkedAt: new Date().toISOString(),
  baselineMarkersVerified: baselineMarkers.length,
  requirementMarkersVerified: requirementMarkers.length,
  proofMarkersVerified: proofMarkers.length,
  missingGateMarkersVerified: missingGateMarkers.length,
  channelDecisionVerified: true,
  goalCompleteClaimPresent: false,
  mutation: false,
  browserSessionUsed: false,
  providerCall: false,
  databaseRead: false,
  tokenValuesReadOrPrinted: false,
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
