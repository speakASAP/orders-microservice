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

  const handoffMarkers = [
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
      recommendedFirstLane: 'flipflop',
    },
    routeSmoke,
    remainingGates: [
      'merge-order review approval for FlipFlop browser validation lane',
      'approved safe human buyer/admin session or explicit service-scoped browser proxy proof approval',
      'rendered UI evidence after lifecycle mutation',
      'separate review before touching non-Orders repositories',
    ],
  };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
});
