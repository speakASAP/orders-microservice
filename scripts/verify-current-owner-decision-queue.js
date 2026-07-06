#!/usr/bin/env node
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const docPath = path.join(root, 'docs/orchestrator/2026-07-06-owner-decision-optional-gate-queue.md');
const reportPath = path.join(root, 'reports/validation/VAL-W7-current-owner-decision-queue-2026-07-06.md');
const statusPath = path.join(root, 'docs/orchestrator/STATUS.md');
const statePath = path.join(root, 'docs/IMPLEMENTATION_STATE.md');
const runtimePacketPath = path.join(root, 'docs/orchestrator/2026-07-05-runtime-gate-packet-contracts.md');
const completionAuditPath = path.join(root, 'docs/orchestrator/2026-07-03-orders-lifecycle-completion-audit.md');
const w8PacketPath = path.join(root, 'docs/orchestrator/2026-07-06-w8-bazos-product-decision-intake-packet.md');
const finalReportPath = path.join(root, 'reports/validation/VAL-W7-error-free-orders-lifecycle-final-integration-2026-07-05.md');
const bazosRoot = process.env.BAZOS_REPO_PATH || '/home/ssf/Documents/Github/bazos';
const bazosPacketPath = path.join(bazosRoot, 'docs/orchestrator/2026-07-06-w8-bazos-product-decision-intake-packet.md');

function read(file) {
  assert.equal(fs.existsSync(file), true, path.relative(root, file) + ' is missing');
  return fs.readFileSync(file, 'utf8');
}
function assertIncludes(source, marker, label) {
  assert.equal(source.includes(marker), true, label + ' missing marker: ' + marker);
}
function assertNotIncludes(source, marker, label) {
  assert.equal(source.includes(marker), false, label + ' must not include marker: ' + marker);
}

const doc = read(docPath);
const report = read(reportPath);
const status = read(statusPath);
const state = read(statePath);
const runtimePacket = read(runtimePacketPath);
const completionAudit = read(completionAuditPath);
const w8Packet = read(w8PacketPath);
const finalReport = read(finalReportPath);
const bazosPacket = read(bazosPacketPath);

const ipsMarkers = ['Vision ->','Goal Impact ->','System ->','Feature ->','Task ->','Execution Plan ->','Coding Prompt ->','Code ->','Validation ->'];
for (const marker of ipsMarkers) {
  assertIncludes(doc, marker, 'owner decision queue doc IPS chain');
  assertIncludes(report, marker, 'owner decision queue report IPS chain');
}

const decision = '[RESOLVED/NARROWED: required Orders lifecycle implementation is complete and current remaining work is owner/product-gated optional proof or exact runtime packets]';
assertIncludes(doc, decision, 'queue doc decision');
assertIncludes(report, decision, 'queue report decision');
assertIncludes(completionAudit, 'Status: required implementation complete.', 'completion audit required complete');
assertIncludes(completionAudit, 'Required implementation evidence is complete; optional natural/human/provider proofs remain product-gated follow-up evidence only.', 'completion audit optional gate boundary');
assertIncludes(status, 'Current Owner Decision Queue Recorded', 'status owner decision queue');
assertIncludes(state, 'Current owner decision queue recorded', 'state owner decision queue');

const requiredQueueMarkers = [
  'W8 Bazos provider/product scope',
  '[MISSING: Bazos owner must select exactly one allowed product decision option]',
  '[UNKNOWN: live Bazos marketplace webhook support]',
  'provider_backed_supported',
  'provider_backed_not_supported',
  'provider_backed_out_of_scope',
  'bounded_synthetic_accepted_for_now',
  'Do not invent provider webhook contracts, provider payloads, item mappings, or Warehouse warehouseId values',
  'W3-W5 natural/customer-bound marketplace proof',
  '[MISSING: approved buyer/admin bearer/session packets for optional natural human-session/customer-bound proof when product requires proof beyond accepted bounded/service-scoped evidence]',
  'Do not downgrade accepted bounded/service-scoped W3-W5 evidence',
  'Extra Warehouse fulfillment callback smoke',
  '[MISSING: approved Warehouse fulfillment runtime packet]',
  'W1/W2 synthetic cleanup or retention',
  '[MISSING: approved W1/W2 cleanup mutation or retention packet naming exact target hashes and actor]',
  'W9 payment/refund/provider correction',
  '[MISSING: approved exact payment/refund/provider correction runtime packet naming target order hash/state, payment/provider hashes, actor/approvedBy, approval id, safe reason, idempotency key, sideEffectsHandled payment|warehouse|notification|crm|channel, Warehouse lookup state, channel acknowledgement, and final redacted evidence path]',
  'Real provider shipment movement/full tracking reveal',
  'No deploy, live order mutation, Warehouse mutation, payment/refund/provider action, DB read/write, browser session, customer/admin session capture, token output, raw ID output, raw DOM, screenshot, raw customer/payment/provider/tracking output, or provider payload output occurred',
];
for (const marker of requiredQueueMarkers) {
  assertIncludes(doc, marker, 'owner decision queue doc marker');
  assertIncludes(report, marker, 'owner decision queue report marker');
}

const crossDocMarkers = [
  '[MISSING: Bazos owner must select exactly one allowed product decision option]',
  '[UNKNOWN: live Bazos marketplace webhook support]',
  '[MISSING: approved buyer/admin bearer/session packets for optional natural human-session/customer-bound proof when product requires proof beyond accepted bounded/service-scoped evidence]',
];
for (const marker of crossDocMarkers) {
  assertIncludes(report, marker, 'queue cross-doc marker');
  assertIncludes(runtimePacket, marker, 'runtime packet cross-doc marker');
}
assertIncludes(w8Packet, 'Any other option is invalid.', 'W8 allowed option guard');
assertIncludes(bazosPacket, 'Bazos owner must select exactly one product decision option', 'Bazos local owner decision blocker');
assertIncludes(finalReport, 'W5 service-scoped proof, Allegro/Bazos bounded proof, and FlipFlop W6 central action proof are not reopened by this safety rule', 'final report no downgrade boundary');
assertIncludes(runtimePacket, '[RESOLVED/NARROWED: FlipFlop W6B central action authority is runtime-complete; future natural human/admin browser proof remains optional/product-gated and does not reopen W6B action authority]', 'W6B resolved current packet');
assertIncludes(runtimePacket, 'Payment/refund/provider correction remains outside W6B and is governed by the W9 exact-runtime-packet gate', 'W6B payment/provider boundary');
assertNotIncludes(runtimePacket, 'Status: [MISSING: approved live action-admin session packet].', 'W6B stale missing status');

const forbiddenClaims = [
  'Bazos provider-backed proof complete',
  'live Bazos marketplace webhook support resolved',
  'natural human-session proof complete',
  'runtime cleanup executed',
  'refund executed',
  'provider call passed',
  'token value',
];
for (const marker of forbiddenClaims) assertNotIncludes(report, marker, 'owner decision queue forbidden claim');

const result = {
  ok: true,
  verifier: 'orders-current-owner-decision-queue.v1',
  requiredImplementation: 'complete',
  remainingWork: 'owner_product_gated_optional_proof_or_exact_runtime_packets',
  w8Bazos: 'owner_decision_required',
  mutation: false,
  providerCall: false,
  deploy: false,
  databaseRead: false,
  browserSessionUsed: false,
  tokenValuesReadOrPrinted: false,
  sensitiveOutput: 'redacted-source-only',
};
process.stdout.write(JSON.stringify(result, null, 2) + '\n');
