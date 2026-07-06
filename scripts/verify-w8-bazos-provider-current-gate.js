#!/usr/bin/env node
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const bazosRoot = process.env.BAZOS_REPO_PATH || '/home/ssf/Documents/Github/bazos';
const reportPath = path.join(root, 'reports/validation/VAL-W8-bazos-provider-current-gate-2026-07-06.md');
const finalReportPath = path.join(root, 'reports/validation/VAL-W7-error-free-orders-lifecycle-final-integration-2026-07-05.md');
const masterPlanPath = path.join(root, 'docs/orchestrator/2026-07-05-error-free-orders-lifecycle-master-plan.md');
const statePath = path.join(root, 'docs/IMPLEMENTATION_STATE.md');
const servicePath = path.join(bazosRoot, 'services/aukro-service/src/aukro/orders/orders.service.ts');
const controllerPath = path.join(bazosRoot, 'services/aukro-service/src/aukro/orders/orders.controller.ts');
const gateVerifierPath = path.join(bazosRoot, 'scripts/verify-bazos-provider-proof-gate.js');
const boundaryVerifierPath = path.join(bazosRoot, 'scripts/verify-bazos-provider-proof-boundary.js');
const w4ReportPath = path.join(bazosRoot, 'reports/validation/2026-07-05-W4-bazos-orders-lifecycle-cabinet-provider-proof.md');
const w8ReportPath = path.join(bazosRoot, 'reports/validation/2026-07-05-W8-bazos-provider-backed-order-lifecycle-proof-blocker.md');

function read(file) {
  assert.equal(fs.existsSync(file), true, file + ' is missing');
  return fs.readFileSync(file, 'utf8');
}
function assertIncludes(source, marker, label) {
  assert.equal(source.includes(marker), true, label + ' missing marker: ' + marker);
}
function assertNotIncludes(source, marker, label) {
  assert.equal(source.includes(marker), false, label + ' must not include marker: ' + marker);
}

const report = read(reportPath);
const finalReport = read(finalReportPath);
const masterPlan = read(masterPlanPath);
const state = read(statePath);
const service = read(servicePath);
const controller = read(controllerPath);
const gateVerifier = read(gateVerifierPath);
const boundaryVerifier = read(boundaryVerifierPath);
const w4Report = read(w4ReportPath);
const w8Report = read(w8ReportPath);

const decision = '[RESOLVED/NARROWED: W8 Bazos provider-backed proof is not an autonomous source implementation gap; current Bazos source supports bounded synthetic/internal order ingestion and central Orders UI proof, while true provider-backed webhook/status proof remains owner-decision-option gated]';
const ipsMarkers = ['Vision ->','Goal Impact ->','System ->','Feature ->','Task ->','Execution Plan ->','Coding Prompt ->','Code ->','Validation ->'];
for (const marker of ipsMarkers) assertIncludes(report, marker, 'W8 report IPS chain');
for (const doc of [report, finalReport, masterPlan, state]) assertIncludes(doc, decision, 'W8 decision propagation');

const sourceMarkers = [
  "const LIVE_BAZOS_WEBHOOK_SUPPORT = '[UNKNOWN: live Bazos marketplace webhook support]'",
  "message: 'Synthetic/internal Bazos order ingested'",
  'liveWebhookSupport: LIVE_BAZOS_WEBHOOK_SUPPORT',
  "const BAZOS_ORDER_ITEM_CONTRACT_MISSING = '[MISSING: Bazos order item ingestion contract]'",
  "const BAZOS_ORDER_WAREHOUSE_ID_MISSING = '[MISSING: Warehouse-owned warehouseId for Bazos order item]'",
];
for (const marker of sourceMarkers) assertIncludes(service, marker, 'Bazos service boundary');
assertIncludes(controller, "@Post('webhook')", 'Bazos webhook route exists');
assertIncludes(controller, '@UseGuards(JwtAuthGuard)', 'Bazos orders route guarded');

const gateMarkers = [
  '[UNKNOWN: live Bazos marketplace webhook support]',
  '[MISSING: provider-backed Bazos order item/status ingestion contract]',
  '[MISSING: provider-backed Bazos order status transition sample]',
  '[MISSING: provider-backed Bazos order item identity mapping sample]',
  '[MISSING: Warehouse-owned warehouseId for provider-backed Bazos order items]',
  '[MISSING: approved provider-backed non-secret fixture or live provider smoke packet]',
];
for (const marker of gateMarkers) {
  assertIncludes(report, marker, 'Orders W8 report gate marker');
  assertIncludes(w8Report, marker, 'Bazos W8 report gate marker');
}
assertIncludes(report, '[MISSING: Bazos owner must select exactly one allowed product decision option]', 'Orders W8 owner decision blocker');
assertIncludes(report, 'Bounded synthetic/internal evidence is not provider-backed proof', 'Orders W8 bounded proof distinction');
assertIncludes(report, 'owner_decision_option_gated_not_autonomous_source_gap', 'Orders W8 owner decision gate status');
assertIncludes(report, 'Provider/status packet fields are required only for `provider_backed_supported`', 'Orders W8 provider fields conditional on supported option');
assertIncludes(w8Report, 'Rejected as provider-backed proof:', 'Bazos W8 rejected evidence heading');
assertIncludes(w8Report, 'Synthetic/internal webhook envelopes.', 'Bazos W8 rejects synthetic webhook evidence');
assertIncludes(w4Report, 'Status: source-verified, runtime buyer/admin smoke gated, provider-backed webhook proof missing', 'Bazos W4 boundary');
assertIncludes(gateVerifier, "providerBackedProof: 'blocked'", 'Bazos gate verifier blocked status');
assertIncludes(boundaryVerifier, 'providerBackedProof: "blocked"', 'Bazos boundary verifier blocked status');
assertIncludes(boundaryVerifier, 'synthetic/internal Bazos order ingestion is not provider-backed webhook/status proof', 'Bazos boundary verifier distinction');

const forbiddenClaims = [
  'provider-backed proof complete',
  'live Bazos marketplace webhook support resolved',
  'provider call passed',
  'raw provider payload',
  'token value',
];
for (const marker of forbiddenClaims) {
  assertNotIncludes(report, marker, 'Orders W8 report forbidden claim');
}

const result = {
  ok: true,
  verifier: 'orders-w8-bazos-provider-current-gate.v1',
  providerBackedProof: 'owner_decision_option_gated',
  autonomousSourceGap: false,
  boundedSyntheticInternalProofAccepted: true,
  liveWebhookSupport: '[UNKNOWN: live Bazos marketplace webhook support]',
  mutation: false,
  providerCall: false,
  deploy: false,
  tokenValuesReadOrPrinted: false,
  sensitiveOutput: 'redacted-source-only',
};
process.stdout.write(JSON.stringify(result, null, 2) + '\n');
