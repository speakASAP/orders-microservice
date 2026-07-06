#!/usr/bin/env node
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const packetPath = path.join(root, 'docs/orchestrator/2026-07-06-w8-bazos-product-decision-intake-packet.md');
const reportPath = path.join(root, 'reports/validation/VAL-W8-bazos-product-decision-intake-2026-07-06.md');
const currentGatePath = path.join(root, 'reports/validation/VAL-W8-bazos-provider-current-gate-2026-07-06.md');
const runtimePacketPath = path.join(root, 'docs/orchestrator/2026-07-05-runtime-gate-packet-contracts.md');
const browserOrderPath = path.join(root, 'docs/orchestrator/2026-07-03-channel-browser-smoke-order.md');
const statusPath = path.join(root, 'docs/orchestrator/STATUS.md');
const unifiedCurrentPath = path.join(root, 'reports/validation/VAL-unified-order-lifecycle-platform-current-state-2026-07-05.md');
const finalIntegrationPath = path.join(root, 'reports/validation/VAL-W7-error-free-orders-lifecycle-final-integration-2026-07-05.md');
const masterPlanPath = path.join(root, 'docs/orchestrator/2026-07-05-error-free-orders-lifecycle-master-plan.md');
const bazosRoot = process.env.BAZOS_REPO_PATH || '/home/ssf/Documents/Github/bazos';
const bazosPacketPath = path.join(bazosRoot, 'docs/orchestrator/2026-07-06-w8-bazos-product-decision-intake-packet.md');
const bazosReportPath = path.join(bazosRoot, 'reports/validation/2026-07-06-W8-bazos-product-decision-intake.md');
const bazosVerifierPath = path.join(bazosRoot, 'scripts/verify-bazos-product-decision-intake.js');
const bazosStatePath = path.join(bazosRoot, 'docs/IMPLEMENTATION_STATE.md');

function read(file) {
  assert.equal(fs.existsSync(file), true, `${path.relative(root, file)} is missing`);
  return fs.readFileSync(file, 'utf8');
}
function assertIncludes(source, marker, label) {
  assert.equal(source.includes(marker), true, `${label} missing marker: ${marker}`);
}
function assertNotIncludes(source, marker, label) {
  assert.equal(source.includes(marker), false, `${label} must not include marker: ${marker}`);
}

const packet = read(packetPath);
const report = read(reportPath);
const currentGate = read(currentGatePath);
const runtimePacket = read(runtimePacketPath);
const browserOrder = read(browserOrderPath);
const status = read(statusPath);
const unifiedCurrent = read(unifiedCurrentPath);
const finalIntegration = read(finalIntegrationPath);
const masterPlan = read(masterPlanPath);
const bazosPacket = read(bazosPacketPath);
const bazosReport = read(bazosReportPath);
const bazosVerifier = read(bazosVerifierPath);
const bazosState = read(bazosStatePath);

const decision = '[RESOLVED/NARROWED: W8 Bazos product decision intake packet is source-defined; real provider-backed Bazos lifecycle remains blocked until an owner selects one allowed decision option and supplies the required non-secret evidence]';
const ipsMarkers = ['Vision ->','Goal Impact ->','System ->','Feature ->','Task ->','Execution Plan ->','Coding Prompt ->','Code ->','Validation ->'];
for (const marker of ipsMarkers) {
  assertIncludes(packet, marker, 'W8 intake packet IPS chain');
  assertIncludes(report, marker, 'W8 intake report IPS chain');
}
for (const doc of [packet, report, currentGate, runtimePacket, browserOrder, status]) {
  assertIncludes(doc, decision, 'W8 intake decision propagation');
}
assertIncludes(currentGate, 'owner_decision_option_gated_not_autonomous_source_gap', 'W8 provider current gate owner-decision status');
assertIncludes(currentGate, 'Provider/status packet fields are required only for `provider_backed_supported`', 'W8 provider current gate conditional provider fields');
const bazosLocalDecision = 'Bazos owner must select exactly one product decision option';
assertIncludes(bazosPacket, bazosLocalDecision, 'Bazos W8 local decision packet');
assertIncludes(bazosReport, '[MISSING: Bazos owner must select exactly one allowed product decision option]', 'Bazos W8 local report owner blocker');
assertIncludes(bazosState, 'W8 Bazos product/provider decision intake packet added source-only', 'Bazos W8 implementation state propagation');
for (const doc of [unifiedCurrent, finalIntegration, masterPlan]) {
  assertIncludes(doc, '[MISSING: Bazos owner must select exactly one allowed product decision option]', 'Orders W8 current-state owner blocker propagation');
  assertIncludes(doc, '[UNKNOWN: live Bazos marketplace webhook support]', 'Orders W8 current-state unknown provider propagation');
}
assertIncludes(unifiedCurrent, 'The intake packet itself is no longer missing.', 'Unified current state W8 intake no longer missing');
assertIncludes(finalIntegration, 'Consumed Bazos commit: `3abd0ab docs: add W8 Bazos product decision intake`', 'Final integration Bazos intake commit');
assertIncludes(masterPlan, 'local intake packet exists; blocked until Bazos owner selects exactly one allowed product decision option', 'Master plan Bazos intake merge-order');

