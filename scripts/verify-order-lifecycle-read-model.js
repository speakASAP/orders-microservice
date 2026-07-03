const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { BadRequestException } = require('@nestjs/common');
const {
  ORDER_LIFECYCLE_STAGES,
  buildLifecycleAggregates,
  buildOrderLifecycleChangedPayload,
  deriveOrderLifecycleState,
  normalizeOrderLifecycleReadFilters,
  serializeOrderLifecycleReadModel,
  validateOrderLifecycleTransition,
  isOrderLifecycleTransitionAllowed,
} = require('../dist/orders/order-lifecycle');
const {
  ORDER_ADMIN_LIFECYCLE_READ_ROLES,
  ORDER_CHANNEL_LIFECYCLE_READ_ROLES,
  ORDER_CUSTOMER_LIFECYCLE_READ_ROLES,
  ORDER_DETAIL_READ_ROLES,
} = require('../dist/orders/orders.controller');

const PROJECT_ROOT = path.resolve(__dirname, '..');

function makeOrder(overrides = {}) {
  return {
    id: 'order-1',
    externalOrderId: 'checkout-1001',
    channel: 'flipflop',
    channelAccountId: 'flipflop-storefront',
    status: 'pending',
    customer: { name: 'Customer Name', email: 'buyer@example.invalid', phone: '+420000000000' },
    shippingAddress: {
      name: 'Customer Name',
      street: 'Main 1',
      city: 'Prague',
      postalCode: '11000',
      country: 'CZ',
    },
    subtotal: 490,
    shippingCost: 100,
    taxAmount: 0,
    total: 590,
    currency: 'CZK',
    paymentStatus: 'pending',
    paymentMethod: 'card',
    shippingMethod: 'courier',
    warehouseHandoff: { status: 'reserved', itemCount: 1, reservedCount: 1, failedCount: 0 },
    items: [
      {
        id: 'item-1',
        productId: 'catalog-product-1001',
        sku: 'SKU-1001',
        title: 'Catalog product',
        quantity: 1,
        unitPrice: 490,
        totalPrice: 490,
        fulfillmentStatus: 'reserved',
        warehouseId: 'warehouse-1',
      },
    ],
    orderedAt: new Date('2026-07-02T09:00:00.000Z'),
    createdAt: new Date('2026-07-02T09:00:00.000Z'),
    updatedAt: new Date('2026-07-02T09:00:00.000Z'),
    ...overrides,
  };
}

assert.deepEqual(ORDER_LIFECYCLE_STAGES, [
  'ordered_unpaid',
  'payment_failed',
  'paid_not_delivered',
  'warehouse_fulfillment_requested',
  'warehouse_collecting',
  'warehouse_forming',
  'warehouse_formed',
  'handed_to_delivery',
  'in_delivery',
  'received',
  'not_received',
  'returned',
  'cancelled',
]);

assert.equal(deriveOrderLifecycleState(makeOrder()).lifecycleStage, 'ordered_unpaid');
assert.equal(deriveOrderLifecycleState(makeOrder({ paymentStatus: 'failed' })).lifecycleStage, 'payment_failed');
assert.equal(deriveOrderLifecycleState(makeOrder({ paymentStatus: 'paid', warehouseHandoff: { status: 'reserved' } })).lifecycleStage, 'paid_not_delivered');
assert.equal(deriveOrderLifecycleState(makeOrder({ paymentStatus: 'paid', status: 'confirmed', warehouseHandoff: { status: 'fulfilled' } })).lifecycleStage, 'warehouse_fulfillment_requested');
assert.equal(deriveOrderLifecycleState(makeOrder({ paymentStatus: 'paid', status: 'processing', warehouseHandoff: { status: 'fulfilled' } })).lifecycleStage, 'warehouse_collecting');
assert.equal(deriveOrderLifecycleState(makeOrder({ paymentStatus: 'paid', status: 'shipped' })).lifecycleStage, 'handed_to_delivery');
assert.equal(deriveOrderLifecycleState(makeOrder({ status: 'delivered' })).lifecycleStage, 'received');
assert.equal(deriveOrderLifecycleState(makeOrder({ warehouseHandoff: { status: 'returned' } })).lifecycleStage, 'returned');
assert.equal(deriveOrderLifecycleState(makeOrder({ status: 'cancelled' })).lifecycleStage, 'cancelled');
assert.equal(deriveOrderLifecycleState(makeOrder({
  paymentStatus: 'paid',
  warehouseHandoff: { status: 'fulfilled', fulfillmentOrderHandoff: { warehouseStatus: 'forming' } },
})).lifecycleStage, 'warehouse_forming');
assert.equal(deriveOrderLifecycleState(makeOrder({
  paymentStatus: 'paid',
  warehouseHandoff: { status: 'fulfilled', fulfillmentOrderHandoff: { warehouseStatus: 'formed' } },
})).lifecycleStage, 'warehouse_formed');
assert.equal(deriveOrderLifecycleState(makeOrder({
  paymentStatus: 'paid',
  warehouseHandoff: { status: 'fulfilled', fulfillmentOrderHandoff: { warehouseStatus: 'in_delivery' } },
})).lifecycleStage, 'in_delivery');
assert.equal(deriveOrderLifecycleState(makeOrder({
  paymentStatus: 'paid',
  warehouseHandoff: { status: 'fulfilled', fulfillmentOrderHandoff: { warehouseStatus: 'not_delivered' } },
})).lifecycleStage, 'not_received');

