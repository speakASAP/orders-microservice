const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
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
  leadAttribution: {
    leadId: 'lead-1001',
    source: 'lead-form',
    campaignId: 'campaign-1001',
  },
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
assert.deepEqual(normalized.leadAttribution, {
  leadId: 'lead-1001',
  source: 'lead-form',
  campaignId: 'campaign-1001',
});
assert.equal(normalized.order.status, 'pending');
assert.equal(normalized.order.currency, 'CZK');
assert.equal(normalized.order.paymentMethod, 'card');
assert.equal(normalized.order.shippingMethod, 'carrier');
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


const controllerSource = fs.readFileSync(path.join(__dirname, '..', 'src/orders/orders.controller.ts'), 'utf8');
assert.match(controllerSource, /CHANNEL_ORDER_CREATE_ROLES/);
assert.match(controllerSource, /@Roles\(\.\.\.CHANNEL_ORDER_CREATE_ROLES\)/);
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
    serviceName: 'cliplot-service',
    tokenEnv: 'CLIPLOT_ORDERS_SERVICE_TOKEN',
    fallbackTokenEnv: 'CLIPLOT_SERVICE_TOKEN',
    role: 'internal:cliplot-service:service',
    vaultKey: 'secret/prod/cliplot-service',
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

console.log('create order contract verification ok');
