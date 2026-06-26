const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { BadRequestException } = require('@nestjs/common');
const {
  OrdersController,
  PRODUCT_SALES_STATISTICS_READ_ROLES,
} = require('../dist/orders/orders.controller');
const { OrdersService } = require('../dist/orders/orders.service');
const { ROLES_KEY, PUBLIC_KEY } = require('../dist/auth/roles.decorator');

const PROJECT_ROOT = path.resolve(__dirname, '..');

class ProductSalesQueryBuilder {
  constructor(calls) {
    this.calls = calls;
    this.groups = [];
    this.takeValue = null;
  }

  innerJoin(relation, alias) { this.calls.push({ method: 'innerJoin', relation, alias }); return this; }
  where(clause, params) { this.calls.push({ method: 'where', clause, params }); return this; }
  andWhere(clause, params) { this.calls.push({ method: 'andWhere', clause, params }); return this; }
  select(selection, alias) { this.selection = selection; this.alias = alias; return this; }
  addSelect() { return this; }
  groupBy(group) { this.groups = [group]; return this; }
  addGroupBy(group) { this.groups.push(group); return this; }
  orderBy() { return this; }
  addOrderBy() { return this; }
  take(value) { this.takeValue = value; return this; }

  async getRawMany() {
    if (this.groups.includes('orders.id')) {
      assert.equal(this.takeValue, 10);
      return [
        { orderId: 'order-1', channel: 'allegro', status: 'confirmed', currency: 'CZK', itemLineCount: '1', quantitySold: '2', grossItemRevenue: '200.50', orderedAt: '2026-06-25T10:00:00.000Z' },
      ];
    }
    if (this.groups.includes('orders.channel')) {
      return [
        { channel: 'allegro', currency: 'CZK', orderCount: '1', itemLineCount: '1', quantitySold: '2', grossItemRevenue: '200.50', lastOrderAt: '2026-06-25T10:00:00.000Z' },
        { channel: 'flipflop', currency: 'EUR', orderCount: '1', itemLineCount: '1', quantitySold: '1', grossItemRevenue: '25.00', lastOrderAt: '2026-06-24T10:00:00.000Z' },
      ];
    }
    if (this.groups.includes('orders.status')) {
      return [
        { status: 'confirmed', currency: 'CZK', orderCount: '1', itemLineCount: '1', quantitySold: '2', grossItemRevenue: '200.50', lastOrderAt: '2026-06-25T10:00:00.000Z' },
        { status: 'delivered', currency: 'EUR', orderCount: '1', itemLineCount: '1', quantitySold: '1', grossItemRevenue: '25.00', lastOrderAt: '2026-06-24T10:00:00.000Z' },
      ];
    }
    if (this.groups.includes('orders.currency')) {
      return [
        { currency: 'CZK', orderCount: '1', itemLineCount: '1', quantitySold: '2', grossItemRevenue: '200.50', lastOrderAt: '2026-06-25T10:00:00.000Z' },
        { currency: 'EUR', orderCount: '1', itemLineCount: '1', quantitySold: '1', grossItemRevenue: '25.00', lastOrderAt: '2026-06-24T10:00:00.000Z' },
      ];
    }
    throw new Error(`Unexpected groups: ${this.groups.join(',')}`);
  }
}

function makeService(calls) {
  return new OrdersService(
    {
      createQueryBuilder() { return new ProductSalesQueryBuilder(calls); },
    },
    {},
    {},
    { audit() {} },
  );
}

