#!/usr/bin/env node
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const contractPath = path.join(root, 'docs/orchestrator/2026-07-05-runtime-gate-packet-contracts.md');
const finalReportPath = path.join(root, 'reports/validation/VAL-W7-error-free-orders-lifecycle-final-integration-2026-07-05.md');
const masterPlanPath = path.join(root, 'docs/orchestrator/2026-07-05-error-free-orders-lifecycle-master-plan.md');

function read(file) {
  assert.equal(fs.existsSync(file), true, path.relative(root, file) + ' is missing');
  return fs.readFileSync(file, 'utf8');
}
function assertIncludes(source, marker, label) {
  assert.equal(source.includes(marker), true, label + ' missing marker: ' + marker);
}
const contract = read(contractPath);
const finalReport = read(finalReportPath);
const masterPlan = read(masterPlanPath);
const paymentProviderDecision = '[RESOLVED/NARROWED: payment/refund/provider correction workflow is source-defined and fail-closed; Orders cancellation/idempotency/side-effect packet shape is verified, while live refund/provider/Orders route execution remains owner-approved exact-runtime-packet gated]';
const ipsMarkers = ['Vision ->','Goal Impact ->','System ->','Feature ->','Task ->','Execution Plan ->','Coding Prompt ->','Code ->','Validation ->'];
for (const marker of ipsMarkers) assertIncludes(contract, marker, 'IPS chain');
const packetSections = ['## W1/W2 Live Synthetic Create Pay Warehouse Read Packet','## W3-W5 Marketplace Natural/Customer-Bound Cabinet Packet','## W6B FlipFlop Route-To-Orders Admin Action Packet','## W8 Bazos Provider-Backed Proof Packet','## Warehouse Callback Runtime Packet','## Payment Refund Provider Correction Runtime Packet'];
for (const marker of packetSections) assertIncludes(contract, marker, 'packet section');
const requiredGateMarkers = ['[RESOLVED: W1/W2 live buyer-bound synthetic lifecycle packet executed and verified]','[MISSING: approved buyer/admin bearer/session packets for optional natural human-session/customer-bound proof when product requires proof beyond accepted bounded/service-scoped evidence]','[MISSING: approved live action-admin session packet]','[MISSING: approved provider-backed non-secret fixture or live provider smoke packet]','[UNKNOWN: live Bazos marketplace webhook support]','[RESOLVED/NARROWED: Warehouse callback source and approved synthetic customer/admin runtime proof are complete; any extra Warehouse callback smoke beyond W1/W2/W2 is not an autonomous source gap and remains product-approved target/status packet gated]','[MISSING: approved Warehouse fulfillment runtime packet]',paymentProviderDecision,'[MISSING: approved exact payment/refund/provider correction runtime packet naming target order hash/state, payment/provider hashes, actor/approvedBy, approval id, safe reason, idempotency key, sideEffectsHandled payment|warehouse|notification|crm|channel, Warehouse lookup state, channel acknowledgement, and final redacted evidence path]'];
for (const marker of requiredGateMarkers) assertIncludes(contract, marker, 'missing gate marker');
const requiredFields = ['packetId','ownerApproval','scope','actor','target','idempotency','sideEffects','readback','redaction','abortConditions','Auth actor/role mapping','Orders idempotency key and replay policy','sideEffectsHandled.payment|warehouse|notification|crm|channel=true','Provider order item/status ingestion contract','Warehouse-owned warehouseId','Subject-bound ownership policy; email fallback is forbidden'];
for (const marker of requiredFields) assertIncludes(contract, marker, 'required packet field');
const forbiddenSafetyMarkers = ['Do not run live mutation from this document.','raw tokens','raw customer/order/payment/provider/tracking payloads','raw DB rows','screenshots','do not authorize any live mutation','provider call','deploy','DB write'];
for (const marker of forbiddenSafetyMarkers) assertIncludes(contract, marker, 'safety marker');
assertIncludes(finalReport, '## Minimum Packets To Close Remaining Gates', 'final W7 report packet section');
assertIncludes(finalReport, 'Orders W1/W2 live buyer-bound synthetic proof is verified', 'final W7 report W1/W2 resolved proof');
assertIncludes(finalReport, 'w1w2_buyer_bound_and_w6b_action_admin_runtime_proven_remaining_marketplace_provider_payment_browser_packets_gated', 'final W7 report updated decision');
assertIncludes(finalReport, 'FlipFlop W6 is runtime-complete', 'final W7 report FlipFlop resolved proof');
assertIncludes(finalReport, 'create 201, read 200, cleanup 200', 'final W7 report FlipFlop runtime statuses');
assertIncludes(finalReport, 'Warehouse callback runtime smoke beyond already proven W1/W2/W2 synthetic evidence', 'final W7 report Warehouse packet');
assertIncludes(finalReport, 'Bazos provider proof: the decision intake packet is now pushed', 'final W7 report Bazos intake packet');
assertIncludes(finalReport, 'exactly one owner decision option is selected', 'final W7 report Bazos owner-decision wording in integrated evidence');
assertIncludes(finalReport, 'Aukro and Heureka are current-proven for service-scoped central Orders lifecycle rendering', 'final W7 report W5 current proof in integrated evidence');
assertIncludes(finalReport, 'W5 service-scoped proof, Allegro/Bazos bounded proof, and FlipFlop W6 central action proof are not reopened by this safety rule', 'final W7 report narrowed no-go safety rule');
assertIncludes(finalReport, 'Natural human-session/customer-bound row proof is not claimed and remains optional/product-gated', 'final W7 report W5 optional natural proof boundary');
assertIncludes(finalReport, '[MISSING: Bazos owner must select exactly one allowed product decision option]', 'final W7 report Bazos owner option blocker');
assertIncludes(finalReport, paymentProviderDecision, 'final W7 report W9 payment/provider gate');
assertIncludes(masterPlan, 'W1/W2 live buyer-bound proof is verified by `npm run verify:w1w2-live-buyer-bound-proof`', 'master plan W1/W2 resolved gate');
assertIncludes(masterPlan, 'FlipFlop W6 central action proof is runtime-complete in FlipFlop `df32252`', 'master plan W6 resolved gate');
assertIncludes(masterPlan, 'Aukro and Heureka are current-proven for service-scoped API/DOM central Orders lifecycle rendering', 'master plan W5 current proof');
assertIncludes(contract, 'Current accepted bounded/service-scoped evidence remains in force for implementation readiness', 'W3-W5 optional natural proof boundary');
assertIncludes(contract, 'Do not use this optional packet to downgrade already accepted bounded/service-scoped W3-W5 evidence', 'W3-W5 downgrade guard');
assertIncludes(finalReport, 'No natural/customer-bound or row-level marketplace buyer/admin cabinet smoke may run without approved bearer/browser-session packets', 'final W7 report optional natural proof wording');
assertIncludes(masterPlan, 'Natural human-session/customer-bound row proof is not claimed and remains optional/product-gated', 'master plan W5 optional natural proof boundary');
assertIncludes(masterPlan, paymentProviderDecision, 'master plan W9 payment/provider gate');
console.log(JSON.stringify({ok:true,verifier:'orders-runtime-gate-packets.v1',packetSections:packetSections.length,runtimeGateMarkers:requiredGateMarkers.length,warehouseCallbackExtraSmoke:'product_approved_packet_gated',paymentProviderCorrection:'exact_runtime_packet_gated',mutation:false,providerCall:false,browserSessionUsed:false,tokenValuesReadOrPrinted:false,sensitiveOutput:'redacted-source-only'}, null, 2));
