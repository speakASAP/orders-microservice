#!/usr/bin/env node
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const sibling = (repo, file) => path.join(root, '..', repo, file);
const files = {
  report: path.join(root, 'reports/validation/VAL-W9-payment-provider-correction-current-gate-2026-07-06.md'),
  finalReport: path.join(root, 'reports/validation/VAL-W7-error-free-orders-lifecycle-final-integration-2026-07-05.md'),
  masterPlan: path.join(root, 'docs/orchestrator/2026-07-05-error-free-orders-lifecycle-master-plan.md'),
  status: path.join(root, 'docs/orchestrator/STATUS.md'),
  state: path.join(root, 'docs/IMPLEMENTATION_STATE.md'),
  runtimeGate: path.join(root, 'docs/orchestrator/2026-07-05-runtime-gate-packet-contracts.md'),
  readiness: path.join(root, 'reports/validation/VAL-GOAL-24-orders-paid-provider-bundle-readiness.md'),
  finalOwnerPacket: path.join(root, 'docs/orchestrator/2026-07-04-goal24-final-source-only-owner-handoff-packet.md'),
  noMutationAudit: path.join(root, 'reports/validation/VAL-GOAL-24-orders-final-no-mutation-cross-repo-audit-2026-07-05.md'),
  paymentBoundary: path.join(root, 'docs/orchestrator/PAYMENT_STATUS_BOUNDARY.md'),
  warehouseBoundary: path.join(root, 'docs/orchestrator/WAREHOUSE_HANDOFF_CONTRACT.md'),
  transitionBoundary: path.join(root, 'docs/orchestrator/ORDER_STATUS_TRANSITIONS.md'),
  paymentDto: path.join(root, 'src/payments/payment-status.dto.ts'),
  ordersService: path.join(root, 'src/orders/orders.service.ts'),
  paymentsPacket: sibling('payments-microservice', 'docs/orchestrator/2026-07-04-goal24-final-owner-approval-runtime-packet.md'),
};

function read(file) {
  assert.equal(fs.existsSync(file), true, file + ' is missing');
  return fs.readFileSync(file, 'utf8');
}
function includes(source, marker, label) {
  assert.equal(source.includes(marker), true, label + ' missing marker: ' + marker);
}
function excludes(source, marker, label) {
  assert.equal(source.includes(marker), false, label + ' must not include marker: ' + marker);
}

const docs = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, read(file)]));
const decision = '[RESOLVED/NARROWED: payment/refund/provider correction workflow is source-defined and fail-closed; Orders cancellation/idempotency/side-effect packet shape is verified, while live refund/provider/Orders route execution remains owner-approved exact-runtime-packet gated]';
const ipsMarkers = ['Vision ->','Goal Impact ->','System ->','Feature ->','Task ->','Execution Plan ->','Coding Prompt ->','Code ->','Validation ->'];
for (const marker of ipsMarkers) includes(docs.report, marker, 'W9 IPS chain');
for (const key of ['report','finalReport','masterPlan','status','state','runtimeGate']) includes(docs[key], decision, key + ' W9 decision propagation');

for (const marker of ['Refunds remain Payments-owned','Fiobanka Goal 24 cleanup refinement','GOAL24_PAID_PROVIDER_ROLLBACK']) includes(docs.paymentBoundary, marker, 'payment boundary');
for (const marker of ["if (normalized === 'refunded' || normalized === 'refund' || normalized === 'partially_refunded')", 'providerTransactionId', 'providerResponse']) includes(docs.paymentDto, marker, 'payment DTO guard');
for (const marker of ['statusTransitionAudit = transition.approvalAudit', 'hasMatchingStatusIdempotencyKey(order, transition.approvalAudit.idempotencyKey, transition.status)', 'audit?.idempotencyKey === idempotencyKey && audit?.resultingStatus === resultingStatus', 'sideEffectsHandled']) includes(docs.ordersService, marker, 'Orders status/idempotency source');
for (const marker of ['`pending|confirmed|processing -> cancelled` requires `approval.approved=true`, `approval.approvalType=human`', 'side-effect acknowledgements for payment, warehouse, notification, CRM, and channel handling', 'terminal-state destructive corrections remain rejected']) includes(docs.transitionBoundary, marker, 'transition boundary');
for (const marker of ['For Fiobanka Goal 24 cleanup', 'Payments refund state, provider correction notes, and local payment metadata are never Warehouse operation selectors', 'unknown component state is no-op fail-closed']) includes(docs.warehouseBoundary, marker, 'warehouse boundary');

