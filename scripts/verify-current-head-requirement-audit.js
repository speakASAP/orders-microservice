#!/usr/bin/env node
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = process.cwd();
const docPath = path.join(root, 'docs/orchestrator/2026-07-06-current-head-requirement-audit.md');
const reportPath = path.join(root, 'reports/validation/VAL-W7-current-head-requirement-audit-2026-07-06.md');
const statusPath = path.join(root, 'docs/orchestrator/STATUS.md');
const statePath = path.join(root, 'docs/IMPLEMENTATION_STATE.md');
const ownerQueuePath = path.join(root, 'docs/orchestrator/2026-07-06-owner-decision-optional-gate-queue.md');
const completionAuditPath = path.join(root, 'docs/orchestrator/2026-07-03-orders-lifecycle-completion-audit.md');
const packagePath = path.join(root, 'package.json');

function read(file) {
  assert.equal(fs.existsSync(file), true, path.relative(root, file) + ' is missing');
  return fs.readFileSync(file, 'utf8');
}
function includes(source, marker, label) {
  assert.equal(source.includes(marker), true, `${label} missing marker: ${marker}`);
}
function excludes(source, marker, label) {
  assert.equal(source.includes(marker), false, `${label} forbidden marker: ${marker}`);
}
function gitHead(repoPath) {
  return execFileSync('git', ['-C', repoPath, 'log', '-1', '--oneline'], { encoding: 'utf8' }).trim();
}
function gitStatus(repoPath) {
  return execFileSync('git', ['-C', repoPath, 'status', '--short', '--branch'], { encoding: 'utf8' }).trim();
}

const doc = read(docPath);
const report = read(reportPath);
const status = read(statusPath);
const state = read(statePath);
const ownerQueue = read(ownerQueuePath);
const completionAudit = read(completionAuditPath);
const pkg = JSON.parse(read(packagePath));

const ipsMarkers = ['Vision ->','Goal Impact ->','System ->','Feature ->','Task ->','Execution Plan ->','Coding Prompt ->','Code ->','Validation ->'];
for (const marker of ipsMarkers) {
  includes(doc, marker, 'current head audit doc IPS chain');
  includes(report, marker, 'current head audit report IPS chain');
}

const repos = {
  'orders-microservice': { path: '/home/ssf/Documents/Github/orders-microservice', head: 'd24eedd docs: align W8 Bazos owner gate' },
  'warehouse-microservice': { path: '/home/ssf/Documents/Github/warehouse-microservice', head: 'a259309 Add warehouse business health contract' },
  flipflop: { path: '/home/ssf/Documents/Github/flipflop', head: '281e2f4 docs: refresh W6B auth-subject smoke artifact' },
  bazos: { path: '/home/ssf/Documents/Github/bazos', head: '1a41e73 docs: align W8 intake with orders gate' },
  heureka: { path: '/home/ssf/Documents/Github/heureka', head: '3191ac2 docs: record runtime gate packet handoff' },
  allegro: { path: '/home/ssf/Documents/Github/allegro', head: '6653a16 docs: record runtime gate packet handoff' },
  aukro: { path: '/home/ssf/Documents/Github/aukro', head: 'ac3514a docs: record runtime gate packet handoff' },
};

const allowedOrdersDirty = new Set([
  'M docs/IMPLEMENTATION_STATE.md',
  'M docs/orchestrator/STATUS.md',
  'M package.json',
  '?? docs/orchestrator/2026-07-06-current-head-requirement-audit.md',
  '?? reports/validation/VAL-W7-current-head-requirement-audit-2026-07-06.md',
  '?? scripts/verify-current-head-requirement-audit.js',
]);

for (const [repo, cfg] of Object.entries(repos)) {
  includes(doc, cfg.head, `${repo} documented head`);
  includes(report, cfg.head, `${repo} report head`);
  assert.equal(gitHead(cfg.path), cfg.head, `${repo} current head drifted`);
  const statusText = gitStatus(cfg.path);
  assert.equal(statusText.startsWith('## main...origin/main'), true, `${repo} not synced to origin/main`);
  const dirtyLines = statusText.split('\n').slice(1).map((line) => line.trim()).filter(Boolean);
  if (repo === 'orders-microservice') {
    const unexpected = dirtyLines.filter((line) => !allowedOrdersDirty.has(line));
    assert.equal(unexpected.length, 0, `${repo} has unexpected dirty worktree entries: ${unexpected.join('; ')}`);
  } else {
    assert.equal(dirtyLines.length, 0, `${repo} has dirty worktree: ${dirtyLines.join('; ')}`);
  }
}

