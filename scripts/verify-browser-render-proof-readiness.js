#!/usr/bin/env node
const assert = require('assert/strict');
const https = require('https');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const handoffPath = path.join(root, 'docs/orchestrator/2026-07-03-browser-render-proof-handoff.md');
const statusPath = path.join(root, 'docs/orchestrator/STATUS.md');
const implementationStatePath = path.join(root, 'docs/IMPLEMENTATION_STATE.md');
const packagePath = path.join(root, 'package.json');
const smokeOrderPath = path.join(root, 'docs/orchestrator/2026-07-03-channel-browser-smoke-order.md');
const flipflopReadinessPath = path.join(root, 'docs/orchestrator/2026-07-03-flipflop-browser-proof-readiness-evidence.md');

const runRouteSmoke = process.env.RUN_BROWSER_RENDER_PROOF_ROUTE_SMOKE === '1';
const routeSmokeApproved = process.env.BROWSER_RENDER_PROOF_ROUTE_SMOKE_APPROVED === '1';
const expectedConfirm = 'ROUTE_STATUS_ONLY_NO_SESSION_NO_MUTATION';
const routeSmokeConfirm = String(process.env.BROWSER_RENDER_PROOF_ROUTE_SMOKE_CONFIRM || '').trim();

const FLIPFLOP_ROUTES = [
  'https://flipflop.alfares.cz/orders',
  'https://flipflop.alfares.cz/admin/orders',
];

function read(file) {
  assert.equal(fs.existsSync(file), true, `${path.relative(root, file)} is missing`);
  return fs.readFileSync(file, 'utf8');
}

function assertIncludes(source, marker, file) {
  assert.equal(source.includes(marker), true, `${file} missing marker: ${marker}`);
}

function requestStatus(url) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: 'GET',
        timeout: 10000,
        rejectUnauthorized: false,
        headers: {
          'user-agent': 'orders-browser-render-proof-readiness/1.0',
          accept: 'text/html,application/xhtml+xml,application/json;q=0.8,*/*;q=0.5',
        },
      },
      (res) => {
        res.resume();
        res.on('end', () => resolve(res.statusCode || 0));
      },
    );
    req.on('timeout', () => req.destroy(new Error(`timeout ${url}`)));
    req.on('error', reject);
    req.end();
  });
}

async function optionalRouteSmoke() {
  const blockers = [];
  if (!runRouteSmoke) blockers.push('[MISSING: RUN_BROWSER_RENDER_PROOF_ROUTE_SMOKE=1]');
  if (!routeSmokeApproved) blockers.push('[MISSING: BROWSER_RENDER_PROOF_ROUTE_SMOKE_APPROVED=1]');
  if (routeSmokeConfirm !== expectedConfirm) {
    blockers.push(`[MISSING: BROWSER_RENDER_PROOF_ROUTE_SMOKE_CONFIRM=${expectedConfirm}]`);
  }
  if (blockers.length) {
    return {
      status: 'route_smoke_not_run',
      mutation: false,
      browserSessionUsed: false,
      blockers,
    };
  }

  const routes = {};
  for (const url of FLIPFLOP_ROUTES) {
    routes[url] = await requestStatus(url);
  }
  return {
    status: 'route_status_checked',
    mutation: false,
    browserSessionUsed: false,
    routes,
    ok: Object.values(routes).every((status) => status >= 200 && status < 400),
    blockers: [],
  };
}