assert.equal(deriveOrderLifecycleState(makeOrder({
  paymentStatus: 'paid',
  warehouseHandoff: { status: 'fulfilled', fulfillmentOrderHandoff: { warehouseStatus: 'handed_to_delivery' } },
})).deliveryStatus, 'handed_to_delivery');
assert.equal(deriveOrderLifecycleState(makeOrder({
  paymentStatus: 'paid',
  warehouseHandoff: { status: 'fulfilled', fulfillmentOrderHandoff: { warehouseStatus: 'in_delivery' } },
})).deliveryStatus, 'in_delivery');
assert.equal(deriveOrderLifecycleState(makeOrder({
  paymentStatus: 'paid',
  warehouseHandoff: { status: 'fulfilled', fulfillmentOrderHandoff: { warehouseStatus: 'not_delivered' } },
})).deliveryStatus, 'not_received');


assert.equal(validateOrderLifecycleTransition(null, 'ordered_unpaid'), 'ordered_unpaid');
assert.equal(validateOrderLifecycleTransition('ordered_unpaid', 'paid_not_delivered'), 'paid_not_delivered');
assert.equal(validateOrderLifecycleTransition('paid_not_delivered', 'warehouse_fulfillment_requested'), 'warehouse_fulfillment_requested');
assert.equal(validateOrderLifecycleTransition('warehouse_collecting', 'warehouse_forming'), 'warehouse_forming');
assert.equal(validateOrderLifecycleTransition('in_delivery', 'received'), 'received');
assert.equal(validateOrderLifecycleTransition('not_received', 'returned'), 'returned');
assert.throws(
  () => validateOrderLifecycleTransition('ordered_unpaid', 'received'),
  BadRequestException,
);
assert.equal(isOrderLifecycleTransitionAllowed('ordered_unpaid', 'warehouse_fulfillment_requested'), false);
assert.equal(isOrderLifecycleTransitionAllowed('ordered_unpaid', 'warehouse_fulfillment_requested', { mode: 'coarse_projection' }), true);
assert.equal(isOrderLifecycleTransitionAllowed('handed_to_delivery', 'received', { mode: 'coarse_projection' }), true);

assert.deepEqual(normalizeOrderLifecycleReadFilters({
  channel: 'FlipFlop',
  status: 'Confirmed',
  paymentStatus: 'Paid',
  lifecycleStage: 'warehouse_fulfillment_requested',
  from: '2026-07-01T00:00:00.000Z',
  to: '2026-07-02T00:00:00.000Z',
  limit: '25',
}), {
  channel: 'flipflop',
  status: 'confirmed',
  paymentStatus: 'paid',
  lifecycleStage: 'warehouse_fulfillment_requested',
  from: new Date('2026-07-01T00:00:00.000Z'),
  to: new Date('2026-07-02T00:00:00.000Z'),
  limit: 25,
});
assert.throws(() => normalizeOrderLifecycleReadFilters({ lifecycleStage: 'unknown' }), BadRequestException);

const readModel = serializeOrderLifecycleReadModel(makeOrder({
  paymentStatus: 'paid',
  status: 'confirmed',
  warehouseHandoff: {
    status: 'fulfilled',
    itemCount: 1,
    reservedCount: 1,
    failedCount: 0,
    completedAt: '2026-07-02T09:05:00.000Z',
  },
}), {
  includeCustomer: true,
  includeDeliveryAddress: true,
  includeWarehouseHandoff: true,
});
assert.equal(readModel.lifecycle.lifecycleStage, 'warehouse_fulfillment_requested');
assert.equal(readModel.lifecycle.statusProjection, 'confirmed');
assert.equal(readModel.shipping.deliveryAddress.city, 'Prague');
assert.equal(readModel.customer.email, 'buyer@example.invalid');
assert.equal(readModel.items[0].productId, 'catalog-product-1001');
assert.equal(readModel.warehouseHandoff.status, 'fulfilled');
assert.equal(readModel.timeline.some((entry) => entry.lifecycleStage === 'ordered_unpaid'), true);
assert.equal(readModel.timeline.some((entry) => entry.lifecycleStage === 'warehouse_fulfillment_requested'), true);

