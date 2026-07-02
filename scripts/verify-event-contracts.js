const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const {
  ORDER_EVENT_TYPES,
  buildOrderCreatedEvent,
  buildOrderUpdatedEvent,
  buildOrderPaidEvent,
  buildOrderShippedEvent,
  buildOrderCancelledEvent,
  buildOrderLifecycleChangedEvent,
} = require('../dist/orders/order-event-contracts');
const { OrderEventsService } = require('../dist/orders/order-events.service');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const FIXTURE_DIR = path.join(PROJECT_ROOT, 'docs/orchestrator/event-fixtures');
const forbiddenKeys = new Set([
  'customer',
  'shippingAddress',
  'billingAddress',
  'deliveryAddress',
  'address',
  'street',
  'postalCode',
  'paymentMethod',
  'trackingNumber',
  'trackingUrl',
  'token',
  'authorization',
  'bearer',
  'jwt',
  'secret',
  'password',
  'credential',
  'actorEmail',
  'approvedBy',
  'warehouseId',
]);

function walk(value, visitor, trail = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, visitor, trail.concat(String(index))));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      visitor(key, nested, trail.concat(key));
      walk(nested, visitor, trail.concat(key));
    }
  }
}

function assertSafePayload(event, label) {
  assert.equal(typeof event.type, 'string', label + ' type');
  assert.equal(event.eventVersion, 1, label + ' eventVersion');
  assert.match(event.eventId, /^[0-9a-f-]{36}$/i, label + ' eventId');
  assert.equal(event.source, 'orders-microservice', label + ' source');
  assert.ok(event.payload && typeof event.payload === 'object', label + ' payload');
  walk(event, (key, value, trail) => {
    assert.equal(forbiddenKeys.has(key), false, label + ' forbidden key ' + trail.join('.'));
    if (typeof value === 'string') {
      assert.equal(/Bearer\s+/i.test(value), false, label + ' bearer value ' + trail.join('.'));
      assert.equal(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(value), false, label + ' jwt value ' + trail.join('.'));
    }
  });
}

const expectedTypes = Object.values(ORDER_EVENT_TYPES).sort();
const fixtureFiles = fs.readdirSync(FIXTURE_DIR).filter((name) => name.endsWith('.json')).sort();
assert.deepEqual(fixtureFiles.map((name) => name.replace(/\.json$/, '')).sort(), expectedTypes);

for (const fileName of fixtureFiles) {
  const fixture = JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, fileName), 'utf8'));
  assert.equal(fixture.type + '.json', fileName, fileName + ' type matches filename');
  assertSafePayload(fixture, fileName);
}

const approval = {
  approvalType: 'human',
  reasonCode: 'CUSTOMER_REQUEST',
  sideEffectsHandled: {
    payment: true,
    warehouse: true,
    notification: true,
    crm: true,
    channel: true,
  },
  approvedAt: '2026-06-13T08:04:00.000Z',
  actorEmail: 'operator@example.invalid',
  approvedBy: 'operator@example.invalid',
  previousStatus: 'processing',
  requestedStatus: 'cancelled',
  resultingStatus: 'cancelled',
};

