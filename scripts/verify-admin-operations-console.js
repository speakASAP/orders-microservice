const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { BadRequestException, ForbiddenException } = require('@nestjs/common');
const { AdminController } = require('../dist/admin/admin.controller');
const { ADMIN_ACTION_ROLES, ADMIN_READ_ROLES, AdminService } = require('../dist/admin/admin.service');
const { ROLES_KEY } = require('../dist/auth/roles.decorator');

const PROJECT_ROOT = path.resolve(__dirname, '..');

function makeOrder(overrides = {}) {
  return {
    id: 'order-1',
    channel: 'flipflop',
    channelAccountId: 'flipflop-storefront',
    externalOrderId: 'ff-100',
    status: 'confirmed',
    paymentStatus: 'paid',
    warehouseHandoff: { status: 'fulfilled' },
    total: 1200,
    currency: 'CZK',
    createdAt: new Date('2026-06-13T09:00:00.000Z'),
    updatedAt: new Date('2026-06-13T10:00:00.000Z'),
    items: [{ quantity: 2 }],
    ...overrides,
  };
}

function makeQueryBuilder(matches) {
  const state = { channel: null, externalOrderId: null, channelAccountId: undefined };
  return {
    leftJoinAndSelect() { return this; },
    where(_clause, params) {
      state.channel = params.channel;
      return this;
    },
    andWhere(clause, params) {
      if (clause.includes('externalOrderId')) state.externalOrderId = params.externalOrderId;
      if (clause.includes('channelAccountId')) state.channelAccountId = params.channelAccountId;
      return this;
    },
    orderBy() { return this; },
    take() { return this; },
    async getMany() {
      return matches.filter((order) => {
        const sameChannel = String(order.channel || '').toLowerCase() === state.channel;
        const sameExternal = order.externalOrderId === state.externalOrderId;
        const sameAccount = state.channelAccountId === undefined || (order.channelAccountId || '') === state.channelAccountId;
        return sameChannel && sameExternal && sameAccount;
      });
    },
  };
}

