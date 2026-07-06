#!/usr/bin/env node
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const packetPath = path.join(root, 'docs/orchestrator/2026-07-06-w1w2-synthetic-cleanup-policy-packet.md');
const reportPath = path.join(root, 'reports/validation/VAL-W7-W1W2-synthetic-cleanup-policy-2026-07-06.md');
const liveProofPath = path.join(root, 'reports/validation/VAL-W7-W1W2-live-buyer-bound-proof-2026-07-05.md');
const runtimePacketPath = path.join(root, 'docs/orchestrator/2026-07-05-w1w2-synthetic-lifecycle-runtime-packet.md');
const runtimeGatePath = path.join(root, 'docs/orchestrator/2026-07-05-runtime-gate-packet-contracts.md');
const finalReportPath = path.join(root, 'reports/validation/VAL-W7-error-free-orders-lifecycle-final-integration-2026-07-05.md');
const ordersControllerPath = path.join(root, 'src/orders/orders.controller.ts');
const ordersServicePath = path.join(root, 'src/orders/orders.service.ts');
const statusTransitionsPath = path.join(root, 'src/orders/status-transitions.ts');
const warehouseClientPath = path.join(root, 'src/warehouse/warehouse-reservation.client.ts');
const warehouseReservationsControllerPath = '/home/ssf/Documents/Github/warehouse-microservice/src/reservations/reservations.controller.ts';
const warehouseStockServicePath = '/home/ssf/Documents/Github/warehouse-microservice/src/stock/stock.service.ts';
const warehouseReservationEntityPath = '/home/ssf/Documents/Github/warehouse-microservice/src/reservations/stock-reservation.entity.ts';

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

const packet = read(packetPath);
const report = read(reportPath);
const liveProof = read(liveProofPath);
const runtimePacket = read(runtimePacketPath);
const runtimeGate = read(runtimeGatePath);
const finalReport = read(finalReportPath);
const ordersController = read(ordersControllerPath);
const ordersService = read(ordersServicePath);
const statusTransitions = read(statusTransitionsPath);
const warehouseClient = read(warehouseClientPath);
const warehouseReservationsController = read(warehouseReservationsControllerPath);
const warehouseStockService = read(warehouseStockServicePath);
const warehouseReservationEntity = read(warehouseReservationEntityPath);

const ipsMarkers = ['Vision ->','Goal Impact ->','System ->','Feature ->','Task ->','Execution Plan ->','Coding Prompt ->','Code ->','Validation ->'];
for (const marker of ipsMarkers) {
  assertIncludes(packet, marker, 'cleanup packet IPS chain');
  assertIncludes(report, marker, 'cleanup report IPS chain');
}

const decision = '[RESOLVED/NARROWED: cleanup route/policy for W1/W2 synthetic lifecycle rows is defined as fail-closed Orders-owned cleanup decision packet; live retention or cancellation remains blocked until current redacted readback and owner side-effect acknowledgements exist]';
for (const doc of [packet, report, liveProof, runtimePacket, runtimeGate, finalReport]) {
  assertIncludes(doc, decision, 'cleanup decision propagation');
}

const policyMarkers = [
  'status: route_policy_defined_runtime_cleanup_blocked',
  'packetId: W1W2-SYNTHETIC-CLEANUP-POLICY-2026-07-06',
  'PUT /api/orders/:id/status',
  'status=cancelled',
  'ORDER_STATUS_UPDATE_ROLES',
  'internal:orders-microservice:action-admin',
  'approval.approved=true',
  'approval.approvalType=human',
  'approval.sideEffectsHandled.payment|warehouse|notification|crm|channel=true',
  'GET /api/reservations/order/:orderId',
  'Do not use `release`; it cannot release fulfilled rows.',
  'payment-status downgrade',
  '[MISSING: approved W1/W2 cleanup mutation or retention packet naming exact target hashes and actor]',
  '[MISSING: current Orders lifecycle/payment/fulfillment readback before cleanup decision]',
  '[MISSING: Warehouse reservation lookup via GET /api/reservations/order/:orderId before cleanup decision]',
  '[MISSING: sideEffectsHandled.payment|warehouse|notification|crm|channel acknowledgements before cancellation cleanup]',
  '[MISSING: explicit owner decision to retain the paid synthetic evidence row if no cleanup mutation is chosen]',
  '[MISSING: same-request replay/idempotency proof for any future Orders cancellation route invocation]',
  'This packet does not authorize direct DB deletion, direct Warehouse-only cleanup',
  'Runtime cleanup remains blocked',
  'Runtime no-cleanup retention also remains blocked',
];
for (const marker of policyMarkers) assertIncludes(packet, marker, 'cleanup packet policy marker');

const boundaryMarkers = [
  'No cleanup route invocation',
  'Warehouse mutation',
  'direct DB write/delete',
  'payment downgrade',
  'provider call',
  'token output',
  'raw ID output',
  'raw DB row output',
  'raw customer/payment/provider/tracking output',
];
for (const marker of boundaryMarkers) assertIncludes(report, marker, 'cleanup report boundary');

