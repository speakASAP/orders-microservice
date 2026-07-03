const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const CHANNELS = {
  flipflop: {
    env: 'FLIPFLOP_REPO_PATH',
    defaults: ['/home/ssf/Documents/Github/flipflop'],
    status: 'live_create_reservation_and_browser_lifecycle_proven',
    artifactChecks: [
      {
        file: 'reports/validation/orders-readiness-smoke/report-latest.json',
        type: 'json',
        assertions: [
          ['ok', true],
          ['liveSmokeRun', true],
          ['mutatingSmokeApprovedByOwner', true],
          ['result.centralOrders.status', 'accepted'],
          ['result.centralOrders.contractVersion', 'orders.create.v1'],
          ['result.centralOrders.centralOrderIdPresent', true],
          ['result.warehouseReservation.statusPresent', true],
          ['result.warehouseReservation.exactlyOneWarehouseId', true],
          ['result.valuesRedacted', true],
        ],
      },
      {
        file: 'reports/validation/guest-checkout-smoke/report-production-guest-order-smoke.json',
        type: 'json',
        assertions: [
          ['ok', true],
          ['mutatingSmokeApprovedByOwner', true],
          ['databaseEvidence.centralOrdersForwardingStatus', 'accepted'],
          ['valuesRedacted', true],
        ],
      },
      {
        root: 'orders',
        file: 'reports/validation/orders-browser-render-proof/proven-flipflop-dd3765a.json',
        type: 'json',
        assertions: [
          ['schemaVersion', 'orders.browser_render_proof.v1'],
          ['status', 'proven'],
          ['channel', 'flipflop'],
          ['proofMode', 'service_scoped_proxy'],
          ['ordersEvidenceCommit', 'dd3765ab0c08284367ce6c3e21aca8c2e877c789'],
          ['mutationEvidence.expectedLifecycleStage', 'warehouse_collecting'],
          ['centralReadModelBacked', true],
          ['evidencePolicy.noTokenValues', true],
          ['evidencePolicy.noCustomerPii', true],
          ['evidencePolicy.noRawOrderRows', true],
          ['routes.0.surface', 'customer_cabinet'],
          ['routes.0.httpStatus', 200],
          ['routes.0.dataSourceStatus', 200],
          ['routes.0.renderedLifecycleStage', 'warehouse_collecting'],
          ['routes.1.surface', 'admin_cabinet'],
          ['routes.1.httpStatus', 200],
          ['routes.1.dataSourceStatus', 200],
          ['routes.1.renderedLifecycleStage', 'warehouse_collecting'],
        ],
      },
      {
        root: 'orders',
        file: 'reports/validation/orders-browser-render-proof/customer_cabinet-flipflop-dd3765a.json',
        type: 'json',
        assertions: [
          ['schemaVersion', 'orders.browser_render_artifact.v1'],
          ['channel', 'flipflop'],
          ['surface', 'customer_cabinet'],
          ['documentStatus', 200],
          ['renderedLifecycleStage', 'warehouse_collecting'],
          ['labelCount', 2],
          ['redacted', true],
          ['tokenValuesPrinted', false],
          ['rawOrderRowsPrinted', false],
        ],
      },
      {
        root: 'orders',
        file: 'reports/validation/orders-browser-render-proof/admin_cabinet-flipflop-dd3765a.json',
        type: 'json',
        assertions: [
          ['schemaVersion', 'orders.browser_render_artifact.v1'],
          ['channel', 'flipflop'],
          ['surface', 'admin_cabinet'],
          ['documentStatus', 200],
          ['renderedLifecycleStage', 'warehouse_collecting'],
          ['labelCount', 2],
          ['redacted', true],
          ['tokenValuesPrinted', false],
          ['rawOrderRowsPrinted', false],
        ],
      },
    ],
    remainingGates: [
      'direct safe-human FlipFlop browser session remains blocked by profile 401 and auth-loading redirect race; service-scoped proxy browser proof is proven',
    ],
  },
  bazos: {
    env: 'BAZOS_REPO_PATH',
    defaults: ['/home/ssf/Documents/Github/bazos'],
    status: 'synthetic_create_reservation_smoke_proven_provider_source_live_fail_closed',
    artifactChecks: [
      {
        file: 'implementation-goals/GOAL-17-bazos-order-forwarding.md',
        contains: [
          'Owner-approved synthetic runtime smoke passed on 2026-07-01',
          'Warehouse handoff returned `reserved`',
          'approved cleanup returned `cancelled`',
          '[UNKNOWN: live Bazos marketplace webhook support]',
        ],
      },
      {
        file: 'reports/validation/2026-07-02-orders-lifecycle-cabinet-bazos-report.md',
        contains: [
          'Customer and admin Bazos UI surfaces',
          'delivery-state counts derived from `centralOrder.deliveryStatus`/lifecycle/status',
          'No live provider-backed Bazos marketplace webhook/order ingestion was invented',
        ],
      },
      {
        root: 'orders',
        file: 'reports/validation/channel-lifecycle-runtime-evidence/bazos-provider-source-blocked.json',
        type: 'json',
        assertions: [
          ['schemaVersion', 'orders.channel_runtime_blocker.v1'],
          ['channel', 'bazos'],
          ['status', 'provider_backed_order_source_blocked'],
          ['runtimeProbe.replayHttpStatus', 200],
          ['runtimeProbe.replaySuccess', true],
          ['runtimeProbe.replayCount', 0],
          ['runtimeProbe.replayEventsLength', 0],
          ['runtimeProbe.replayFailClosed', true],
          ['runtimeProbe.unauthOrdersHttpStatus', 401],
          ['runtimeProbe.unauthWebhookHttpStatus', 401],
          ['sourceEvidence.syntheticWebhookOnly', true],
          ['sourceEvidence.persistedPaidOrderHistory', false],
          ['sourceEvidence.persistedOrderItemReplaySource', false],
          ['sourceEvidence.orderItemIngestionContract', false],
          ['redacted', true],
          ['rawRowsPrinted', false],
          ['customerPrinted', false],
          ['providerPayloadPrinted', false],
        ],
      },
    ],
    remainingGates: [
      'provider-backed Bazos marketplace webhook/order source is live-fail-closed until Bazos owns a real paid order ingestion and persisted item snapshot contract',
      'approved authenticated customer/admin browser or API smoke after a real provider-backed order exists',
    ],
  },
  heureka: {
    env: 'HEUREKA_REPO_PATH',
    defaults: ['/home/ssf/Documents/Github/heureka'],
    status: 'live_create_replay_reservation_cleanup_proven_browser_blocked_orders_api_404',
    artifactChecks: [
      {
        file: 'docs/orchestrator/TASK-ORDERS-007-heureka-orders-smoke-readiness.md',
        contains: [
          '## 2026-07-01 Final Orders/Warehouse Smoke Verification',
          'preflight missing markers: none',
          'first POST status: `201`',
          'replay POST status: `201`',
          'Orders readback status: `200`',
          'reservation statuses: `reserved`',
          'cleanup cancelled: `true`',
          'missing markers: none',
          'The earlier blockers `[MISSING: successful Orders Warehouse reservation handoff for Heureka]`',
        ],
      },
      {
        file: 'docs/orchestrator/2026-07-02-central-orders-status-read-model-plan.md',
        contains: [
          'Dashboard order list/detail enrich serialized orders with `centralLifecycle`',
          'Public dashboard order table now labels central lifecycle separately',
          '`npm run verify:heureka-orders-runtime-readiness`: passed in source mode with `blockers: []`',
        ],
      },
      {
        root: 'orders',
        file: 'reports/validation/orders-browser-render-proof/blocked-heureka-dashboard-orders-api.json',
        type: 'json',
        assertions: [
          ['schemaVersion', 'orders.browser_render_proof.v1'],
          ['status', 'blocked'],
          ['channel', 'heureka'],
          ['proofMode', 'service_scoped_proxy'],
          ['centralReadModelBacked', false],
          ['routes.0.surface', 'customer_cabinet'],
          ['routes.0.httpStatus', 200],
          ['routes.0.dataSourceStatus', 404],
          ['routes.1.surface', 'admin_dashboard'],
          ['routes.1.httpStatus', 200],
          ['routes.1.dataSourceStatus', 200],
          ['evidencePolicy.noTokenValues', true],
          ['evidencePolicy.noRawOrderRows', true],
        ],
      },
      {
        root: 'orders',
        file: 'reports/validation/orders-browser-render-proof/heureka-dashboard-orders-api-blocked-artifact.json',
        type: 'json',
        assertions: [
          ['schemaVersion', 'orders.browser_blocked_route_probe.v1'],
          ['channel', 'heureka'],
          ['redacted', true],
          ['tokenValuesPrinted', false],
          ['rawOrderRowsPrinted', false],
          ['databaseRead', false],
          ['providerCall', false],
        ],
      },
    ],
    remainingGates: [
      'Heureka rendered order lifecycle proof is blocked because /heureka/dashboard/orders and /api/heureka/dashboard/orders return 404 while dashboard shell and admin stats are live',
      'external Heureka shop registration details remain unknown',
    ],
  },
  allegro: {
    env: 'ALLEGRO_REPO_PATH',
    defaults: ['/tmp/allegro-worktrees/allegro-shipment-correlation-producer', '/home/ssf/Documents/Github/allegro'],
    status: 'buyer_route_live_isolation_proven_real_order_and_central_lifecycle_blocked',
    artifactChecks: [
      {
        file: 'docs/orchestrator/STATUS.md',
        contains: [
          'Public smokes: `/` 200, `/cabinet/orders` 200, `/api/health` 200',
          'Buyer API smokes: unauthenticated `GET /api/allegro/buyer/orders` returned 401',
          'synthetic Auth-subject buyer list returned `success=true`, `items=0`, `total=0`',
          '[MISSING: live authenticated buyer smoke with a real buyer Auth bearer and an approved subject-bound order row.]',
          '[MISSING: central Orders lifecycle display smoke with a real forwarded Allegro order visible to the bound buyer.]',
        ],
      },
      {
        root: 'orders',
        file: 'reports/validation/channel-lifecycle-runtime-evidence/allegro-buyer-real-order-blocked.json',
        type: 'json',
        assertions: [
          ['schemaVersion', 'orders.channel_runtime_blocker.v1'],
          ['channel', 'allegro'],
          ['status', 'buyer_real_order_lifecycle_blocked'],
          ['runtimeProbe.publicCabinetOrdersHttpStatus', 200],
          ['runtimeProbe.externalUnauthBuyerApiHttpStatus', 401],
          ['runtimeProbe.syntheticBuyerHttpStatus', 200],
          ['runtimeProbe.syntheticBuyerSuccess', true],
          ['runtimeProbe.syntheticBuyerTotal', 0],
          ['runtimeProbe.adminOrdersHttpStatus', 200],
          ['runtimeProbe.adminSampleCount', 100],
          ['runtimeProbe.adminSampleHasCentralAvailable', false],
          ['runtimeProbe.adminStatsTotals.orders', 117],
          ['runtimeProbe.adminStatsTotals.centralForwarded', 0],
          ['sourceEvidence.buyerApiSubjectBound', true],
          ['sourceEvidence.buyerSafeDtoExcludesRawBuyerData', true],
          ['sourceEvidence.centralLifecycleProjectionImplemented', true],
          ['redacted', true],
          ['tokenPrinted', false],
          ['rawOrdersPrinted', false],
          ['customerPrinted', false],
          ['providerPayloadPrinted', false],
        ],
      },
    ],
    remainingGates: [
      'real buyer Auth bearer plus approved subject-bound Allegro order row',
      'real forwarded Allegro order lifecycle display smoke; live admin statistics currently show centralForwarded=0',
      'shipment provider runtime correlation is deployed with Warehouse migrations applied, but remains gated by Allegro enablement, Warehouse URL/token config, safe live smoke, and sanitized readback',
    ],
  },
  aukro: {
    env: 'AUKRO_REPO_PATH',
    defaults: ['/home/ssf/Documents/Github/aukro'],
    status: 'live_synthetic_create_reservation_cleanup_proven_cabinet_apis_live_lifecycle_data_blocked',
    artifactChecks: [
      {
        file: '12_validation/VAL-GOAL-7-2B-orders-create-auth-warehouse-readiness.md',
        contains: [
          'controlled synthetic live create smoke created one Aukro local order',
          'reserved Warehouse stock once',
          'replayed the canonical Orders create idempotently without a second reservation',
          'cancelled the synthetic canonical order through Orders lifecycle cleanup',
          'Owner-approved live Aukro-to-Orders create smoke passed',
        ],
      },
      {
        file: '12_validation/VAL-AU2-orders-lifecycle-cabinet-admin-stats.md',
        contains: [
          'Customer cabinet renders central lifecycle status',
          'Admin dashboard exposes order/delivery statistics',
          'pass-with-blocked-smoke',
          '[MISSING: Orders lifecycle read contract authorized for aukro-service role; client method is implemented fail-closed pending Orders endpoint/role approval.]',
        ],
      },
      {
        root: 'orders',
        file: 'reports/validation/orders-browser-render-proof/blocked-aukro-live-data-no-canonical-lifecycle.json',
        type: 'json',
        assertions: [
          ['schemaVersion', 'orders.browser_render_proof.v1'],
          ['status', 'blocked'],
          ['channel', 'aukro'],
          ['proofMode', 'service_scoped_proxy'],
          ['ordersEvidenceCommit', '4b08bb5b870bfec87bea5724ed9b515b5690857a'],
          ['centralReadModelBacked', false],
          ['routes.0.surface', 'customer_cabinet'],
          ['routes.0.httpStatus', 200],
          ['routes.0.dataSourceStatus', 200],
          ['routes.1.surface', 'admin_dashboard'],
          ['routes.1.httpStatus', 200],
          ['routes.1.dataSourceStatus', 200],
          ['evidencePolicy.noTokenValues', true],
          ['evidencePolicy.noRawOrderRows', true],
        ],
      },
      {
        root: 'orders',
        file: 'reports/validation/orders-browser-render-proof/aukro-dashboard-live-data-blocked-artifact.json',
        type: 'json',
        assertions: [
          ['schemaVersion', 'orders.browser_blocked_live_data_probe.v1'],
          ['channel', 'aukro'],
          ['runtime.serviceSurfaceOnly', true],
          ['runtime.ordersApiHttpStatus', 200],
          ['runtime.dashboardHttpStatus', 200],
          ['runtime.adminHttpStatus', 200],
          ['dashboardEvidence.ordersWithCentralStatus', 1],
          ['dashboardEvidence.hasCentralLifecycleStage', false],
          ['centralReadModelEvidence.canonicalLifecycleStagePresent', false],
          ['redacted', true],
          ['tokenValuesPrinted', false],
          ['rawOrderRowsPrinted', false],
          ['rawCustomerPrinted', false],
          ['providerCall', false],
        ],
      },
    ],
    remainingGates: [
      'Aukro customer/admin APIs are live, but rendered central lifecycle proof is blocked until an approved live Aukro row links to a current non-stale canonical Orders lifecycle stage',
    ],
  },
};

