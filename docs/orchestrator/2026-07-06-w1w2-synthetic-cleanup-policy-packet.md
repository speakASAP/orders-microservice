# W1/W2 Synthetic Lifecycle Cleanup Policy Packet

status: route_policy_defined_runtime_cleanup_blocked
created_at: 2026-07-06
packetId: W1W2-SYNTHETIC-CLEANUP-POLICY-2026-07-06
repository: /home/ssf/Documents/Github/orders-microservice
mutation: false
provider_call: false
deploy: false
raw_sensitive_output: forbidden

## Intent Preservation Chain

Vision -> Every synthetic lifecycle proof must preserve real stock/order correctness and must not leave ambiguous Warehouse side effects.

Goal Impact -> The W1/W2 buyer-bound proof remains valid while cleanup is moved from an undefined blocker to an explicit fail-closed route policy.

System -> Orders owns order lifecycle cancellation and approval audit. Warehouse owns reservation lookup and stock correction semantics. Payments/provider/channel/notification/CRM owners must acknowledge side effects before any cancellation cleanup.

Feature -> W1/W2 synthetic lifecycle cleanup decision packet.

Task -> Define the only source-supported cleanup route and the exact missing runtime evidence before either retaining or cancelling the W1/W2 synthetic evidence row.

Execution Plan -> Source-only documentation and verifier update; inspect existing Orders and Warehouse route semantics; do not run readback, route invocation, direct Warehouse mutation, database write, provider call, deploy, or cleanup.

Coding Prompt -> Do not invent cleanup semantics. Do not print raw order ids, tokens, customer/payment/provider/tracking payloads, raw DB rows, screenshots, or session material. Use route names, status names, hashes, counts, booleans, and `[MISSING: ...]` blockers only.

Code -> `docs/orchestrator/2026-07-06-w1w2-synthetic-cleanup-policy-packet.md`, `reports/validation/VAL-W7-W1W2-synthetic-cleanup-policy-2026-07-06.md`, `scripts/verify-w1w2-synthetic-cleanup-policy.js`, `package.json`, and W7 aggregation docs.

Validation -> `npm run verify:w1w2-cleanup-policy`; `npm run verify:w1w2-live-buyer-bound-proof`; `npm run verify:runtime-gate-packets`; `npm run verify:completion-audit`; `npm test`; `git diff --check`.

## Source-Supported Route Policy

Decision: `[RESOLVED/NARROWED: cleanup route/policy for W1/W2 synthetic lifecycle rows is defined as fail-closed Orders-owned cleanup decision packet; live retention or cancellation remains blocked until current redacted readback and owner side-effect acknowledgements exist]`.

The source-supported Orders route for a cleanup mutation is `PUT /api/orders/:id/status` with `status=cancelled`. The route is protected by `ORDER_STATUS_UPDATE_ROLES`, including `internal:orders-microservice:action-admin`, and calls `OrdersService.updateStatus`.

For `cancelled`, Orders source validates `approval.approved=true`, `approval.approvalType=human`, an Auth actor identity or `approval.approvedBy`, a safe uppercase `approval.reasonCode`, optional sanitized `approval.idempotencyKey`, and `approval.sideEffectsHandled.payment|warehouse|notification|crm|channel=true`.

If Orders accepts the cancellation transition, `OrdersService.updateStatus` calls `warehouseReservations.cancelOrderItems(updated)`. The Warehouse client posts `cancel` to `/api/reservations/cancel` for every order item, with actor `orders-microservice` and reason `ORDER_CANCELLED` unless a narrower owner-approved reason is supplied in source later.

Payment cleanup is not a payment-status downgrade. Orders source rejects changing a paid order back to pending, failed, or cancelled through `PUT /api/orders/:id/payment-status`; any paid rollback requires the separate owner-approved cancellation/correction workflow.

## Warehouse Readback And Operation Matrix

Before any live cleanup or no-cleanup retention decision, the approved packet must read current state without printing raw identifiers:

