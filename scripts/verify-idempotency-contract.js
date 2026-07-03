const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const idempotencyDoc = fs.readFileSync(path.join(projectRoot, 'docs/orchestrator/ORDER_IDEMPOTENCY_CONTRACT.md'), 'utf8');
const createContractDoc = fs.readFileSync(path.join(projectRoot, 'docs/orchestrator/CHANNEL_ORDER_CREATE_CONTRACT.md'), 'utf8');
const goalsDoc = fs.readFileSync(path.join(projectRoot, 'docs/orchestrator/GOALS.md'), 'utf8');

for (const required of [
  'contractVersion + channel + channelAccountId + externalOrderId',
  'orders.create.v1',
  '409 Conflict',
  'ORDER_IDEMPOTENCY_CONFLICT',
  'Do not insert another `orders` row',
  'Do not insert duplicate `order_items` rows',
  'Do not emit another `order.created` event',
  'channelAccountId',
  'externalOrderId',
  'bundleEvidence',
  'Bundle evidence is part of the normalized replay fingerprint',
]) {
  assert.ok(idempotencyDoc.includes(required), `Missing idempotency contract text: ${required}`);
}

assert.ok(
  createContractDoc.includes('contractVersion + channel + channelAccountId + externalOrderId') &&
    createContractDoc.includes('ORDER_IDEMPOTENCY_CONTRACT'),
  'Create-order contract must reference idempotency expectations',
);
assert.ok(
  goalsDoc.includes('[x] 4.2 Document idempotency expectations for external order IDs and channel account IDs') ||
    goalsDoc.includes('[ ] 4.2 Document idempotency expectations for external order IDs and channel account IDs'),
  'Goal 4.2 must remain tracked in GOALS.md',
);

console.log('idempotency contract verification ok');
