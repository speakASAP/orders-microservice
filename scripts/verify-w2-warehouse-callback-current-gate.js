#!/usr/bin/env node
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const warehouseRoot = process.env.WAREHOUSE_REPO_PATH || '/home/ssf/Documents/Github/warehouse-microservice';
const reportPath = path.join(root, 'reports/validation/VAL-W2-warehouse-callback-current-gate-2026-07-06.md');
const finalReportPath = path.join(root, 'reports/validation/VAL-W7-error-free-orders-lifecycle-final-integration-2026-07-05.md');
const masterPlanPath = path.join(root, 'docs/orchestrator/2026-07-05-error-free-orders-lifecycle-master-plan.md');
const statePath = path.join(root, 'docs/IMPLEMENTATION_STATE.md');
const runtimeGatePath = path.join(root, 'docs/orchestrator/2026-07-05-runtime-gate-packet-contracts.md');
const w1w2ProofPath = path.join(root, 'reports/validation/VAL-W7-W1W2-live-buyer-bound-proof-2026-07-05.md');
const ordersControllerPath = path.join(root, 'src/orders/orders.controller.ts');
const ordersServicePath = path.join(root, 'src/orders/orders.service.ts');
const ordersLifecyclePath = path.join(root, 'src/orders/order-lifecycle.ts');
const ordersWarehouseDtoPath = path.join(root, 'src/orders/warehouse-fulfillment-status.dto.ts');
const warehouseW2ReportPath = path.join(warehouseRoot, 'reports/validation/VAL-W2-warehouse-fulfillment-callback-proof-2026-07-05.md');
const warehouseServicePath = path.join(warehouseRoot, 'src/fulfillment/fulfillment-orders.service.ts');
const warehouseControllerPath = path.join(warehouseRoot, 'src/fulfillment/fulfillment-orders.controller.ts');
const warehouseInternalDeliveryContractPath = path.join(warehouseRoot, 'docs/contracts/internal-delivery-status-contract.md');

function read(file) {
  assert.equal(fs.existsSync(file), true, file + ' is missing');
  return fs.readFileSync(file, 'utf8');
}
function assertIncludes(source, marker, label) {
  assert.equal(source.includes(marker), true, label + ' missing marker: ' + marker);
}
function assertNotIncludes(source, marker, label) {
  assert.equal(source.includes(marker), false, label + ' must not include marker: ' + marker);
}

const report = read(reportPath);
const finalReport = read(finalReportPath);
const masterPlan = read(masterPlanPath);
const state = read(statePath);
const runtimeGate = read(runtimeGatePath);
const w1w2Proof = read(w1w2ProofPath);
const ordersController = read(ordersControllerPath);
const ordersService = read(ordersServicePath);
const ordersLifecycle = read(ordersLifecyclePath);
const ordersWarehouseDto = read(ordersWarehouseDtoPath);
const warehouseW2Report = read(warehouseW2ReportPath);
const warehouseService = read(warehouseServicePath);
const warehouseController = read(warehouseControllerPath);
const internalDeliveryContract = read(warehouseInternalDeliveryContractPath);

const decision = '[RESOLVED/NARROWED: Warehouse callback source and approved synthetic customer/admin runtime proof are complete; any extra Warehouse callback smoke beyond W1/W2/W2 is not an autonomous source gap and remains product-approved target/status packet gated]';
const ipsMarkers = ['Vision ->','Goal Impact ->','System ->','Feature ->','Task ->','Execution Plan ->','Coding Prompt ->','Code ->','Validation ->'];
for (const marker of ipsMarkers) assertIncludes(report, marker, 'W2 current gate IPS chain');
for (const doc of [report, finalReport, masterPlan, state]) assertIncludes(doc, decision, 'W2 current gate decision propagation');

assertIncludes(w1w2Proof, 'warehouseHttpStatus=200', 'W1/W2 Warehouse callback HTTP proof');
assertIncludes(w1w2Proof, 'customerSawWarehouseCollecting=true', 'W1/W2 customer lifecycle proof');
assertIncludes(w1w2Proof, 'adminSawWarehouseCollecting=true', 'W1/W2 admin lifecycle proof');

