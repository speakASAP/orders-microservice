const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const DEFAULT_ALLEGRO_PATHS = [
  '/tmp/allegro-worktrees/allegro-shipment-correlation-producer',
  '/home/ssf/Documents/Github/allegro',
];
const DEFAULT_WAREHOUSE_PATHS = [
  '/home/ssf/Documents/Github/warehouse-microservice',
];

function firstExisting(paths) {
  return paths.find((candidate) => candidate && fs.existsSync(candidate));
}

function repoPath(envName, defaults) {
  const explicit = process.env[envName];
  const selected = explicit || firstExisting(defaults);
  if (!selected || !fs.existsSync(selected)) {
    throw new Error(`${envName} is required; checked defaults: ${defaults.join(', ')}`);
  }
  return path.resolve(selected);
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function requireFile(root, relativePath) {
  const file = path.join(root, relativePath);
  assert.equal(fs.existsSync(file), true, `missing required file: ${file}`);
  return read(file);
}

function assertContains(source, pattern, label) {
  if (pattern instanceof RegExp) {
    assert.match(source, pattern, label);
  } else {
    assert.equal(source.includes(pattern), true, label);
  }
}

function assertNotContains(source, forbidden, label) {
  for (const item of forbidden) {
    assert.equal(source.includes(item), false, `${label}: ${item}`);
  }
}

const ordersRoot = path.resolve(__dirname, '..');
const allegroRoot = repoPath('ALLEGRO_REPO_PATH', DEFAULT_ALLEGRO_PATHS);
const warehouseRoot = repoPath('WAREHOUSE_REPO_PATH', DEFAULT_WAREHOUSE_PATHS);

const runtimeGateReportPath = 'reports/validation/shipment-runtime-readiness/allegro-warehouse-runtime-gate-current.json';
const runtimeGateReport = JSON.parse(requireFile(ordersRoot, runtimeGateReportPath));
assert.equal(runtimeGateReport.schemaVersion, 'orders.shipment_runtime_gate.v1', 'shipment runtime gate report schema mismatch');
assert.equal(runtimeGateReport.status, 'runtime_proven_source_hardened_token_projection_blocked', 'shipment runtime gate must record proven runtime path plus source-hardened token projection blocker');
assert.equal(runtimeGateReport.runtimeEvidence.deployments.orders.image, 'localhost:5000/orders-microservice:ad83d15', 'Orders runtime image evidence mismatch');
assert.equal(runtimeGateReport.runtimeEvidence.deployments.warehouse.image, 'localhost:5000/warehouse-microservice:2553452', 'Warehouse runtime image evidence mismatch');
assert.equal(runtimeGateReport.runtimeEvidence.deployments.allegro.image, 'localhost:5000/allegro-service:0cfe401', 'Allegro runtime image evidence mismatch');
assert.equal(runtimeGateReport.runtimeEvidence.warehouse.appliedMigrations.includes('CreateFulfillmentProviderShipmentCorrelations1781700000000'), true, 'Warehouse correlation migration must be applied at runtime');
assert.equal(runtimeGateReport.runtimeEvidence.warehouse.appliedMigrations.includes('CreateFulfillmentProviderStatusObservations1781600000000'), true, 'Warehouse provider status observation migration must be applied at runtime');
assert.equal(runtimeGateReport.runtimeEvidence.allegro.deadLetterEnv, 'set', 'Allegro runtime must have dead-letter env set');
assert.equal(runtimeGateReport.runtimeEvidence.allegro.correlationEnabledEnv, 'true', 'Allegro correlation gate must be explicitly enabled for the proven smoke');
assert.equal(runtimeGateReport.runtimeEvidence.allegro.warehouseServiceTokenPresent, true, 'Allegro runtime must have a Warehouse-capable service token');
assert.equal(runtimeGateReport.runtimeEvidence.allegro.sanitizedReplay.posted, 1, 'sanitized replay must post exactly one Warehouse correlation');
assert.equal(runtimeGateReport.runtimeEvidence.allegro.sanitizedReplay.disabled, 0, 'enabled replay must not be disabled');
assert.equal(runtimeGateReport.runtimeEvidence.allegro.sanitizedReplay.blocked, 0, 'enabled replay must not be blocked');
assert.equal(runtimeGateReport.runtimeEvidence.allegro.sanitizedReplay.failed, 0, 'enabled replay must not fail');
assert.equal(runtimeGateReport.runtimeEvidence.warehouse.correlationReadback.correlations, 1, 'Warehouse correlation readback mismatch');
assert.equal(runtimeGateReport.runtimeEvidence.warehouse.correlationReadback.idempotent, true, 'Warehouse correlation must be idempotent');
assert.equal(runtimeGateReport.runtimeEvidence.warehouse.providerStatusReadback.observations, 1, 'Warehouse provider observation readback mismatch');
assert.equal(runtimeGateReport.runtimeEvidence.warehouse.providerStatusReadback.latestDecision, 'accepted', 'Warehouse provider observation decision mismatch');
assert.equal(runtimeGateReport.runtimeEvidence.warehouse.providerStatusReadback.latestNormalizedWarehouseStatus, 'in_delivery', 'Warehouse normalized status mismatch');
assert.equal(runtimeGateReport.runtimeEvidence.warehouse.fulfillmentMutation.statusMutationApplied, true, 'Warehouse fulfillment status mutation must be proven');
assert.equal(runtimeGateReport.runtimeEvidence.warehouse.fulfillmentMutation.fulfillmentStatus, 'in_delivery', 'Warehouse fulfillment status readback mismatch');
assert.equal(runtimeGateReport.runtimeEvidence.orders.warehouseCallbackReadback.centralStatus, 'shipped', 'Orders central status readback mismatch');
assert.equal(runtimeGateReport.runtimeEvidence.orders.warehouseCallbackReadback.paymentStatus, 'paid', 'Orders payment status readback mismatch');
assert.equal(runtimeGateReport.runtimeEvidence.orders.warehouseCallbackReadback.projectionReceived, true, 'Orders callback projection must be proven');
assert.equal(runtimeGateReport.policy.boundedApprovedRuntimeSmoke, true, 'runtime smoke must be explicitly bounded/approved in evidence');
assert.equal(runtimeGateReport.policy.rawTrackingDisplayed, false, 'shipment gate report must not expose raw tracking values');
assert.equal(runtimeGateReport.policy.rawProviderPayloadDisplayed, false, 'shipment gate report must not expose raw provider payloads');
assert.equal(runtimeGateReport.policy.customerPiiDisplayed, false, 'shipment gate report must not expose customer PII');
assert.equal(runtimeGateReport.policy.secretsDisplayed, false, 'shipment gate report must not expose secrets');
assert.equal(runtimeGateReport.policy.rawDatabaseRowsDisplayed, false, 'shipment gate report must not expose raw DB rows');
assert.equal(runtimeGateReport.policy.statusOnlyTrackingVisibilityApproved, true, 'shipment gate report must record status-only tracking visibility approval');

assert.equal(runtimeGateReport.sourceEvidence.allegroWarehouseServiceRoleHardening.warehouseCommit, 'ab7ac6e', 'Warehouse service-role hardening commit mismatch');
assert.equal(runtimeGateReport.sourceEvidence.allegroWarehouseServiceRoleHardening.allegroCommit, 'edb3a88', 'Allegro service-token hardening commit mismatch');
assert.equal(runtimeGateReport.sourceEvidence.allegroWarehouseServiceRoleHardening.warehouseEndpointsRequireOnlyAllegroServiceRole, true, 'Warehouse endpoints must require only Allegro service role in source');
assert.equal(runtimeGateReport.sourceEvidence.allegroWarehouseServiceRoleHardening.allegroBroadInternalTokenFallbackRemoved, true, 'Allegro source must remove broad internal token fallbacks');
assert.equal(runtimeGateReport.sourceEvidence.allegroWarehouseServiceRoleHardening.runtimeCutoverBlocked, true, 'runtime cutover must remain blocked until a minimal token is projected');
assert.equal(runtimeGateReport.runtimeEvidence.allegro.tokenAuthEvidence.hasAllegroServiceRole, false, 'current runtime token must not be misreported as Allegro service role');
assert.equal(runtimeGateReport.runtimeEvidence.allegro.tokenAuthEvidence.hasWarehouseAdminRole, true, 'current runtime evidence must preserve the broad Warehouse-admin token finding');
assert.equal(runtimeGateReport.runtimeEvidence.allegro.tokenAuthEvidence.requiredRole, 'internal:allegro-service:service', 'runtime required role mismatch');

const ordersLifecycle = requireFile(ordersRoot, 'src/orders/order-lifecycle.ts');
for (const stage of [
  'ordered_unpaid',
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
]) {
  assertContains(ordersLifecycle, `'${stage}'`, `Orders lifecycle stage missing: ${stage}`);
}
assertContains(ordersLifecycle, /fulfillmentOrderHandoff[\s\S]*warehouseStatus/, 'Orders must derive lifecycle from Warehouse fulfillment status callback');

const ordersVerifier = requireFile(ordersRoot, 'scripts/verify-order-lifecycle-read-model.js');
for (const assertion of ['warehouse_forming', 'warehouse_formed', 'in_delivery', 'not_received']) {
  assertContains(ordersVerifier, assertion, `Orders lifecycle verifier must cover ${assertion}`);
}

const warehouseController = requireFile(warehouseRoot, 'src/fulfillment/fulfillment-orders.controller.ts');
assertContains(
  warehouseController,
  "@Post('order/:orderId/provider-shipment-correlations')",
  'Warehouse must expose provider shipment correlation registration endpoint',
);
assertContains(
  warehouseController,
  "@Post('provider-status/allegro-shipment-snapshots')",
  'Warehouse must expose provider status snapshot endpoint',
);
assertContains(warehouseController, 'statusMutationApplied', 'Warehouse snapshot intake must report status mutation result');
assertContains(warehouseController, 'ProviderShipmentCorrelationDto', 'Warehouse endpoint must use bounded DTO');
assertContains(warehouseController, "@Roles('internal:allegro-service:service')", 'Warehouse shipment endpoints must require the minimal Allegro service role');
assertNotContains(warehouseController, ["@Roles('internal:warehouse-microservice:admin', 'internal:allegro-service:service')"], 'Warehouse shipment endpoints must not keep the broad admin fallback');

const warehouseMigration = requireFile(warehouseRoot, 'src/migrations/1781700000000-CreateFulfillmentProviderShipmentCorrelations.ts');
assertContains(warehouseMigration, '"fulfillment_provider_shipment_correlations"', 'Warehouse correlation table migration missing');
assertContains(warehouseMigration, '"source_reference_hash"', 'Warehouse migration must index source reference hash');

const warehouseService = requireFile(warehouseRoot, 'src/fulfillment/fulfillment-provider-shipment-correlation.service.ts');
assertContains(warehouseService, 'registerCorrelation', 'Warehouse must register sanitized correlation rows');
assertContains(warehouseService, 'resolveAllegroShipmentSnapshot', 'Warehouse must resolve sanitized Allegro shipment snapshots');
assertContains(warehouseService, 'buildAllegroSourceReferenceHash', 'Warehouse must expose the shared source-reference hash builder');
assertNotContains(warehouseService, ['trackingNumber', 'trackingUrl', 'buyerEmail', 'shippingAddress'], 'Warehouse correlation service must not persist raw provider/customer fields');

const warehouseStatusAdapter = requireFile(warehouseRoot, 'src/fulfillment/fulfillment-provider-status-snapshot-adapter.service.ts');
assertContains(warehouseStatusAdapter, 'DELIVERED', 'Warehouse status adapter must understand delivered provider state');
assertContains(warehouseStatusAdapter, 'in_delivery', 'Warehouse status adapter must map in-transit provider state');
assertContains(warehouseStatusAdapter, 'FORBIDDEN_SNAPSHOT_KEYS', 'Warehouse status adapter must reject raw provider/customer fields');

const allegroClient = requireFile(allegroRoot, 'services/allegro-service/src/allegro/shipments/warehouse-shipment-correlation.client.ts');
assertContains(
  allegroClient,
  'ALLEGRO_WAREHOUSE_SHIPMENT_CORRELATION_ENABLED',
  'Allegro correlation producer must be disabled by default behind env gate',
);
assertContains(allegroClient, 'provider-shipment-correlations', 'Allegro producer must call Warehouse correlation endpoint');
assertContains(allegroClient, 'sourceReferenceHash', 'Allegro producer must send sanitized source reference hash');
assertContains(allegroClient, 'WAREHOUSE_SERVICE_TOKEN', 'Allegro producer must accept the Auth-issued Warehouse service token env');
assertContains(allegroClient, 'WAREHOUSE_INTERNAL_SERVICE_TOKEN', 'Allegro producer must accept the internal Warehouse service token env');
assertNotContains(allegroClient, ['trackingNumber', 'trackingUrl', 'buyerEmail', 'shippingAddress', 'ALLEGRO_INTERNAL_SERVICE_TOKEN', 'process.env.INTERNAL_SERVICE_TOKEN'], 'Allegro producer must not send raw provider/customer fields or use broad internal token fallbacks');

const allegroReplay = requireFile(allegroRoot, 'services/allegro-service/src/scripts/replay-shipment-status-handoff.ts');
assertContains(allegroReplay, 'ALLEGRO_SHIPMENT_DEAD_LETTER_DIR', 'Allegro replay must support dead-letter retention env path');
assertContains(allegroReplay, 'ALLEGRO_SHIPMENT_STATUS_WAREHOUSE_CORRELATION', 'Allegro replay apply mode must require exact confirmation');
assertContains(allegroReplay, 'writesAllowed', 'Allegro replay metadata must declare bounded writes');

const allegroDeployment = requireFile(allegroRoot, 'k8s/deployment.yaml');
assertContains(allegroDeployment, 'allegro-shipment-dead-letter-data', 'Allegro deployment must declare dead-letter PVC');
assertContains(allegroDeployment, 'ALLEGRO_SHIPMENT_DEAD_LETTER_DIR', 'Allegro deployment must configure writer-compatible dead-letter env');
assertContains(allegroDeployment, 'ALLEGRO_WAREHOUSE_SHIPMENT_CORRELATION_ENABLED', 'Allegro deployment must declare the approved correlation enablement env');
assertContains(allegroDeployment, 'persistentVolumeClaim', 'Allegro dead-letter storage must be PVC-backed in source');

const allegroConfig = requireFile(allegroRoot, 'k8s/configmap.yaml');
assertContains(allegroConfig, 'ALLEGRO_SHIPMENT_DEAD_LETTER_DIR', 'Allegro configmap must expose dead-letter env');
assertContains(allegroConfig, 'ALLEGRO_WAREHOUSE_SHIPMENT_CORRELATION_ENABLED', 'Allegro configmap must expose approved correlation enablement');

const remainingGates = runtimeGateReport.remainingGates;

const result = {
  schemaVersion: 'orders.shipment_runtime_readiness.v1',
  status: 'runtime_proven_source_hardened_token_projection_blocked',
  checkedAt: new Date().toISOString(),
  repositories: {
    orders: ordersRoot,
    allegro: allegroRoot,
    warehouse: warehouseRoot,
  },
  sourceEvidence: {
    ordersLifecycleStages: 'verified',
    ordersLateStageVerifierCoverage: 'verified',
    warehouseCorrelationEndpoint: 'verified',
    warehouseStatusSnapshotEndpoint: 'verified',
    warehouseCorrelationMigration: 'verified',
    warehouseRawFieldExclusion: 'verified',
    allegroProducerGate: 'verified_enabled_for_bounded_smoke',
    allegroDeadLetterPvcAndEnv: 'verified',
    allegroRawFieldExclusion: 'verified',
  },
  runtimeEvidence: {
    gateReport: runtimeGateReportPath,
    k3s: runtimeGateReport.runtimeEvidence.k3s,
    ordersDeployment: runtimeGateReport.runtimeEvidence.deployments.orders.image,
    warehouseDeployment: runtimeGateReport.runtimeEvidence.deployments.warehouse.image,
    allegroDeployment: runtimeGateReport.runtimeEvidence.deployments.allegro.image,
    warehouseMigrationsApplied: runtimeGateReport.runtimeEvidence.warehouse.appliedMigrations.length,
    allegroCorrelationGate: runtimeGateReport.runtimeEvidence.allegro.correlationEnabledEnv,
    serviceRoleHardening: runtimeGateReport.sourceEvidence.allegroWarehouseServiceRoleHardening,
    sanitizedReplayPosted: runtimeGateReport.runtimeEvidence.allegro.sanitizedReplay.posted,
    warehouseObservationStatus: runtimeGateReport.runtimeEvidence.warehouse.providerStatusReadback.latestNormalizedWarehouseStatus,
    ordersCentralStatus: runtimeGateReport.runtimeEvidence.orders.warehouseCallbackReadback.centralStatus,
  },
  remainingGates,
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
