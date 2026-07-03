const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const CHANNELS = {
  flipflop: {
    env: 'FLIPFLOP_REPO_PATH',
    defaults: ['/home/ssf/Documents/Github/flipflop'],
    status: 'live_create_reservation_smoke_proven',
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
    ],
    remainingGates: [
      'approved authenticated customer/admin browser smoke proving refreshed lifecycle after later Warehouse/provider stage changes',
    ],
  },
  bazos: {
    env: 'BAZOS_REPO_PATH',
    defaults: ['/home/ssf/Documents/Github/bazos'],
    status: 'synthetic_create_reservation_smoke_proven_provider_webhook_unknown',
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
    ],
    remainingGates: [
      'provider-backed Bazos marketplace webhook/order source remains unknown',
      'approved authenticated customer/admin browser or API smoke after a real provider-backed order exists',
    ],
  },
  heureka: {
    env: 'HEUREKA_REPO_PATH',
    defaults: ['/home/ssf/Documents/Github/heureka'],
    status: 'live_create_replay_reservation_cleanup_smoke_proven',
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
    ],
    remainingGates: [
      'external Heureka shop registration details remain unknown',
      'approved authenticated dashboard/browser smoke for real customer/admin order views',
    ],
  },
  allegro: {
    env: 'ALLEGRO_REPO_PATH',
    defaults: ['/tmp/allegro-worktrees/allegro-shipment-correlation-producer', '/home/ssf/Documents/Github/allegro'],
    status: 'buyer_route_live_isolation_proven_real_order_smoke_missing',
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
    ],
    remainingGates: [
      'real buyer Auth bearer plus approved subject-bound Allegro order row',
      'real forwarded Allegro order lifecycle display smoke',
      'shipment provider runtime correlation remains gated by migration/deploy/enablement approvals',
    ],
  },
  aukro: {
    env: 'AUKRO_REPO_PATH',
    defaults: ['/home/ssf/Documents/Github/aukro'],
    status: 'live_synthetic_create_reservation_cleanup_proven_source_cabinet_stats_proven',
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
    ],
    remainingGates: [
      'authorized customer/admin runtime smoke for the central lifecycle cabinet read model remains deploy/restart gated by Orders read-role source alignment',
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
    const file = path.join(root, check.file);
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
    'approved authenticated customer/admin browser or API smoke per channel for real lifecycle refresh after status changes',
    'real subject-bound Allegro order row and buyer bearer before Allegro cabinet lifecycle can be called live-complete',
    'Orders read-role deployment/restart plus Aukro central lifecycle cabinet hydration runtime smoke',
    'Warehouse/Allegro shipment-status deploy, migration, env enablement, and safe live smoke approvals',
    'provider-backed Bazos marketplace webhook/order source remains unknown',
  ],
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