async function main() {
  const handoff = read(handoffPath);
  const status = read(statusPath);
  const implementationState = read(implementationStatePath);
  const pkg = JSON.parse(read(packagePath));
  const smokeOrder = read(smokeOrderPath);
  const flipflopReadiness = read(flipflopReadinessPath);

  const handoffMarkers = [
    'Current Orders evidence baseline: use repository `HEAD`; this handoff is enforced by `verify:browser-render-proof-readiness` in `npm test`.',
    'Recommended first browser proof lane: FlipFlop only.',
    'No edits in `flipflop`, `heureka`, `bazos`, `aukro`, `allegro`, Auth, Cliplot, Marketing, Payments, Warehouse, or shared contracts during validation-only lane.',
    'Needs approved safe human buyer/admin session or explicit approval for service-scoped browser proxy proof.',
    'Provider-backed marketplace webhook/order source remains `[UNKNOWN]`',
    'Needs real subject-bound Allegro buyer order row and buyer bearer',
    'Evidence classification: `proven`, `incomplete`, or `blocked`.',
  ];
  handoffMarkers.forEach((marker) => assertIncludes(handoff, marker, 'browser-render-proof-handoff'));

  const statusMarkers = [
    'Browser Render Proof Handoff Recorded',
    '[MISSING: merge-order review approval for FlipFlop browser validation lane.]',
    '[MISSING: approved safe human buyer/admin browser session or explicitly approved service-scoped browser proxy proof.]',
    '[MISSING: rendered UI evidence after lifecycle mutation.]',
  ];
  statusMarkers.forEach((marker) => assertIncludes(status, marker, 'STATUS'));

  const smokeOrderMarkers = [
    'Run remaining channel browser/API proof work in this order:',
    '1. Keep FlipFlop service-scoped browser proof as the current proven browser lifecycle evidence; pursue direct safe-human proof only if an approved safe buyer/admin session is provided.',
    '2. Heureka service-scoped API/DOM lifecycle proof is current-proven; pursue natural human-session proof only if product requires proof beyond approved service-scoped evidence.',
    '3. Aukro protected API plus service-scoped DOM lifecycle proof is current-proven; pursue natural real customer-bound proof only if product requires proof beyond approved service-scoped/bounded evidence.',
    '4. Bazos remains the next product/provider decision lane: provider-backed paid order ingestion and persisted item snapshot source, or an explicit product decision accepting bounded synthetic/internal scope.',
    '5. Allegro bounded buyer lifecycle proof is current-proven; pursue natural real-buyer proof only if product requires proof beyond approved bounded evidence.',
    '6. Provider shipment-status runtime proof only after Allegro enablement, Warehouse URL/token config, safe order selection, sanitized readback, and fulfillment/Orders mutation approval.',
    'No new source-edit worker should start for the five channel UI repos',
    'FlipFlop direct proof lane, only if a safe session is supplied:',
    'Status: required service-scoped/bounded proof complete for current W7 aggregation; remaining natural/provider lanes are product/approval-gated.',
  ];
  smokeOrderMarkers.forEach((marker) => assertIncludes(smokeOrder, marker, 'channel browser smoke order'));


  const flipflopReadinessMarkers = [
    'Status: `ready_for_approved_browser_proof`',
    'This packet does not prove rendered lifecycle propagation.',
    'Mode: non-mutating route/source readiness only',
    'FlipFlop source checkout:',
    'Commit: `3110c6a feat: improve orders lifecycle UI reliability`',
    '`https://flipflop.alfares.cz/orders` returned `200`',
    '`https://flipflop.alfares.cz/admin/orders` returned `200`',
    'Customer cabinet route: `services/frontend/app/orders/page.tsx`',
    'Admin cabinet route: `services/frontend/app/admin/orders/page.tsx`',
    'Refresh mechanism for the first proof lane: manual refresh plus visible polling every 30 seconds.',
    '[MISSING: approved safe buyer/admin session source or explicit service-scoped browser proxy proof for FlipFlop validation-only lane.]',
    'This packet must not be treated as browser-render proof.',
  ];
  flipflopReadinessMarkers.forEach((marker) => assertIncludes(flipflopReadiness, marker, 'FlipFlop browser proof readiness evidence'));

  assertIncludes(
    implementationState,
    'Browser-render lifecycle proof merge-order handoff is recorded',
    'IMPLEMENTATION_STATE',
  );
  assert.equal(
    pkg.scripts && pkg.scripts['smoke:lifecycle-mutation'],
    'node scripts/smoke-lifecycle-mutation-propagation.js',
    'package.json must expose the lifecycle mutation smoke source for browser proof',
  );

  const routeSmoke = await optionalRouteSmoke();
  if (routeSmoke.status === 'route_status_checked') {
    assert.equal(routeSmoke.ok, true, 'FlipFlop browser proof routes must return 2xx/3xx when route smoke is enabled');
  }

  const result = {
    schemaVersion: 'orders.browser_render_proof_readiness.v1',
    status: 'browser_render_proof_merge_order_gated',
    checkedAt: new Date().toISOString(),
    defaultMode: {
      mutation: false,
      browserSessionUsed: false,
      providerCall: false,
      databaseRead: false,
      tokenValuesReadOrPrinted: false,
    },
    evidence: {
      handoffMarkersVerified: handoffMarkers.length,
      statusMarkersVerified: statusMarkers.length,
      lifecycleMutationSmokeScriptPresent: true,
      recommendedFirstLane: 'w8_bazos_provider_product_decision',
      smokeOrderMarkersVerified: smokeOrderMarkers.length,
      flipflopReadinessMarkersVerified: flipflopReadinessMarkers.length,
    },
    routeSmoke,
    remainingGates: [
      'direct safe-human FlipFlop proof if required beyond proven service-scoped evidence',
      'optional direct human-session Heureka proof if product requires beyond service-scoped evidence',
      'optional natural real customer-bound Aukro proof if product requires beyond service-scoped/bounded evidence',
      'Bazos provider-backed paid order source or explicit product acceptance of bounded synthetic/internal scope',
      'optional natural real-buyer Allegro proof if product requires beyond bounded evidence',
      'separate review before touching non-Orders repositories',
    ],
  };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
});
