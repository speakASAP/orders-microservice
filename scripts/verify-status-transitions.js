const assert = require('assert/strict');
const {
  validateOrderStatusTransitionWithAudit,
  validateItemFulfillmentTransition,
} = require('../dist/orders/status-transitions');

const allSideEffects = {
  payment: true,
  warehouse: true,
  notification: true,
  crm: true,
  channel: true,
};

function approval(overrides = {}) {
  return {
    approved: true,
    approvalType: 'human',
    reasonCode: 'CUSTOMER_REQUEST',
    sideEffectsHandled: allSideEffects,
    ...overrides,
  };
}

function actor(overrides = {}) {
  return {
    sub: 'orders-owner-1',
    email: 'orders.owner@example.invalid',
    ...overrides,
  };
}

function assertOrderAllowed(current, requested, items = [], context = {}) {
  const result = validateOrderStatusTransitionWithAudit(current, requested, items, context);
  assert.equal(result.status, requested);
  return result;
}

function assertOrderRejected(current, requested, expectedMessage, items = [], context = {}) {
  assert.throws(
    () => validateOrderStatusTransitionWithAudit(current, requested, items, context),
    (error) => error instanceof Error && error.message.includes(expectedMessage),
  );
}

function assertItemAllowed(current, requested) {
  assert.equal(validateItemFulfillmentTransition(current, requested), requested);
}

function assertItemRejected(current, requested, expectedMessage) {
  assert.throws(
    () => validateItemFulfillmentTransition(current, requested),
    (error) => error instanceof Error && error.message.includes(expectedMessage),
  );
}

const shippedItems = [{ fulfillmentStatus: 'shipped' }, { fulfillmentStatus: 'delivered' }];
const deliveredItems = [{ fulfillmentStatus: 'delivered' }, { fulfillmentStatus: 'delivered' }];

assertOrderAllowed('pending', 'confirmed');
assertOrderAllowed('confirmed', 'processing');
assertOrderAllowed('processing', 'shipped', shippedItems);
assertOrderAllowed('shipped', 'delivered', deliveredItems);
assertOrderAllowed(' pending ', 'confirmed');

assertOrderRejected('pending', 'processing', 'Invalid order status transition');
assertOrderRejected('processing', 'shipped', 'every item is shipped or delivered', [{ fulfillmentStatus: 'reserved' }]);
assertOrderRejected('shipped', 'delivered', 'every item is delivered', shippedItems);
assertOrderRejected('delivered', 'processing', 'Destructive terminal-state corrections');
assertOrderRejected('cancelled', 'confirmed', 'Destructive terminal-state corrections');
assertOrderRejected('pending', 'refunded', 'Payments-owned');
assertOrderRejected('pending', 'unknown_status', 'Unrecognized order status');

for (const current of ['pending', 'confirmed', 'processing']) {
  const now = new Date('2026-06-13T10:00:00.000Z');
  const result = assertOrderAllowed(current, 'cancelled', [], {
    approval: approval({ reasonCode: ' customer_request ' }),
    actor: actor(),
    now,
  });

  assert.deepEqual(result.approvalAudit, {
    approved: true,
    approvalType: 'human',
    approvedBy: 'orders.owner@example.invalid',
    actorId: 'orders-owner-1',
    actorEmail: 'orders.owner@example.invalid',
    reasonCode: 'CUSTOMER_REQUEST',
    sideEffectsHandled: allSideEffects,
    previousStatus: current,
    requestedStatus: 'cancelled',
    resultingStatus: 'cancelled',
    approvedAt: now.toISOString(),
  });
}

const fallbackApproval = assertOrderAllowed('pending', 'cancelled', [], {
  approval: approval({ approvedBy: 'support-lead' }),
  now: new Date('2026-06-13T11:00:00.000Z'),
});
assert.equal(fallbackApproval.approvalAudit.approvedBy, 'support-lead');

assertOrderRejected('pending', 'cancelled', 'approval.approved=true');
assertOrderRejected('pending', 'cancelled', 'approval.approvalType=human', [], {
  approval: approval({ approvalType: 'automation' }),
  actor: actor(),
});
assertOrderRejected('pending', 'cancelled', 'approval.reasonCode', [], {
  approval: approval({ reasonCode: 'no' }),
  actor: actor(),
});
assertOrderRejected('pending', 'cancelled', 'side-effect acknowledgements for: warehouse', [], {
  approval: approval({ sideEffectsHandled: { ...allSideEffects, warehouse: false } }),
  actor: actor(),
});
assertOrderRejected('shipped', 'cancelled', 'Invalid order status transition');

assertItemAllowed('pending', 'reserved');
assertItemAllowed('reserved', 'shipped');
assertItemAllowed('shipped', 'delivered');
assertItemAllowed(' shipped ', 'delivered');
assertItemRejected('pending', 'shipped', 'Invalid item fulfillment transition');
assertItemRejected('reserved', 'pending', 'Invalid item fulfillment transition');
assertItemRejected('delivered', 'shipped', 'terminal');
assertItemRejected('pending', 'returned', 'owner-approved schema and API workflow');
assertItemRejected('pending', 'lost', 'Unrecognized item fulfillment status');

console.log('status transition verification ok');
