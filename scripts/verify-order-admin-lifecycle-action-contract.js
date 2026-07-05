const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { AdminController } = require('../dist/admin/admin.controller');
const { ADMIN_ACTION_ROLES, ADMIN_READ_ROLES, AdminService } = require('../dist/admin/admin.service');
const { OrdersController, ORDER_STATUS_UPDATE_ROLES } = require('../dist/orders/orders.controller');
const { ROLES_KEY } = require('../dist/auth/roles.decorator');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

function assertIncludes(source, needle, label) {
  assert(source.includes(needle), `${label}: missing ${needle}`);
}

(async () => {
  const ordersControllerSource = read('src/orders/orders.controller.ts');
  const adminControllerSource = read('src/admin/admin.controller.ts');
  const adminServiceSource = read('src/admin/admin.service.ts');
  const ordersServiceSource = read('src/orders/orders.service.ts');
  const statusTransitionsSource = read('src/orders/status-transitions.ts');
  const contract = read('docs/orchestrator/ORDER_ADMIN_LIFECYCLE_ACTION_CONTRACT.md');
  const w7b = read('reports/validation/VAL-W7B-flipflop-admin-status-authority-closed-2026-07-05.md');

  assertIncludes(ordersControllerSource, 'export const ORDER_STATUS_UPDATE_ROLES', 'orders status role constant');
  assertIncludes(ordersControllerSource, "'internal:orders-microservice:action-admin'", 'orders status action role');
  assertIncludes(ordersControllerSource, "@Put(':id/status')", 'orders status route');
  assertIncludes(ordersControllerSource, '@Roles(...ORDER_STATUS_UPDATE_ROLES)', 'orders status route role gate');
  assert.deepEqual(
    Reflect.getMetadata(ROLES_KEY, OrdersController.prototype.updateStatus),
    { roles: ORDER_STATUS_UPDATE_ROLES },
  );
  assert.deepEqual([...ORDER_STATUS_UPDATE_ROLES], ['global:superadmin', 'internal:orders-microservice:action-admin']);
  assert.equal(ORDER_STATUS_UPDATE_ROLES.includes('internal:orders-microservice:admin'), false);
  assert.equal(ORDER_STATUS_UPDATE_ROLES.includes('internal:flipflop-service:service'), false);

  assertIncludes(adminControllerSource, "@Post('admin/operations/actions/order-status')", 'admin action route');
  assertIncludes(adminControllerSource, '@Roles(...ADMIN_ACTION_ROLES)', 'admin action role gate');
  assert.deepEqual(
    Reflect.getMetadata(ROLES_KEY, AdminController.prototype.applyOrderStatusAction),
    { roles: ADMIN_ACTION_ROLES },
  );
  assert.deepEqual([...ADMIN_ACTION_ROLES], ['global:superadmin', 'internal:orders-microservice:action-admin']);
  assert.equal(ADMIN_READ_ROLES.includes('internal:orders-microservice:admin'), true);
  assert.equal(ADMIN_ACTION_ROLES.includes('internal:orders-microservice:admin'), false);
  assertIncludes(adminServiceSource, 'Default admin mode is read-only', 'read-only default policy');
  assertIncludes(adminServiceSource, 'this.ordersService.updateStatus(orderId, status', 'admin action delegates to OrdersService');
  assertIncludes(ordersServiceSource, 'validateOrderStatusTransitionWithAudit(previousStatus, status', 'status validator use');
  assertIncludes(ordersServiceSource, 'cancelOrderItems(updated)', 'warehouse cancel handoff');
  assertIncludes(ordersServiceSource, 'publishLifecycleChangedIfNeeded(updated, previousLifecycleStage)', 'lifecycle changed event');
  assertIncludes(statusTransitionsSource, 'Order cancellation requires approval.approved=true', 'approval gate');
  assertIncludes(statusTransitionsSource, 'side-effect acknowledgements for', 'side effect gate');
  assertIncludes(statusTransitionsSource, 'Refund-like order transitions are Payments-owned', 'payment boundary');

  const service = new AdminService(
    { async find() { return []; }, createQueryBuilder() { throw new Error('not used'); } },
    { async count() { return 0; } },
    { async updateStatus(orderId, status, context) { return { id: orderId, status, channel: 'flipflop', externalOrderId: 'ff', channelAccountId: 'default' }; } },
  );
  await assert.rejects(
    () => service.applyOrderStatusAction({ orderId: 'order-1', status: 'processing' }, { roles: ['internal:orders-microservice:admin'] }),
    /Orders admin action role is required/,
  );
  const action = await service.applyOrderStatusAction(
    { orderId: 'order-1', status: 'processing' },
    { sub: 'actor-1', email: 'operator@example.invalid', roles: ['internal:orders-microservice:action-admin'] },
  );
  assert.equal(action.success, true);
  assert.equal(action.action.workflow, 'order.status.update');
  assert.equal(action.action.resultingStatus, 'processing');
  assert.equal(JSON.stringify(action).includes('operator@example.invalid'), false);

  assertIncludes(contract, 'Vision -> Orders is the canonical lifecycle authority', 'IPS vision');
  assertIncludes(contract, 'POST /api/admin/operations/actions/order-status', 'contract admin route');
  assertIncludes(contract, 'PUT /api/orders/:id/status', 'contract low-level route');
  assertIncludes(contract, 'FlipFlop correctly fails closed', 'contract FlipFlop rule');
  assertIncludes(contract, '[MISSING: FlipFlop route-to-Orders admin action implementation]', 'remaining route implementation gate');
  assertIncludes(w7b, 'FlipFlop evidence HEAD: `1d89927', 'W7B evidence head marker');

  console.log(JSON.stringify({
    ok: true,
    verifier: 'orders-admin-lifecycle-action-contract.v1',
    adminActionRoute: '/api/admin/operations/actions/order-status',
    lowLevelStatusRouteRoleGated: true,
    actionRoles: [...ADMIN_ACTION_ROLES],
    readOnlyAdminCanMutate: false,
    channelServiceCanMutate: false,
    runtimeMutation: false,
    sensitiveOutput: 'redacted-source-only',
  }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
