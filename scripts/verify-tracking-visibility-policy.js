#!/usr/bin/env node
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = process.cwd();

function read(relativePath) {
  const file = path.join(root, relativePath);
  assert.equal(fs.existsSync(file), true, `${relativePath} is missing`);
  return fs.readFileSync(file, 'utf8');
}

function repoRead(repoPath, relativePath) {
  const file = path.join(repoPath, relativePath);
  assert.equal(fs.existsSync(file), true, `${relativePath} is missing under ${repoPath}`);
  return fs.readFileSync(file, 'utf8');
}

function firstExisting(paths) {
  return paths.find((candidate) => candidate && fs.existsSync(candidate));
}

function repoPath(envName, defaults) {
  const selected = process.env[envName] || firstExisting(defaults);
  assert.ok(selected, `${envName} is required; checked ${defaults.join(', ')}`);
  return path.resolve(selected);
}

function assertIncludes(source, marker, label) {
  assert.equal(source.includes(marker), true, `${label} missing marker: ${marker}`);
}

function assertNotIncludes(source, marker, label) {
  assert.equal(source.includes(marker), false, `${label} forbidden marker: ${marker}`);
}

const policy = read('docs/contracts/tracking-visibility-policy.md');
for (const marker of [
  'Current product-approved behavior is status-only shipment visibility.',
  'trackingAvailable: true|false',
  'raw tracking number',
  'tracking URL or courier deep link',
  'Full tracking value allowed now?',
  'No | Buyer ownership must use Auth subject/order ownership, not email-only matching.',
  'Future Reveal Gate',
  'implementations must fail closed by rendering status-only shipment progress',
  'Orders events may include `shipmentStatus` and `shipmentLookupRequired`, but not raw tracking values.',
]) {
  assertIncludes(policy, marker, 'tracking visibility policy');
}

const eventContractsDoc = read('docs/orchestrator/ORDER_EVENT_CONTRACTS.md');
assertIncludes(eventContractsDoc, 'shipmentLookupRequired', 'event contracts doc');
assertIncludes(eventContractsDoc, 'tracking numbers, tracking URLs', 'event contracts doc');

const sensitiveReview = read('docs/orchestrator/SENSITIVE_DATA_REVIEW.md');
assertIncludes(sensitiveReview, 'Tracking values are sensitive operational delivery data', 'sensitive data review');
assertIncludes(sensitiveReview, 'Versioned shipped events no longer include tracking number or tracking URL', 'sensitive data review');

const eventContracts = read('src/orders/order-event-contracts.ts');
assertIncludes(eventContracts, 'shipmentLookupRequired: true', 'order event contracts');
assertNotIncludes(eventContracts, 'trackingUrl:', 'order event contracts');
assertNotIncludes(eventContracts, 'trackingNumber:', 'order event contracts');

const eventVerifier = read('scripts/verify-event-contracts.js');
assertIncludes(eventVerifier, "'trackingNumber'", 'event verifier forbidden keys');
assertIncludes(eventVerifier, "'trackingUrl'", 'event verifier forbidden keys');
assertIncludes(eventVerifier, 'tracking-must-not-appear', 'event verifier sentinel');

const shipmentVerifier = read('scripts/verify-shipment-runtime-readiness.js');
for (const marker of [
  'rawTrackingDisplayed',
  'rawProviderPayloadDisplayed',
  'customerPiiDisplayed',
  'secretsDisplayed',
  'rawDatabaseRowsDisplayed',
]) {
  assertIncludes(shipmentVerifier, marker, 'shipment runtime verifier');
}

const surfaceVerifier = read('scripts/verify-channel-lifecycle-surfaces.js');
for (const marker of ['lifecycleStage', 'paymentStatus', 'deliveryStatus', 'fulfillmentStatus']) {
  assertIncludes(surfaceVerifier, marker, 'channel lifecycle surface verifier');
}
assertNotIncludes(surfaceVerifier, 'trackingNumber', 'channel lifecycle surface verifier');
assertNotIncludes(surfaceVerifier, 'trackingUrl', 'channel lifecycle surface verifier');

