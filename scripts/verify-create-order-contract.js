const assert = require('assert/strict');
const {
  CREATE_ORDER_CONTRACT_VERSION,
  getCreateOrderIdempotencyKey,
  isMatchingCreateOrderReplay,
  normalizeCreateOrderRequest,
} = require('../dist/orders/create-order.dto');

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

const normalized = normalizeCreateOrderRequest(validRequest);
assert.equal(normalized.order.channel, 'flipflop');
assert.equal(normalized.order.externalOrderId, 'checkout-1001');
assert.equal(normalized.order.status, 'pending');
assert.equal(normalized.order.currency, 'CZK');
assert.equal(normalized.order.paymentMethod, 'card');
assert.equal(normalized.order.shippingMethod, 'carrier');
assert.equal(normalized.items.length, 1);
assert.equal(normalized.items[0].orderId, undefined);
assert.equal(normalized.items[0].quantity, 2);
assert.equal(normalized.items[0].fulfillmentStatus, 'pending');
assert.deepEqual(getCreateOrderIdempotencyKey(normalized), {
  channel: 'flipflop',
  externalOrderId: 'checkout-1001',
  channelAccountId: 'flipflop-storefront',
});

const existingOrder = {
  ...normalized.order,
  id: 'existing-order-id',
  items: normalized.items,
};
assert.equal(isMatchingCreateOrderReplay(existingOrder, normalized), true);
assert.equal(isMatchingCreateOrderReplay({ ...existingOrder, total: 201 }, normalized), false);
assert.equal(
  isMatchingCreateOrderReplay(
    { ...existingOrder, items: [{ ...normalized.items[0], quantity: 3 }] },
    normalized,
  ),
  false,
);

assert.throws(
  () => normalizeCreateOrderRequest({ ...validRequest, contractVersion: 'orders.create.v2' }),
  /Unsupported create order contractVersion/,
);
assert.throws(
  () => normalizeCreateOrderRequest({ ...validRequest, channel: 'unknown' }),
  /Unsupported order channel/,
);
assert.throws(
  () => normalizeCreateOrderRequest({ ...validRequest, items: [] }),
  /items must contain at least one order line/,
);
assert.throws(
  () => normalizeCreateOrderRequest({ ...validRequest, unexpected: true }),
  /Unsupported create order fields/,
);
assert.throws(
  () => normalizeCreateOrderRequest({ ...validRequest, status: 'shipped' }),
  /Create order status must be pending or confirmed/,
);

console.log('create order contract verification ok');
