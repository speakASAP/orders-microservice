const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assertIncludes(source, snippet, label) {
  assert.ok(source.includes(snippet), `${label} missing snippet: ${snippet}`);
}

function assertNotMatches(source, pattern, label) {
  assert.doesNotMatch(source, pattern, `${label} contains forbidden pattern ${pattern}`);
}

const controller = read('src/business-health/business-health.controller.ts');
const service = read('src/business-health/business-health.service.ts');
const types = read('src/business-health/business-health.types.ts');
const moduleSource = read('src/business-health/business-health.module.ts');
const appModule = read('src/app.module.ts');
const packageJson = read('package.json');
const handoffDoc = read('docs/orchestrator/2026-07-06-orders-business-health-handoff.md');
const ordersService = read('src/orders/orders.service.ts');
const warehouseClient = read('src/warehouse/warehouse-reservation.client.ts');
const reservationVerifier = read('scripts/verify-order-reservation-gate.js');
const warehouseVerifier = read('scripts/verify-warehouse-handoff-contract.js');

for (const [source, label] of [
  [controller, 'business-health controller'],
  [service, 'business-health service'],
  [types, 'business-health types'],
  [moduleSource, 'business-health module'],
]) {
  assertNotMatches(source, /Repository|InjectRepository|TypeOrmModule|DataSource|EntityManager|QueryBuilder|getRepository/i, label);
  assertNotMatches(source, /HttpService|firstValueFrom|fetch\(|axios|\.post\(|\.put\(|\.patch\(|\.delete\(/, label);
  assertNotMatches(source, /process\.env/, label);
  assertNotMatches(source, /(?:this\.|await\s+|=\s*|return\s+).*?(reserveOrderItems|releaseOrderItems|fulfillOrderItems|cancelOrderItems|postReservationAction)\(/, label);
  assertNotMatches(source, /create\(|cancel\(|update\(|save\(|remove\(|delete\(/, label);
}

assertIncludes(controller, "@Controller('business-health')", 'controller');
assertIncludes(controller, '@Public()', 'controller');
assertIncludes(controller, "@Get('order-reservation-correlation')", 'controller');
assertIncludes(controller, 'getOrderReservationCorrelation', 'controller');

assertIncludes(moduleSource, 'BusinessHealthController', 'module');
assertIncludes(moduleSource, 'BusinessHealthService', 'module');
assertIncludes(appModule, "import { BusinessHealthModule } from './business-health/business-health.module';", 'app module');
assertIncludes(appModule, 'BusinessHealthModule,', 'app module imports');

for (const snippet of [
  "const CONTRACT_ID = 'orders.order_reservation_correlation_business_health.v1' as const;",
  "const BUSINESS_HEALTH_CONTRACT = 'stock-order-marketplace-business-health.v1' as const;",
  "const SERVICE_NAME = 'orders-microservice' as const;",
  "const ENDPOINT = '/api/business-health/order-reservation-correlation' as const;",
  'mutatesOrders: false',
  'mutatesWarehouse: false',
  'mutatesPayments: false',
  'mutatesMarketplace: false',
  'runtimeDataQueried: false',
  'productionDbQueried: false',
  'liveSyntheticMutationAuthorized: false',
  "status: 'warn'",
  '[MISSING: approved live Orders/Warehouse runtime evidence packet for target order/product/channel]',
  'vision:',
  'goalImpact:',
  'system:',
  'feature:',
  'task:',
  'executionPlan:',
  'codingPrompt:',
  'code:',
  'validation:',
]) {
  assertIncludes(service, snippet, 'service');
}

for (const snippet of [
  'OrderReservationCorrelationBusinessHealthEnvelope',
  "contractId: 'orders.order_reservation_correlation_business_health.v1';",
  "businessHealthContract: 'stock-order-marketplace-business-health.v1';",
  "endpoint: '/api/business-health/order-reservation-correlation';",
  'mutatesOrders: false;',
  'productionDbQueried: false;',
]) {
  assertIncludes(types, snippet, 'types');
}

for (const snippet of [
  'Vision -> Goal Impact -> System -> Feature -> Task -> Execution Plan -> Coding Prompt -> Code -> Validation',
  'GET /api/business-health/order-reservation-correlation',
  'orders.order_reservation_correlation_business_health.v1',
  'stock-order-marketplace-business-health.v1',
  'mutatesOrders: false',
  'mutatesWarehouse: false',
  'runtimeDataQueried: false',
  'productionDbQueried: false',
  '[MISSING: approved live Orders/Warehouse runtime evidence packet for target order/product/channel]',
  'npm run verify:business-health-orders-reservation-contract',
  'npm run build',
  'git diff --check',
]) {
  assertIncludes(handoffDoc, snippet, 'handoff doc');
}

assertIncludes(packageJson, 'verify:business-health-orders-reservation-contract', 'package scripts');

assertIncludes(ordersService, 'const handoff = await this.warehouseReservations.reserveOrderItems(savedOrder);', 'orders service reservation call');
assertIncludes(ordersService, 'this.assertRequiredWarehouseReservation(savedOrder, handoff);', 'orders service reservation gate');
assertIncludes(ordersService, 'savedOrder.warehouseHandoff = handoff;', 'orders service handoff persistence');
assertIncludes(ordersService, 'await this.orderEvents.publishOrderCreated', 'orders service event emission');
assert.ok(
  ordersService.indexOf('this.assertRequiredWarehouseReservation(savedOrder, handoff);') < ordersService.indexOf('await this.orderEvents.publishOrderCreated'),
  'reservation assertion must appear before order created event publication',
);
assertIncludes(ordersService, "if (handoff.status === 'reserved') return;", 'orders service reserved-only gate');
assertIncludes(ordersService, 'SELLABLE_ORDER_CHANNELS', 'orders service sellable channel set');
assertIncludes(ordersService, 'order.create.idempotent_replay', 'orders service idempotent replay audit');

for (const snippet of [
  'reserveOrderItems(order: Order)',
  'releaseOrderItems(order: Order',
  'fulfillOrderItems(order: Order',
  'cancelOrderItems(order: Order',
  'postReservationAction(',
  'ORDER_CREATE_RESERVATION',
  'ORDER_CREATE_RESERVATION_COMPENSATION',
]) {
  assertIncludes(warehouseClient, snippet, 'warehouse reservation client');
}

for (const snippet of [
  'transaction-rollback',
  'persistedOrders.length, 0',
  'Warehouse reservation is required',
]) {
  assertIncludes(reservationVerifier, snippet, 'order reservation gate verifier');
}

for (const snippet of [
  '/api/reservations/reserve',
  '/api/reservations/release',
  '/api/reservations/fulfill',
  '/api/reservations/cancel',
  '/api/reservations/expire',
  '/api/reservations/return',
  'Authorization',
]) {
  assertIncludes(warehouseVerifier, snippet, 'warehouse handoff verifier');
}

console.log(JSON.stringify({
  ok: true,
  endpoint: '/api/business-health/order-reservation-correlation',
  contractId: 'orders.order_reservation_correlation_business_health.v1',
  businessHealthContract: 'stock-order-marketplace-business-health.v1',
  forbiddenEndpointPatternsChecked: 40,
}, null, 2));
