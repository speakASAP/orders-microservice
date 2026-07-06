# W7 W1/W2 Synthetic Cleanup Policy

status: route_policy_defined_runtime_cleanup_blocked
created_at: 2026-07-06
repository: /home/ssf/Documents/Github/orders-microservice
packet: docs/orchestrator/2026-07-06-w1w2-synthetic-cleanup-policy-packet.md
mutation: false
provider_call: false
deploy: false

## Intent Preservation Chain

Vision -> Synthetic lifecycle proof must not compromise Orders/Warehouse stock correctness.
Goal Impact -> The W1/W2 live buyer-bound proof can be aggregated with an explicit cleanup policy instead of an undefined cleanup-route blocker.
System -> Orders owns cancellation route/audit, Warehouse owns reservation state and stock effects, and payment/notification/CRM/channel owners must acknowledge side effects.
Feature -> W1/W2 cleanup route/policy source proof.
Task -> Define source-supported cleanup route, readback requirements, operation matrix, and blockers without running cleanup.
Execution Plan -> Inspect Orders and Warehouse source, add packet/report/verifier, update W7 aggregation docs, and run focused/full validation.
Coding Prompt -> Preserve hard stops, do not invent cleanup semantics, and do not expose raw sensitive runtime data.
Code -> `scripts/verify-w1w2-synthetic-cleanup-policy.js`, cleanup packet, this report, runtime gate contracts, W1/W2 proof report, status docs, and package script.
Validation -> `npm run verify:w1w2-cleanup-policy`; `npm run verify:w1w2-live-buyer-bound-proof`; `npm run verify:runtime-gate-packets`; `npm run verify:completion-audit`; `npm test`; `git diff --check`.

## Verdict

`[RESOLVED/NARROWED: cleanup route/policy for W1/W2 synthetic lifecycle rows is defined as fail-closed Orders-owned cleanup decision packet; live retention or cancellation remains blocked until current redacted readback and owner side-effect acknowledgements exist]`.

The previous missing item `[MISSING: cleanup route/policy for synthetic lifecycle smoke rows]` is narrowed: source now defines the route, policy, readback requirements, operation matrix, and hard stops. It is not closed as a live cleanup or live retention decision.

## Source Evidence

- Orders route: `PUT /api/orders/:id/status` protected by `ORDER_STATUS_UPDATE_ROLES`.
- Orders cancellation approval: `approval.approved=true`, `approval.approvalType=human`, actor or `approvedBy`, safe `reasonCode`, optional sanitized `idempotencyKey`, and `sideEffectsHandled.payment|warehouse|notification|crm|channel=true`.
- Orders cancellation handoff: `OrdersService.updateStatus` calls `warehouseReservations.cancelOrderItems(updated)` when status becomes `cancelled`.
- Paid rollback guard: `applyPaymentStatus` rejects paid-status downgrade; cleanup must not be modeled as a payment downgrade.
- Warehouse readback: `GET /api/reservations/order/:orderId` exists for pre-cleanup status lookup.
- Warehouse mutation semantics: `release` handles active holds, `fulfill` decrements stock, `cancel` handles active or fulfilled reservations, `return` is for fulfilled inventory return workflow, and `expire` handles active expired reservations.

## Remaining Runtime Hard Stops

- `[MISSING: approved W1/W2 cleanup mutation or retention packet naming exact target hashes and actor]`.
- `[MISSING: current Orders lifecycle/payment/fulfillment readback before cleanup decision]`.
- `[MISSING: Warehouse reservation lookup via GET /api/reservations/order/:orderId before cleanup decision]`.
- `[MISSING: sideEffectsHandled.payment|warehouse|notification|crm|channel acknowledgements before cancellation cleanup]`.
- `[MISSING: explicit owner decision to retain the paid synthetic evidence row if no cleanup mutation is chosen]`.
- `[MISSING: same-request replay/idempotency proof for any future Orders cancellation route invocation]`.

## Boundary

No cleanup route invocation, Warehouse mutation, direct Warehouse-only cleanup, direct DB write/delete, payment downgrade, provider call, provider refund/reversal, notification send, CRM mutation, marketplace provider write, deploy, migration, browser session, screenshot, token output, raw ID output, raw DB row output, or raw customer/payment/provider/tracking output occurred.