const channelLifecycleDetail = (() => {
  const model = serializeOrderLifecycleReadModel(makeOrder({
    paymentStatus: 'paid',
    status: 'processing',
    warehouseHandoff: {
      status: 'fulfilled',
      itemCount: 1,
      reservedCount: 1,
      failedCount: 0,
      fulfillmentOrderHandoff: { status: 'updated', warehouseStatus: 'collecting' },
    },
  }), {
    includeCustomer: true,
    includeDeliveryAddress: true,
    includeWarehouseHandoff: true,
  });
  return {
    ...model,
    lifecycle: {
      ...model.lifecycle,
      stage: model.lifecycle.lifecycleStage,
      status: model.lifecycle.lifecycleStage,
      rawStatus: model.lifecycle.status,
    },
    lifecycleStage: model.lifecycle.lifecycleStage,
    status: model.lifecycle.lifecycleStage,
    rawStatus: model.status,
    statusProjection: model.lifecycle.statusProjection,
  };
})();
assert.equal(channelLifecycleDetail.lifecycle.stage, 'warehouse_collecting');
assert.equal(channelLifecycleDetail.lifecycle.status, 'warehouse_collecting');
assert.equal(channelLifecycleDetail.lifecycle.rawStatus, 'processing');
assert.equal(channelLifecycleDetail.lifecycleStage, 'warehouse_collecting');
assert.equal(channelLifecycleDetail.status, 'warehouse_collecting');
assert.equal(channelLifecycleDetail.rawStatus, 'processing');
assert.equal(channelLifecycleDetail.statusProjection, 'processing');

const eventPayload = buildOrderLifecycleChangedPayload(makeOrder({
  paymentStatus: 'paid',
  status: 'confirmed',
  warehouseHandoff: { status: 'fulfilled', itemCount: 1, reservedCount: 1, failedCount: 0 },
}), 'ordered_unpaid');
assert.equal(eventPayload.previousLifecycleStage, 'ordered_unpaid');
assert.equal(eventPayload.lifecycleStage, 'warehouse_fulfillment_requested');
assert.equal(eventPayload.orderNumber, 'checkout-1001');
assert.equal(eventPayload.paymentStatus, 'paid');
assert.equal(eventPayload.fulfillmentStatus, 'fulfillment_requested');
assert.equal(eventPayload.deliveryStatus, 'not_started');
assert.equal(eventPayload.items[0].sku, 'SKU-1001');
assert.equal(JSON.stringify(eventPayload).includes('shippingAddress'), false);
assert.equal(JSON.stringify(eventPayload).includes('street'), false);
assert.equal(JSON.stringify(eventPayload).includes('buyer@example.invalid'), false);

const aggregates = buildLifecycleAggregates([
  serializeOrderLifecycleReadModel(makeOrder()),
  serializeOrderLifecycleReadModel(makeOrder({ id: 'order-2', channel: 'allegro', paymentStatus: 'failed' })),
  serializeOrderLifecycleReadModel(makeOrder({ id: 'order-3', channel: 'flipflop', status: 'cancelled' })),
]);
assert.equal(aggregates.totalOrders, 3);
assert.equal(aggregates.byLifecycleStage.ordered_unpaid, 1);
assert.equal(aggregates.byLifecycleStage.payment_failed, 1);
assert.equal(aggregates.byLifecycleStage.cancelled, 1);
assert.equal(aggregates.byChannel.flipflop, 2);
assert.equal(aggregates.exceptionCounts.paymentFailed, 1);
assert.equal(aggregates.byDeliveryStatus.not_started, 3);
assert.equal(buildLifecycleAggregates([
  serializeOrderLifecycleReadModel(makeOrder({
    id: 'delivery-1',
    paymentStatus: 'paid',
    warehouseHandoff: { status: 'fulfilled', fulfillmentOrderHandoff: { warehouseStatus: 'in_delivery' } },
  })),
  serializeOrderLifecycleReadModel(makeOrder({
    id: 'delivery-2',
    paymentStatus: 'paid',
    warehouseHandoff: { status: 'fulfilled', fulfillmentOrderHandoff: { warehouseStatus: 'not_delivered' } },
  })),
]).byDeliveryStatus.in_delivery, 1);
assert.equal(buildLifecycleAggregates([
  serializeOrderLifecycleReadModel(makeOrder({
    id: 'delivery-3',
    paymentStatus: 'paid',
    warehouseHandoff: { status: 'fulfilled', fulfillmentOrderHandoff: { warehouseStatus: 'not_delivered' } },
  })),
]).exceptionCounts.notReceived, 1);
assert.equal(aggregates.totalsByCurrency.CZK.orderCount, 3);

