const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const reportPath = 'reports/validation/VAL-GOAL-24-orders-paid-provider-bundle-readiness.md';
const createDto = read('src/orders/create-order.dto.ts');
const ordersService = read('src/orders/orders.service.ts');
const ordersController = read('src/orders/orders.controller.ts');
const orderEvents = read('src/orders/order-events.service.ts');
const warehouseClient = read('src/warehouse/warehouse-reservation.client.ts');
const fulfillmentHandoff = read('src/orders/order-fulfillment-handoff.client.ts');
const paymentDto = read('src/payments/payment-status.dto.ts');
const paymentBoundary = read('docs/orchestrator/PAYMENT_STATUS_BOUNDARY.md');
const warehouseBoundary = read('docs/orchestrator/WAREHOUSE_HANDOFF_CONTRACT.md');
const transitionBoundary = read('docs/orchestrator/ORDER_STATUS_TRANSITIONS.md');
const rollbackReadiness = read('docs/orchestrator/2026-07-03-goal24-orders-cancel-cleanup-rollback-readiness.md');
const createContract = read('docs/orchestrator/CHANNEL_ORDER_CREATE_CONTRACT.md');
const createVerifier = read('scripts/verify-create-order-contract.js');
const paymentVerifier = read('scripts/verify-payment-boundary.js');
const report = read(reportPath);

function requireIncludes(source, needle, label) {
  assert.ok(source.includes(needle), `${label} missing: ${needle}`);
}

function requireMatch(source, pattern, label) {
  assert.match(source, pattern, `${label} missing pattern ${pattern}`);
}

for (const [source, label] of [
  [createContract, 'create contract'],
  [createVerifier, 'create verifier'],
  [report, 'readiness report'],
]) {
  requireIncludes(source, 'catalog.bundle.v1', label);
  requireIncludes(source, 'bundleEvidence', label);
}

requireIncludes(createDto, "contractVersion !== 'catalog.bundle.v1'", 'create dto');
requireIncludes(createDto, "const allowedKeys = new Set(['contractVersion', 'bundleId', 'productIds', 'discountPolicyRef', 'freeShippingPolicyRef', 'serverTotalSource'])", 'bundle evidence allowlist');
requireIncludes(createDto, 'productIds must match submitted order item productIds', 'bundle evidence product-set check');
requireIncludes(createDto, 'Unsupported bundleEvidence', 'bundle evidence unknown field rejection');
requireIncludes(createVerifier, 'appliedSavings', 'create verifier pricing-claim rejection');
requireIncludes(createVerifier, 'paymentProviderMetadata', 'create verifier provider metadata rejection');
requireIncludes(createVerifier, 'validateCreate must not reserve warehouse stock', 'validate-create non-mutation guard');

