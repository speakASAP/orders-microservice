const assert = require('assert/strict');
const { ConflictException } = require('@nestjs/common');
const { OrdersService } = require('../dist/orders/orders.service');
const { CREATE_ORDER_CONTRACT_VERSION } = require('../dist/orders/create-order.dto');

const validRequest = {
  contractVersion: CREATE_ORDER_CONTRACT_VERSION,
  channel: 'flipflop',
  externalOrderId: 'checkout-1001',
  channelAccountId: 'flipflop-storefront',
  orderedAt: '2026-06-13T08:00:00.000Z',
  customer: {
    name: 'Example Customer',
    email: 'customer@example.invalid',
  },
  shippingAddress: {
    name: 'Example Customer',
    street: 'Example Street 1',
    city: 'Prague',
    postalCode: '11000',
    country: 'CZ',
  },
  items: [
    {
      productId: 'catalog-product-1',
      sku: 'SKU-1',
      title: 'Catalog product',
      quantity: 2,
      unitPrice: 100,
      totalPrice: 200,
    },
  ],
  totals: {
    subtotal: 200,
    shippingCost: 0,
    taxAmount: 0,
    total: 200,
    currency: 'CZK',
  },
  payment: {
    method: 'card',
    status: 'pending',
  },
  shipping: {
    method: 'carrier',
  },
};

const existingOrder = {
  id: 'existing-order-id',
  externalOrderId: 'checkout-1001',
  channel: 'flipflop',
  channelAccountId: 'flipflop-storefront',
  status: 'pending',
  customer: validRequest.customer,
  shippingAddress: validRequest.shippingAddress,
  billingAddress: undefined,
  subtotal: 200,
  shippingCost: 0,
  taxAmount: 0,
  total: 200,
  currency: 'CZK',
  paymentMethod: 'card',
  paymentStatus: 'pending',
  shippingMethod: 'carrier',
  customerNote: undefined,
  orderedAt: new Date(validRequest.orderedAt),
  items: [
    {
      productId: 'catalog-product-1',
      sku: 'SKU-1',
      title: 'Catalog product',
      quantity: 2,
      unitPrice: 100,
      totalPrice: 200,
      warehouseId: undefined,
      fulfillmentStatus: 'pending',
    },
  ],
};

function makeService(existing) {
  let transactionCalls = 0;
  let publishedCreated = 0;
  const query = {
    leftJoinAndSelect() { return this; },
    where() { return this; },
    andWhere() { return this; },
    async getOne() { return existing; },
  };
  const orderRepository = {
    createQueryBuilder() { return query; },
    manager: {
      async transaction() {
        transactionCalls += 1;
        throw new Error('transaction must not run for duplicate replay');
      },
    },
  };
  const service = new OrdersService(
    orderRepository,
    {},
    { async publishOrderCreated() { publishedCreated += 1; } },
    { audit() {} },
  );
  return { service, calls: () => ({ transactionCalls, publishedCreated }) };
}

(async () => {
  const replay = makeService(existingOrder);
  const replayResult = await replay.service.create(validRequest);
  assert.equal(replayResult.id, 'existing-order-id');
  assert.deepEqual(replay.calls(), { transactionCalls: 0, publishedCreated: 0 });

  const conflict = makeService({ ...existingOrder, total: 201 });
  await assert.rejects(
    () => conflict.service.create(validRequest),
    (error) => error instanceof ConflictException && /different payload/.test(error.message),
  );
  assert.deepEqual(conflict.calls(), { transactionCalls: 0, publishedCreated: 0 });

  console.log('duplicate order protection verification ok');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
