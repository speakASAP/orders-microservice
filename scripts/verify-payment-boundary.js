const assert = require('assert/strict');
const { BadRequestException } = require('@nestjs/common');
const {
  PAYMENT_STATUS_CONTRACT_VERSION,
  normalizePaymentStatusUpdate,
} = require('../dist/payments/payment-status.dto');
const { OrdersService } = require('../dist/orders/orders.service');

function makeOrder(overrides = {}) {
  return {
    id: 'order-1',
    status: 'pending',
    channel: 'flipflop',
    paymentStatus: 'pending',
    paymentMethod: 'card',
    items: [],
    ...overrides,
  };
}

function makeService(order = makeOrder()) {
  const events = [];
  const audits = [];
  const saved = [];
  const warehouseCalls = [];
  const service = new OrdersService(
    {
      async findOne() {
        return order;
      },
      async save(entity) {
        saved.push({ ...entity });
        return entity;
      },
      createQueryBuilder() {
        throw new Error('not used');
      },
      manager: {},
    },
    {
      async reserveOrderItems() { throw new Error('not used'); },
      async fulfillOrderItems(order) {
        warehouseCalls.push({ action: 'fulfill', orderId: order.id });
        return { status: 'fulfilled', attemptedAt: '2026-06-13T10:00:00.000Z', itemCount: order.items.length, reservedCount: order.items.length, failedCount: 0, reasonCode: 'PAYMENT_CONFIRMED', actor: 'orders-microservice' };
      },
      async releaseOrderItems(order) {
        warehouseCalls.push({ action: 'release', orderId: order.id });
        return { status: 'released', attemptedAt: '2026-06-13T10:00:00.000Z', itemCount: order.items.length, reservedCount: order.items.length, failedCount: 0, reasonCode: 'PAYMENT_FAILED_RELEASE', actor: 'orders-microservice' };
      },
      async cancelOrderItems() { throw new Error('not used'); },
    },
    {
      async publishOrderUpdated(orderId, status) {
        events.push({ type: 'updated', orderId, status });
      },
      async publishOrderPaid(orderId, paymentReferenceId) {
        events.push({ type: 'paid', orderId, paymentReferenceId });
      },
      async publishOrderLifecycleChanged(payload) {
        events.push({ type: 'lifecycle', orderId: payload.orderId, lifecycleStage: payload.lifecycleStage });
      },
    },
    {
      audit(metadata) {
        audits.push(metadata);
      },
    },
  );
  return { service, order, events, audits, saved, warehouseCalls };
}

