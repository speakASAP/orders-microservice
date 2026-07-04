const assert = require('assert/strict');
const fs = require('fs');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}
function requireIncludes(source, needle, label) {
  assert.ok(source.includes(needle), `${label} missing: ${needle}`);
}

const marker = '[RESOLVED/NARROWED: Orders consumed Warehouse 032ed96 no-mutation acknowledgement and FlipFlop 86394e7 channel no-cleanup acknowledgement for centralOrderHash 04d7d08c82a07853 as source-owned sideEffectsHandled.warehouse=true and sideEffectsHandled.channel=true planning evidence; Orders route invocation remains blocked until named runtime Orders actor/approvedBy, unused-key preflight, sideEffectsHandled.notification=true, sideEffectsHandled.crm=true, and final redacted evidence content exist]';
const report = read('reports/validation/VAL-GOAL-24-orders-consume-sideeffects-acks-2026-07-04.md');
const state = read('docs/IMPLEMENTATION_STATE.md');
const status = read('docs/orchestrator/STATUS.md');
const packet = read('docs/orchestrator/2026-07-04-goal24-final-source-only-owner-handoff-packet.md');
const finalReport = read('reports/validation/VAL-GOAL-24-orders-final-owner-handoff-packet-2026-07-04.md');
const readiness = read('reports/validation/VAL-GOAL-24-orders-paid-provider-bundle-readiness.md');
const selectedLookup = read('reports/validation/VAL-GOAL-24-selected-readonly-lookup-2026-07-04.md');
const warehouseAck = read('../warehouse-microservice/reports/validation/VAL-GOAL-24-warehouse-no-mutation-ack-2026-07-04.md');
const flipflopAck = read('../flipflop/reports/validation/VAL-GOAL-24-channel-no-cleanup-ack-2026-07-04.md');

for (const [label, source] of [
  ['report', report],
  ['state', state],
  ['status', status],
  ['packet', packet],
  ['final report', finalReport],
  ['readiness', readiness],
  ['selected lookup', selectedLookup],
]) {
  requireIncludes(source, marker, `${label} side-effect ack marker`);
  requireIncludes(source, 'orders_route_invocation: false', `${label} Orders route boundary`);
  requireIncludes(source, 'orders_mutation: false', `${label} Orders mutation boundary`);
  requireIncludes(source, 'warehouse_mutation: false', `${label} Warehouse mutation boundary`);
  requireIncludes(source, 'channel_cleanup_mutation: false', `${label} channel mutation boundary`);
  requireIncludes(source, '[MISSING: final redacted evidence content for Orders, Warehouse, channel cleanup, idempotency, and validation sections]', `${label} final evidence blocker`);
}

for (const required of [
  'Warehouse acknowledgement: `032ed96 docs: record goal24 warehouse no-mutation ack`',
  'FlipFlop acknowledgement: `86394e7 docs: record goal24 channel no-cleanup ack`',
  '`sideEffectsHandled.warehouse=true`',
  '`sideEffectsHandled.channel=true`',
  '`sideEffectsHandled.notification=true`: `[MISSING: owner-approved notification acknowledgement for centralOrderHash 04d7d08c82a07853]`',
  '`sideEffectsHandled.crm=true`: `[MISSING: owner-approved CRM acknowledgement for centralOrderHash 04d7d08c82a07853]`',
  '[MISSING: named runtime Orders cancellation actor/approvedBy for centralOrderHash 04d7d08c82a07853]',
  '[MISSING: unused-key preflight and same-request replay proof for Orders idempotency label orders:goal24:post-paid-correction:GOAL24-PAID-PROVIDER-SMOKE-20260704-CODEX-OWNER-APPROVED-003:49853ba96700cdd1]',
  'Orders must not infer Warehouse stock effects from Payments refund state',
  'notification_mutation: false',
  'crm_mutation: false',
  'raw_ids_printed: false',
]) {
  requireIncludes(report, required, `report required evidence ${required}`);
}

requireIncludes(warehouseAck, '[RESOLVED/NARROWED: owner-approved Warehouse no-mutation acknowledgement for Goal 24 centralOrderHash 04d7d08c82a07853 accepts the selected read-only lookup state with two expired component reservation rows and zero active/fulfilled/cancelled/released/returned rows; Warehouse cleanup operation matrix is no-op for release/fulfill/cancel/return/expire, and no Warehouse mutation is required for this selected unpaid cancellation path]', 'Warehouse ack marker');
requireIncludes(flipflopAck, '[RESOLVED/NARROWED: owner-approved FlipFlop channel no-cleanup acknowledgement for Goal 24 centralOrderHash 04d7d08c82a07853 accepts the selected read-only channel correlation state with one pending local fiobanka order, paymentStatus pending, total 300.00, and central forwarding accepted; no cart/session/payment-result/local projection cleanup mutation is required before Orders unpaid cancellation planning, and no channel cleanup mutation occurred]', 'FlipFlop ack marker');

console.log('Goal 24 Orders side-effect acknowledgement consumption verified');
