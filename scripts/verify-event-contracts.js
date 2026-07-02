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
  const service = new OrderEventsService();
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

  const routingKeys = published.map((message) => message.routingKey).sort();
  assert.deepEqual(routingKeys, [
    ORDER_EVENT_TYPES.cancelled,
    ORDER_EVENT_TYPES.created,
    ORDER_EVENT_TYPES.lifecycleChanged,
    ORDER_EVENT_TYPES.paid,
    ORDER_EVENT_TYPES.shipped,
    ORDER_EVENT_TYPES.updated,
    ORDER_EVENT_TYPES.updated,
  ].sort());

  for (const message of published) {
    assert.equal(message.exchangeName, 'orders.events');
    assert.equal(message.options.persistent, true);
    assert.equal(message.options.contentType, 'application/json');
    assert.equal(message.options.headers.eventType, message.routingKey);
    assert.equal(message.options.headers.eventVersion, 1);
    assert.equal(message.event.type, message.routingKey);
    assertSafePayload(message.event, 'publisher ' + message.routingKey);
  }

  const createdMessage = published.find((message) => message.routingKey === ORDER_EVENT_TYPES.created);
  assert.deepEqual(createdMessage.event.payload.leadAttribution, {
    leadId: 'lead-1001',
    source: 'lead-form',
    campaignId: 'campaign-1001',
  });
  assert.deepEqual(createdMessage.event.payload.items, safeItems);
  assert.equal(createdMessage.event.payload.currency, 'CZK');

  const lifecycleMessage = published.find((message) => message.routingKey === ORDER_EVENT_TYPES.lifecycleChanged);
  assert.equal(lifecycleMessage.event.payload.eventId, lifecycleMessage.event.eventId);
  assert.equal(lifecycleMessage.event.payload.previousLifecycleStage, 'ordered_unpaid');

  assert.equal(JSON.stringify(published).includes('tracking-must-not-appear'), false, 'publisher leaked tracking number');
  assert.equal(JSON.stringify(published).includes('operator@example.invalid'), false, 'publisher leaked approval identity');
}

verifyPublisherRoutes().then(() => {
  console.log('event contract verification ok');
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
