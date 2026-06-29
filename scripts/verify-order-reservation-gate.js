const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { BadRequestException } = require('@nestjs/common');
const { OrdersService } = require('../dist/orders/orders.service');
const { CREATE_ORDER_CONTRACT_VERSION } = require('../dist/orders/create-order.dto');

const validRequest = {
  contractVersion: CREATE_ORDER_CONTRACT_VERSION,
  channel: 'flipflop',
  externalOrderId: 'checkout-reservation-1001',
  channelAccountId: 'flipflop-storefront',
  items: [
    {
      productId: 'catalog-product-1',
      sku: 'SKU-1',
      title: 'Catalog product',
      quantity: 2,
      unitPrice: 100,
      totalPrice: 200,
      warehouseId: 'warehouse-1',
    },
  ],
  totals: {
    subtotal: 200,
    shippingCost: 0,
    taxAmount: 0,
    total: 200,
    currency: 'CZK',
  },
};

function makeHandoff(status, overrides = {}) {
  return {
    status,
    attemptedAt: '2026-06-29T10:00:00.000Z',
    completedAt: status === 'reserved' ? '2026-06-29T10:00:01.000Z' : undefined,
    itemCount: 1,
    reservedCount: status === 'reserved' ? 1 : 0,
    failedCount: status === 'failed' ? 1 : 0,
    reasonCode: 'ORDER_CREATE_RESERVATION',
    actor: 'orders-microservice',
    ...overrides,
  };
}

function makeService(handoff) {
  let orderSequence = 0;
  let itemSequence = 0;
  const published = [];
  const auditEvents = [];
  const transactionEvents = [];
  const persistedOrders = [];

  const query = {
    leftJoinAndSelect() { return this; },
    where() { return this; },
    andWhere() { return this; },
    async getOne() { return undefined; },
  };

  const manager = {
    create(_target, value) {
      return { ...value };
    },
    async save(target, value) {
      if (Array.isArray(value)) {
        const savedItems = value.map((item) => ({
          id: item.id || `item-${++itemSequence}`,
          ...item,
        }));
        transactionEvents.push({ target: target.name, action: 'save-items', count: savedItems.length });
        return savedItems;
      }

      if (target.name === 'Order' && !value.id) {
        const savedOrder = { id: `order-${++orderSequence}`, ...value };
        transactionEvents.push({ target: target.name, action: 'save-order-draft', orderId: savedOrder.id });
        return savedOrder;
      }

      if (target.name === 'Order') {
        persistedOrders.push({ ...value });
        transactionEvents.push({
          target: target.name,
          action: 'save-order-final',
          orderId: value.id,
          warehouseHandoffStatus: value.warehouseHandoff?.status,
        });
        return value;
      }

      throw new Error(`Unexpected save target ${target.name}`);
    },
  };

  const orderRepository = {
    createQueryBuilder() { return query; },
    manager: {
      async transaction(callback) {
        transactionEvents.push({ action: 'transaction-start' });
        try {
          const result = await callback(manager);
          transactionEvents.push({ action: 'transaction-commit' });
          return result;
        } catch (error) {
          transactionEvents.push({ action: 'transaction-rollback', message: error.message });
          throw error;
        }
      },
    },
    async save() {
      throw new Error('create must persist warehouseHandoff inside the create transaction');
    },
  };

  const service = new OrdersService(
    orderRepository,
    {
      async reserveOrderItems(order) {
        transactionEvents.push({ action: 'warehouse-reserve', orderId: order.id, itemCount: order.items.length });
        return handoff;
      },
    },
    {
      async publishOrderCreated(orderId, channel) {
        published.push({ orderId, channel });
      },
    },
    {
      audit(metadata) {
        auditEvents.push(metadata);
      },
    },
  );

  return { service, published, auditEvents, transactionEvents, persistedOrders };
}

async function assertRejectedHandoff(handoff) {
  const harness = makeService(handoff);
  await assert.rejects(
    () => harness.service.create(validRequest),
    (error) => error instanceof BadRequestException && /Warehouse reservation is required/.test(error.message),
  );
  assert.deepEqual(harness.published, []);
  assert.equal(harness.persistedOrders.length, 0);
  assert.equal(harness.transactionEvents.some((event) => event.action === 'transaction-rollback'), true);
  assert.equal(
    harness.auditEvents.some((event) => event.operation === 'order.create' && event.outcome === 'failure'),
    true,
  );
}

(async () => {
  const reserved = makeService(makeHandoff('reserved'));
  const created = await reserved.service.create(validRequest);
  assert.equal(created.warehouseHandoff.status, 'reserved');
  assert.deepEqual(reserved.published, [{ orderId: 'order-1', channel: 'flipflop' }]);
  assert.equal(reserved.persistedOrders.length, 1);
  assert.equal(reserved.persistedOrders[0].warehouseHandoff.status, 'reserved');
  assert.equal(reserved.transactionEvents.some((event) => event.action === 'transaction-commit'), true);

  await assertRejectedHandoff(makeHandoff('disabled', { skipReason: 'reservation_disabled' }));
  await assertRejectedHandoff(makeHandoff('skipped', { skipReason: 'missing_warehouse_id' }));
  await assertRejectedHandoff(makeHandoff('failed', { failureCode: 'warehouse_request_failed' }));

  const serviceSource = fs.readFileSync(path.join(__dirname, '..', 'src/orders/orders.service.ts'), 'utf8');
  assert.match(serviceSource, /SELLABLE_ORDER_CHANNELS/);
  assert.match(serviceSource, /assertRequiredWarehouseReservation/);
  assert.match(serviceSource, /handoff\.status === 'reserved'/);

  const handoffContract = fs.readFileSync(path.join(__dirname, '..', 'docs/orchestrator/WAREHOUSE_HANDOFF_CONTRACT.md'), 'utf8');
  assert.match(handoffContract, /Sellable channel create requests fail closed/);
  assert.match(handoffContract, /disabled`, `skipped`, or `failed`/);

  console.log('order reservation gate verification ok');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