const options = ['provider_backed_supported', 'provider_backed_not_supported', 'provider_backed_out_of_scope', 'bounded_synthetic_accepted_for_now'];
for (const option of options) {
  assertIncludes(packet, option, 'W8 allowed option packet');
  assertIncludes(report, option, 'W8 allowed option report');
  assertIncludes(bazosPacket, option, 'Bazos W8 allowed option packet');
  assertIncludes(bazosReport, option, 'Bazos W8 allowed option report');
}
assertIncludes(packet, 'Any other option is invalid.', 'W8 invalid option guard');

const requiredMarkers = [
  'Decision owner: named product/provider owner or owner role.',
  'Provider order item/status ingestion contract.',
  'Provider status transition sample with raw provider payload redacted.',
  'Item identity mapping sample from provider listing/item/ad id to Catalog `productId` and Orders item snapshot.',
  'Warehouse-owned `warehouseId` source for every provider-backed item.',
  'Payment status mapping and whether paid state is provider-originated or Orders/Payments-originated.',
  'Fulfillment/delivery status mapping and whether Warehouse callback remains canonical.',
  'Explicit statement that no provider-backed Bazos lifecycle proof is claimed.',
  'Product acceptance that bounded synthetic/internal Bazos ingestion plus central Orders UI projection is sufficient for the stated scope.',
  'Confirmation that no source code should invent provider adapters, webhook payloads, item mappings, or Warehouse `warehouseId` values.',
];
for (const marker of requiredMarkers) assertIncludes(packet, marker, 'W8 required field marker');

const missingMarkers = [
  '[UNKNOWN: live Bazos marketplace webhook support]',
  '[MISSING: provider-backed Bazos order item/status ingestion contract]',
  '[MISSING: provider-backed Bazos order status transition sample]',
  '[MISSING: provider-backed Bazos order item identity mapping sample]',
  '[MISSING: Warehouse-owned warehouseId for provider-backed Bazos order items]',
  '[MISSING: approved provider-backed non-secret fixture or live provider smoke packet]',
  '[MISSING: explicit product decision accepting bounded synthetic/internal Bazos scope or declaring provider-backed Bazos out of scope]',
];
for (const marker of missingMarkers) {
  assertIncludes(packet, marker, 'W8 missing marker packet');
  assertIncludes(report, marker, 'W8 missing marker report');
}
const bazosMissingMarkers = [
  '[UNKNOWN: live Bazos marketplace webhook support]',
  '[MISSING: provider-backed Bazos order item/status ingestion contract]',
  '[MISSING: provider-backed Bazos order status transition sample]',
  '[MISSING: provider-backed Bazos order item identity mapping sample]',
  '[MISSING: Warehouse-owned warehouseId for provider-backed Bazos order items]',
  '[MISSING: approved provider-backed non-secret fixture or live provider smoke packet]',
  '[MISSING: Bazos owner must select exactly one allowed product decision option]',
];
for (const marker of bazosMissingMarkers) {
  assertIncludes(bazosPacket, marker, 'Bazos W8 missing marker packet');
  assertIncludes(bazosReport, marker, 'Bazos W8 missing marker report');
}

const abortMarkers = [
  'Provider-backed proof is claimed from synthetic/internal Bazos envelopes',
  'Item identity mapping or Warehouse-owned `warehouseId` is missing',
  'raw provider payload output, token/cookie output, raw order/customer/payment/tracking output',
  'weakens Auth subject binding, uses customer email as ownership proof',
];
for (const marker of abortMarkers) assertIncludes(packet, marker, 'W8 abort marker');

const forbiddenClaims = [
  'provider-backed proof complete',
  'live Bazos marketplace webhook support resolved',
  'product decision approved',
  'runtime smoke approved',
  'provider call passed',
  'raw provider payload:',
  'Bearer ',
];
for (const marker of forbiddenClaims) {
  assertNotIncludes(packet, marker, 'W8 intake packet forbidden claim');
  assertNotIncludes(report, marker, 'W8 intake report forbidden claim');
}

assertIncludes(bazosVerifier, 'verifier: "bazos-product-decision-intake.v1"', 'Bazos W8 verifier identity');
assertIncludes(bazosVerifier, '[MISSING: Bazos owner must select exactly one allowed product decision option]', 'Bazos W8 owner decision blocker');
const result = {
  ok: true,
  verifier: 'orders-w8-bazos-product-decision-packet.v1',
  intakePacketDefined: true,
  bazosLocalIntakeVerified: true,
  bazosLocalIntakeEvidence: 'bazos_docs_report_verifier_state_checked',
  providerBackedProof: 'still_product_provider_decision_gated',
  allowedOptions: options,
  mutation: false,
  providerCall: false,
  deploy: false,
  tokenValuesReadOrPrinted: false,
  sensitiveOutput: 'redacted-source-only',
};
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