for (const marker of [
  '[RESOLVED/NARROWED: owner-approved Orders cancellation/refund correction packet shape is defined as route, targetOrderHash/state, actor/approvedBy, human approval, safe reason, sanitized idempotency key, all side-effect acknowledgements, provider evidence hash, Warehouse decision, and redaction acceptance]',
  '[MISSING: named runtime Orders cancellation actor/approvedBy and exact target order hash/state for the paid/provider packet]',
  '[MISSING: owner-approved payment/warehouse/notification/crm/channel sideEffectsHandled acknowledgements for the selected central order hash]',
  '[MISSING: approved runtime route invocation evidence; do not call the route until all packet fields are present]',
  'Orders must not infer Warehouse stock effects from Payments refund state'
]) includes(docs.readiness, marker, 'Goal 24 readiness');
for (const marker of ['route: PUT /api/orders/:id/status', 'targetStatus: cancelled', 'GOAL24_PAID_PROVIDER_ROLLBACK', 'GOAL24_PROVIDER_UNPAID_CANCEL', '[MISSING: exact Orders target order hash/state]', '[MISSING: named runtime Orders cancellation actor/approvedBy]', '[MISSING: final redacted evidence path for required provider, Orders, Warehouse, and channel cleanup proof]']) includes(docs.finalOwnerPacket, marker, 'final owner packet');
for (const marker of ['goal24-orders-final-no-mutation-cross-repo-audit-complete-route-invocation-not-run', 'sideEffectsHandled.payment=true', 'sideEffectsHandled.warehouse=true', 'sideEffectsHandled.channel=true', 'sideEffectsHandled.notification=true', 'sideEffectsHandled.crm=true', '[MISSING: same-request replay proof requires a future approved route invocation/replay and was not executed in this no-mutation closeout]']) includes(docs.noMutationAudit, marker, 'final no-mutation audit');
for (const marker of [
  '[MISSING: approved exact payment/refund/provider correction runtime packet naming target order hash/state, payment/provider hashes, actor/approvedBy, approval id, safe reason, idempotency key, sideEffectsHandled payment|warehouse|notification|crm|channel, Warehouse lookup state, channel acknowledgement, and final redacted evidence path]',
  '[MISSING: Fiobanka provider-side completed-transfer refund/reversal/correction proof hash, or owner-approved unpaid no-provider-cancel acknowledgement for the selected future target]',
  '[MISSING: approved runtime route invocation evidence; do not call the route until all packet fields are present]'
]) includes(docs.runtimeGate, marker, 'runtime packet W9 blockers');

for (const forbidden of ['live refund executed', 'provider call executed', 'Orders route invocation executed', 'raw provider payload', 'token value']) excludes(docs.report, forbidden, 'W9 report forbidden claim');

console.log(JSON.stringify({
  ok: true,
  verifier: 'orders-w9-payment-provider-correction-current-gate.v1',
  sourceDefinedFailClosed: true,
  liveExecution: 'owner_approved_exact_runtime_packet_gated',
  mutation: false,
  providerCall: false,
  refundOrReversal: false,
  ordersRouteInvocation: false,
  deploy: false,
  tokenValuesReadOrPrinted: false,
  sensitiveOutput: 'redacted-source-only'
}, null, 2));