const safeItems = [
  { productId: 'catalog-product-1001', sku: 'SKU-1001', quantity: 1, unitPrice: 490, totalPrice: 490 },
  { productId: 'catalog-product-2002', sku: 'SKU-2002', quantity: 2, unitPrice: 150, totalPrice: 300 },
];
const lifecyclePayload = {
  orderId: 'order-1001',
  orderNumber: 'checkout-1001',
  channel: 'flipflop',
  channelAccountId: 'flipflop-storefront',
  externalOrderId: 'checkout-1001',
  previousLifecycleStage: 'ordered_unpaid',
  lifecycleStage: 'warehouse_fulfillment_requested',
  status: 'confirmed',
  paymentStatus: 'paid',
  fulfillmentStatus: 'fulfillment_requested',
  deliveryStatus: 'not_started',
  total: 790,
  currency: 'CZK',
  items: safeItems,
  warehouseHandoff: {
    status: 'fulfilled',
    itemCount: 2,
    reservedCount: 2,
    failedCount: 0,
    reasonCode: 'PAYMENT_CONFIRMED',
    actor: 'orders-microservice',
  },
};
const createdWithoutAttribution = buildOrderCreatedEvent('order-1001', 'flipflop');
const createdWithAttribution = buildOrderCreatedEvent('order-1001', 'flipflop', {
  leadId: 'lead-1001',
  source: 'lead-form',
  campaignId: 'campaign-1001',
}, safeItems, 'CZK');
const lifecycleChanged = buildOrderLifecycleChangedEvent(lifecyclePayload);
const builtEvents = [
  createdWithoutAttribution,
  buildOrderUpdatedEvent('order-1001', 'processing', 'confirmed'),
  buildOrderPaidEvent('order-1001', 'payments-ref-1001'),
  buildOrderShippedEvent('order-1001', 'tracking-must-not-appear'),
  buildOrderCancelledEvent('order-1001', 'processing', approval),
  lifecycleChanged,
];

assert.equal(Object.prototype.hasOwnProperty.call(createdWithoutAttribution.payload, 'leadAttribution'), false);
assert.deepEqual(createdWithAttribution.payload.leadAttribution, {
  leadId: 'lead-1001',
  source: 'lead-form',
  campaignId: 'campaign-1001',
});
assert.deepEqual(createdWithAttribution.payload.items, safeItems);
assert.equal(createdWithAttribution.payload.currency, 'CZK');
assertSafePayload(createdWithAttribution, 'created event with leadAttribution and items');
assert.equal(lifecycleChanged.payload.eventId, lifecycleChanged.eventId);
assert.equal(lifecycleChanged.payload.occurredAt, lifecycleChanged.occurredAt);
assert.equal(lifecycleChanged.payload.lifecycleStage, 'warehouse_fulfillment_requested');
assert.deepEqual(builtEvents.map((event) => event.type).sort(), expectedTypes);
for (const event of builtEvents) {
  assertSafePayload(event, event.type);
}
assert.equal(JSON.stringify(builtEvents).includes('tracking-must-not-appear'), false, 'tracking number leaked into shipped event');
assert.equal(JSON.stringify(builtEvents).includes('operator@example.invalid'), false, 'approval identity leaked into event');

