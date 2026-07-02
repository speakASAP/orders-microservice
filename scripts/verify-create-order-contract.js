const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const {
  CREATE_ORDER_CONTRACT_VERSION,
  getCreateOrderIdempotencyKey,
  isMatchingCreateOrderReplay,
  normalizeCreateOrderRequest,
} = require('../dist/orders/create-order.dto');
const { OrdersService } = require('../dist/orders/orders.service');

const validRequest = {
  contractVersion: CREATE_ORDER_CONTRACT_VERSION,
  channel: 'flipflop',
  externalOrderId: 'checkout-1001',
  channelAccountId: 'flipflop-storefront',
  leadAttribution: {
    leadId: 'lead-1001',
    source: 'lead-form',
    campaignId: 'campaign-1001',
  },
  orderedAt: '2026-06-13T08:00:00.000Z',
  customer: {
    authSubject: '11111111-1111-4111-8111-111111111111',
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
assert.deepEqual(normalized.leadAttribution, {
  leadId: 'lead-1001',
  source: 'lead-form',
  campaignId: 'campaign-1001',
});
assert.equal(normalized.order.status, 'pending');
assert.equal(normalized.order.currency, 'CZK');
assert.equal(normalized.order.paymentMethod, 'card');
assert.equal(normalized.order.shippingMethod, 'carrier');
assert.deepEqual(normalized.order.customer, {
  authUserId: '11111111-1111-4111-8111-111111111111',
  subject: '11111111-1111-4111-8111-111111111111',
  name: 'Example Customer',
  email: 'customer@example.invalid',
  phone: undefined,
});
assert.equal(normalized.items.length, 1);
assert.equal(normalized.items[0].orderId, undefined);
assert.equal(normalized.items[0].quantity, 2);
assert.equal(normalized.items[0].fulfillmentStatus, 'pending');
assert.equal(normalized.items[0].productId, 'catalog-product-1');
assert.deepEqual(getCreateOrderIdempotencyKey(normalized), {
  channel: 'flipflop',
  externalOrderId: 'checkout-1001',
  channelAccountId: 'flipflop-storefront',
});
const normalizedWithoutLeadAttribution = normalizeCreateOrderRequest({ ...validRequest, leadAttribution: undefined });
assert.equal(normalizedWithoutLeadAttribution.leadAttribution, undefined);
const normalizedCliplot = normalizeCreateOrderRequest({
  ...validRequest,
  channel: 'Cliplot',
  externalOrderId: 'cliplot-order-1001',
  channelAccountId: 'cliplot-storefront',
});
assert.equal(normalizedCliplot.order.channel, 'cliplot');

const normalizedWithAuthSubjectAliases = normalizeCreateOrderRequest({
  ...validRequest,
  externalOrderId: 'checkout-auth-subject-aliases',
  customer: {
    ...validRequest.customer,
    authSubject: undefined,
    authUserId: '22222222-2222-4222-8222-222222222222',
    subject: '22222222-2222-4222-8222-222222222222',
    sub: '22222222-2222-4222-8222-222222222222',
  },
});
assert.equal(normalizedWithAuthSubjectAliases.order.customer.authUserId, '22222222-2222-4222-8222-222222222222');
assert.equal(normalizedWithAuthSubjectAliases.order.customer.subject, '22222222-2222-4222-8222-222222222222');

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
  () => normalizeCreateOrderRequest({ ...validRequest, leadAttribution: { leadId: 'lead-1001', unexpected: 'x' } }),
  /Unsupported leadAttribution fields/,
);
assert.throws(
  () => normalizeCreateOrderRequest({ ...validRequest, leadAttribution: 'lead-1001' }),
  /leadAttribution must be an object/,
);
assert.throws(
  () => normalizeCreateOrderRequest({ ...validRequest, status: 'shipped' }),
  /Create order status must be pending or confirmed/,
);
assert.throws(
  () => normalizeCreateOrderRequest({ ...validRequest, customer: { ...validRequest.customer, authSubject: 'not-a-uuid' } }),
  /customer\.authSubject must be a UUID/,
);
assert.throws(
  () => normalizeCreateOrderRequest({
    ...validRequest,
    customer: {
      ...validRequest.customer,
      authSubject: '33333333-3333-4333-8333-333333333333',
      authUserId: '44444444-4444-4444-8444-444444444444',
    },
  }),
  /customer Auth subject fields must match/,
);


const controllerSource = fs.readFileSync(path.join(__dirname, '..', 'src/orders/orders.controller.ts'), 'utf8');
assert.match(controllerSource, /CHANNEL_ORDER_CREATE_ROLES/);
assert.match(controllerSource, /@Roles\(\.\.\.CHANNEL_ORDER_CREATE_ROLES\)/);
assert.match(controllerSource, /@Post\('validate-create'\)/);
const guardSource = fs.readFileSync(path.join(__dirname, '..', 'src/auth/jwt-roles.guard.ts'), 'utf8');
const createServiceContracts = [
  {
    serviceName: 'flipflop-service',
    tokenEnv: 'FLIPFLOP_INTERNAL_SERVICE_TOKEN',
    role: 'internal:flipflop-service:service',
    vaultKey: 'secret/prod/flipflop-service',
    vaultProperty: 'ORDERS_SERVICE_TOKEN',
  },
  {
    serviceName: 'allegro-service',
    tokenEnv: 'ALLEGRO_INTERNAL_SERVICE_TOKEN',
    role: 'internal:allegro-service:service',
    vaultKey: 'secret/prod/allegro-service',
    vaultProperty: 'JWT_TOKEN',
  },
  {
    serviceName: 'aukro-service',
    tokenEnv: 'AUKRO_INTERNAL_SERVICE_TOKEN',
    role: 'internal:aukro-service:service',
    vaultKey: 'secret/prod/aukro-service',
    vaultProperty: 'JWT_TOKEN',
  },
  {
    serviceName: 'bazos-service',
    tokenEnv: 'BAZOS_INTERNAL_SERVICE_TOKEN',
    role: 'internal:bazos-service:service',
    vaultKey: 'secret/prod/bazos-service',
    vaultProperty: 'JWT_TOKEN',
  },
  {
    serviceName: 'heureka-service',
    tokenEnv: 'HEUREKA_INTERNAL_SERVICE_TOKEN',
    role: 'internal:heureka-service:service',
    vaultKey: 'secret/prod/heureka-service',
    vaultProperty: 'JWT_TOKEN',
  },
  {
    serviceName: 'cliplot',
    tokenEnv: 'CLIPLOT_ORDERS_SERVICE_TOKEN',
    fallbackTokenEnv: 'CLIPLOT_SERVICE_TOKEN',
    role: 'internal:cliplot:service',
    vaultKey: 'secret/prod/cliplot',
    vaultProperty: 'ORDERS_SERVICE_TOKEN',
  },
  {
    serviceName: 'cliplot-service',
    tokenEnv: 'CLIPLOT_ORDERS_SERVICE_TOKEN',
    fallbackTokenEnv: 'CLIPLOT_SERVICE_TOKEN',
    role: 'internal:cliplot-service:service',
    vaultKey: 'secret/prod/cliplot',
    vaultProperty: 'ORDERS_SERVICE_TOKEN',
  },
];
for (const { serviceName, tokenEnv, fallbackTokenEnv, role } of createServiceContracts) {
  assert.ok(controllerSource.includes(role), `Create order controller missing role ${role}`);
  assert.ok(guardSource.includes(`'${serviceName}'`), `Guard missing service ${serviceName}`);
  assert.ok(guardSource.includes(tokenEnv), `Guard missing env ${tokenEnv}`);
  if (fallbackTokenEnv) assert.ok(guardSource.includes(fallbackTokenEnv), `Guard missing fallback env ${fallbackTokenEnv}`);
  assert.ok(guardSource.includes(role), `Guard missing role ${role}`);
}
const contractDoc = fs.readFileSync(path.join(__dirname, '..', 'docs/orchestrator/CHANNEL_ORDER_CREATE_CONTRACT.md'), 'utf8');
for (const { serviceName, tokenEnv, fallbackTokenEnv, role, vaultKey, vaultProperty } of createServiceContracts) {
  assert.ok(contractDoc.includes(serviceName), `Contract missing service ${serviceName}`);
  assert.ok(contractDoc.includes(tokenEnv), `Contract missing token env ${tokenEnv}`);
  if (fallbackTokenEnv) assert.ok(contractDoc.includes(fallbackTokenEnv), `Contract missing fallback token env ${fallbackTokenEnv}`);
  assert.ok(contractDoc.includes(role), `Contract missing role ${role}`);
  assert.ok(contractDoc.includes(vaultKey), `Contract missing runtime secret source ${vaultKey}`);
  assert.ok(contractDoc.includes(vaultProperty), `Contract missing runtime secret property ${vaultProperty}`);
}
const externalSecretSource = fs.readFileSync(path.join(__dirname, '..', 'k8s/external-secret.yaml'), 'utf8');
for (const { tokenEnv, vaultKey, vaultProperty } of createServiceContracts) {
  assert.ok(externalSecretSource.includes(`secretKey: ${tokenEnv}`), `ExternalSecret missing ${tokenEnv}`);
  assert.ok(externalSecretSource.includes(`key: ${vaultKey}`), `ExternalSecret missing ${vaultKey}`);
  assert.ok(externalSecretSource.includes(`property: ${vaultProperty}`), `ExternalSecret missing property ${vaultProperty}`);
}
for (const required of [
  'items[].productId`: canonical `catalog-microservice` product ID',
  'Channel-local product, offer, ad, listing, or row IDs must not be sent as `productId`',
  'product-level marketplace sales statistics',
  'resolve offer/ad/listing IDs to canonical Catalog product IDs before calling Orders',
  '`leadAttribution`: optional explicit attribution metadata with allowed fields `leadId`, `source`, and `campaignId`',
  '[MISSING: channel lead attribution source mapping]',
]) {
  assert.ok(contractDoc.includes(required), `Missing canonical Catalog product ID contract text: ${required}`);
}

const serviceSource = fs.readFileSync(path.join(__dirname, '..', 'src/orders/orders.service.ts'), 'utf8');
assert.match(serviceSource, /async validateCreate\(data: CreateOrderRequestDto\)/);
assert.match(serviceSource, /mutation:\s*false/);
assert.match(serviceSource, /orderCreated:\s*false/);
assert.match(serviceSource, /warehouseMutation:\s*false/);
assert.match(serviceSource, /eventPublished:\s*false/);

function makeReadOnlyQuery(existing = null) {
  return {
    leftJoinAndSelect() { return this; },
    where() { return this; },
    andWhere() { return this; },
    async getOne() { return existing; },
  };
}

(async () => {
  const mutationCalls = [];
  const service = new OrdersService(
    {
      createQueryBuilder() {
        return makeReadOnlyQuery(null);
      },
      manager: {
        async transaction() {
          mutationCalls.push('transaction');
          throw new Error('validateCreate must not open a write transaction');
        },
      },
      async save() {
        mutationCalls.push('save');
        throw new Error('validateCreate must not save orders');
      },
    },
    {
      async reserveOrderItems() {
        mutationCalls.push('warehouse.reserve');
        throw new Error('validateCreate must not reserve warehouse stock');
      },
      async fulfillOrderItems() {
        mutationCalls.push('warehouse.fulfill');
        throw new Error('validateCreate must not fulfill warehouse stock');
      },
      async releaseOrderItems() {
        mutationCalls.push('warehouse.release');
        throw new Error('validateCreate must not release warehouse stock');
      },
      async cancelOrderItems() {
        mutationCalls.push('warehouse.cancel');
        throw new Error('validateCreate must not cancel warehouse reservations');
      },
    },
    {
      async publishOrderCreated() {
        mutationCalls.push('event.created');
        throw new Error('validateCreate must not publish events');
      },
      async publishOrderLifecycleChanged() {
        mutationCalls.push('event.lifecycle');
        throw new Error('validateCreate must not publish lifecycle events');
      },
    },
    { audit() {} },
  );

  const validation = await service.validateCreate(validRequest);
  assert.equal(validation.valid, true);
  assert.equal(validation.mutation, false);
  assert.equal(validation.orderCreated, false);
  assert.equal(validation.warehouseMutation, false);
  assert.equal(validation.eventPublished, false);
  assert.equal(validation.channel, 'flipflop');
  assert.equal(validation.externalOrderId, 'checkout-1001');
  assert.equal(validation.itemCount, 1);
  assert.equal(validation.total, 200);
  assert.equal(validation.currency, 'CZK');
  assert.equal(validation.idempotencyStatus, 'available');
  assert.deepEqual(mutationCalls, []);

  console.log('create order contract verification ok');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