function firstExisting(paths) {
  return paths.find((candidate) => fs.existsSync(candidate));
}

function repoRoot(spec) {
  const explicit = process.env[spec.env];
  const selected = explicit || firstExisting(spec.defaults);
  assert.ok(selected, `${spec.env} is required; checked ${spec.defaults.join(', ')}`);
  return path.resolve(selected);
}

function nestedValue(source, dottedPath) {
  return dottedPath.split('.').reduce((value, segment) => (value == null ? value : value[segment]), source);
}

function verifyJson(file, check) {
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const [dottedPath, expected] of check.assertions) {
    assert.deepEqual(nestedValue(parsed, dottedPath), expected, `${file} expected ${dottedPath}=${expected}`);
  }
}

function verifyText(file, check) {
  const source = fs.readFileSync(file, 'utf8');
  for (const marker of check.contains) {
    assert.equal(source.includes(marker), true, `${file} missing marker ${marker}`);
  }
}

function verifyChannel(name, spec) {
  const root = repoRoot(spec);
  const artifacts = [];
  for (const check of spec.artifactChecks) {
    const checkRoot = check.root === 'orders' ? process.cwd() : root;
    const file = path.join(checkRoot, check.file);
    assert.equal(fs.existsSync(file), true, `${name} missing artifact ${check.file}`);
    if (check.type === 'json') {
      verifyJson(file, check);
    } else {
      verifyText(file, check);
    }
    artifacts.push(check.file);
  }
  return {
    root,
    status: spec.status,
    artifacts,
    remainingGates: spec.remainingGates,
  };
}

