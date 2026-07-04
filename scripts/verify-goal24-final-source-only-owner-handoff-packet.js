const assert = require('assert/strict');
const fs = require('fs');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

function requireIncludes(source, needle, label) {
  assert.ok(source.includes(needle), `${label} missing: ${needle}`);
}

const packet = read('docs/orchestrator/2026-07-04-goal24-final-source-only-owner-handoff-packet.md');
const report = read('reports/validation/VAL-GOAL-24-orders-final-owner-handoff-packet-2026-07-04.md');
const readiness = read('reports/validation/VAL-GOAL-24-orders-paid-provider-bundle-readiness.md');
const status = read('docs/orchestrator/STATUS.md');
const state = read('docs/IMPLEMENTATION_STATE.md');
const rollbackReadiness = read('docs/orchestrator/2026-07-03-goal24-orders-cancel-cleanup-rollback-readiness.md');
const paymentsPacket = read('../payments-microservice/docs/orchestrator/2026-07-04-goal24-final-owner-approval-runtime-packet.md');
const catalogNoGo = read('../catalog-microservice/reports/validation/VAL-GOAL-24-catalog-consume-orders-warehouse-no-go-9287e3f-eee2f20-2026-07-04.md');
const flipflopNoGo = read('../flipflop/reports/validation/VAL-GOAL-24-flipflop-consume-current-no-go-heads-2026-07-04.md');

const marker = '[RESOLVED/NARROWED: Orders final owner handoff packet is source-defined for Goal 24 paid/provider cleanup after Catalog 7c85732 and FlipFlop 99dfe76; runtime route invocation remains hard-stopped until named Payments/bank authority, exact future payment/order/provider hashes, Orders actor/reason/idempotency/sideEffectsHandled, exact Warehouse reservation lookup state, channel acknowledgement, and final redacted evidence exist]';

for (const [label, source] of [
  ['packet', packet],
  ['validation report', report],
]) {
  requireIncludes(source, 'Vision -> Goal Impact -> System -> Feature -> Task -> Execution Plan -> Coding Prompt -> Code -> Validation -> State Update', `${label} IPS chain`);
}

for (const [label, source] of [
  ['packet', packet],
  ['validation report', report],
  ['readiness report', readiness],
  ['status', status],
  ['implementation state', state],
  ['rollback readiness', rollbackReadiness],
]) {
  requireIncludes(source, marker, `${label} marker`);
  for (const blocker of [
    '[MISSING: named human Payments/provider rollback execution owner with bank/refund authority for runtime]',
    '[MISSING: named bank/refund executor, exact destination/source account proof, amount, reference, deadline, and redacted completion evidence for the future linked payment]',
    '[MISSING: future paymentId/orderId/variableSymbolHash/providerTransactionHash for exact smoke]',
    '[MISSING: Fiobanka provider-side completed-transfer refund/reversal/correction proof hash, or owner-approved unpaid no-provider-cancel acknowledgement]',
    '[MISSING: concrete side-effectful rollback run id and cleanup idempotency keys derived from the future approval id and sanitized payment hash]',
    '[MISSING: exact Orders target order hash/state, cancellation actor, approval id, safe reason code, idempotency key, and sideEffectsHandled payment|warehouse|notification|crm|channel acknowledgements for the future smoke]',
    '[MISSING: exact selected Orders cleanup packet runtime values and sideEffectsHandled acknowledgements]',
    '[MISSING: exact selected Warehouse reservation lookup state for cleanup]',
    '[MISSING: owner-approved channel side-effect acknowledgement for the selected central order hash]',
    '[MISSING: final redacted evidence path for required provider, Orders, Warehouse, and channel cleanup proof]',
  ]) {
    requireIncludes(source, blocker, `${label} blocker ${blocker}`);
  }
  for (const boundary of [
    'live_checkout_executed: false',
    'payment_created: false',
    'provider_call: false',
    'refund_or_reversal: false',
    'orders_route_invocation: false',
    'warehouse_mutation: false',
    'channel_cleanup_mutation: false',
    'deployment: false',
    'migration: false',
    'db_write: false',
    'secret_output: false',
    'raw_customer_or_payment_evidence: false',
  ]) {
    requireIncludes(source, boundary, `${label} boundary ${boundary}`);
  }
}

for (const markerText of [
  'status: source-defined-runtime-hard-stopped',
  'route: PUT /api/orders/:id/status',
  'targetStatus: cancelled',
  'targetOrderHash',
  'targetOrderState',
  'actorOrApprovedBy',
  'approvalType: human',
  'GOAL24_PAID_PROVIDER_ROLLBACK',
  'GOAL24_PROVIDER_UNPAID_CANCEL',
  'orders:goal24:post-paid-correction:<approvalId>:<paymentHash>',
  'sideEffectsHandled.payment|warehouse|notification|crm|channel=true',
  'providerEvidenceHash',
  'warehouseDecision',
  'POST /api/reservations/release',
  'POST /api/reservations/fulfill',
  'POST /api/reservations/cancel',
  'POST /api/reservations/return',
  'Unknown Warehouse component state',
  'Orders must not infer Warehouse stock effects from Payments refund state, Orders no-go state, Catalog bundle identity, FlipFlop checkout/channel readiness',
  'tokens, raw provider payloads, full bank data, card/customer data, raw DB rows, raw order ids, raw payment ids, or raw channel order ids',
]) {
  requireIncludes(packet, markerText, `packet required field ${markerText}`);
}

for (const [label, source, head] of [
  ['Payments final packet', paymentsPacket, 'id: PAYMENTS-GOAL24-FINAL-OWNER-APPROVAL-RUNTIME-PACKET'],
  ['Catalog no-go', catalogNoGo, 'Catalog consumed Orders 9287e3f live no-go consumer sync and Warehouse eee2f20 Orders no-go consumer sync'],
  ['FlipFlop no-go', flipflopNoGo, 'FlipFlop consumed Catalog 7c85732 consolidated no-go marker plus Orders 9287e3f, Warehouse eee2f20, Payments cc49c08, and FlipFlop 9a7c664'],
]) {
  requireIncludes(source, head, `${label} consumed marker`);
}

for (const currentHead of [
  'Orders `434b1de docs: consume goal24 catalog flipflop no-go heads`',
  'Payments `cc49c08 docs: record goal24 live no-go preflight`',
  'Warehouse `eee2f20 docs: consume goal24 orders no-go preflight`',
  'Catalog `7c85732 docs: consume goal24 orders warehouse no-go heads`',
  'FlipFlop `99dfe76 docs: consume goal24 current no-go heads`',
]) {
  requireIncludes(packet, currentHead, `packet current head ${currentHead}`);
}

console.log('Goal 24 Orders final source-only owner handoff packet verified');
