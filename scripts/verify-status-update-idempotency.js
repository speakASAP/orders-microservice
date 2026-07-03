const assert = require('assert/strict');
const { OrdersService } = require('../dist/orders/orders.service');

function makePendingOrder() {
  return {
    id: 'order-pending-1',
    status: 'pending',
    channel: 'flipflop',
    items: [],
  };
}

function makeCancelledOrder() {
  return {
    id: 'order-1',
    status: 'cancelled',
    channel: 'flipflop',
    items: [],
  };
}

async function verifyPersistedCleanupIdempotencyKey() {
  const order = makePendingOrder();
  const saved = [];
  const warehouseCalls = [];
  const service = new OrdersService(
    {
      async findOne() { return order; },
      async save(entity) { saved.push({ ...entity }); return entity; },
      createQueryBuilder() { throw new Error('not used'); },
      manager: {},
    },
    {
      async reserveOrderItems() { throw new Error('not used'); },
      async fulfillOrderItems() { throw new Error('not used'); },
      async releaseOrderItems() { throw new Error('not used'); },
      async cancelOrderItems(updated) { warehouseCalls.push(updated.id); return { status: 'cancelled', attemptedAt: '2026-07-03T10:00:00.000Z', itemCount: 0, reservedCount: 0, failedCount: 0, reasonCode: 'ORDER_CANCELLED', actor: 'orders-microservice' }; },
    },
    {
      async publishOrderUpdated() {},
      async publishOrderPaid() { throw new Error('not used'); },
      async publishOrderLifecycleChanged() {},
    },
    { audit() {} },
  );

  const result = await service.updateStatus('order-pending-1', 'cancelled', {
    actor: { sub: 'orders-owner-1', email: 'orders.owner@example.invalid' },
    approval: {
      approved: true,
      approvalType: 'human',
      reasonCode: 'GOAL24_PAID_PROVIDER_ROLLBACK',
      idempotencyKey: 'goal24:sha256:abcdef1234567890',
      sideEffectsHandled: {
        payment: true,
        warehouse: true,
        notification: true,
        crm: true,
        channel: true,
      },
    },
  });

  assert.equal(result.status, 'cancelled');
  assert.equal(warehouseCalls.length, 1);
  assert.equal(saved[0].statusTransitionAudit.idempotencyKey, 'goal24:sha256:abcdef1234567890');
  assert.equal(saved[0].statusTransitionAudit.reasonCode, 'GOAL24_PAID_PROVIDER_ROLLBACK');
  assert.equal(JSON.stringify(saved).includes('bearer'), false);
}

async function run() {
  await verifyPersistedCleanupIdempotencyKey();
  const order = makeCancelledOrder();
  const events = [];
  const audits = [];
  const service = new OrdersService(
    {
      async findOne() {
        return order;
      },
      async save() {
        throw new Error('idempotent replay must not save the order');
      },
      createQueryBuilder() {
        throw new Error('not used');
      },
      manager: {},
    },
    {
      async reserveOrderItems() { throw new Error('not used'); },
      async fulfillOrderItems() { throw new Error('not used'); },
      async releaseOrderItems() { throw new Error('not used'); },
      async cancelOrderItems() {
        throw new Error('idempotent cancelled replay must not call Warehouse cancel');
      },
    },
    {
      async publishOrderUpdated() {
        events.push('updated');
        throw new Error('idempotent replay must not publish order update');
      },
      async publishOrderPaid() { throw new Error('not used'); },
      async publishOrderLifecycleChanged() {
        events.push('lifecycle');
        throw new Error('idempotent replay must not publish lifecycle update');
      },
    },
    {
      audit(metadata) {
        audits.push(metadata);
      },
    },
  );

  const result = await service.updateStatus('order-1', 'cancelled', {
    actor: { sub: 'orders-owner-1', email: 'orders.owner@example.invalid' },
    approval: {
      approved: true,
      approvalType: 'human',
      reasonCode: 'GOAL24_PAID_PROVIDER_ROLLBACK',
      sideEffectsHandled: {
        payment: true,
        warehouse: true,
        notification: true,
        crm: true,
        channel: true,
      },
    },
  });

  assert.equal(result, order);
  assert.deepEqual(events, []);
  assert.equal(audits.length, 1);
  assert.equal(audits[0].operation, 'order.status.update.idempotent_replay');
  assert.equal(audits[0].previousStatus, 'cancelled');
  assert.equal(audits[0].resultingStatus, 'cancelled');
  assert.equal(JSON.stringify(audits).includes('GOAL24_PAID_PROVIDER_ROLLBACK'), false);

  console.log('status update idempotency verification ok');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
