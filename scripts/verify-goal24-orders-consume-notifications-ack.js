const assert = require('assert/strict');
const fs = require('fs');
function read(path) { return fs.readFileSync(path, 'utf8'); }
function requireIncludes(source, needle, label) { assert.ok(source.includes(needle), `${label} missing: ${needle}`); }
const marker = '[RESOLVED/NARROWED: Orders consumed Notifications c68d995 selected unpaid cancellation acknowledgement for centralOrderHash 04d7d08c82a07853 as source-owned sideEffectsHandled.notification=true planning evidence; no notification send, validate call, provider dispatch, broker mutation, recipient mutation, DB write, deploy, secret read, raw data output, or customer contact occurred; future real recipient/customer-contact policy remains Notifications-owned if a later Orders route invocation emits events]';
const report = read('reports/validation/VAL-GOAL-24-orders-consume-notifications-ack-2026-07-04.md');
const state = read('docs/IMPLEMENTATION_STATE.md');
const status = read('docs/orchestrator/STATUS.md');
const closeout = read('reports/validation/VAL-GOAL-24-orders-structured-approval-no-mutation-closeout-2026-07-04.md');
const notificationsReport = read('../notifications-microservice/reports/validation/GOAL-24-selected-unpaid-orders-cancellation-notifications-ack.md');
const notificationsDoc = read('../notifications-microservice/docs/orchestrator/GOAL-24-selected-unpaid-orders-cancellation-notifications-ack.md');
const notificationsVerifier = read('../notifications-microservice/scripts/verifier/verify-goal24-selected-unpaid-cancel-ack.js');
for (const [label, source] of [['report', report], ['state', state], ['status', status], ['closeout', closeout]]) {
  requireIncludes(source, marker, `${label} Notifications consumption marker`);
  requireIncludes(source, 'orders_route_invocation: false', `${label} route boundary`);
  requireIncludes(source, 'notification_send: false', `${label} send boundary`);
  requireIncludes(source, 'notification_mutation: false', `${label} mutation boundary`);
  requireIncludes(source, 'raw_customer_or_payment_evidence: false', `${label} raw evidence boundary`);
}
for (const required of [
  'Notifications commit: `c68d995 docs: finalize Goal 24 notifications ack validation`',
  'sideEffectsHandled.notification=true',
  'no `/notifications/send`',
  'no `/notifications/validate`',
  'no customer contact',
  '[MISSING: owner-approved recipient/customer-contact policy if a future cancelled event should notify a real recipient]',
]) requireIncludes(report, required, `report evidence ${required}`);
for (const [label, source] of [['notifications report', notificationsReport], ['notifications doc', notificationsDoc]]) {
  requireIncludes(source, '04d7d08c82a07853', `${label} selected hash`);
  requireIncludes(source, 'sideEffectsHandled.notification=true', `${label} notification ack`);
  requireIncludes(source, 'requires no pre-route notification send', `${label} no pre-route send`);
}
requireIncludes(notificationsVerifier, 'No `/notifications/send` call', 'Notifications verifier no-send assertion');
requireIncludes(notificationsVerifier, 'No `/notifications/validate` call', 'Notifications verifier no-validate assertion');
console.log('Goal 24 Orders Notifications acknowledgement consumption verified');