async function verifyPublisherRoutes() {
  const published = [];
  const outboxRows = [];
  const outboxRepository = {
    create(row) {
      return { id: 'outbox-' + (outboxRows.length + 1), ...row };
    },
    async save(row) {
      outboxRows.push({ ...row });
      return row;
    },
  };
  const service = new OrderEventsService(outboxRepository);
  service.channel = {
    publish(exchangeName, routingKey, buffer, options) {
      published.push({
        exchangeName,
        routingKey,
        event: JSON.parse(buffer.toString('utf8')),
        options,
      });
      return true;
    },
  };

  await service.publishOrderCreated('order-1001', 'flipflop', {
    leadId: 'lead-1001',
    source: 'lead-form',
    campaignId: 'campaign-1001',
  }, safeItems, 'CZK');
  await service.publishOrderUpdated('order-1001', 'processing', { previousStatus: 'confirmed' });
  await service.publishOrderPaid('order-1001', 'payments-ref-1001');
  await service.publishOrderShipped('order-1001', 'tracking-must-not-appear');
  await service.publishOrderUpdated('order-1001', 'cancelled', { previousStatus: 'processing', approval });
  await service.publishOrderLifecycleChanged(lifecyclePayload);
  await service.publishPricingPriceChanged({
    productId: 'catalog-product-1001',
    productName: 'Catalog Product',
    oldPrice: 480,
    newPrice: 490,
    changePercent: 2.08,
    approvedAt: '2026-07-02T08:00:00.000Z',
    suggestionId: 'price-suggestion-1001',
  });

  const orderMessages = published.filter((message) => message.exchangeName === 'orders.events');
  const pricingMessages = published.filter((message) => message.exchangeName === 'pricing.events');
  assert.equal(pricingMessages.length, 1, 'pricing event is still published');
  assert.equal(pricingMessages[0].routingKey, 'pricing.price_changed');
  assert.equal(pricingMessages[0].options.persistent, true);
  assert.equal(pricingMessages[0].options.contentType, 'application/json');
  assert.equal(pricingMessages[0].options.headers.eventType, 'pricing.price_changed');
  assert.equal(pricingMessages[0].options.headers.eventVersion, 1);

  const routingKeys = orderMessages.map((message) => message.routingKey).sort();
  assert.deepEqual(routingKeys, [
    ORDER_EVENT_TYPES.cancelled,
    ORDER_EVENT_TYPES.created,
    ORDER_EVENT_TYPES.lifecycleChanged,
    ORDER_EVENT_TYPES.paid,
    ORDER_EVENT_TYPES.shipped,
    ORDER_EVENT_TYPES.updated,
    ORDER_EVENT_TYPES.updated,
  ].sort());

  for (const message of orderMessages) {
    assert.equal(message.exchangeName, 'orders.events');
    assert.equal(message.options.persistent, true);
    assert.equal(message.options.contentType, 'application/json');
    assert.equal(message.options.headers.eventType, message.routingKey);
    assert.equal(message.options.headers.eventVersion, 1);
    assert.equal(message.event.type, message.routingKey);
    assertSafePayload(message.event, 'publisher ' + message.routingKey);
  }

  const createdMessage = orderMessages.find((message) => message.routingKey === ORDER_EVENT_TYPES.created);
  assert.deepEqual(createdMessage.event.payload.leadAttribution, {
    leadId: 'lead-1001',
    source: 'lead-form',
    campaignId: 'campaign-1001',
  });
  assert.deepEqual(createdMessage.event.payload.items, safeItems);
  assert.equal(createdMessage.event.payload.currency, 'CZK');

  const lifecycleMessage = orderMessages.find((message) => message.routingKey === ORDER_EVENT_TYPES.lifecycleChanged);
  assert.equal(lifecycleMessage.event.payload.eventId, lifecycleMessage.event.eventId);
  assert.equal(lifecycleMessage.event.payload.previousLifecycleStage, 'ordered_unpaid');

  const createdOutboxRows = outboxRows.filter((row) => row.status === 'pending');
  const publishedOutboxRows = outboxRows.filter((row) => row.status === 'published');
  assert.equal(createdOutboxRows.length, orderMessages.length, 'one pending outbox row per order event publish attempt');
  assert.equal(publishedOutboxRows.length, orderMessages.length, 'one published outbox update per accepted order event publish');
  assert.equal(outboxRows.some((row) => row.routingKey === 'pricing.price_changed'), false, 'pricing events are not stored in order outbox');

  for (const row of publishedOutboxRows) {
    assert.equal(row.exchangeName, 'orders.events');
    assert.ok(expectedTypes.includes(row.routingKey), 'outbox routing key is versioned');
    assert.equal(row.eventType, row.routingKey);
    assert.equal(row.eventVersion, 1);
    assert.match(row.eventId, /^[0-9a-f-]{36}$/i, 'outbox event id');
    assert.equal(row.attempts, 1);
    assert.ok(row.publishedAt instanceof Date, 'outbox publishedAt');
    assert.equal(row.lastErrorCode, null);
    assertSafePayload(row.payload, 'outbox ' + row.routingKey);
  }

  assert.equal(JSON.stringify(orderMessages).includes('tracking-must-not-appear'), false, 'publisher leaked tracking number');
  assert.equal(JSON.stringify(orderMessages).includes('operator@example.invalid'), false, 'publisher leaked approval identity');
}

