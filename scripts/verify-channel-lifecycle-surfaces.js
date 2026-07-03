const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const REPOS = {
  flipflop: {
    env: 'FLIPFLOP_REPO_PATH',
    defaults: ['/home/ssf/Documents/Github/flipflop'],
    checks: [
      {
        file: 'shared/clients/order-client.service.ts',
        contains: ['lifecycleStage', 'paymentStatus', 'deliveryStatus', 'fulfillmentStatus'],
      },
      {
        file: 'services/frontend/app/orders/[id]/page.tsx',
        contains: ['display.lifecycleStage', 'display.paymentStatus', 'display.deliveryStatus'],
      },
      {
        file: 'services/frontend/app/admin/orders/page.tsx',
        contains: ['display.lifecycleStage', 'display.paymentStatus', 'display.deliveryStatus', 'display.fulfillmentStatus'],
      },
      {
        file: 'scripts/verify-orders-hub-integration.js',
        contains: ['central Orders client', 'admin-scoped orders API'],
      },
    ],
  },
  bazos: {
    env: 'BAZOS_REPO_PATH',
    defaults: ['/home/ssf/Documents/Github/bazos'],
    checks: [
      {
        file: 'shared/clients/order-client.service.ts',
        contains: ['lifecycleStage', 'paymentStatus', 'deliveryStatus', 'fulfillmentStatus', 'warehouse_collecting'],
      },
      {
        file: 'services/aukro-service/src/aukro/orders/orders.service.ts',
        contains: ['centralOrder', 'lifecycleStage', 'unforwarded', 'stale'],
      },
      {
        file: 'services/aukro-service/src/ui/ui.assets.ts',
        contains: ['centralOrderRead', 'centralOrderState', 'deliveryStatus', 'staleOrUnknown'],
      },
      {
        file: 'reports/validation/2026-07-02-orders-lifecycle-cabinet-bazos-report.md',
        contains: ['Customer and admin Bazos UI surfaces', 'delivery-state counts derived from `centralOrder.deliveryStatus`/lifecycle/status'],
      },
    ],
  },
  heureka: {
    env: 'HEUREKA_REPO_PATH',
    defaults: ['/home/ssf/Documents/Github/heureka'],
    checks: [
      {
        file: 'shared/clients/order-client.service.ts',
        contains: ['getOrderById', 'paymentStatus', 'ORDER_LIFECYCLE_READ_CONTRACT_MISSING', 'stale'],
      },
      {
        file: 'services/heureka-service/src/public/public.controller.ts',
        contains: ['lifecycleStage', 'payment', 'deliveryStats', 'orderLifecycleStats', 'centralStatusCounts'],
      },
      {
        file: 'services/heureka-service/src/heureka/dashboard/dashboard.service.ts',
        contains: ['centralLifecycle', 'lifecycleStageCounts', 'deliveryStats', 'getCentralOrderLifecycle'],
      },
      {
        file: 'services/heureka-service/src/public/public-dashboard-routes.self-test.ts',
        contains: ['dashboard/orders', 'orderLifecycleStats'],
      },
    ],
  },
  allegro: {
    env: 'ALLEGRO_REPO_PATH',
    defaults: ['/tmp/allegro-worktrees/allegro-shipment-correlation-producer', '/home/ssf/Documents/Github/allegro'],
    checks: [
      {
        file: 'services/allegro-service/src/allegro/orders/orders.service.ts',
        contains: ['centralLifecycle', 'lifecycleStage', 'paymentStatus', 'fulfillmentStatus'],
      },
      {
        file: 'services/frontend/src/pages/BuyerOrdersPage.tsx',
        contains: ['lifecycleStage', 'paymentStatus', 'fulfillmentStatus'],
      },
      {
        file: 'services/frontend/src/pages/OrdersPage.tsx',
        contains: ['displayStatus', 'lifecycleStage'],
      },
      {
        file: 'docs/orchestrator/STATUS.md',
        contains: ['/cabinet/orders', 'central Orders lifecycle'],
      },
    ],
  },
  aukro: {
    env: 'AUKRO_REPO_PATH',
    defaults: ['/home/ssf/Documents/Github/aukro'],
    checks: [
      {
        file: 'shared/clients/order-client.service.ts',
        contains: ['lifecycleStage', 'paymentStatus', 'fulfillmentStatus', 'deliveryStatus'],
      },
      {
        file: 'services/aukro-service/src/ui/ui.controller.ts',
        contains: ['centralLifecycle', 'lifecycleStage', 'paymentStatus', 'fulfillmentStatus', 'deliveryStatus', 'ordersReadStatus'],
      },
      {
        file: 'services/aukro-service/src/ui/ui.controller.spec.ts',
        contains: ['missing_order_id', 'unavailable', 'paid_not_delivered'],
      },
      {
        file: '12_validation/VAL-AU2-orders-lifecycle-cabinet-admin-stats.md',
        contains: ['Customer cabinet renders central lifecycle status', 'Admin dashboard exposes order/delivery statistics'],
      },
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

function read(root, relativePath) {
  const file = path.join(root, relativePath);
  assert.equal(fs.existsSync(file), true, `missing ${relativePath} under ${root}`);
  return fs.readFileSync(file, 'utf8');
}

function verifyRepo(name, spec) {
  const root = repoRoot(spec);
  const files = [];
  for (const check of spec.checks) {
    const source = read(root, check.file);
    for (const marker of check.contains) {
      assert.equal(source.includes(marker), true, `${name}:${check.file} missing marker ${marker}`);
    }
    files.push(check.file);
  }
  return { root, files };
}

const channels = {};
for (const [name, spec] of Object.entries(REPOS)) {
  channels[name] = verifyRepo(name, spec);
}

const result = {
  schemaVersion: 'orders.channel_lifecycle_surfaces.v1',
  status: 'source_ready_runtime_smoke_gated',
  checkedAt: new Date().toISOString(),
  channels,
  evidence: {
    customerLifecycleSurfaces: 'verified_source_markers',
    adminLifecycleSurfaces: 'verified_source_markers',
    paymentFulfillmentDeliveryFields: 'verified_source_markers',
    staleOrMissingCentralOrderStates: 'verified_where_applicable',
  },
  remainingGates: [
    'approved live customer/admin browser or API smoke per channel',
    'real buyer bearer plus subject-bound Allegro order row for live buyer cabinet lifecycle smoke',
    'Warehouse/Allegro shipment-status runtime and Orders callback are proven through bounded sanitized smoke; optional real provider live-read and full-tracking reveal remain product-gated',
    'provider-backed Bazos marketplace webhook support remains unknown',
  ],
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
