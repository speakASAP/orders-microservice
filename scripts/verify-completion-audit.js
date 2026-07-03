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
  'Channel deploy/browser-smoke reconciliation was refreshed against current remote source heads and k3s images: FlipFlop `64e7831` runs mutable `latest` images and `/orders` plus `/admin/orders` return HTTP `200`; Heureka `712c3b0` runs `heureka-service:1cf0f32` and `heureka-api-gateway:1cf0f32`, `/dashboard/orders` returns HTTP `200`, and unauthenticated `/heureka/dashboard/orders-list` fails closed with HTTP `401`; Bazos `053a4d3` runs `bazos-service:27f325d`, `/` returns HTTP `200`, and `/orders` fails closed with HTTP `401`; Allegro `60fb3f3` runs `allegro-service:c979768` and `allegro-frontend:c979768`, with `/api/health`, `/cabinet/orders`, and `/dashboard/orders` returning HTTP `200`; Aukro `e264a34` runs `aukro-service:94f3427`, `/dashboard` returns HTTP `200`, and protected `/aukro/ui/dashboard` fails closed with HTTP `403`.',
  'Anonymous FlipFlop browser-render preflight is blocked, not proven: artifact `/tmp/flipflop-browser-render-preflight-2026-07-03T09-34-31-524Z.json` SHA-256 `450f71e08497c99f545176d97ce047ace28496f66e0b263b182570c781fc22eb`; public `/orders` and `/admin/orders` HTML returned HTTP `200`, anonymous backing APIs `/api/orders` and `/api/admin/orders` returned HTTP `401`, and empty-profile Chromium found no rendered lifecycle labels/stages.',
  'Fresh gated FlipFlop route smoke returned HTTP `200` for `https://flipflop.alfares.cz/orders` and `https://flipflop.alfares.cz/admin/orders` with no browser session, lifecycle mutation, provider call, DB read, or token output. This is route readiness only, not rendered lifecycle proof.',
  'FlipFlop first browser lane readiness is recorded in `docs/orchestrator/2026-07-03-flipflop-browser-proof-readiness-evidence.md`',
  'This is readiness evidence only, not rendered lifecycle proof.',
  'Browser-render proof must be submitted as sanitized `orders.browser_render_proof.v1` JSON and validated by `verify:browser-render-proof-report`',
  'Channel create/reservation evidence boundary from `verify:channel-lifecycle-runtime-evidence`:',
  'FlipFlop: `live_create_reservation_and_browser_lifecycle_proven`.',
  'Heureka: `live_create_replay_reservation_cleanup_orders_list_non_stale_lifecycle_api_proven_dom_optional`.',
  'Aukro: `live_synthetic_create_reservation_cleanup_proven_cabinet_protected_data_auth_blocked`.',
  'Bazos: `synthetic_create_reservation_smoke_proven_paid_replay_source_deployed_live_evidence_blocked`.',
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
assert.equal(channelDecision.status, 'partial_smoke_ready_with_current_runtime_and_product_gates', 'channel deploy/browser smoke decision status mismatch');
assert.equal(channelDecision.policy.readOnlyProbe, true, 'channel decision must be read-only evidence');
assert.equal(channelDecision.policy.channelSourceEdits, false, 'channel decision must not include channel source edits');
assert.equal(channelDecision.policy.deploys, false, 'channel decision must not include deploys');
assert.equal(channelDecision.policy.runtimeMutations, false, 'channel decision must not include runtime mutations');
assert.equal(channelDecision.channels.flipflop.currentHead, '64e7831', 'FlipFlop current head mismatch');
assert.equal(channelDecision.channels.flipflop.routeStatus['/orders'], 200, 'FlipFlop /orders route status mismatch');
assert.equal(channelDecision.channels.flipflop.routeStatus['/admin/orders'], 200, 'FlipFlop /admin/orders route status mismatch');
assert.equal(channelDecision.channels.heureka.currentHead, '712c3b0', 'Heureka current head mismatch');
assert.equal(channelDecision.channels.heureka.routeStatus['/dashboard/orders'], 200, 'Heureka dashboard route status mismatch');
assert.equal(channelDecision.channels.heureka.routeStatus['/heureka/dashboard/orders-list?limit=1&status=all'], 401, 'Heureka protected route fail-closed status mismatch');
assert.equal(channelDecision.channels.bazos.currentHead, '053a4d3', 'Bazos current head mismatch');
assert.equal(channelDecision.channels.bazos.routeStatus['/orders'], 401, 'Bazos protected orders route fail-closed status mismatch');
assert.equal(channelDecision.channels.allegro.currentHead, '60fb3f3', 'Allegro current head mismatch');
assert.equal(channelDecision.channels.allegro.routeStatus['/cabinet/orders'], 200, 'Allegro cabinet orders route status mismatch');
assert.equal(channelDecision.channels.aukro.currentHead, 'e264a34', 'Aukro current head mismatch');
assert.equal(channelDecision.channels.aukro.routeStatus['/aukro/ui/dashboard'], 403, 'Aukro protected route fail-closed status mismatch');
assert.equal(channelDecision.channels.flipflop.proofStatus, 'service_scoped_proxy_browser_proof_proven_direct_human_optional', 'FlipFlop proof status mismatch');
assert.equal(channelDecision.channels.heureka.proofStatus, 'orders_list_non_stale_lifecycle_api_proven_dom_optional', 'Heureka proof status mismatch');
assert.equal(channelDecision.channels.bazos.proofStatus, 'bounded_paid_multi_product_customer_admin_lifecycle_proven_natural_provider_optional', 'Bazos proof status mismatch');
assert.equal(channelDecision.channels.allegro.proofStatus, 'bounded_buyer_lifecycle_and_central_forwarded_shipment_proven_natural_buyer_provider_optional', 'Allegro proof status mismatch');
assert.equal(channelDecision.channels.aukro.proofStatus, 'protected_customer_admin_lifecycle_api_proven_dom_optional', 'Aukro proof status mismatch');

const missingGateMarkers = [
  'Direct safe-human FlipFlop browser proof if product requires it beyond the already proven service-scoped proxy proof.',
  'Heureka optional browser DOM render capture if API-backed dashboard lifecycle proof is not sufficient.',
  'Aukro approved human/admin bearer or bounded fixture for protected customer/admin lifecycle proof.',
  'Real subject-bound Allegro buyer order row and buyer bearer before Allegro buyer cabinet lifecycle can be called live-complete.',
  'Bazos paid replay source is deployed, but current aggregate has totalOrders=0; live paid multi-product evidence and approved customer/admin lifecycle proof remain missing.',
  'Warehouse/Allegro shipment-status runtime proof is closed for bounded status-only display; optional real provider live-read and future audited full-tracking reveal remain product-gated:',
  'FlipFlop service-scoped browser-render proof is proven; tracking visibility is status-only and raw tracking values remain forbidden, while optional channel human/DOM proofs and optional real provider live-read evidence remain product-gated.',
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
  audit.includes('Heureka optional browser DOM render capture if API-backed dashboard lifecycle proof is not sufficient.') &&
    audit.includes('Warehouse/Allegro shipment-status runtime proof is closed for bounded status-only display; optional real provider live-read and future audited full-tracking reveal remain product-gated:'),
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
