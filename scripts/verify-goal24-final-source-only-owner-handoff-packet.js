const assert = require('assert/strict');
const fs = require('fs');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

function requireIncludes(source, needle, label) {
  assert.ok(source.includes(needle), `${label} missing: ${needle}`);
}
function requireIncludesAny(source, needles, label) {
  assert.ok(needles.some((needle) => source.includes(needle)), `${label} missing one of: ${needles.join(' OR ')}`);
}

const packet = read('docs/orchestrator/2026-07-04-goal24-final-source-only-owner-handoff-packet.md');
const report = read('reports/validation/VAL-GOAL-24-orders-final-owner-handoff-packet-2026-07-04.md');
const readiness = read('reports/validation/VAL-GOAL-24-orders-paid-provider-bundle-readiness.md');
const status = read('docs/orchestrator/STATUS.md');
const state = read('docs/IMPLEMENTATION_STATE.md');
const rollbackReadiness = read('docs/orchestrator/2026-07-03-goal24-orders-cancel-cleanup-rollback-readiness.md');
const paymentsPacket = read('../payments-microservice/docs/orchestrator/2026-07-04-goal24-final-owner-approval-runtime-packet.md');
const paymentsPreSideEffectPacket = read('../payments-microservice/docs/orchestrator/2026-07-04-goal24-pre-side-effect-runtime-execution-packet.md');
const ordersPaymentsPreSideEffectConsumption = read('reports/validation/VAL-GOAL-24-orders-consume-payments-pre-side-effect-packet-445c4e7-2026-07-04.md');
const ordersPaymentsOwnerAuthorityConsumption = read('reports/validation/VAL-GOAL-24-orders-consume-payments-owner-authority-4f21094-2026-07-04.md');
const ordersPaymentsUnpaidIdempotencyConsumption = read('reports/validation/VAL-GOAL-24-orders-consume-payments-unpaid-idempotency-7853822-2026-07-04.md');
const paymentsOwnerAuthorityIntake = read('../payments-microservice/reports/validation/VAL-GOAL-24-payments-owner-authority-intake-2026-07-04.md');
const catalogNoGo = read('../catalog-microservice/reports/validation/VAL-GOAL-24-catalog-consume-orders-warehouse-no-go-9287e3f-eee2f20-2026-07-04.md');
const flipflopNoGo = read('../flipflop/reports/validation/VAL-GOAL-24-flipflop-consume-current-no-go-heads-2026-07-04.md');

const marker = '[RESOLVED/NARROWED: Orders final owner handoff packet is source-defined for Goal 24 paid/provider cleanup after Catalog 7c85732 and FlipFlop 99dfe76 plus Payments 4f21094 owner authority; runtime route invocation remains hard-stopped until exact future payment/order/provider hashes, Orders actor/reason/idempotency/sideEffectsHandled, exact Warehouse reservation lookup state, channel acknowledgement, provider proof, and final redacted evidence exist]';

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
    '[MISSING: exact destination/source account proof, amount, reference, deadline, and redacted completion evidence for the future linked payment]',
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


for (const [label, source] of [
  ['Orders Payments owner authority consumption report', ordersPaymentsOwnerAuthorityConsumption],
  ['packet', packet],
  ['validation report', report],
  ['readiness report', readiness],
  ['status', status],
  ['implementation state', state],
  ['rollback readiness', rollbackReadiness],
]) {
  requireIncludes(source, '[RESOLVED/NARROWED: Orders consumed Payments 4f21094 owner authority intake naming Sergey Stasok / Сергей Сташок as Payments/provider rollback owner, bank/refund authority, and bank/refund executor for Goal 24 runtime planning; Orders route invocation remains blocked until exact target order hash/state, Orders actor/reason/idempotency/sideEffectsHandled, provider proof, exact Warehouse reservation lookup state, channel acknowledgement, and final redacted evidence exist]', `${label} Payments owner authority consumption marker`);
  requireIncludes(source, 'Sergey Stasok', `${label} Latin owner name`);
  requireIncludes(source, 'Сергей Сташок', `${label} Cyrillic owner name`);
  requireIncludes(source, '[MISSING: future paymentId/orderId/variableSymbolHash/providerTransactionHash for exact smoke]', `${label} exact future identity still missing`);
  requireIncludes(source, '[MISSING: final redacted evidence path for required provider, Orders, Warehouse, and channel cleanup proof]', `${label} final evidence still missing`);
  requireIncludes(source, 'orders_route_invocation: false', `${label} Orders route boundary`);
  requireIncludes(source, 'warehouse_mutation: false', `${label} Warehouse boundary`);
}

