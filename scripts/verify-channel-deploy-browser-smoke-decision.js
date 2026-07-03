#!/usr/bin/env node
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const reportPath = path.join(root, 'reports/validation/channel-lifecycle-runtime-evidence/channel-deploy-browser-smoke-decision-current.json');

function readJson(file) {
  assert.equal(fs.existsSync(file), true, `${path.relative(root, file)} is missing`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function assertPolicy(policy) {
  assert.equal(policy.readOnlyProbe, true, 'decision must be read-only evidence');
  assert.equal(policy.channelSourceEdits, false, 'decision must not include channel source edits');
  assert.equal(policy.deploys, false, 'decision must not include deploys');
  assert.equal(policy.runtimeMutations, false, 'decision must not include runtime mutations');
  assert.equal(policy.databaseReads, false, 'decision must not include database reads');
  assert.equal(policy.providerCalls, false, 'decision must not include provider calls');
  assert.equal(policy.secretsPrinted, false, 'decision must not print secrets');
  assert.equal(policy.rawDomDumped, false, 'decision must not dump raw DOM');
  assert.equal(policy.rawOrderRowsPrinted, false, 'decision must not print raw order rows');
  assert.equal(policy.customerPiiPrinted, false, 'decision must not print customer PII');
}

function assertNoStaleWorkerFields(channel, name) {
  const staleFields = [
    'expectedWorkerCommit',
    'integratedEquivalentCommit',
    'equivalentPatchId',
    'mergeNeededForExpectedCommit',
    'runtimeContainsExpectedCommit',
    'sourceContainsExpectedCommit',
  ];
  for (const field of staleFields) {
    assert.equal(Object.prototype.hasOwnProperty.call(channel, field), false, `${name} decision still uses stale worker field ${field}`);
  }
}

function assertRoutes(routes, expected, name) {
  for (const [route, status] of Object.entries(expected)) {
    assert.equal(routes[route], status, `${name} route ${route} status mismatch`);
  }
}

const report = readJson(reportPath);

assert.equal(report.schemaVersion, 'orders.channel_deploy_browser_smoke_decision.v1');
assert.equal(report.status, 'partial_smoke_ready_with_current_runtime_and_product_gates');
assertPolicy(report.policy);

const expectedChannels = ['flipflop', 'heureka', 'bazos', 'allegro', 'aukro'];
assert.deepEqual(Object.keys(report.channels).sort(), expectedChannels.slice().sort(), 'channel set mismatch');

const checks = {
  flipflop: {
    head: '64e7831',
    proofStatus: 'service_scoped_proxy_browser_proof_proven_direct_human_optional',
    routes: { '/': 200, '/orders': 200, '/admin/orders': 200 },
    runtimeImages: ['localhost:5000/flipflop-frontend:latest', 'localhost:5000/flipflop-service:latest'],
  },
  heureka: {
    head: '712c3b0',
    proofStatus: 'orders_list_non_stale_lifecycle_api_proven_dom_optional',
    routes: { '/': 200, '/api/health': 200, '/dashboard/orders': 200, '/heureka/dashboard/orders-list?limit=1&status=all': 401 },
    runtimeImages: ['localhost:5000/heureka-service:1cf0f32', 'localhost:5000/heureka-api-gateway:1cf0f32'],
  },
  bazos: {
    head: '053a4d3',
    proofStatus: 'bounded_paid_multi_product_customer_admin_lifecycle_proven_natural_provider_optional',
    routes: { '/': 200, '/orders': 401 },
    runtimeImage: 'localhost:5000/bazos-service:27f325d',
  },
  allegro: {
    head: '60fb3f3',
    proofStatus: 'bounded_buyer_lifecycle_and_central_forwarded_shipment_proven_natural_buyer_provider_optional',
    routes: { '/': 200, '/api/health': 200, '/cabinet/orders': 200, '/dashboard/orders': 200 },
    runtimeImages: ['localhost:5000/allegro-service:c979768', 'localhost:5000/allegro-frontend:c979768'],
  },
  aukro: {
    head: 'e264a34',
    proofStatus: 'protected_customer_admin_lifecycle_api_proven_dom_optional',
    routes: { '/': 200, '/dashboard': 200, '/aukro/ui/dashboard': 403 },
    runtimeImage: 'localhost:5000/aukro-service:94f3427',
  },
};

for (const [name, expected] of Object.entries(checks)) {
  const channel = report.channels[name];
  assert.equal(channel.currentHead, expected.head, `${name} current head mismatch`);
  assert.equal(channel.proofStatus, expected.proofStatus, `${name} proof status mismatch`);
  assertRoutes(channel.routeStatus || {}, expected.routes, name);
  assertNoStaleWorkerFields(channel, name);
  if (expected.runtimeImage) {
    assert.equal(channel.runtimeImage, expected.runtimeImage, `${name} runtime image mismatch`);
  }
  if (expected.runtimeImages) {
    assert.deepEqual(channel.runtimeImages, expected.runtimeImages, `${name} runtime images mismatch`);
  }
  assert.equal(typeof channel.remainingGate, 'string', `${name} remaining gate must be documented`);
  assert.equal(channel.remainingGate.length > 20, true, `${name} remaining gate must be meaningful`);
}

assert.equal(Array.isArray(report.safeOrder), true, 'safe order must be listed');
assert.equal(report.safeOrder.some((item) => item.includes('do not duplicate the Allegro central-forwarded shipment proof')), true, 'safe order must prevent duplicate Allegro proof lane');
assert.equal(report.safeOrder.some((item) => item.includes('non-UNKNOWN tracking status')), true, 'safe order must preserve provider movement gate');
assert.equal(report.safeOrder.some((item) => item.includes('raw tracking number/URL hidden')), true, 'safe order must preserve tracking visibility gate');

console.log(JSON.stringify({
  schemaVersion: 'orders.channel_deploy_browser_smoke_decision_verification.v1',
  status: 'current_runtime_decision_verified',
  checkedAt: new Date().toISOString(),
  channelsVerified: expectedChannels.length,
  readOnlyEvidence: true,
  channelSourceEdits: false,
  deploys: false,
  runtimeMutations: false,
  providerCalls: false,
  secretsPrinted: false,
  rawDomDumped: false,
  rawOrderRowsPrinted: false,
  customerPiiPrinted: false,
}, null, 2));