requireIncludes(ordersService, 'mutation: false', 'validate-create response');
requireIncludes(ordersService, 'warehouseMutation: false', 'validate-create response');
requireIncludes(ordersService, 'eventPublished: false', 'validate-create response');
requireIncludes(ordersService, 'bundleEvidenceCount', 'validate-create bundle evidence count');
requireMatch(orderEvents, /publishOrderCreated\([\s\S]*items\?:/, 'order-created publisher signature');
assert.equal(orderEvents.includes('bundleEvidence'), false, 'orders.order.created publisher must not include bundleEvidence');

requireIncludes(paymentDto, "export type PaymentsOwnedStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';", 'payment status dto');
requireIncludes(paymentDto, "if (normalized === 'refunded' || normalized === 'refund' || normalized === 'partially_refunded')", 'refund rejection');
for (const forbidden of ['providerTransactionId', 'providerResponse', 'metadata', 'refund', 'amount', 'currency', 'customer', 'card', 'token', 'secret']) {
  requireIncludes(paymentDto, `'${forbidden}'`, `payment forbidden field ${forbidden}`);
}
requireIncludes(paymentBoundary, 'Orders does not receive raw provider webhooks', 'payment boundary provider webhook ownership');
requireIncludes(paymentBoundary, 'Refunds remain Payments-owned', 'payment boundary refund ownership');
requireIncludes(paymentBoundary, 'Manual payment-state bypass', 'payment boundary manual bypass rejection');
requireIncludes(paymentBoundary, 'orders.payment-status.v1', 'payment boundary status contract');
requireIncludes(warehouseBoundary, 'PAYMENT_CONFIRMED', 'warehouse paid fulfillment reason');
requireIncludes(warehouseBoundary, 'PAYMENT_FAILED_RELEASE', 'warehouse failed/cancelled release reason');
requireIncludes(warehouseBoundary, 'ORDER_CANCELLED', 'warehouse cancellation cleanup reason');
requireIncludes(warehouseBoundary, 'Orders must not edit stock truth', 'warehouse cleanup ownership');
requireIncludes(transitionBoundary, 'side-effect acknowledgements for payment, warehouse, notification, CRM, and channel handling', 'order cancellation side-effect gate');
requireIncludes(rollbackReadiness, 'without manual payment-state bypass', 'rollback readiness no manual bypass');
requireIncludes(rollbackReadiness, 'provider refund or cancellation plus Orders/Warehouse cleanup', 'rollback readiness blocker');
requireIncludes(rollbackReadiness, 'must be proven by Payments first', 'rollback readiness provider proof first');
requireIncludes(paymentVerifier, 'cannot mark a cancelled order as paid', 'payment verifier cancelled paid rejection');
requireIncludes(paymentVerifier, 'refund or correction workflow', 'payment verifier paid downgrade rejection');
requireIncludes(paymentVerifier, 'provider-owned', 'payment verifier provider data rejection');
requireIncludes(ordersController, "internal:payments-microservice:service", 'payment-status route Payments service role');
requireIncludes(ordersController, "@Put(':id/payment-status')", 'payment-status route');
requireIncludes(ordersService, 'fulfillOrderItems(updated)', 'payment success Warehouse fulfill call');
requireIncludes(ordersService, 'releaseOrderItems(updated)', 'payment failed/cancelled Warehouse release call');
requireIncludes(ordersService, 'createAfterPaymentFulfillment(updated)', 'post-paid Warehouse fulfillment handoff');
requireIncludes(warehouseClient, "fulfill: 'PAYMENT_CONFIRMED'", 'Warehouse fulfill reason mapping');
requireIncludes(warehouseClient, "cancel: 'ORDER_CANCELLED'", 'Warehouse cancel reason mapping');
requireIncludes(warehouseClient, "return: 'ORDER_RETURNED'", 'Warehouse return reason mapping');
requireIncludes(fulfillmentHandoff, "reasonCode: 'PAYMENT_CONFIRMED'", 'Warehouse fulfillment handoff reason');

const ordersCheckoutSource = [ordersService, ordersController, paymentDto].join('\n');
assert.equal(
  /PAYMENTS_SERVICE_URL|payments\/create|\/payments\/create|CreatePayment|createPayment\(/.test(ordersCheckoutSource),
  false,
  'Orders source must not claim active Payments checkout creation proof',
);

for (const required of [
  '[RESOLVED: owner-approved Rung 1 non-mutating real checkout smoke passed',
  '[RESOLVED: owner-approved Rung 2 live pending-order smoke proved pending Orders create',
  '[MISSING: owner-approved paid/provider checkout smoke with stock and refund/cancel rollback plan]',
  '[MISSING: owner-approved refund/cancel rollback plan proving provider refund or cancellation plus Orders/Warehouse cleanup]',
  '[MISSING: provider-specific side-effect-safe rollback contract for the selected payment method]',
  '[MISSING: owner-approved paid/provider payment provider source and callback contract]',
  '[MISSING: owner-approved Warehouse stock decrement/fulfillment rollback criteria for paid bundle smoke]',
  '[MISSING: owner-approved Payments refund/cancel rollback workflow for paid bundle smoke]',
  '[MISSING: proof that active checkout paths pass central Orders UUIDs to Payments]',
  '[MISSING: Orders/Payments provider-success, provider-cancel, refund, and post-fulfillment cancellation event contract that maps to Warehouse fulfill/cancel/return calls]',
  '[MISSING: runtime verification of Payments Orders service token/role]',
]) {
  requireIncludes(report, required, 'readiness report blocker/evidence');
}

console.log('goal24 paid/provider bundle readiness verification ok');