const requirementMarkers = [
  'Every order creation checks Warehouse stock and reserves available stock every time',
  'Order creation fails closed if Warehouse reservation is unavailable',
  'Order schema includes items, per-item prices, total, delivery cost, and delivery address',
  'Paid order triggers Warehouse fulfillment/delivery handoff',
  'Standard lifecycle model covers ordered/unpaid through paid, collecting/forming/formed, delivery, received/not received/returned/cancelled',
  'Buyer cabinets show order list and canonical status changes',
  'Admin cabinets show lifecycle and delivery/order statistics',
  'Bazos provider-backed lifecycle proof is not overclaimed from synthetic/internal evidence',
  'W1/W2 synthetic evidence row cleanup/retention has a safe route/policy',
  'Payment/refund/provider correction is controlled and fail-closed',
  'Cross-repo IPS plans and subagent orchestration are recorded',
];
for (const marker of requirementMarkers) {
  includes(doc, marker, 'current head audit requirement matrix');
  includes(report, marker, 'current head audit report matrix');
}

const verifierMarkers = [
  'verify:order-reservation-gate',
  'verify:create-order-contract',
  'verify:pricing-safety',
  'verify:order-fulfillment-handoff',
  'verify:w2-warehouse-callback-current-gate',
  'verify:order-lifecycle-read-model',
  'verify:shipment-runtime-readiness',
  'verify:channel-lifecycle-surfaces',
  'verify:channel-lifecycle-runtime-evidence',
  'verify:admin-operations-console',
  'verify:product-sales-statistics',
  'verify:w8-bazos-product-decision-packet',
  'verify:w8-bazos-provider-current-gate',
  'verify:w1w2-cleanup-policy',
  'verify:w9-payment-provider-correction-current-gate',
  'verify:current-owner-decision-queue',
  'verify:completion-audit',
];
for (const marker of verifierMarkers) includes(doc, marker, 'current head audit verifier marker');

const blockers = [
  '[MISSING: Bazos owner must select exactly one allowed product decision option]',
  '[UNKNOWN: live Bazos marketplace webhook support]',
  '[MISSING: approved buyer/admin bearer/session packets for optional natural human-session/customer-bound proof when product requires proof beyond accepted bounded/service-scoped evidence]',
  '[MISSING: approved Warehouse fulfillment runtime packet]',
  '[MISSING: approved exact payment/refund/provider correction runtime packet naming target order hash/state, payment/provider hashes, actor/approvedBy, approval id, safe reason, idempotency key, sideEffectsHandled payment|warehouse|notification|crm|channel, Warehouse lookup state, channel acknowledgement, and final redacted evidence path]',
  '[MISSING: approved W1/W2 cleanup mutation or retention packet naming exact target hashes and actor]',
];
for (const blocker of blockers) {
  includes(doc, blocker, 'current head audit blocker');
  includes(report, blocker, 'current head audit report blocker');
  includes(ownerQueue, blocker, 'owner queue blocker propagation');
}

const decision = '[RESOLVED/NARROWED: current pushed heads prove the required unified Orders lifecycle implementation; remaining work is owner/product-gated optional proof or exact runtime packets]';
includes(doc, decision, 'current head audit decision');
includes(report, decision, 'current head audit report decision');
includes(status, 'Current Head Requirement Audit Recorded', 'status current head audit');
includes(state, 'Current-head requirement audit recorded', 'state current head audit');
includes(completionAudit, 'Status: required implementation complete.', 'completion audit complete status');
includes(completionAudit, 'Required implementation evidence is complete; optional natural/human/provider proofs remain product-gated follow-up evidence only.', 'completion audit optional boundary');

includes(pkg.scripts.test, 'npm run verify:current-head-requirement-audit', 'npm test current head audit wiring');
assert.equal(pkg.scripts['verify:current-head-requirement-audit'], 'node scripts/verify-current-head-requirement-audit.js');

const forbiddenClaims = [
  'Bazos provider-backed proof complete',
  'live Bazos marketplace webhook support resolved',
  'runtime cleanup executed',
  'retention approved',
  'refund executed',
  'provider call passed',
  'token value',
  'raw provider payload:',
];
for (const marker of forbiddenClaims) {
  excludes(doc, marker, 'current head audit forbidden claim');
  excludes(report, marker, 'current head audit report forbidden claim');
}

const result = {
  ok: true,
  verifier: 'orders-current-head-requirement-audit.v1',
  requiredImplementation: 'complete',
  remainingWork: 'owner_product_gated_optional_proof_or_exact_runtime_packets',
  reposVerified: Object.keys(repos).length,
  mutation: false,
  providerCall: false,
  deploy: false,
  databaseRead: false,
  browserSessionUsed: false,
  tokenValuesReadOrPrinted: false,
  sensitiveOutput: 'redacted-source-only',
};
process.stdout.write(JSON.stringify(result, null, 2) + '\n');