(async () => {
  const orders = [
    makeOrder(),
    makeOrder({
      id: 'order-2',
      channel: 'allegro',
      channelAccountId: 'seller-1',
      externalOrderId: 'ag-200',
      status: 'pending',
      paymentStatus: null,
      warehouseHandoff: null,
      items: [],
    }),
  ];
  const service = new AdminService(
    {
      async find() { return orders; },
      createQueryBuilder() { return makeQueryBuilder(orders); },
    },
    {
      async count() { return 1; },
    },
    {
      async updateStatus(orderId, status, context) {
        return makeOrder({
          id: orderId,
          status,
          externalOrderId: 'ff-100',
          channelAccountId: 'flipflop-storefront',
          items: [],
          approvalContext: context,
        });
      },
    },
  );

  const overview = await service.getOperationsOverview({ roles: ['internal:orders-microservice:admin'] });
  assert.equal(overview.mode.readOnly, true);
  assert.equal(overview.mode.actionWorkflowsEnabled, false);
  assert.equal(overview.mode.canRunActions, false);
  assert.equal(overview.mode.allowedReadRoles.includes('internal:orders-microservice:admin'), true);
  assert.equal(overview.mode.actionRolesRequired.includes('internal:orders-microservice:action-admin'), true);
  assert.equal(overview.integrations.length, 7);
  assert.deepEqual(overview.integrations.map((item) => item.name), ['Auth', 'Warehouse', 'Payments', 'Catalog', 'Notifications', 'Leads', 'Marketing']);
  assert.equal(JSON.stringify(overview).includes('ff-100'), false);
  assert.equal(JSON.stringify(overview).includes('Bearer '), false);
  assert.equal(overview.idempotency.contractVersion, 'orders.create.v1');
  assert.equal(overview.lifecycle.openOrders, 2);
  assert.equal(overview.lifecycle.paidOrders, 1);
  assert.equal(overview.lifecycle.shipmentRecords, 1);

  const readOnlyCatalog = service.getActionCatalog({ roles: ['internal:orders-microservice:admin'] });
  assert.equal(readOnlyCatalog.mode.readOnly, true);
  assert.equal(readOnlyCatalog.workflows[0].enabled, false);
  await assert.rejects(
    () => service.applyOrderStatusAction({ orderId: 'order-1', status: 'processing' }, { roles: ['internal:orders-microservice:admin'] }),
    ForbiddenException,
  );

  const actionCatalog = service.getActionCatalog({ roles: ['internal:orders-microservice:action-admin'] });
  assert.equal(actionCatalog.mode.canRunActions, true);
  assert.equal(actionCatalog.workflows[0].enabled, true);
  assert.equal(actionCatalog.workflows[0].approvalRequiredFor.includes('cancelled'), true);

  const actionResult = await service.applyOrderStatusAction({
    orderId: 'order-1',
    status: 'cancelled',
    approval: {
      approved: true,
      approvalType: 'human',
      approvedBy: 'orders-owner',
      reasonCode: 'CUSTOMER_REQUEST',
      sideEffectsHandled: {
        payment: true,
        warehouse: true,
        notification: true,
        crm: true,
        channel: true,
      },
    },
  }, {
    sub: 'operator-1',
    email: 'operator@example.invalid',
    roles: ['internal:orders-microservice:action-admin'],
  });
  assert.equal(actionResult.success, true);
  assert.equal(actionResult.action.workflow, 'order.status.update');
  assert.equal(actionResult.action.resultingStatus, 'cancelled');
  assert.equal(actionResult.action.approvalRequired, true);
  assert.equal(JSON.stringify(actionResult).includes('operator@example.invalid'), false);

  const diagnostic = await service.getIdempotencyDiagnostics({
    contractVersion: 'orders.create.v1',
    channel: 'FlipFlop',
    channelAccountId: 'flipflop-storefront',
    externalOrderId: 'ff-100',
  });
  assert.equal(diagnostic.outcome, 'single_match');
  assert.equal(diagnostic.duplicateRisk, false);
  assert.equal(diagnostic.matches.length, 1);
  assert.equal(diagnostic.matches[0].source.service, 'flipflop-service');
  assert.equal(JSON.stringify(diagnostic).includes('shippingAddress'), false);
  assert.equal(JSON.stringify(diagnostic).includes('paymentReferenceId'), false);

  await assert.rejects(
    () => service.getIdempotencyDiagnostics({ channel: 'flipflop' }),
    BadRequestException,
  );
  await assert.rejects(
    () => service.getIdempotencyDiagnostics({ contractVersion: 'orders.create.v2', channel: 'flipflop', externalOrderId: 'ff-100' }),
    BadRequestException,
  );

  const controllerSource = fs.readFileSync(path.join(PROJECT_ROOT, 'src/admin/admin.controller.ts'), 'utf8');
  assert.match(controllerSource, /@Get\('admin\/operations\/overview'\)/);
  assert.match(controllerSource, /@Get\('admin\/operations\/idempotency'\)/);
  assert.match(controllerSource, /@Get\('admin\/operations\/actions'\)/);
  assert.match(controllerSource, /@Post\('admin\/operations\/actions\/order-status'\)/);
  assert.match(controllerSource, /@Roles\(\.\.\.ADMIN_READ_ROLES\)/);
  assert.match(controllerSource, /@Roles\(\.\.\.ADMIN_ACTION_ROLES\)/);
  assert.deepEqual(
    Reflect.getMetadata(ROLES_KEY, AdminController.prototype.getOperationsOverview),
    { roles: ADMIN_READ_ROLES },
  );
  assert.deepEqual(
    Reflect.getMetadata(ROLES_KEY, AdminController.prototype.applyOrderStatusAction),
    { roles: ADMIN_ACTION_ROLES },
  );

  const uiSource = fs.readFileSync(path.join(PROJECT_ROOT, 'src/admin/admin-ui.ts'), 'utf8');
  assert.match(uiSource, /Integration health/);
  assert.match(uiSource, /Idempotency diagnostics/);
  assert.match(uiSource, /Approved actions/);
  assert.match(uiSource, /Sign in with Auth/);
  assert.match(uiSource, /https:\/\/auth\.alfares\.cz/);
  assert.match(uiSource, /AUTH_CLIENT_ID = 'orders-microservice'/);
  assert.match(uiSource, /url\.searchParams\.set\('client_id', AUTH_CLIENT_ID\)/);
  assert.match(uiSource, /url\.searchParams\.set\('return_url', returnUrl\.toString\(\)\)/);
  assert.match(uiSource, /url\.searchParams\.set\('state', nonce\)/);
  assert.match(uiSource, /window\.location\.hash\.includes\('access_token='\)/);
  assert.match(uiSource, /sessionStorage\.getItem\(AUTH_STATE_KEY\)/);
  assert.match(uiSource, /window\.history\.replaceState\(null, document\.title, cleanUrl\)/);
  assert.match(uiSource, /sessionStorage\.setItem\(ADMIN_TOKEN_KEY, accessToken\)/);
  assert.doesNotMatch(uiSource, /Paste Auth-issued admin bearer token/);
  assert.doesNotMatch(uiSource, /id="token" type="password"/);
  assert.match(uiSource, /id="runAction" disabled/);
  assert.match(uiSource, /\/api\/admin\/operations\/overview/);
  assert.match(uiSource, /\/api\/admin\/operations\/idempotency/);
  assert.match(uiSource, /\/api\/admin\/operations\/actions\/order-status/);

  const guardSource = fs.readFileSync(path.join(PROJECT_ROOT, 'src/auth/jwt-roles.guard.ts'), 'utf8');
  const authModuleSource = fs.readFileSync(path.join(PROJECT_ROOT, 'src/auth/auth.module.ts'), 'utf8');
  assert.match(guardSource, /AUTH_SERVICE_URL/);
  assert.match(guardSource, /http:\/\/auth-microservice:3370/);
  assert.match(guardSource, /\/auth\/validate/);
  assert.match(guardSource, /JSON\.stringify\(\{ token \}\)/);
  assert.match(guardSource, /payload\?\.valid/);
  assert.match(guardSource, /payload\.user/);
  assert.doesNotMatch(guardSource, /auth-microservice:3000/);
  assert.doesNotMatch(guardSource, /JwtService|jwtService\.verify|JWT_SECRET/);
  assert.doesNotMatch(authModuleSource, /JwtModule|JWT_SECRET/);

  console.log('admin operations console verification ok');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