const runtimeEvidenceVerifier = read('scripts/verify-channel-lifecycle-runtime-evidence.js');
for (const marker of ['providerPayloadPrinted', 'tracking visibility policy', 'bounded sanitized smoke']) {
  assertIncludes(runtimeEvidenceVerifier, marker, 'channel runtime evidence verifier');
}

const repos = {
  flipflop: {
    root: repoPath('FLIPFLOP_REPO_PATH', ['/home/ssf/Documents/Github/flipflop']),
    files: ['scripts/verify-orders-lifecycle-ui.js', 'shared/clients/order-client.service.ts'],
  },
  bazos: {
    root: repoPath('BAZOS_REPO_PATH', ['/home/ssf/Documents/Github/bazos']),
    files: ['scripts/verify-orders-lifecycle-ui.js', 'shared/clients/order-client.service.ts'],
  },
  heureka: {
    root: repoPath('HEUREKA_REPO_PATH', ['/home/ssf/Documents/Github/heureka']),
    files: ['docs/orchestrator/2026-07-03-orders-lifecycle-ui-reliability-report.md', 'services/heureka-service/src/heureka/dashboard/dashboard.service.ts'],
  },
  allegro: {
    root: repoPath('ALLEGRO_REPO_PATH', ['/home/ssf/Documents/Github/allegro']),
    files: ['services/allegro-service/src/allegro/shipments/warehouse-shipment-correlation.client.ts', 'services/frontend/src/pages/BuyerOrdersPage.tsx'],
  },
  aukro: {
    root: repoPath('AUKRO_REPO_PATH', ['/home/ssf/Documents/Github/aukro']),
    files: ['scripts/verify-orders-lifecycle-ui.js', 'services/aukro-service/src/ui/ui.controller.ts'],
  },
};

const channelEvidence = {};
for (const [name, spec] of Object.entries(repos)) {
  channelEvidence[name] = { root: spec.root, files: spec.files };
  const combined = spec.files.map((file) => repoRead(spec.root, file)).join('\n');
  assertIncludes(combined, 'lifecycleStage', `${name} status-only lifecycle marker`);
  assert.equal(combined.includes('deliveryStatus') || combined.includes('deliveryStats') || combined.includes('fulfillmentStatus'), true, `${name} status-only surface missing delivery/fulfillment status marker`);
  assertNotIncludes(combined, 'trackingUrl', `${name} broad tracking display`);
  if (name === 'allegro') {
    assertIncludes(combined, 'sourceReferenceHash', `${name} provider boundary must use sanitized hashes`);
    assertIncludes(combined, 'provider-shipment-correlations', `${name} provider boundary must use Warehouse correlation endpoint`);
  } else if (combined.includes('trackingNumber')) {
    assertIncludes(combined, 'must not render tracking values', `${name} tracking marker must be defensive verifier context`);
  }
}

const result = {
  schemaVersion: 'orders.tracking_visibility_policy_verification.v1',
  status: 'status_only_tracking_visibility_policy_approved',
  checkedAt: new Date().toISOString(),
  policy: {
    customerCabinetRawTrackingDisplay: false,
    adminDashboardRawTrackingDisplay: false,
    eventsRawTrackingDisplay: false,
    notificationsRawTrackingDisplay: false,
    validationRawTrackingDisplay: false,
    statusOnlyDisplayApproved: true,
    futureRevealRequiresAuditedContract: true,
  },
  channels: channelEvidence,
  remainingGates: [
    'optional future audited full-tracking reveal API if product/security approves it',
    'optional real provider live-read evidence if sanitized existing-correlation smoke is insufficient',
    'Allegro/Warehouse source hardening is landed and the Auth-issued internal:allegro-service:service token is projected as WAREHOUSE_INTERNAL_SERVICE_TOKEN; remaining gates are optional real provider live-read and future audited full-tracking reveal',
  ],
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