- Orders lifecycle/payment/fulfillment readback for the target central order, recorded as status names, booleans, counts, and hashes only.
- Warehouse reservation readback through `GET /api/reservations/order/:orderId`, recorded as status counts and product/warehouse/order/channel hashes only.

Warehouse source semantics:

| Current Warehouse evidence | Source-supported operation | Policy |
|---|---|---|
| Active reserved-only hold before payment fulfillment | `release` or Orders cancellation `cancel` if explicitly approved | Prefer `release` for payment failure; use Orders cancellation only when cancelling the order lifecycle. |
| Fulfilled reservation / stock already decremented | Orders cancellation -> Warehouse `cancel` only with owner-approved reversal/cancellation packet | Do not use `release`; it cannot release fulfilled rows. |
| Fulfilled reservation with customer return workflow | Warehouse `return` only through owner-approved inventory return workflow | Do not infer return from a smoke cleanup request. |
| Expired/released/cancelled/returned rows and zero active/fulfilled rows | `none` may be accepted after readback | No Warehouse mutation, but still record the retention/no-cleanup owner decision. |
| Duplicate, missing, aggregate, quantity-mismatched, product/warehouse/channel-mismatched rows | none | Fail closed; no mutation. |

The executed W1/W2 synthetic proof reached `paid` plus `warehouse_collecting`, so this packet does not claim that a default no-cleanup retention decision is generally acceptable. Retention is allowed only if an owner explicitly approves keeping the redacted synthetic evidence row after current readback.

## Required Runtime Cleanup Or Retention Packet

Any future live cleanup or explicit no-cleanup retention must include all of the following non-secret fields:

- packetId: stable W1/W2 cleanup or retention label.
- target: redacted central order hash and current state, never the raw order id in logs or reports.
- actor: approved Auth actor or `approvedBy` value, with `approvalType=human`.
- route: `PUT /api/orders/:id/status` with `status=cancelled` if cleanup mutation is selected.
- reasonCode: safe W1/W2-specific uppercase reason such as `W1W2_SYNTHETIC_CLEANUP_CANCEL`.
- idempotency: sanitized idempotency key label and same-request replay expectation.
- sideEffectsHandled: `payment=true`, `warehouse=true`, `notification=true`, `crm=true`, and `channel=true` as owner acknowledgements or explicit no-op acknowledgements.
- readback: redacted Orders readback and Warehouse `GET /api/reservations/order/:orderId` readback before and after any approved mutation.
- redaction: no raw tokens, raw IDs, raw customer/payment/provider/tracking payloads, raw DB rows, screenshots, or session material.

## Hard Stops

- `[MISSING: approved W1/W2 cleanup mutation or retention packet naming exact target hashes and actor]`.
- `[MISSING: current Orders lifecycle/payment/fulfillment readback before cleanup decision]`.
- `[MISSING: Warehouse reservation lookup via GET /api/reservations/order/:orderId before cleanup decision]`.
- `[MISSING: sideEffectsHandled.payment|warehouse|notification|crm|channel acknowledgements before cancellation cleanup]`.
- `[MISSING: explicit owner decision to retain the paid synthetic evidence row if no cleanup mutation is chosen]`.
- `[MISSING: same-request replay/idempotency proof for any future Orders cancellation route invocation]`.

## Forbidden Actions

This packet does not authorize direct DB deletion, direct Warehouse-only cleanup, payment downgrade after paid, provider refund/reversal, provider shipment movement, notification send, CRM mutation, marketplace provider write, browser/session capture, deploy, migration, raw token output, raw ID output, raw DB row output, raw customer/payment/provider/tracking output, or screenshots.

## Current Decision

The W1/W2 cleanup route/policy is now source-defined and machine-verifiable. Runtime cleanup remains blocked. Runtime no-cleanup retention also remains blocked until an owner explicitly chooses retention after redacted Orders and Warehouse readback. No cleanup mutation, retention decision, database write, provider call, deploy, token output, raw ID output, raw row output, or customer/payment/provider/tracking output occurred while preparing this packet.