(async () => {
  const normalized = normalizePaymentStatusUpdate({
    contractVersion: PAYMENT_STATUS_CONTRACT_VERSION,
    paymentId: 'payment-1',
    applicationId: 'flipflop-service',
    status: 'completed',
    paymentMethod: 'stripe',
    occurredAt: '2026-06-13T10:00:00.000Z',
  });
  assert.equal(normalized.paymentStatus, 'paid');
  assert.equal(normalized.paymentReferenceId, 'payment-1');
  assert.equal(normalized.paymentApplicationId, 'flipflop-service');
  assert.equal(normalized.paymentMethod, 'stripe');
  assert.equal(normalized.paymentUpdatedAt.toISOString(), '2026-06-13T10:00:00.000Z');

  assert.throws(
    () => normalizePaymentStatusUpdate({
      contractVersion: PAYMENT_STATUS_CONTRACT_VERSION,
      paymentId: 'payment-1',
      status: 'refunded',
    }),
    BadRequestException,
  );

  assert.throws(
    () => normalizePaymentStatusUpdate({
      contractVersion: PAYMENT_STATUS_CONTRACT_VERSION,
      paymentId: 'payment-1',
      status: 'completed',
      providerTransactionId: 'provider-owned',
    }),
    BadRequestException,
  );

  const paid = makeService();
  const paidOrder = await paid.service.applyPaymentStatus('order-1', {
    contractVersion: PAYMENT_STATUS_CONTRACT_VERSION,
    paymentId: 'payment-1',
    applicationId: 'payments-microservice',
    status: 'completed',
    paymentMethod: 'stripe',
    occurredAt: '2026-06-13T10:00:00.000Z',
  }, { sub: 'payments-service', roles: ['internal:payments-microservice:service'] });

  assert.equal(paidOrder.paymentStatus, 'paid');
  assert.equal(paidOrder.paymentReferenceId, 'payment-1');
  assert.equal(paidOrder.paymentApplicationId, 'payments-microservice');
  assert.equal(paidOrder.paymentMethod, 'stripe');
  assert.equal(paidOrder.paymentUpdatedAt.toISOString(), '2026-06-13T10:00:00.000Z');
  assert.equal(paidOrder.status, 'confirmed');
  assert.deepEqual(paid.warehouseCalls, [{ action: 'fulfill', orderId: 'order-1' }]);
  assert.equal(paidOrder.warehouseHandoff.status, 'fulfilled');
  assert.deepEqual(paid.events, [
    { type: 'lifecycle', orderId: 'order-1', lifecycleStage: 'warehouse_fulfillment_requested' },
    { type: 'updated', orderId: 'order-1', status: 'confirmed' },
    { type: 'paid', orderId: 'order-1', paymentReferenceId: 'payment-1' },
  ]);
  assert.equal(JSON.stringify(paidOrder).includes('provider-owned'), false);

  const failed = makeService(makeOrder({ status: 'confirmed' }));
  const failedOrder = await failed.service.applyPaymentStatus('order-1', {
    contractVersion: PAYMENT_STATUS_CONTRACT_VERSION,
    paymentId: 'payment-2',
    status: 'failed',
  }, { sub: 'payments-service' });
  assert.equal(failedOrder.paymentStatus, 'failed');
  assert.equal(failedOrder.status, 'confirmed');
  assert.deepEqual(failed.warehouseCalls, [{ action: 'release', orderId: 'order-1' }]);
  assert.equal(failedOrder.warehouseHandoff.status, 'released');
  assert.deepEqual(failed.events, [{ type: 'lifecycle', orderId: 'order-1', lifecycleStage: 'payment_failed' }]);

  const providerCancelled = makeService(makeOrder({ status: 'confirmed' }));
  const providerCancelledOrder = await providerCancelled.service.applyPaymentStatus('order-1', {
    contractVersion: PAYMENT_STATUS_CONTRACT_VERSION,
    paymentId: 'payment-3',
    status: 'cancelled',
  }, { sub: 'payments-service' });
  assert.equal(providerCancelledOrder.paymentStatus, 'cancelled');
  assert.equal(providerCancelledOrder.status, 'confirmed');
  assert.deepEqual(providerCancelled.warehouseCalls, [{ action: 'release', orderId: 'order-1' }]);
  assert.equal(providerCancelledOrder.warehouseHandoff.status, 'released');
  assert.deepEqual(providerCancelled.events, [{ type: 'lifecycle', orderId: 'order-1', lifecycleStage: 'payment_failed' }]);

  const paidReplay = makeService(makeOrder({
    status: 'confirmed',
    paymentStatus: 'paid',
    paymentReferenceId: 'payment-1',
  }));
  await paidReplay.service.applyPaymentStatus('order-1', {
    contractVersion: PAYMENT_STATUS_CONTRACT_VERSION,
    paymentId: 'payment-1',
    status: 'completed',
    occurredAt: '2026-06-13T10:05:00.000Z',
  }, { sub: 'payments-service' });
  assert.equal(paidReplay.events.length, 0);
  assert.equal(paidReplay.warehouseCalls.length, 0);

  const paidCorrection = makeService(makeOrder({
    status: 'confirmed',
    paymentStatus: 'paid',
    paymentReferenceId: 'payment-1',
  }));
  await assert.rejects(
    () => paidCorrection.service.applyPaymentStatus('order-1', {
      contractVersion: PAYMENT_STATUS_CONTRACT_VERSION,
      paymentId: 'payment-2',
      status: 'completed',
    }, { sub: 'payments-service' }),
    /reference cannot be replaced/i,
  );

  const paidRefundLike = makeService(makeOrder({
    status: 'confirmed',
    paymentStatus: 'paid',
    paymentReferenceId: 'payment-1',
  }));
  await assert.rejects(
    () => paidRefundLike.service.applyPaymentStatus('order-1', {
      contractVersion: PAYMENT_STATUS_CONTRACT_VERSION,
      paymentId: 'payment-1',
      status: 'failed',
    }, { sub: 'payments-service' }),
    /refund or correction workflow/i,
  );

  const failedReplay = makeService(makeOrder({
    status: 'confirmed',
    paymentStatus: 'failed',
    paymentReferenceId: 'payment-2',
  }));
  await failedReplay.service.applyPaymentStatus('order-1', {
    contractVersion: PAYMENT_STATUS_CONTRACT_VERSION,
    paymentId: 'payment-2',
    status: 'failed',
  }, { sub: 'payments-service' });
  assert.equal(failedReplay.warehouseCalls.length, 0);

  const cancelledOrder = makeService(makeOrder({ status: 'cancelled' }));
  await assert.rejects(
    () => cancelledOrder.service.applyPaymentStatus('order-1', {
      contractVersion: PAYMENT_STATUS_CONTRACT_VERSION,
      paymentId: 'payment-3',
      status: 'completed',
    }, { sub: 'payments-service' }),
    /cannot mark a cancelled order as paid/,
  );

  assert.equal(JSON.stringify(paid.audits).includes('provider-owned'), false);
  console.log('payment boundary verification ok');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
