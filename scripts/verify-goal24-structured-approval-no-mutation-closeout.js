const assert = require('assert/strict');
const fs = require('fs');
function read(path) { return fs.readFileSync(path, 'utf8'); }
function requireIncludes(source, needle, label) { assert.ok(source.includes(needle), `${label} missing: ${needle}`); }
const report = read('reports/validation/VAL-GOAL-24-orders-structured-approval-no-mutation-closeout-2026-07-04.md');
const state = read('docs/IMPLEMENTATION_STATE.md');
const status = read('docs/orchestrator/STATUS.md');
const paymentsEvidence = read('../payments-microservice/reports/validation/VAL-GOAL-24-final-redacted-cleanup-evidence-2026-07-04.md');
const paymentsUnpaidAck = read('../payments-microservice/reports/validation/VAL-GOAL-24-fiobanka-unpaid-no-provider-cancel-ack-2026-07-04.md');
const warehouseAck = read('../warehouse-microservice/reports/validation/VAL-GOAL-24-warehouse-no-mutation-ack-2026-07-04.md');
const channelAck = read('../flipflop/reports/validation/VAL-GOAL-24-channel-no-cleanup-ack-2026-07-04.md');
const marker = '[RESOLVED/NARROWED: structured owner approval from Sergey Stasok / Сергей Сташок on 2026-07-04 Europe/Prague is consumed as no-mutation Goal 24 closeout planning evidence for centralOrderHash 04d7d08c82a07853; sideEffectsHandled.payment=true by unpaid no-provider-cancel acknowledgement, sideEffectsHandled.warehouse=true by Warehouse 032ed96 no-mutation acknowledgement, sideEffectsHandled.channel=true by FlipFlop 86394e7 no-cleanup acknowledgement, sideEffectsHandled.notification=true only as no-notification-mutation acknowledgement, and sideEffectsHandled.crm=true only as no-crm-mutation acknowledgement; no Orders route invocation, Warehouse mutation, channel cleanup, notification, CRM, refund, reversal, bank transfer, provider polling mutation, deploy, migration, DB write, or raw evidence output occurred; any future Orders route call remains blocked until unused-key preflight and same-request replay proof are recorded without raw IDs or secrets]';
for (const [label, source] of [['report', report], ['state', state], ['status', status]]) {
  requireIncludes(source, marker, `${label} marker`);
  for (const boundary of ['orders_route_invocation: false', 'orders_mutation: false', 'warehouse_mutation: false', 'channel_cleanup_mutation: false', 'notification_mutation: false', 'crm_mutation: false', 'raw_customer_or_payment_evidence: false']) requireIncludes(source, boundary, `${label} boundary ${boundary}`);
}
for (const required of ['Vision -> Goal Impact -> System -> Feature -> Task -> Execution Plan -> Coding Prompt -> Code -> Validation -> State Update', 'approvedBy: Sergey Stasok / Сергей Сташок', 'selectedCentralOrderHash: `04d7d08c82a07853`', 'selectedPaymentHash: `49853ba96700cdd1`', 'sideEffectsHandled.payment=true', 'sideEffectsHandled.warehouse=true', 'sideEffectsHandled.channel=true', 'sideEffectsHandled.notification=true', 'sideEffectsHandled.crm=true', '[MISSING: unused-key preflight and same-request replay proof before any future Orders route invocation]', '[MISSING: same-request replay proof for the exact future Orders request hash before any future route invocation]', 'noRouteCloseout: true', 'provider_polling_mutation: false', 'refund_or_reversal: false', 'bank_transfer: false', 'webhook_replay: false']) requireIncludes(report, required, `report evidence ${required}`);
requireIncludes(paymentsUnpaidAck, 'owner-approved unpaid no-provider-cancel acknowledgement', 'Payments unpaid acknowledgement');
requireIncludes(warehouseAck, 'owner-approved Warehouse no-mutation acknowledgement', 'Warehouse no-mutation acknowledgement');
requireIncludes(channelAck, 'owner-approved FlipFlop channel no-cleanup acknowledgement', 'FlipFlop no-cleanup acknowledgement');
requireIncludes(paymentsEvidence, 'goal24-selected-unpaid-no-mutation-closeout-source-evidence-complete-route-mutation-blocked', 'Payments final evidence closeout decision');
console.log('Goal 24 structured approval no-mutation closeout verified');