async function verifyOutboxRetry() {
  const rows = [];
  const retryPublished = [];
  const outboxRepository = {
    create(row) {
      const record = { id: 'retry-outbox-' + (rows.length + 1), createdAt: new Date(), ...row };
      rows.push(record);
      return record;
    },
    async save(row) {
      return row;
    },
    async find() {
      return rows.filter((row) => ['pending', 'failed'].includes(row.status) && row.attempts < 12);
    },
    async count(options) {
      return rows.filter((row) => row.status === options.where.status).length;
    },
  };
  const service = new OrderEventsService(outboxRepository);

  await service.publishOrderPaid('order-2002', 'payments-ref-2002');
  assert.equal(rows.length, 1, 'pending outbox row created when broker is unavailable');
  assert.equal(rows[0].status, 'pending');
  assert.equal(rows[0].attempts, 0);

  const degradedReadiness = await service.getOutboxReadiness();
  assert.equal(degradedReadiness.status, 'degraded');
  assert.equal(degradedReadiness.brokerConnected, false);
  assert.equal(degradedReadiness.pendingCount, 1);

  service.channel = {
    publish(exchangeName, routingKey, buffer, options) {
      retryPublished.push({
        exchangeName,
        routingKey,
        event: JSON.parse(buffer.toString('utf8')),
        options,
      });
      return true;
    },
  };

  await service.flushPendingOutbox();
  assert.equal(retryPublished.length, 1, 'pending outbox row is retried');
  assert.equal(retryPublished[0].exchangeName, 'orders.events');
  assert.equal(retryPublished[0].routingKey, ORDER_EVENT_TYPES.paid);
  assert.equal(rows[0].status, 'published');
  assert.equal(rows[0].attempts, 1);
  assert.ok(rows[0].publishedAt instanceof Date, 'retry marks publishedAt');

  const readyReadiness = await service.getOutboxReadiness();
  assert.equal(readyReadiness.status, 'ready');
  assert.equal(readyReadiness.brokerConnected, true);
  assert.equal(readyReadiness.pendingCount, 0);
  assert.equal(readyReadiness.failedCount, 0);
}

function verifyOutboxSourceFiles() {
  const entitySource = fs.readFileSync(path.join(PROJECT_ROOT, 'src/orders/order-event-outbox.entity.ts'), 'utf8');
  const migrationSource = fs.readFileSync(path.join(PROJECT_ROOT, 'migrations/007_create_order_event_outbox.sql'), 'utf8');
  const moduleSource = fs.readFileSync(path.join(PROJECT_ROOT, 'src/orders/orders.module.ts'), 'utf8');
  const eventServiceSource = fs.readFileSync(path.join(PROJECT_ROOT, 'src/orders/order-events.service.ts'), 'utf8');
  const healthSource = fs.readFileSync(path.join(PROJECT_ROOT, 'src/health/health.controller.ts'), 'utf8');

  assert.match(entitySource, /@Entity\('order_event_outbox'\)/);
  assert.match(entitySource, /status: OrderEventOutboxStatus/);
  assert.match(migrationSource, /CREATE TABLE IF NOT EXISTS order_event_outbox/);
  assert.match(migrationSource, /"exchangeName" varchar\(100\) NOT NULL/);
  assert.match(migrationSource, /"lastAttemptAt" timestamp NULL/);
  assert.match(migrationSource, /CREATE UNIQUE INDEX IF NOT EXISTS idx_order_event_outbox_event_id/);
  assert.match(moduleSource, /OrderEventOutbox/);
  assert.match(eventServiceSource, /flushPendingOutbox/);
  assert.match(eventServiceSource, /exchangeName === this\.ordersExchangeName/);
  assert.match(healthSource, /health\/order-events/);
}

async function main() {
  verifyOutboxSourceFiles();
  await verifyPublisherRoutes();
  await verifyOutboxRetry();
  console.log('event contract verification ok');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
