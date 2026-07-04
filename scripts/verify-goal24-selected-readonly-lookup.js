const fs = require('fs');
const assert = require('assert/strict');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}
function requireIncludes(source, needle, label) {
  assert.ok(source.includes(needle), `${label} missing: ${needle}`);
}

const marker = '[RESOLVED/NARROWED: Goal 24 selected read-only lookup resolved sanitized Orders state, Warehouse reservation state, and FlipFlop channel correlation for centralOrderHash 04d7d08c82a07853; Orders row count is 1 with status pending/paymentStatus pending/channel flipflop/total 300.00 CZK, Warehouse reservation lookup count is 2 with both component rows expired and zero active/fulfilled/cancelled/released/returned rows, and FlipFlop channel correlation count is 1 with pending/pending fiobanka 300.00 and central forwarding accepted; no cleanup mutation occurred]';
const report = read('reports/validation/VAL-GOAL-24-selected-readonly-lookup-2026-07-04.md');
const state = read('docs/IMPLEMENTATION_STATE.md');
const status = read('docs/orchestrator/STATUS.md');
const packet = read('docs/orchestrator/2026-07-04-goal24-final-source-only-owner-handoff-packet.md');
const consumedHeads = read('reports/validation/VAL-GOAL-24-orders-consume-selected-lookup-heads-2026-07-04.md');
const selectedLookupHeadsMarker = '[RESOLVED/NARROWED: Orders consumed Warehouse 058f5eb selected reservation lookup and FlipFlop 41953d7 selected channel lookup as source-owned read-only evidence for centralOrderHash 04d7d08c82a07853; Warehouse reports two expired component reservations and FlipFlop reports one pending fiobanka channel correlation, but Orders sideEffectsHandled warehouse|channel acknowledgements remain missing until owner-approved acknowledgement packets exist]';

for (const [label, source] of [['report', report], ['state', state], ['status', status], ['packet', packet]]) {
  requireIncludes(source, marker, `${label} selected lookup marker`);
}

for (const required of [
  'ordersMatchingRows: `1`',
  'ordersStatus: `pending`',
  'ordersPaymentStatus: `pending`',
  'ordersChannel: `flipflop`',
  'ordersTotal: `300.00`',
  'orderItemCount: `2`',
  'warehouseReservationLookupCount: `2`',
  'warehouseReservationExpiredCount: `2`',
  'warehouseReservationActiveCount: `0`',
  'warehouseReservationFulfilledCount: `0`',
  'warehouseReservationCancelledCount: `0`',
  'warehouseReservationReleasedCount: `0`',
  'warehouseReservationReturnedCount: `0`',
  'flipflopCorrelationCount: `1`',
  'flipflopStatus: `pending`',
  'flipflopPaymentStatus: `pending`',
  'flipflopPaymentMethod: `fiobanka`',
  'flipflopCentralForwardingAcceptedCount: `1`',
  '[MISSING: named runtime Orders cancellation actor/approvedBy for centralOrderHash 04d7d08c82a07853]',
  '[MISSING: owner-approved sideEffectsHandled warehouse|notification|crm|channel acknowledgements for centralOrderHash 04d7d08c82a07853]',
  '[MISSING: Warehouse owner acknowledgement that expired component reservation rows require no mutation, or explicit approved operation matrix if the owner chooses cleanup evidence beyond readback]',
  '[MISSING: owner-approved channel side-effect acknowledgement for centralOrderHash 04d7d08c82a07853]',
  'orders_route_invocation: false',
  'orders_mutation: false',
  'warehouse_mutation: false',
  'channel_cleanup_mutation: false',
  'raw_ids_printed: false',
]) requireIncludes(report, required, `report evidence ${required}`);

for (const [label, source] of [['consumed heads report', consumedHeads], ['state', state], ['status', status], ['lookup report', report]]) {
  requireIncludes(source, selectedLookupHeadsMarker, `${label} selected lookup heads marker`);
}

console.log('Goal 24 selected read-only lookup verified');