const warehouseReportMarkers = [
  'status: runtime_customer_and_admin_lifecycle_verified',
  'notifyOrdersStatus()` sends `PUT ${ORDERS_SERVICE_URL}/api/orders/:orderId/warehouse-fulfillment-status`',
  'Orders maps Warehouse statuses into lifecycle stages',
  'Warehouse runtime accepted the approved existing synthetic fulfillment transition `in_delivery -> delivered` with HTTP 201',
  'Orders admin lifecycle readback confirmed the same hashed order projected to lifecycle stage `received`',
  'customer lifecycle readback returned HTTP 200 for the matching hashed order',
  '"customerStage": "warehouse_collecting"',
  '"tokenPrinted": false',
  '"rawCustomerPrinted": false',
  '"rawTrackingPrinted": false',
];
for (const marker of warehouseReportMarkers) assertIncludes(warehouseW2Report, marker, 'Warehouse W2 report');

assertIncludes(warehouseService, 'async updateStatus(orderId: string, body: FulfillmentStatusTransitionCommand)', 'Warehouse updateStatus source');
assertIncludes(warehouseService, 'await this.notifyOrdersStatus(saved, body)', 'Warehouse callback invocation');
assertIncludes(warehouseService, 'await axios.put(', 'Warehouse Orders callback HTTP client');
assertIncludes(warehouseService, '${baseUrl}/api/orders/${encodeURIComponent(order.orderId)}/warehouse-fulfillment-status', 'Warehouse Orders callback URL');
assertIncludes(warehouseService, "'x-service-name': 'warehouse-microservice'", 'Warehouse callback service identity');
assertIncludes(warehouseController, "@Post('order/:orderId/status')", 'Warehouse status route');
assertIncludes(warehouseController, "@Post('order/:orderId/internal-delivery-status')", 'Warehouse internal delivery route');
assertIncludes(internalDeliveryContract, '[SOURCE-IMPLEMENTED: Warehouse internal delivery status endpoint and service path.]', 'Internal delivery source implemented');
assertIncludes(internalDeliveryContract, '[MISSING: bounded runtime smoke proving internal delivery status mutates one safe fulfillment order and triggers Orders callback/projection.]', 'Internal delivery runtime gate preserved');

assertIncludes(ordersController, "@Put(':id/warehouse-fulfillment-status')", 'Orders callback endpoint');
assertIncludes(ordersController, 'ORDER_WAREHOUSE_FULFILLMENT_UPDATE_ROLES', 'Orders callback roles');
assertIncludes(ordersService, 'async applyWarehouseFulfillmentStatus', 'Orders apply callback service');
assertIncludes(ordersService, 'normalizeWarehouseFulfillmentStatusUpdate(data)', 'Orders callback normalization');
assertIncludes(ordersService, 'publishLifecycleChangedIfNeeded(updated, previousLifecycleStage)', 'Orders lifecycle event publication');
assertIncludes(ordersWarehouseDto, "'not_delivered'", 'Orders fulfillment DTO not delivered');
assertIncludes(ordersWarehouseDto, "'returned'", 'Orders fulfillment DTO returned');
assertIncludes(ordersLifecycle, "delivered: 'received'", 'Orders delivered lifecycle mapping');
assertIncludes(ordersLifecycle, "not_delivered: 'not_received'", 'Orders not delivered lifecycle mapping');
assertIncludes(ordersLifecycle, "returned: 'returned'", 'Orders returned lifecycle mapping');

assertIncludes(runtimeGate, '## Warehouse Callback Runtime Packet', 'Runtime packet Warehouse section remains');
assertIncludes(runtimeGate, '[MISSING: approved Warehouse fulfillment runtime packet]', 'Runtime packet marker preserved');
assertIncludes(report, '[MISSING: approved extra Warehouse fulfillment runtime packet naming exact target hash, current status, next status, actor, reason, reference/idempotency, rollback/no-rollback, and Orders readback boundary]', 'extra packet blocker');

const forbiddenClaims = [
  'extra Warehouse callback smoke complete',
  'production fulfillment mutation executed',
  'raw tracking number',
  'token value',
  'provider payload printed',
];
for (const marker of forbiddenClaims) assertNotIncludes(report, marker, 'W2 report forbidden claim');

const result = {
  ok: true,
  verifier: 'orders-w2-warehouse-callback-current-gate.v1',
  sourceAndApprovedSyntheticRuntimeProven: true,
  extraWarehouseCallbackSmoke: 'product_approved_packet_gated',
  autonomousSourceGap: false,
  mutation: false,
  providerCall: false,
  deploy: false,
  tokenValuesReadOrPrinted: false,
  sensitiveOutput: 'redacted-source-only',
};
process.stdout.write(JSON.stringify(result, null, 2) + '\n');