for (const [label, source] of [
  ['Payments owner authority intake report', paymentsOwnerAuthorityIntake],
  ['Payments final packet', paymentsPacket],
]) {
  requireIncludes(source, '[RESOLVED/NARROWED: owner statement names Sergey Stasok / Сергей Сташок as the human Payments/provider rollback owner, bank/refund authority, and bank/refund executor for Goal 24 runtime planning; runtime side effects remain blocked until exact future payment/order/provider hashes, provider proof, Orders/Warehouse/channel packets, idempotency keys, and final redacted evidence exist]', `${label} Payments owner intake marker`);
  requireIncludes(source, 'Sergey Stasok', `${label} Latin owner name`);
  requireIncludes(source, 'Сергей Сташок', `${label} Cyrillic owner name`);
  if (label === 'Payments final packet') {
    const paymentsFutureIdentityMissing = '[MISSING: future paymentId/orderId/variableSymbolHash/providerTransactionHash for exact smoke]';
    const paymentsFutureIdentityRecorded = '[RESOLVED/NARROWED: exact selected runtime initiation window and payment/order/provider identity are recorded in reports/validation/VAL-GOAL-24-live-paid-provider-runtime-evidence-2026-07-04.md';
    assert.ok(source.includes(paymentsFutureIdentityMissing) || source.includes(paymentsFutureIdentityRecorded), 'Payments final packet missing future identity missing-or-recorded marker');
    if (source.includes(paymentsFutureIdentityRecorded)) {
      requireIncludes(source, 'provider completion, refund/reversal, Orders cleanup, Warehouse cleanup, and channel cleanup remain blocked', 'Payments final packet recorded identity still blocks cleanup');
    }
  } else {
    requireIncludes(source, '[MISSING: future paymentId/orderId/variableSymbolHash/providerTransactionHash for exact smoke]', `${label} exact future identity still missing`);
  }
  if (label === 'Payments final packet') {
    const paymentsFinalEvidencePathMissing = '[MISSING: final redacted evidence path for required provider, Orders, Warehouse, and channel cleanup proof]';
    const paymentsFinalEvidencePathReserved = '[RESOLVED/NARROWED: final redacted evidence path is reserved as reports/validation/VAL-GOAL-24-final-redacted-cleanup-evidence-2026-07-04.md for required provider, Orders, Warehouse, and channel cleanup proof; runtime evidence content remains missing until exact provider proof, Orders packet, Warehouse lookup/cleanup, channel acknowledgement, and idempotency keys are captured]';
    assert.ok(source.includes(paymentsFinalEvidencePathMissing) || source.includes(paymentsFinalEvidencePathReserved), 'Payments final packet missing final evidence path missing-or-reserved marker');
    if (source.includes(paymentsFinalEvidencePathReserved)) {
      assert.ok(
      source.includes('[MISSING: complete runtime evidence content at reports/validation/VAL-GOAL-24-final-redacted-cleanup-evidence-2026-07-04.md for provider, Orders, Warehouse, channel cleanup, idempotency, and validation sections]') ||
        source.includes('[MISSING: complete runtime evidence content at reports/validation/VAL-GOAL-24-final-redacted-cleanup-evidence-2026-07-04.md for Orders, Warehouse, channel cleanup, idempotency, and validation sections]'), 'Payments final packet reserved path runtime-content blocker');
    }
  } else {
    requireIncludes(source, '[MISSING: final redacted evidence path for required provider, Orders, Warehouse, and channel cleanup proof]', `${label} final evidence still missing`);
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
  'Payments `4f21094 docs: record goal24 payments owner authority intake`',
  'Warehouse `eee2f20 docs: consume goal24 orders no-go preflight`',
  'Catalog `7c85732 docs: consume goal24 orders warehouse no-go heads`',
  'FlipFlop `99dfe76 docs: consume goal24 current no-go heads`',
]) {
  requireIncludes(packet, currentHead, `packet current head ${currentHead}`);
}

