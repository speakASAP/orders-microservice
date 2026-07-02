const assert = require('assert/strict');
const { of, throwError } = require('rxjs');
const { OrderFulfillmentHandoffClient } = require('../dist/orders/order-fulfillment-handoff.client');

function makeOrder(overrides = {}) {
  return {
    id: 'order-1',
    externalOrderId: 'checkout-1001',
    channel: 'flipflop',
    status: 'confirmed',
    paymentStatus: 'paid',
    shippingMethod: 'courier',
    customer: {
      name: 'Customer Name',
      email: 'buyer@example.invalid',
      phone: '+420000000000',
    },
    shippingAddress: {
      name: 'Customer Name',
      street: 'Main 1',
      city: 'Prague',
      postalCode: '11000',
      country: 'CZ',
    },
    warehouseHandoff: {
      status: 'fulfilled',
      itemCount: 1,
      reservedCount: 1,
      failedCount: 0,
      reasonCode: 'PAYMENT_CONFIRMED',
      actor: 'orders-microservice',
    },
    items: [
      {
        id: 'item-1',
        productId: 'catalog-product-1001',
        sku: 'SKU-1001',
        title: 'Catalog product',
        warehouseId: 'warehouse-1',
        quantity: 1,
      },
    ],
    ...overrides,
  };
}

function withEnv(values, fn) {
  const previous = {};
  for (const key of Object.keys(values)) {
    previous[key] = process.env[key];
    process.env[key] = values[key];
  }
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    });
}

async function run() {
  await withEnv({ WAREHOUSE_RESERVATION_ENABLED: 'true', WAREHOUSE_SERVICE_TOKEN: ' warehouse-token\n' }, async () => {
    const calls = [];
    const client = new OrderFulfillmentHandoffClient({
      get(url, config) {
        calls.push({ method: 'GET', url, config });
        return of({
          data: {
            success: true,
            data: [
              {
                id: 'reservation-1',
                orderId: 'order-1',
                productId: 'catalog-product-1001',
                warehouseId: 'warehouse-1',
                quantity: 1,
                status: 'fulfilled',
              },
            ],
          },
        });
      },
      post(url, payload, config) {
        calls.push({ method: 'POST', url, payload, config });
        return of({ data: { success: true, data: { id: 'fulfillment-order-1' } } });
      },
    }, { warn() {} });

    const result = await client.createAfterPaymentFulfillment(makeOrder({
      shippingAddress: {
        name: 'Customer Name',
        street: 'Main 1',
        city: 'Prague',
        postalCode: '11000',
        country: 'Czech Republic',
      },
    }));
    assert.equal(result.status, 'requested');
    assert.equal(result.handedOffCount, 1);
    assert.equal(result.fulfillmentOrderId, 'fulfillment-order-1');
    assert.deepEqual(calls.map((call) => `${call.method} ${call.url}`), [
      'GET http://warehouse-microservice:3201/api/reservations/order/order-1',
      'POST http://warehouse-microservice:3201/api/fulfillment-orders',
    ]);
    assert.equal(calls[0].config.headers.Authorization, 'Bearer warehouse-token');
    assert.equal(calls[1].config.headers.Authorization, 'Bearer warehouse-token');
    assert.deepEqual(calls[1].payload, {
      orderId: 'order-1',
      orderNumber: 'checkout-1001',
      channel: 'flipflop',
      shippingMethod: 'courier',
      reasonCode: 'PAYMENT_CONFIRMED',
      reference: 'checkout-1001',
      deliveryAddress: {
        name: 'Customer Name',
        street: 'Main 1',
        city: 'Prague',
        postalCode: '11000',
        country: 'CZ',
      },
      customerContact: {
        name: 'Customer Name',
        email: 'buyer@example.invalid',
        phone: '+420000000000',
      },
      items: [
        {
          orderItemId: 'item-1',
          reservationId: 'reservation-1',
          productId: 'catalog-product-1001',
          sku: 'SKU-1001',
          title: 'Catalog product',
          warehouseId: 'warehouse-1',
          quantity: 1,
        },
      ],
    });
  });

  await withEnv({ WAREHOUSE_RESERVATION_ENABLED: 'true' }, async () => {
    const client = new OrderFulfillmentHandoffClient({
      get() {
        return of({ data: { success: true, data: [] } });
      },
      post() {
        throw new Error('missing reservations must not create fulfillment order');
      },
    }, { warn() {} });
    const result = await client.createAfterPaymentFulfillment(makeOrder());
    assert.equal(result.status, 'skipped');
    assert.equal(result.skipReason, 'missing_reservation_id');
  });

  await withEnv({ WAREHOUSE_RESERVATION_ENABLED: 'false' }, async () => {
    const client = new OrderFulfillmentHandoffClient({
      get() {
        throw new Error('disabled client must not call warehouse');
      },
      post() {
        throw new Error('disabled client must not call warehouse');
      },
    }, { warn() {} });
    const result = await client.createAfterPaymentFulfillment(makeOrder());
    assert.equal(result.status, 'disabled');
    assert.equal(result.skipReason, 'reservation_disabled');
  });

  await withEnv({ WAREHOUSE_RESERVATION_ENABLED: 'true' }, async () => {
    const warnings = [];
    const client = new OrderFulfillmentHandoffClient({
      get() {
        return throwError(() => new Error('warehouse response included private payload'));
      },
      post() {
        throw new Error('not used');
      },
    }, { warn(message, context) { warnings.push({ message, context }); } });
    const result = await client.createAfterPaymentFulfillment(makeOrder());
    assert.equal(result.status, 'failed');
    assert.equal(result.failureCode, 'warehouse_request_failed');
    assert.equal(JSON.stringify(result).includes('private payload'), false);
    assert.deepEqual(warnings, [{
      message: 'Warehouse fulfillment order handoff failed',
      context: 'OrderFulfillmentHandoffClient',
    }]);
  });

  const source = require('fs').readFileSync(require('path').join(__dirname, '..', 'src/orders/orders.service.ts'), 'utf8');
  assert.match(source, /createAfterPaymentFulfillment\(updated\)/);
  assert.match(source, /fulfillmentOrderHandoff/);

  console.log('order fulfillment handoff verification ok');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
