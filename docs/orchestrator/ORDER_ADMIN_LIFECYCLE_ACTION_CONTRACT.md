# Orders Admin Lifecycle Action Contract

```yaml
id: ORDER-ADMIN-LIFECYCLE-ACTION-CONTRACT
status: approved-source-contract
owner: Orders lifecycle owner
created: 2026-07-05
last_updated: 2026-07-05
completeness_level: source_validated
upstream:
  - docs/orchestrator/ORDER_STATUS_TRANSITIONS.md
  - src/admin/admin.controller.ts
  - src/admin/admin.service.ts
  - src/orders/orders.controller.ts
  - src/orders/orders.service.ts
downstream:
  - flipflop/reports/validation/2026-07-05-w6b-flipflop-admin-status-authority-contract.md
  - reports/validation/VAL-W7B-flipflop-admin-status-authority-closed-2026-07-05.md
```

## Intent Preservation Chain

Vision -> Orders is the canonical lifecycle authority for every marketplace order.

Goal Impact -> Selling platforms must not mutate local lifecycle truth for central-owned orders; approved human lifecycle actions run through Orders-owned command paths and state-machine gates.

System -> Orders owns lifecycle status, status transition validation, lifecycle events, and Warehouse cancellation handoff. Payments owns provider payment/refund truth. Warehouse owns reservations, stock and fulfillment state. Marketplace services own channel UI and channel-local notes.

Feature -> Admin lifecycle actions for central orders are performed through an Orders-owned action workflow, not channel-local Prisma writes.

Task -> Formalize the safe Orders command surface that W6-B FlipFlop can depend on while preserving fail-closed behavior for missing channel-admin routing.

Execution Plan -> Reuse the existing Orders admin operations action route, make the generic status route explicitly action-role gated, document permitted payloads and blockers, and verify the contract by source checks.

Coding Prompt -> Do not invent refund/payment/warehouse/provider semantics. Permit only status transitions already accepted by `ORDER_STATUS_TRANSITIONS`; cancellation requires human approval and all side-effect acknowledgements.

Code -> `src/admin/admin.controller.ts`, `src/admin/admin.service.ts`, `src/orders/orders.controller.ts`, `src/orders/orders.service.ts`, `src/orders/status-transitions.ts`, `scripts/verify-order-admin-lifecycle-action-contract.js`.

Validation -> `npm run verify:order-admin-lifecycle-action-contract`, `npm run verify:admin-operations-console`, `npm run verify:status-update-idempotency`, `npm run verify:transitions`, `npm run build`, `git diff --check`.

## Approved Command Surface

Service callers follow the [canonical service identity standard](../../../auth-microservice/docs/SERVICE_IDENTITY_CONSUMER_STANDARD.md).

The Orders-owned admin lifecycle command is:

- `POST /api/admin/operations/actions/order-status`
- Required role: `global:superadmin` or `internal:orders-microservice:action-admin` through `ADMIN_ACTION_ROLES`.
- Request body: `orderId`, `status`, optional `approval`.
- Implementation: `AdminController.applyOrderStatusAction -> AdminService.applyOrderStatusAction -> OrdersService.updateStatus`.
- Read-only roles such as `internal:orders-microservice:admin`, `internal:orders-microservice:readonly`, and channel service roles are not action roles.

The lower-level status route is also action-role gated:

- `PUT /api/orders/:id/status`
- Required role: `global:superadmin` or `internal:orders-microservice:action-admin` through `ORDER_STATUS_UPDATE_ROLES`.
- Implementation: `OrdersController.updateStatus -> OrdersService.updateStatus`.

## Allowed Status Actions

The action workflow may request only statuses accepted by `validateOrderStatusTransitionWithAudit`:

- Normal forward path: `pending -> confirmed -> processing -> shipped -> delivered`.
- `processing -> shipped` requires every active item to be at least shipped.
- `shipped -> delivered` requires every active item to be delivered.
- `pending|confirmed|processing -> cancelled` is allowed only with human approval and side-effect acknowledgements.

## Cancellation Approval Packet

Cancellation requires:

- `approval.approved=true`
- `approval.approvalType=human`
- Auth actor identity or `approval.approvedBy`
- safe `approval.reasonCode`
- `approval.sideEffectsHandled.payment=true`
- `approval.sideEffectsHandled.warehouse=true`
- `approval.sideEffectsHandled.notification=true`
- `approval.sideEffectsHandled.crm=true`
- `approval.sideEffectsHandled.channel=true`
- optional safe `approval.idempotencyKey` for replay protection

## Forbidden Through This Contract

- Marketplace services must not map local admin forms directly to `orders.status` or `orders.paymentStatus`.
- Channel service roles must not be granted generic lifecycle mutation privileges.
- Paid payment downgrades, refunds, provider corrections, payment reference replacement, Warehouse stock corrections, delivery-provider truth, and terminal-state destructive corrections are outside this command surface.
- Refund-like status strings remain Payments-owned and are rejected by the status transition validator.

## FlipFlop W6-B Integration Rule

FlipFlop correctly fails closed for local status/payment edits on central-owned orders. Future FlipFlop admin integration may call Orders only after it can supply an Auth-backed `global:superadmin` or `internal:orders-microservice:action-admin` actor and this exact action packet. Until then, FlipFlop must keep status/payment controls disabled and allow only channel-local notes.

## Remaining Gates

- `[MISSING: approved live action-admin session packet]` No live browser/API mutation proof was run.
- `[MISSING: FlipFlop route-to-Orders admin action implementation]` FlipFlop source currently fails closed and does not call this Orders action route.
- `[MISSING: payment/refund/provider correction workflow]` Payment-owned corrections remain explicitly outside this status action contract.
