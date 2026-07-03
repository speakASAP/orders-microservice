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
assert.equal(runtimeGateReport.status, 'runtime_deployed_correlation_disabled', 'shipment runtime gate must stay disabled until approved');
assert.equal(runtimeGateReport.runtimeEvidence.deployments.warehouse.image, 'localhost:5000/warehouse-microservice:174f92e', 'Warehouse runtime image evidence mismatch');
assert.equal(runtimeGateReport.runtimeEvidence.deployments.allegro.image, 'localhost:5000/allegro-service:ae9d381', 'Allegro runtime image evidence mismatch');
assert.equal(runtimeGateReport.runtimeEvidence.warehouse.appliedMigrations.includes('CreateFulfillmentProviderShipmentCorrelations1781700000000'), true, 'Warehouse correlation migration must be applied at runtime');
assert.equal(runtimeGateReport.runtimeEvidence.warehouse.appliedMigrations.includes('CreateFulfillmentProviderStatusObservations1781600000000'), true, 'Warehouse provider status observation migration must be applied at runtime');
assert.equal(runtimeGateReport.runtimeEvidence.allegro.deadLetterEnv, 'set', 'Allegro runtime must have dead-letter env set');
assert.equal(runtimeGateReport.runtimeEvidence.allegro.correlationEnabledEnv, 'missing', 'Allegro correlation gate must remain disabled until approved');
assert.equal(runtimeGateReport.runtimeEvidence.allegro.disabledGateSmoke.posted, 0, 'disabled-gate smoke must not post Warehouse correlations');
assert.equal(runtimeGateReport.runtimeEvidence.allegro.disabledGateSmoke.disabled, 1, 'disabled-gate smoke must prove disabled producer path');
assert.equal(runtimeGateReport.runtimeEvidence.allegro.disabledGateSmoke.reason, 'ALLEGRO_WAREHOUSE_SHIPMENT_CORRELATION_ENABLED_NOT_TRUE', 'disabled-gate smoke reason mismatch');
assert.equal(runtimeGateReport.policy.rawTrackingDisplayed, false, 'shipment gate report must not expose raw tracking values');
assert.equal(runtimeGateReport.policy.rawProviderPayloadDisplayed, false, 'shipment gate report must not expose raw provider payloads');
assert.equal(runtimeGateReport.policy.customerPiiDisplayed, false, 'shipment gate report must not expose customer PII');
assert.equal(runtimeGateReport.policy.secretsDisplayed, false, 'shipment gate report must not expose secrets');
assert.equal(runtimeGateReport.policy.productionFulfillmentMutation, false, 'shipment gate report must not mutate production fulfillment status');

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
assertContains(warehouseController, 'ProviderShipmentCorrelationDto', 'Warehouse endpoint must use bounded DTO');

const warehouseMigration = requireFile(warehouseRoot, 'src/migrations/1781700000000-CreateFulfillmentProviderShipmentCorrelations.ts');
assertContains(warehouseMigration, '"fulfillment_provider_shipment_correlations"', 'Warehouse correlation table migration missing');
assertContains(warehouseMigration, '"source_reference_hash"', 'Warehouse migration must index source reference hash');

const warehouseService = requireFile(warehouseRoot, 'src/fulfillment/fulfillment-provider-shipment-correlation.service.ts');
assertContains(warehouseService, 'registerCorrelation', 'Warehouse must register sanitized correlation rows');
assertContains(warehouseService, 'resolveAllegroShipmentSnapshot', 'Warehouse must resolve sanitized Allegro shipment snapshots');
assertContains(warehouseService, 'buildAllegroSourceReferenceHash', 'Warehouse must expose the shared source-reference hash builder');
assertNotContains(warehouseService, ['trackingNumber', 'trackingUrl', 'buyerEmail', 'shippingAddress'], 'Warehouse correlation service must not persist raw provider/customer fields');

const allegroClient = requireFile(allegroRoot, 'services/allegro-service/src/allegro/shipments/warehouse-shipment-correlation.client.ts');
assertContains(
  allegroClient,
  'ALLEGRO_WAREHOUSE_SHIPMENT_CORRELATION_ENABLED',
  'Allegro correlation producer must be disabled by default behind env gate',
);
assertContains(allegroClient, 'provider-shipment-correlations', 'Allegro producer must call Warehouse correlation endpoint');
assertContains(allegroClient, 'sourceReferenceHash', 'Allegro producer must send sanitized source reference hash');
assertNotContains(allegroClient, ['trackingNumber', 'trackingUrl', 'buyerEmail', 'shippingAddress'], 'Allegro producer must not send raw provider/customer fields');

const allegroReplay = requireFile(allegroRoot, 'services/allegro-service/src/scripts/replay-shipment-status-handoff.ts');
assertContains(allegroReplay, 'ALLEGRO_SHIPMENT_DEAD_LETTER_DIR', 'Allegro replay must support dead-letter retention env path');
assertContains(allegroReplay, 'ALLEGRO_SHIPMENT_STATUS_WAREHOUSE_CORRELATION', 'Allegro replay apply mode must require exact confirmation');
assertContains(allegroReplay, 'writesAllowed', 'Allegro replay metadata must declare bounded writes');

const allegroDeployment = requireFile(allegroRoot, 'k8s/deployment.yaml');
assertContains(allegroDeployment, 'allegro-shipment-dead-letter-data', 'Allegro deployment must declare dead-letter PVC');
assertContains(allegroDeployment, 'ALLEGRO_SHIPMENT_DEAD_LETTER_DIR', 'Allegro deployment must configure writer-compatible dead-letter env');
assertContains(allegroDeployment, 'persistentVolumeClaim', 'Allegro dead-letter storage must be PVC-backed in source');

const allegroConfig = requireFile(allegroRoot, 'k8s/configmap.yaml');
assertContains(allegroConfig, 'ALLEGRO_SHIPMENT_DEAD_LETTER_DIR', 'Allegro configmap must expose dead-letter env');

const remainingGates = runtimeGateReport.remainingGates;

const result = {
  schemaVersion: 'orders.shipment_runtime_readiness.v1',
  status: 'source_ready_runtime_gated',
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
    warehouseCorrelationMigration: 'verified',
    warehouseRawFieldExclusion: 'verified',
    allegroDisabledProducer: 'verified',
    allegroDeadLetterPvcAndEnv: 'verified',
    allegroRawFieldExclusion: 'verified',
  },
  runtimeEvidence: {
    gateReport: runtimeGateReportPath,
    k3s: runtimeGateReport.runtimeEvidence.k3s,
    warehouseDeployment: runtimeGateReport.runtimeEvidence.deployments.warehouse.image,
    allegroDeployment: runtimeGateReport.runtimeEvidence.deployments.allegro.image,
    warehouseMigrationsApplied: runtimeGateReport.runtimeEvidence.warehouse.appliedMigrations.length,
    allegroCorrelationGate: runtimeGateReport.runtimeEvidence.allegro.correlationEnabledEnv,
    disabledGateSmokeReason: runtimeGateReport.runtimeEvidence.allegro.disabledGateSmoke.reason,
  },
  remainingGates,
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
