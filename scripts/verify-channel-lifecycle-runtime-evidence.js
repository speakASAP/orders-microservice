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
    status: 'synthetic_create_reservation_smoke_proven_paid_replay_source_deployed_live_evidence_blocked',
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
          ['status', 'paid_replay_source_deployed_live_evidence_blocked'],
          ['runtimeProbe.replayHttpStatus', 200],
          ['runtimeProbe.replaySuccess', true],
          ['runtimeProbe.replayCount', 0],
          ['runtimeProbe.replayEventsLength', 0],
          ['runtimeProbe.replayFailClosed', false],
          ['runtimeProbe.healthHttpStatus', 200],
          ['runtimeProbe.replaySkippedRecords', 0],
          ['runtimeProbe.replayBlockerCount', 0],
          ['runtimeProbe.marketingDryRunStatus', 'dry_run_passed'],
          ['runtimeProbe.marketingInputRecords', 0],
          ['runtimeProbe.marketingAcceptedCreatedEvents', 0],
          ['runtimeProbe.marketingCandidateCount', 0],
          ['runtimeProbe.unauthOrdersHttpStatus', 401],
          ['runtimeProbe.unauthWebhookHttpStatus', 401],
          ['sourceEvidence.syntheticWebhookOnly', false],
          ['sourceEvidence.persistedPaidOrderHistory', true],
          ['sourceEvidence.persistedOrderItemReplaySource', true],
          ['sourceEvidence.orderItemIngestionContract', true],
          ['liveAggregateProbe.schemaVersion', 'bazos.paid_replay_aggregate.v1'],
          ['liveAggregateProbe.databaseRead', 'aggregate_counts_and_snapshot_shape_only'],
          ['liveAggregateProbe.totalOrders', 0],
          ['liveAggregateProbe.forwardedOrders', 0],
          ['liveAggregateProbe.paidEligibleStatusRows', 0],
          ['liveAggregateProbe.rowsWithPaidAt', 0],
          ['liveAggregateProbe.rowsWithItemSnapshots', 0],
          ['liveAggregateProbe.paidEligibleMultiProductRows', 0],
          ['liveAggregateProbe.printedRawIds', false],
          ['liveAggregateProbe.printedCustomerPii', false],
          ['liveAggregateProbe.printedProviderPayload', false],
          ['liveAggregateProbe.databaseDump', false],
          ['redacted', true],
          ['rawRowsPrinted', false],
          ['customerPrinted', false],
          ['providerPayloadPrinted', false],
        ],
      },
    ],
    remainingGates: [
      'Bazos paid replay source is deployed and returns HTTP 200, but current aggregate has totalOrders=0; live proof remains blocked until a real eligible paid multi-product Bazos order or approved bounded fixture exists',
      'approved authenticated customer/admin browser or API smoke after a real eligible Bazos order exists',
    ],
  },
  heureka: {
    env: 'HEUREKA_REPO_PATH',
    defaults: ['/home/ssf/Documents/Github/heureka'],
    status: 'live_create_replay_reservation_cleanup_proven_orders_list_non_stale_lifecycle_proven',
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
          ['status', 'api_lifecycle_data_proven_optional_dom_capture_blocked'],
          ['channel', 'heureka'],
          ['proofMode', 'service_scoped_proxy'],
          ['centralReadModelBacked', true],
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
        file: 'reports/validation/orders-browser-render-proof/heureka-dashboard-orders-api-blocked-artifact.json',
        type: 'json',
        assertions: [
          ['schemaVersion', 'orders.browser_route_probe.v1'],
          ['channel', 'heureka'],
          ['redacted', true],
          ['tokenValuesPrinted', false],
          ['rawOrderRowsPrinted', false],
          ['databaseRead', false],
          ['providerCall', false],
        ],
      },
      {
        root: 'orders',
        file: 'reports/validation/orders-browser-render-proof/heureka-rendered-proof-live-proven.json',
        type: 'json',
        assertions: [
          ['schemaVersion', 'orders.heureka_rendered_lifecycle_api_proof.v1'],
          ['channel', 'heureka'],
          ['status', 'orders_list_non_stale_central_lifecycle_proven_after_synthetic_create_cleanup'],
          ['deployedHeurekaCommit', 'a0dbb24'],
          ['httpStatus', 200],
          ['syntheticSmoke.firstPostStatus', 201],
          ['syntheticSmoke.replayPostStatus', 201],
          ['syntheticSmoke.ordersReadbackStatus', 200],
          ['syntheticSmoke.cleanupStatus', 200],
          ['syntheticSmoke.cleanupCancelled', true],
          ['dashboardOrdersList.centralStatusCounts.available', 4],
          ['dashboardOrdersList.nonStaleSample.0.centralStale', false],
          ['dashboardOrdersList.nonStaleSample.0.centralStatus', 'cancelled'],
          ['policy.tokenValuesPrinted', false],
          ['policy.rawOrderRowsPrinted', false],
          ['policy.customerPiiPrinted', false],
          ['policy.providerCall', false],
          ['policy.syntheticOrderLeftOpen', false],
        ],
      },
    ],
    remainingGates: [
      'Heureka dashboard orders-list central lifecycle API proof is proven; optional browser DOM capture remains if visible-label proof is required',
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
          ['runtimeProbe.adminStatsTotals.orders', 118],
          ['runtimeProbe.adminStatsTotals.centralForwarded', 0],
          ['liveAggregateCandidateProbe.schemaVersion', 'allegro.buyer_real_candidate_aggregate.v1'],
          ['liveAggregateCandidateProbe.databaseRead', 'aggregate_counts_only'],
          ['liveAggregateCandidateProbe.totalOrders', 118],
          ['liveAggregateCandidateProbe.buyerBoundOrders', 0],
          ['liveAggregateCandidateProbe.forwardingAttempts', 0],
          ['liveAggregateCandidateProbe.forwardedAttempts', 0],
          ['liveAggregateCandidateProbe.buyerBoundForwardedOrders', 0],
          ['liveAggregateCandidateProbe.centralOrderRefs', 0],
          ['liveAggregateCandidateProbe.distinctBuyerSubjects', 0],
          ['liveAggregateCandidateProbe.printedRawIds', false],
          ['liveAggregateCandidateProbe.printedPii', false],
          ['currentRouteProbe.schemaVersion', 'allegro.buyer_route_probe.v1'],
          ['currentRouteProbe.publicRootHttpStatus', 200],
          ['currentRouteProbe.publicCabinetOrdersHttpStatus', 200],
          ['currentRouteProbe.publicApiHealthHttpStatus', 200],
          ['currentRouteProbe.externalUnauthBuyerApiHttpStatus', 401],
          ['currentRouteProbe.podJwtPresent', true],
          ['currentRouteProbe.podJwtPrinted', false],
          ['currentRouteProbe.serviceLocalBuyerHttpStatus', 200],
          ['currentRouteProbe.serviceLocalBuyerSuccess', true],
          ['currentRouteProbe.serviceLocalBuyerTotal', 0],
          ['currentRouteProbe.serviceLocalBuyerItems', 0],
          ['currentRouteProbe.serviceLocalBuyerHasCentralAvailable', false],
          ['currentRouteProbe.serviceLocalAdminOrdersHttpStatus', 200],
          ['currentRouteProbe.serviceLocalAdminSampleCount', 0],
          ['currentRouteProbe.serviceLocalAdminStatsOrders', 0],
          ['currentRouteProbe.serviceLocalAdminCentralForwarded', 0],
          ['currentRouteProbe.databaseUrlPresentInPod', false],
          ['currentRouteProbe.adHocPrismaClientInitialized', false],
          ['currentRouteProbe.rawRowsPrinted', false],
          ['currentRouteProbe.customerPiiPrinted', false],
          ['currentRouteProbe.providerPayloadPrinted', false],
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
      'real forwarded Allegro order already subject-bound through buyerAuthSubject and visible to a real Auth bearer; current pod-JWT buyer route probe returns total=0',
      'real forwarded Allegro order lifecycle display smoke; live admin statistics currently show centralForwarded=0',
      'shipment provider runtime correlation is deployed with Warehouse migrations applied, but remains gated by Allegro enablement, Warehouse URL/token config, safe live smoke, and sanitized readback',
    ],
  },
  aukro: {
    env: 'AUKRO_REPO_PATH',
    defaults: ['/home/ssf/Documents/Github/aukro'],
    status: 'live_synthetic_create_reservation_cleanup_proven_cabinet_protected_data_auth_blocked',
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
      {
        root: 'orders',
        file: 'reports/validation/orders-browser-render-proof/aukro-dashboard-auth-current-blocked.json',
        type: 'json',
        assertions: [
          ['schemaVersion', 'orders.browser_render_proof_auth_blocker.v1'],
          ['channel', 'aukro'],
          ['status', 'protected_dashboard_data_auth_blocked'],
          ['runtime.publicDashboardShellHttpStatus', 200],
          ['runtime.healthHttpStatus', 200],
          ['runtime.dashboardDataHttpStatusWithPodJwt', 403],
          ['runtime.adminServicesHttpStatusWithPodJwt', 403],
          ['runtime.tokenPresent', true],
          ['runtime.tokenPrinted', false],
          ['runtime.humanBearerAvailable', false],
          ['runtime.adminBearerAvailable', false],
          ['policy.noRuntimeMutation', true],
          ['policy.noDatabaseRead', true],
          ['policy.noProviderCall', true],
          ['policy.tokenValuesPrinted', false],
          ['policy.rawOrderRowsPrinted', false],
          ['policy.customerPiiPrinted', false],
          ['policy.rawDomCaptured', false],
        ],
      },
    ],
    remainingGates: [
      'Aukro public dashboard shell is live, but protected customer/admin data proof is blocked until an approved human/admin bearer or bounded fixture is available',
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
    'real forwarded Allegro order visible to a real Auth bearer before Allegro cabinet lifecycle can be called live-complete; current live admin statistics show centralForwarded=0',
    'Optional Heureka browser DOM render capture remains if API-backed dashboard lifecycle proof is not sufficient',
    'Aukro rendered customer/admin lifecycle proof is blocked by protected dashboard/admin 403 with the available pod JWT and no approved human/admin bearer',
    'Warehouse/Allegro shipment-status runtime is deployed with migrations applied; remaining gates are Allegro enablement, Warehouse URL/token config, safe live smoke, sanitized readback, and approved fulfillment/Orders callback mutation',
    'Bazos paid replay source is deployed, but current aggregate has totalOrders=0; live eligible paid multi-product evidence and approved customer/admin lifecycle proof remain missing',
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