const sellingChannelLifecycleReadRoles = [
  'internal:flipflop-service:service',
  'internal:allegro-service:service',
  'internal:aukro-service:service',
  'internal:bazos-service:service',
  'internal:heureka-service:service',
];
assert.equal(ORDER_ADMIN_LIFECYCLE_READ_ROLES.includes('global:superadmin'), true);
assert.equal(ORDER_ADMIN_LIFECYCLE_READ_ROLES.includes('internal:orders-microservice:readonly'), true);
assert.equal(ORDER_CUSTOMER_LIFECYCLE_READ_ROLES.includes('authenticated:user'), true);
for (const role of sellingChannelLifecycleReadRoles) {
  assert.equal(ORDER_CHANNEL_LIFECYCLE_READ_ROLES.includes(role), true, `channel lifecycle read role missing ${role}`);
  assert.equal(ORDER_ADMIN_LIFECYCLE_READ_ROLES.includes(role), true, `admin lifecycle read role missing ${role}`);
  assert.equal(ORDER_CUSTOMER_LIFECYCLE_READ_ROLES.includes(role), true, `customer lifecycle read role missing ${role}`);
  assert.equal(ORDER_DETAIL_READ_ROLES.includes(role), true, `detail read role missing ${role}`);
}

const controllerSource = fs.readFileSync(path.join(PROJECT_ROOT, 'src/orders/orders.controller.ts'), 'utf8');
assert.match(controllerSource, /@Get\('customer\/lifecycle'\)/);
assert.match(controllerSource, /@Get\('admin\/lifecycle'\)/);
assert.match(controllerSource, /@Roles\(\.\.\.ORDER_CUSTOMER_LIFECYCLE_READ_ROLES\)/);
assert.match(controllerSource, /@Roles\(\.\.\.ORDER_ADMIN_LIFECYCLE_READ_ROLES\)/);

const serviceSource = fs.readFileSync(path.join(PROJECT_ROOT, 'src/orders/orders.service.ts'), 'utf8');
assert.match(serviceSource, /getCustomerLifecycleOrders/);
assert.match(serviceSource, /LOWER\(orders\.customer ->> 'authUserId'\)/);
assert.match(serviceSource, /LOWER\(orders\.customer ->> 'subject'\)/);
assert.match(serviceSource, /LOWER\(orders\.customer ->> 'email'\)/);
assert.match(serviceSource, /getAdminLifecycleOrders/);
assert.match(serviceSource, /publishLifecycleChangedIfNeeded/);
assert.match(serviceSource, /mode: 'coarse_projection'/);
assert.match(serviceSource, /addSelect\(orderDateExpression, 'order_sort_at'\)/);
assert.match(serviceSource, /orderBy\('order_sort_at', 'DESC'\)/);


const guardSource = fs.readFileSync(path.join(PROJECT_ROOT, 'src/auth/jwt-roles.guard.ts'), 'utf8');
assert.match(guardSource, /authenticated:user/);
assert.match(guardSource, /authenticated:service/);

const contractDoc = fs.readFileSync(path.join(PROJECT_ROOT, 'docs/orchestrator/ORDER_LIFECYCLE_READ_MODEL.md'), 'utf8');
assert.match(contractDoc, /GET \/api\/orders\/customer\/lifecycle/);
assert.match(contractDoc, /GET \/api\/orders\/admin\/lifecycle/);
assert.match(contractDoc, /POST \/api\/fulfillment-orders/);
assert.doesNotMatch(contractDoc, /\[MISSING: Warehouse-owned fulfillment order or pick-ticket contract/);
assert.match(contractDoc, /customer\.authUserId/);
assert.match(contractDoc, /FlipFlop runtime smoke proving authenticated central order snapshots carry customer\.authSubject/);
assert.match(contractDoc, /Cliplot hosted Auth callback\/session contract before authenticated checkout can pass Auth subject/);

console.log('order lifecycle read model verification ok');