const paymentsPreSideEffectMarker = '[RESOLVED/NARROWED: Orders consumed Payments 445c4e7 pre-side-effect runtime execution packet as source-only provider-authenticity handoff evidence; Orders route invocation remains blocked until a separate current side-effect execution window, exact future payment/order/provider hashes, provider proof or unpaid acknowledgement, Orders actor/reason/idempotency/sideEffectsHandled, deterministic Warehouse reservation lookup state, channel acknowledgement, and final redacted evidence exist]';
for (const [label, source] of [
  ['Orders Payments pre-side-effect consumption report', ordersPaymentsPreSideEffectConsumption],
  ['packet', packet],
  ['validation report', report],
  ['readiness report', readiness],
  ['status', status],
  ['implementation state', state],
  ['rollback readiness', rollbackReadiness],
]) {
  requireIncludes(source, paymentsPreSideEffectMarker, `${label} Payments 445c4e7 pre-side-effect marker`);
  for (const blocker of [
    '[MISSING: current side-effect execution window owned by a separate newer integration owner thread]',
    '[MISSING: future paymentId/orderId/variableSymbolHash/providerTransactionHash for exact smoke]',
    '[MISSING: concrete side-effectful rollback run id and cleanup idempotency keys derived from the future approval id and sanitized payment hash]',
    '[MISSING: Fiobanka provider-side completed-transfer refund/reversal/correction proof hash, or owner-approved unpaid no-provider-cancel acknowledgement]',
    '[MISSING: exact Orders target order hash/state, cancellation actor, approval id, safe reason code, idempotency key, and sideEffectsHandled payment|warehouse|notification|crm|channel acknowledgements for the future smoke]',
    '[MISSING: exact selected Warehouse reservation lookup state for cleanup]',
    '[MISSING: owner-approved channel side-effect acknowledgement for the selected central order hash]',
    '[MISSING: final redacted evidence path for required provider, Orders, Warehouse, and channel cleanup proof]',
  ]) {
    requireIncludes(source, blocker, `${label} preserved blocker ${blocker}`);
  }
  requireIncludes(source, 'orders_route_invocation: false', `${label} Orders route boundary`);
  requireIncludes(source, 'warehouse_mutation: false', `${label} Warehouse boundary`);
}
for (const markerText of [
  'id: PAYMENTS-GOAL24-PRE-SIDE-EFFECT-RUNTIME-EXECUTION-PACKET',
  '[MISSING: current side-effect execution window owned by a separate newer integration owner thread]',
  '[MISSING: official/native Fio Banka callback signature contract if provider-authentic bank-originated signatures are required]',
]) {
  requireIncludes(paymentsPreSideEffectPacket, markerText, `Payments pre-side-effect packet ${markerText}`);
}


for (const [label, source] of [
  ['Orders Payments unpaid/idempotency consumption report', ordersPaymentsUnpaidIdempotencyConsumption],
  ['packet', packet],
  ['status', status],
  ['implementation state', state],
]) {
  requireIncludes(source, '[RESOLVED/NARROWED: Orders consumed Payments 7853822 unpaid no-provider-cancel and runtime idempotency packet as source-only selected cleanup planning evidence; selected centralOrderHash 04d7d08c82a07853, paymentHash 49853ba96700cdd1, approval GOAL24-PAID-PROVIDER-SMOKE-20260704-CODEX-OWNER-APPROVED-003, reason GOAL24_PROVIDER_UNPAID_CANCEL, and Orders idempotency label orders:goal24:post-paid-correction:GOAL24-PAID-PROVIDER-SMOKE-20260704-CODEX-OWNER-APPROVED-003:49853ba96700cdd1 are recorded for planning only; Orders route invocation remains blocked until exact Orders current state, cancellation actor/approvedBy, unused-key preflight, sideEffectsHandled warehouse|notification|crm|channel acknowledgements, exact Warehouse reservation lookup state, channel acknowledgement, and final redacted evidence exist]', `${label} Payments unpaid/idempotency marker`);
  requireIncludes(source, '[RESOLVED/NARROWED: owner-approved unpaid no-provider-cancel acknowledgement for selected Goal 24 Fiobanka QR payment hash 49853ba96700cdd1 / latestPaymentIdHash 49853ba96700cdd18431dcecee869d5838aa98f582503f269d414eabc0dc06a2, centralOrderHash 04d7d08c82a07853, providerTransactionIdHash/variableSymbolHash 7f5ec0c1ad061a41b23155fb645680fabfcb663867cc2e33a1a32c0537bdae41, amount 300.00 CZK, status processing; no provider-side cancel/refund is required unless later bank completion evidence appears]', `${label} unpaid no-provider acknowledgement`);
  requireIncludes(source, 'orders:goal24:post-paid-correction:GOAL24-PAID-PROVIDER-SMOKE-20260704-CODEX-OWNER-APPROVED-003:49853ba96700cdd1', `${label} Orders idempotency label`);
  requireIncludesAny(source, [
    '[MISSING: exact selected Warehouse reservation lookup state for this central order/component set]',
    '[MISSING: exact selected Warehouse reservation lookup state for cleanup]',
  ], `${label} Warehouse blocker`);
  requireIncludesAny(source, [
    '[MISSING: owner-approved channel side-effect acknowledgement for centralOrderHash 04d7d08c82a07853]',
    '[MISSING: owner-approved channel side-effect acknowledgement for the selected central order hash]',
  ], `${label} channel blocker`);
  requireIncludes(source, 'orders_route_invocation: false', `${label} Orders route boundary`);
  requireIncludes(source, 'warehouse_mutation: false', `${label} Warehouse boundary`);
}

console.log('Goal 24 Orders final source-only owner handoff packet verified');
