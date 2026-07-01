const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { of, throwError } = require('rxjs');
const { WarehouseReservationClient } = require('../dist/warehouse/warehouse-reservation.client');

const repoRoot = path.resolve(__dirname, '..');
const clientSource = fs.readFileSync(path.join(repoRoot, 'src/warehouse/warehouse-reservation.client.ts'), 'utf8');
const handoffContract = fs.readFileSync(path.join(repoRoot, 'docs/orchestrator/WAREHOUSE_HANDOFF_CONTRACT.md'), 'utf8');
const authInventory = fs.readFileSync(path.join(repoRoot, 'docs/orchestrator/2026-06-24-aos-auth-static-inventory.md'), 'utf8');

function assertAuthServiceJwtContract() {
  assert.match(clientSource, /process\.env\.WAREHOUSE_SERVICE_TOKEN/);
  assert.match(clientSource, /process\.env\.WAREHOUSE_INTERNAL_SERVICE_TOKEN/);
  assert.match(clientSource, /rawToken\?\.trim\(\)/);
  assert.match(clientSource, /Authorization:\s*token\.startsWith\('Bearer '\)\s*\?\s*token\s*:\s*`Bearer \$\{token\}`/);
  assert.doesNotMatch(clientSource, /Authorization:\s*rawToken/);
  assert.doesNotMatch(clientSource, /JwtService|jwtService\.sign|jwt\.sign|JWT_SECRET/);

  for (const doc of [handoffContract, authInventory]) {
    assert.match(doc, /Auth-compatible service JWT/);
    assert.match(doc, /auth-microservice\/docs\/SERVICE_IDENTITY_CONSUMER_STANDARD\.md/);
    assert.match(doc, /internal:warehouse-microservice:admin/);
    assert.match(doc, /serviceName/);
  }
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

function makeOrder(overrides = {}) {
  return {
    id: 'order-1',
    externalOrderId: 'checkout-1',
    channel: 'flipflop',
    items: [
      {
        id: 'item-1',
        productId: 'catalog-product-1',
        warehouseId: 'warehouse-1',
        quantity: 2,
      },
    ],
    ...overrides,
  };
}

async function run() {
  assertAuthServiceJwtContract();

  await withEnv({ WAREHOUSE_RESERVATION_ENABLED: 'false' }, async () => {
    const client = new WarehouseReservationClient({ post() { throw new Error('should not call'); } }, { warn() {} });
    const result = await client.reserveOrderItems(makeOrder());
    assert.equal(result.status, 'disabled');
    assert.equal(result.skipReason, 'reservation_disabled');
    assert.equal(result.reservedCount, 0);
  });

  await withEnv({ WAREHOUSE_RESERVATION_ENABLED: 'true', WAREHOUSE_RESERVATION_TTL_MINUTES: '30', WAREHOUSE_SERVICE_TOKEN: '  test-warehouse-token\n' }, async () => {
    const calls = [];
    const client = new WarehouseReservationClient({
      post(url, payload, config) {
        calls.push({ url, payload, config });
        return of({ data: { success: true } });
      },
    }, { warn() {} });
    const result = await client.reserveOrderItems(makeOrder());
    assert.equal(result.status, 'reserved');
    assert.equal(result.reservedCount, 1);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'http://warehouse-microservice:3201/api/reservations/reserve');
    assert.deepEqual(Object.keys(calls[0].payload).sort(), [
      'actor',
      'channel',
      'expiresAt',
      'orderId',
      'productId',
      'quantity',
      'reasonCode',
      'reference',
      'warehouseId',
    ].sort());
    assert.equal(calls[0].payload.reasonCode, 'ORDER_CREATE_RESERVATION');
    assert.equal(calls[0].payload.actor, 'orders-microservice');
    assert.equal(calls[0].config.headers.Authorization, 'Bearer test-warehouse-token');
  });

  await withEnv({ WAREHOUSE_RESERVATION_ENABLED: 'true' }, async () => {
    const client = new WarehouseReservationClient({ post() { throw new Error('should not call'); } }, { warn() {} });
    const result = await client.reserveOrderItems(makeOrder({ items: [{ productId: 'catalog-product-1', quantity: 1 }] }));
    assert.equal(result.status, 'skipped');
    assert.equal(result.skipReason, 'missing_warehouse_id');
  });

  await withEnv({ WAREHOUSE_RESERVATION_ENABLED: 'true' }, async () => {
    const client = new WarehouseReservationClient({
      post() {
        return throwError(() => new Error('warehouse down'));
      },
    }, { warn() {} });
    const result = await client.reserveOrderItems(makeOrder());
    assert.equal(result.status, 'failed');
    assert.equal(result.failureCode, 'warehouse_request_failed');
    assert.equal(JSON.stringify(result).includes('warehouse down'), false);
  });

  await withEnv({ WAREHOUSE_RESERVATION_ENABLED: 'true', WAREHOUSE_SERVICE_TOKEN: 'test-warehouse-token' }, async () => {
    const client = new WarehouseReservationClient({
      post() {
        const error = new Error('Warehouse rejected reservation because requested quantity exceeds available stock');
        error.response = { status: 409, data: { code: 'INSUFFICIENT_STOCK', available: 1, requested: 2 } };
        return throwError(() => error);
      },
    }, { warn() {} });
    const result = await client.reserveOrderItems(makeOrder());
    assert.equal(result.status, 'failed');
    assert.equal(result.reservedCount, 0);
    assert.equal(result.failedCount, 1);
    assert.equal(result.failureCode, 'warehouse_request_failed');
    assert.equal(JSON.stringify(result).includes('INSUFFICIENT_STOCK'), false);
    assert.equal(JSON.stringify(result).includes('available'), false);
    assert.equal(JSON.stringify(result).includes('requested quantity'), false);
  });

  await withEnv({ WAREHOUSE_RESERVATION_ENABLED: 'true', WAREHOUSE_INTERNAL_SERVICE_TOKEN: '\nBearer existing-prefix-token\n' }, async () => {
    const order = makeOrder();
    const item = order.items[0];
    const calls = [];
    const client = new WarehouseReservationClient({
      post(url, payload, config) {
        calls.push({ url, payload, config });
        return of({ data: { success: true } });
      },
    }, { warn() {} });

    assert.equal(client.buildReleasePayload(order, item).reasonCode, 'PAYMENT_FAILED_RELEASE');
    assert.equal(client.buildReleasePayload(order, item).quantity, 2);
    assert.equal(client.buildLifecyclePayload(order, item, 'PAYMENT_CONFIRMED').reasonCode, 'PAYMENT_CONFIRMED');
    assert.equal(client.buildLifecyclePayload(order, item, 'ORDER_CANCELLED').reasonCode, 'ORDER_CANCELLED');
    assert.equal(client.buildLifecyclePayload(order, item, 'RESERVATION_EXPIRED').reasonCode, 'RESERVATION_EXPIRED');
    assert.equal(client.buildLifecyclePayload(order, item, 'ORDER_RETURNED').reasonCode, 'ORDER_RETURNED');

    const released = await client.releaseOrderItems(order);
    const fulfilled = await client.fulfillOrderItems(order);
    const cancelled = await client.cancelOrderItems(order);
    await client.postReservationAction('expire', client.buildLifecyclePayload(order, item, 'RESERVATION_EXPIRED'));
    await client.postReservationAction('return', client.buildLifecyclePayload(order, item, 'ORDER_RETURNED'));

    assert.equal(released.status, 'released');
    assert.equal(fulfilled.status, 'fulfilled');
    assert.equal(cancelled.status, 'cancelled');

    assert.deepEqual(calls.map((call) => call.url), [
      'http://warehouse-microservice:3201/api/reservations/release',
      'http://warehouse-microservice:3201/api/reservations/fulfill',
      'http://warehouse-microservice:3201/api/reservations/cancel',
      'http://warehouse-microservice:3201/api/reservations/expire',
      'http://warehouse-microservice:3201/api/reservations/return',
    ]);

    for (const call of calls) {
      assert.equal(call.payload.actor, 'orders-microservice');
      assert.equal(call.payload.orderId, 'order-1');
      assert.equal(call.payload.channel, 'flipflop');
      assert.equal(call.payload.reference, 'checkout-1');
      assert.equal(call.config.headers.Authorization, 'Bearer existing-prefix-token');
      assert.equal(JSON.stringify(call.payload).includes('warehouse down'), false);
    }
  });

  console.log('warehouse handoff contract verification ok');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
