const assert = require('assert/strict');
const fs = require('fs');
function read(path) { return fs.readFileSync(path, 'utf8'); }
function requireIncludes(source, needle, label) { assert.ok(source.includes(needle), `${label} missing: ${needle}`); }
const marker = '[RESOLVED/NARROWED: Orders read-only runtime unused-key preflight passed for Goal 24 centralOrderHash 04d7d08c82a07853 and idempotencyKeyHash ba7f6aea2ff73df1; selectedRows=1, selectedStatus=pending, selectedPaymentStatus=pending, selectedChannel=flipflop, selectedTotal=300.00, idempotencyKeyUsedAnywhere=false, selectedAuditMatchCount=0, and no Orders route invocation, DB write, raw id output, raw DB row output, secret output, or token output occurred; same-request replay proof remains missing until a future approved route invocation/replay]';
const report = read('reports/validation/VAL-GOAL-24-orders-runtime-unused-key-preflight-2026-07-04.md');
const state = read('docs/IMPLEMENTATION_STATE.md');
const status = read('docs/orchestrator/STATUS.md');
const closeout = read('reports/validation/VAL-GOAL-24-orders-structured-approval-no-mutation-closeout-2026-07-04.md');
const notificationsConsumption = read('reports/validation/VAL-GOAL-24-orders-consume-notifications-ack-2026-07-04.md');
for (const [label, source] of [['report', report], ['state', state], ['status', status], ['closeout', closeout], ['notifications consumption', notificationsConsumption]]) {
  requireIncludes(source, marker, `${label} unused-key preflight marker`);
  requireIncludes(source, 'orders_route_invocation: false', `${label} route boundary`);
  requireIncludes(source, 'db_write: false', `${label} db write boundary`);
  requireIncludes(source, 'raw_ids_printed: false', `${label} raw ids boundary`);
  requireIncludes(source, 'raw_db_rows_printed: false', `${label} raw rows boundary`);
}
for (const required of [
  'selectedCentralOrderHash": "04d7d08c82a07853"',
  'selectedRows": 1',
  'selectedStatus": "pending"',
  'selectedPaymentStatus": "pending"',
  'selectedChannel": "flipflop"',
  'selectedTotal": "300.00"',
  'idempotencyKeyHash": "ba7f6aea2ff73df1"',
  'idempotencyKeyUsedAnywhere": false',
  'selectedAuditMatchCount": 0',
  'decision": "unused-key-preflight-passed-read-only"',
  '[MISSING: same-request replay proof requires a future approved route invocation/replay and was not executed in this read-only preflight]',
]) requireIncludes(report, required, `report evidence ${required}`);
console.log('Goal 24 Orders runtime unused-key preflight verified');