assertIncludes(liveProof, 'W1/W2 cleanup route/policy is source-defined by `docs/orchestrator/2026-07-06-w1w2-synthetic-cleanup-policy-packet.md`', 'live proof cleanup propagation');
assertIncludes(runtimePacket, 'Cleanup policy packet: `docs/orchestrator/2026-07-06-w1w2-synthetic-cleanup-policy-packet.md`', 'runtime packet cleanup propagation');
assertIncludes(runtimeGate, 'Cleanup route/policy is source-defined in `docs/orchestrator/2026-07-06-w1w2-synthetic-cleanup-policy-packet.md`', 'runtime gate cleanup propagation');
assertIncludes(finalReport, 'W1/W2 cleanup route/policy is source-defined as fail-closed', 'final report cleanup propagation');

assertIncludes(ordersController, "@Put(':id/status')", 'Orders status route');
assertIncludes(ordersController, 'ORDER_STATUS_UPDATE_ROLES', 'Orders status route roles');
assertIncludes(ordersController, "'internal:orders-microservice:action-admin'", 'Orders action-admin role');
assertIncludes(ordersService, "if (transition.status === 'cancelled')", 'Orders cancellation branch');
assertIncludes(ordersService, 'warehouseReservations.cancelOrderItems(updated)', 'Orders Warehouse cancel handoff');
assertIncludes(ordersService, "previousPaymentStatus === 'paid' && normalized.paymentStatus !== 'paid'", 'Orders paid downgrade guard');
assertIncludes(statusTransitions, "throw new Error('Order cancellation requires approval.approved=true')", 'approval approved guard');
assertIncludes(statusTransitions, "throw new Error('Order cancellation requires approval.approvalType=human')", 'human approval guard');
assertIncludes(statusTransitions, "throw new Error('Order cancellation requires an Auth actor identity or approval.approvedBy')", 'approvedBy guard');
assertIncludes(statusTransitions, "['payment', 'warehouse', 'notification', 'crm', 'channel']", 'side effects list');
assertIncludes(statusTransitions, 'SAFE_IDEMPOTENCY_KEY_PATTERN', 'idempotency sanitizer');
assertIncludes(warehouseClient, 'async cancelOrderItems(order: Order', 'Warehouse client cancel');
assertIncludes(warehouseClient, "return this.applyReservationAction('cancel', order, reasonCode)", 'Warehouse client cancel action');
assertIncludes(warehouseClient, "cancel: 'ORDER_CANCELLED'", 'Warehouse cancel reason');
assertIncludes(warehouseReservationsController, "@Get('order/:orderId')", 'Warehouse order lookup route');
assertIncludes(warehouseReservationsController, "@Post('release')", 'Warehouse release route');
assertIncludes(warehouseReservationsController, "@Post('cancel')", 'Warehouse cancel route');
assertIncludes(warehouseReservationsController, "@Post('return')", 'Warehouse return route');
assertIncludes(warehouseReservationEntity, "'active' | 'released' | 'fulfilled' | 'cancelled' | 'expired' | 'returned'", 'Warehouse reservation statuses');
assertIncludes(warehouseStockService, 'async unreserveStock', 'Warehouse release semantics');
assertIncludes(warehouseStockService, "findReservationForUpdate(manager, { productId, warehouseId, orderId, channel }, ['active'])", 'Warehouse active-only release/fulfill/expire lookup');
assertIncludes(warehouseStockService, "findReservationForUpdate(manager, { productId, warehouseId, orderId, channel }, ['active', 'fulfilled'])", 'Warehouse cancel active/fulfilled lookup');
assertIncludes(warehouseStockService, 'async returnReservation', 'Warehouse return semantics');
assertIncludes(warehouseStockService, "findReservationForUpdate(manager, { productId, warehouseId, orderId, channel }, ['fulfilled'])", 'Warehouse fulfilled-only return lookup');

const forbiddenClaims = [
  'cleanup_executed',
  'retention_approved',
  'cleanup route invoked',
  'Warehouse cleanup completed',
  'direct Warehouse cleanup completed',
  'provider refund completed',
  'rawOrderId=',
  'Bearer ',
];
for (const marker of forbiddenClaims) {
  assertNotIncludes(packet, marker, 'cleanup packet forbidden claim');
  assertNotIncludes(report, marker, 'cleanup report forbidden claim');
}

const result = {
  ok: true,
  verifier: 'orders-w1w2-synthetic-cleanup-policy.v1',
  routePolicyDefined: true,
  runtimeCleanupBlocked: true,
  runtimeRetentionBlocked: true,
  ordersOwnedRoute: 'PUT /api/orders/:id/status',
  warehouseLookupRequired: 'GET /api/reservations/order/:orderId',
  mutation: false,
  providerCall: false,
  deploy: false,
  tokenValuesReadOrPrinted: false,
  rawIdsPrinted: false,
  sensitiveOutput: 'redacted-source-only',
};
process.stdout.write(JSON.stringify(result, null, 2) + '\n');