const channels = {};
for (const [name, spec] of Object.entries(CHANNELS)) {
  channels[name] = verifyChannel(name, spec);
}

const result = {
  schemaVersion: 'orders.channel_lifecycle_runtime_evidence.v1',
  status: 'partial_runtime_evidence_real_buyer_and_provider_smokes_gated',
  checkedAt: new Date().toISOString(),
  channels,
  evidencePolicy: {
    noSecretRead: true,
    noRuntimeMutation: true,
    noProviderCall: true,
    noDatabaseRead: true,
    sourceAndValidationArtifactOnly: true,
  },
  remainingIntegrationGates: [
    'approved authenticated customer/admin browser or API smoke for remaining channels after route/data blockers are resolved',
    'real subject-bound Allegro order row and buyer bearer before Allegro cabinet lifecycle can be called live-complete; current live admin statistics show centralForwarded=0',
    'Heureka dashboard orders API route must be fixed or exposed before rendered lifecycle proof can pass',
    'Aukro rendered central lifecycle cabinet hydration proof remains blocked by live data lacking a non-stale canonical Orders lifecycle stage',
    'Warehouse/Allegro shipment-status runtime is deployed with migrations applied; remaining gates are Allegro enablement, Warehouse URL/token config, safe live smoke, sanitized readback, and approved fulfillment/Orders callback mutation',
    'provider-backed Bazos marketplace webhook/order source is live-fail-closed pending a real paid order ingestion and persisted item snapshot contract',
  ],
};


const serializedResult = JSON.stringify(result);
assert.equal(
  serializedResult.includes("deploy/restart gated by Orders read-role"),
  false,
  "stale Orders read-role deploy/restart blocker must not be reported after runtime role/list proof",
);
assert.equal(
  serializedResult.includes("Orders read-role deployment/restart"),
  false,
  "stale Orders read-role deployment/restart integration gate must not be reported after runtime role/list proof",
);

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
