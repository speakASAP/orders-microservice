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

const decision = '[RESOLVED/NARROWED: W8 Bazos product decision intake packet is source-defined; real provider-backed Bazos lifecycle remains blocked until an owner selects one allowed decision option and supplies the required non-secret evidence]';
const ipsMarkers = ['Vision ->','Goal Impact ->','System ->','Feature ->','Task ->','Execution Plan ->','Coding Prompt ->','Code ->','Validation ->'];
for (const marker of ipsMarkers) {
  assertIncludes(packet, marker, 'W8 intake packet IPS chain');
  assertIncludes(report, marker, 'W8 intake report IPS chain');
}
for (const doc of [packet, report, currentGate, runtimePacket, browserOrder, status]) {
  assertIncludes(doc, decision, 'W8 intake decision propagation');
}

const options = ['provider_backed_supported', 'provider_backed_not_supported', 'provider_backed_out_of_scope', 'bounded_synthetic_accepted_for_now'];
for (const option of options) {
  assertIncludes(packet, option, 'W8 allowed option packet');
  assertIncludes(report, option, 'W8 allowed option report');
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

const result = {
  ok: true,
  verifier: 'orders-w8-bazos-product-decision-packet.v1',
  intakePacketDefined: true,
  providerBackedProof: 'still_product_provider_decision_gated',
  allowedOptions: options,
  mutation: false,
  providerCall: false,
  deploy: false,
  tokenValuesReadOrPrinted: false,
  sensitiveOutput: 'redacted-source-only',
};
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