(async () => {
  assert.deepEqual(PRODUCT_SALES_STATISTICS_READ_ROLES, [
    'global:superadmin',
    'internal:orders-microservice:admin',
    'internal:orders-microservice:readonly',
    'internal:orders-microservice:operator',
    'internal:catalog-microservice:service',
  ]);

  const controllerSource = fs.readFileSync(path.join(PROJECT_ROOT, 'src/orders/orders.controller.ts'), 'utf8');
  assert.match(controllerSource, /@Get\('statistics\/products\/:productId'\)/);
  assert.match(controllerSource, /@Roles\(\.\.\.PRODUCT_SALES_STATISTICS_READ_ROLES\)/);
  assert.ok(
    controllerSource.indexOf("@Get('statistics/products/:productId')") < controllerSource.indexOf("@Get(':id')"),
    'statistics route must be declared before the generic :id route',
  );
  assert.doesNotMatch(controllerSource, /@Public\(\)\s*\n\s*@Get\('statistics\/products\/:productId'\)/);
  assert.deepEqual(
    Reflect.getMetadata(ROLES_KEY, OrdersController.prototype.getProductSalesStatistics),
    { roles: PRODUCT_SALES_STATISTICS_READ_ROLES },
  );
  assert.equal(Reflect.getMetadata(PUBLIC_KEY, OrdersController.prototype.getProductSalesStatistics), undefined);

  const controller = new OrdersController({
    async getProductSalesStatistics(productId, filters) {
      assert.equal(productId, 'product-1');
      assert.equal(filters.channel, 'allegro');
      return { productId, filters };
    },
  });
  const controllerResult = await controller.getProductSalesStatistics('product-1', { channel: 'allegro' });
  assert.equal(controllerResult.success, true);
  assert.equal(controllerResult.data.productId, 'product-1');

  const calls = [];
  const service = makeService(calls);
  const result = await service.getProductSalesStatistics('product-1', {
    from: '2026-06-01T00:00:00.000Z',
    to: '2026-06-26T23:59:59.999Z',
    channel: 'Allegro',
  });

  assert.equal(result.productId, 'product-1');
  assert.equal(result.filters.channel, 'allegro');
  assert.deepEqual(result.filters.statuses, ['confirmed', 'processing', 'shipped', 'delivered']);
  assert.equal(result.filters.statuses.includes('cancelled'), false);
  assert.equal(result.summary.orderCount, 2);
  assert.equal(result.summary.itemLineCount, 2);
  assert.equal(result.summary.quantitySold, 3);
  assert.equal(result.summary.grossItemRevenue, null);
  assert.equal(result.summary.currency, null);
  assert.equal(result.summary.mixedCurrency, true);
  assert.deepEqual(result.summary.currencies, ['CZK', 'EUR']);
  assert.equal(result.summary.totalsByCurrency.length, 2);
  assert.equal(result.byChannel.length, 2);
  assert.equal(result.byChannel[0].channel, 'allegro');
  assert.equal(result.byStatus.length, 2);
  assert.equal(result.byStatus[0].status, 'confirmed');
  assert.equal(result.recentHistory.length, 1);
  assert.equal(result.recentHistory[0].orderId, 'order-1');
  assert.equal(result.recentHistory[0].grossItemRevenue, 200.5);

  const statusCalls = calls.filter((call) => call.params?.statuses);
  assert.ok(statusCalls.length >= 4);
  for (const call of statusCalls) {
    assert.deepEqual(call.params.statuses, ['confirmed', 'processing', 'shipped', 'delivered']);
    assert.equal(call.params.statuses.includes('cancelled'), false);
  }
  assert.ok(calls.some((call) => call.clause === 'item.productId = :productId'));
  assert.ok(calls.some((call) => call.clause === 'orders.channel = :channel' && call.params.channel === 'allegro'));
  assert.ok(calls.some((call) => String(call.clause).includes('>= :from')));
  assert.ok(calls.some((call) => String(call.clause).includes('<= :to')));

  const explicitCancelledCalls = [];
  await makeService(explicitCancelledCalls).getProductSalesStatistics('product-1', { status: 'cancelled' });
  assert.ok(explicitCancelledCalls.some((call) => call.params?.statuses?.length === 1 && call.params.statuses[0] === 'cancelled'));

  await assert.rejects(() => service.getProductSalesStatistics('', {}), BadRequestException);
  await assert.rejects(() => service.getProductSalesStatistics('product-1', { channel: 'amazon' }), BadRequestException);
  await assert.rejects(() => service.getProductSalesStatistics('product-1', { status: 'refunded' }), BadRequestException);
  await assert.rejects(() => service.getProductSalesStatistics('product-1', { from: 'not-a-date' }), BadRequestException);
  await assert.rejects(
    () => service.getProductSalesStatistics('product-1', { from: '2026-06-27T00:00:00.000Z', to: '2026-06-26T00:00:00.000Z' }),
    BadRequestException,
  );

  const serialized = JSON.stringify(result);
  for (const forbidden of [
    'customer',
    'shippingAddress',
    'billingAddress',
    'externalOrderId',
    'channelAccountId',
    'paymentReferenceId',
    'paymentApplicationId',
    'providerTransactionId',
    'warehouseHandoff',
    'warehouseId',
    'Bearer ',
    'token',
    'secret',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `response must not include ${forbidden}`);
  }

  const serviceSource = fs.readFileSync(path.join(PROJECT_ROOT, 'src/orders/orders.service.ts'), 'utf8');
  const methodSource = serviceSource.slice(
    serviceSource.indexOf('async getProductSalesStatistics'),
    serviceSource.indexOf('async create'),
  );
  assert.match(methodSource, /grossItemRevenue/);
  assert.doesNotMatch(methodSource, /grossSales|paidRevenue|settledRevenue/);
  assert.doesNotMatch(methodSource, /customer|shippingAddress|billingAddress|paymentReferenceId|providerTransactionId|warehouseId/);

  const contract = fs.readFileSync(path.join(PROJECT_ROOT, 'docs/orchestrator/GOAL17_PRODUCT_SALES_STATISTICS_CONTRACT.md'), 'utf8');
  for (const required of [
    'Vision -> Goal Impact -> System -> Feature -> Task -> Execution Plan -> Coding Prompt -> Code -> Validation',
    'GET /api/orders/statistics/products/:productId',
    'order_items.productId',
    'canonical Catalog product ID',
    'Default: `confirmed`, `processing`, `shipped`, `delivered`',
    'grossItemRevenue',
    'No PII',
    '[MISSING: Auth-owned confirmation',
  ]) {
    assert.ok(contract.includes(required), `Missing Goal 17 contract text: ${required}`);
  }

  console.log('product sales statistics verification ok');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
