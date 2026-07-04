const assert = require('assert/strict');
const fs = require('fs');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}
function requireIncludes(source, needle, label) {
  assert.ok(source.includes(needle), `${label} missing: ${needle}`);
}

const marker = '[RESOLVED/NARROWED: Orders selected actor and CRM no-op acknowledgement are source-defined for centralOrderHash 04d7d08c82a07853 with approvedBy Sergey Stasok / Сергей Сташок, targetOrderState pending, approvalId GOAL24-PAID-PROVIDER-SMOKE-20260704-CODEX-OWNER-APPROVED-003, reason GOAL24_PROVIDER_UNPAID_CANCEL, idempotency label orders:goal24:post-paid-correction:GOAL24-PAID-PROVIDER-SMOKE-20260704-CODEX-OWNER-APPROVED-003:49853ba96700cdd1, and sideEffectsHandled.crm=true as owner-approved no-op planning evidence because no CRM service/repo or Orders CRM adapter exists for this selected cancellation path; Orders route invocation remains blocked until Notifications-owned acknowledgement, live unused-key preflight, same-request replay proof, and approved runtime invocation evidence exist]';
const report = read('reports/validation/VAL-GOAL-24-orders-actor-crm-ack-2026-07-04.md');
const state = read('docs/IMPLEMENTATION_STATE.md');
const status = read('docs/orchestrator/STATUS.md');
const packet = read('docs/orchestrator/2026-07-04-goal24-final-source-only-owner-handoff-packet.md');
const finalReport = read('reports/validation/VAL-GOAL-24-orders-final-owner-handoff-packet-2026-07-04.md');
const readiness = read('reports/validation/VAL-GOAL-24-orders-paid-provider-bundle-readiness.md');
const sideEffects = read('reports/validation/VAL-GOAL-24-orders-consume-sideeffects-acks-2026-07-04.md');
const transitions = read('src/orders/status-transitions.ts');
const service = read('src/orders/orders.service.ts');
const leadsGoal11 = read('../leads-microservice/implementation-goals/GOAL-11-ecosystem-lead-lifecycle-contracts.crm-boundary.md');
const leadsGoal05 = read('../leads-microservice/implementation-goals/GOAL-05-ai-and-crm-data-sharing-boundary.md');

for (const [label, source] of [
  ['report', report],
  ['state', state],
  ['status', status],
  ['packet', packet],
  ['final report', finalReport],
  ['readiness', readiness],
  ['side effects report', sideEffects],
]) {
  requireIncludes(source, marker, `${label} actor CRM marker`);
  requireIncludes(source, '[MISSING: Notifications-owned acknowledgement for centralOrderHash 04d7d08c82a07853]', `${label} notification blocker`);
  requireIncludes(source, 'orders_route_invocation: false', `${label} route boundary`);
  requireIncludes(source, 'crm_mutation: false', `${label} CRM mutation boundary`);
}

for (const required of [
  'approvedBy: `Sergey Stasok / Сергей Сташок`',
  'approvalType: `human`',
  'reasonCode: `GOAL24_PROVIDER_UNPAID_CANCEL`',
  'idempotencyLabel: `orders:goal24:post-paid-correction:GOAL24-PAID-PROVIDER-SMOKE-20260704-CODEX-OWNER-APPROVED-003:49853ba96700cdd1`',
  '`sideEffectsHandled.crm=true`: source-owned owner-approved no-op planning evidence only',
  '[MISSING: live unused-key preflight for Orders idempotency label orders:goal24:post-paid-correction:GOAL24-PAID-PROVIDER-SMOKE-20260704-CODEX-OWNER-APPROVED-003:49853ba96700cdd1]',
  '[MISSING: same-request replay proof for Orders idempotency label orders:goal24:post-paid-correction:GOAL24-PAID-PROVIDER-SMOKE-20260704-CODEX-OWNER-APPROVED-003:49853ba96700cdd1]',
  'notification_send: false',
  'crm_mutation: false',
  'raw_ids_printed: false',
]) {
  requireIncludes(report, required, `report required evidence ${required}`);
}

requireIncludes(transitions, "throw new Error('Order cancellation requires an Auth actor identity or approval.approvedBy');", 'Orders actor guard');
requireIncludes(transitions, "const REQUIRED_CANCELLATION_SIDE_EFFECTS: CancellationSideEffectKey[] = ['payment', 'warehouse', 'notification', 'crm', 'channel'];", 'Orders side effects list');
requireIncludes(service, 'hasMatchingStatusIdempotencyKey(order, transition.approvalAudit.idempotencyKey, transition.status)', 'Orders idempotency replay guard');
requireIncludes(leadsGoal11, 'does not create a CRM service', 'Leads CRM boundary no service');
requireIncludes(leadsGoal05, 'No CRM client implementation', 'Leads no CRM client implementation');

console.log('Goal 24 Orders actor and CRM acknowledgement verified');
