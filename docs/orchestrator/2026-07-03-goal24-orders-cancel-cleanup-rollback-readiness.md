# Goal 24 Orders Cancel/Cleanup Rollback Readiness

Metadata:
  id: ORDERS-GOAL24-PAID-PROVIDER-CANCEL-CLEANUP-READINESS
  date: 2026-07-03
  role: Orders cancel/cleanup rollback readiness worker
  status: blocked-paid-provider-progression
  repository: /home/ssf/Documents/Github/orders-microservice
  branch: codex/goal24-orders-cancel-cleanup-gate

## Intent Preservation Chain

Vision -> Goal Impact -> System -> Feature -> Task -> Execution Plan -> Coding Prompt -> Code -> Validation -> State Update

- Vision: Catalog bundle checkout can progress only when product identity, payment provider effects, order lifecycle, and stock cleanup remain owned by their source services.
- Goal Impact: Orders narrows the broad Goal 24 rollback blocker to an Orders-expressible runtime packet: provider proof must arrive through Payments, and Orders/Warehouse cleanup must use existing approved lifecycle boundaries.
- System: Payments owns provider checkout, callback evidence, refund/cancel operations, and payment state proof. Orders owns canonical order lifecycle and bounded payment-status read model. Warehouse owns reservation, fulfillment, release, cancel, return, and stock truth. Catalog owns `catalog.bundle.v1` identity and policy references. FlipFlop/channel services own checkout UX and customer initiation.
- Feature: paid/provider `catalog.bundle.v1` checkout rollback readiness for Orders-owned cancel/cleanup policy.
- Task: verify whether paid/provider bundle rollback can be expressed without manual payment-state bypass and document the remaining owner-approved runtime packet.
- Execution Plan: inspect Orders create/payment/Warehouse/status contracts, Payments paid-provider rollback readiness, and Catalog `catalog.bundle.v1` status; update only Orders docs/verifier/state evidence; do not run live checkout, provider calls, refunds, order mutation, Warehouse mutation, deploy, migration, secret read, or production DB mutation.
- Coding Prompt: fail closed; mark unavailable provider/owner/runtime facts as `[MISSING: ...]`; do not invent a provider adapter, direct payment-state update, Warehouse stock shortcut, or channel cleanup owner.
- Code: this document plus verifier/status/report boundary documentation updates only.
- Validation: `npm run verify:goal24-paid-provider-bundle-readiness`, `npm run verify:payment-boundary`, `npm run verify:warehouse-handoff`, `npm run build`, and `git diff --check`.
- State Update: paid/provider runtime smoke remains blocked until the cross-service packet below is approved.

## Orders-Owned Rollback Expression

Orders can express a future paid/provider rollback only through these bounded paths:

1. Provider success evidence arrives from Payments through `orders.payment-status.v1` with `status=completed`; Orders maps it to `paymentStatus=paid`, confirms a pending order, and calls Warehouse `fulfill` with reason `PAYMENT_CONFIRMED`.
2. Provider failure or provider-side checkout cancellation before paid state arrives from Payments through `orders.payment-status.v1` with `status=failed` or `status=cancelled`; Orders records the bounded payment state and calls Warehouse `release` with reason `PAYMENT_FAILED_RELEASE`.
3. Completed provider payment rollback must be proven by Payments first as a provider refund or provider cancellation/reversal. Orders must not accept `refunded`, raw provider fields, or a downgrade from `paid` to `failed/cancelled/pending` through `orders.payment-status.v1`.
4. After provider-side refund/cancel proof exists, any Orders lifecycle cleanup must use the owner-approved cancellation workflow: `pending|confirmed|processing -> cancelled`, `approval.approved=true`, `approval.approvalType=human`, actor identity or `approvedBy`, safe `reasonCode`, and `sideEffectsHandled.payment|warehouse|notification|crm|channel=true`.
5. Orders-side cancellation cleanup follows Warehouse `3043cad`: reserved-only active component holds use Warehouse `release`; fulfilled/stock-decremented cancellation rollback uses Warehouse `cancel` with reason `ORDER_CANCELLED` only after the Orders cancellation gate passes; approved return workflows use Warehouse `return`; partial failures are cleaned line-by-line; unknown component reservation state has no approved operation and must fail closed. Orders must not invent local stock corrections.

This means paid/provider rollback can be expressed without manual payment-state bypass, but only after the owner-approved runtime packet proves the provider refund/cancel step and Warehouse cleanup semantics. Until then, Orders remains fail-closed.

## Required Owner-Approved Runtime Packet

A paid/provider `catalog.bundle.v1` bundle smoke is blocked until the packet names all of the following:

- `[MISSING: selected payment provider, environment, method, maximum amount, and whether the smoke is auth/capture, sale, cancel, reversal, or refund based]`
- `[MISSING: provider evidence source proving completed payment and provider refund/cancellation/reversal without raw provider payload leakage]`
- `[MISSING: Payments-owned callback/status/refund path that will emit only bounded orders.payment-status.v1 data to Orders]`
- `[MISSING: Orders target order selection, idempotency key, status before rollback, and approved cancellation actor/reason/side-effect acknowledgements]`
- `[RESOLVED/NARROWED: Warehouse owner-approved cleanup operation for reserved-only, fulfilled/stock-decremented, return, partial, and unknown bundle component-line states in Warehouse 3043cad; live stock window/max quantity remains missing]`
- `[MISSING: channel/FlipFlop checkout cleanup owner for customer-visible session/cart/local projection state]`
- `[MISSING: redacted evidence plan proving no tokens, raw provider payloads, card/customer data, raw DB rows, or raw order ids are printed]`

## Fail-Closed Policy

- Manual Orders payment-state edits are not an acceptable rollback substitute.
- Direct production DB updates are not an acceptable rollback substitute.
- Synthetic provider webhook/status simulation is not acceptable unless the owner approves it as a named sandbox/provider-fixture packet.
- Orders cannot mark a paid order unpaid, failed, cancelled-payment, refunded, or provider-corrected through `orders.payment-status.v1`.
- Warehouse cleanup must be performed by Warehouse endpoints through the Orders handoff client or by another owner-approved Warehouse packet, never by Orders editing stock truth.
- The current safe rungs remain Rung 1 non-mutating validation and Rung 2 pending-order create/reservation/payment-cancel release evidence.

## Parallel Execution

| Workstream | Status | Owner role | Objective | Allowed files | Forbidden files/actions | Dependencies | Validation evidence | Handoff notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Orders cancel/cleanup policy | complete in this branch | Orders rollback worker | Define the Orders-expressible rollback path and fail-closed blocker | Orders docs/verifier/state files | runtime mutations, migrations, deploy, source behavior changes | current Orders source and Payments/Catalog status | Orders verifier/build/diff-check | Integrates before any runtime smoke. |
| Payments provider rollback packet | dependency-gated | Payments provider owner | Prove provider refund/cancel/reversal path and bounded Orders status emission | Payments docs/tests/source only after approval | real payment/refund/provider mutation without approval | provider and method selected | `[MISSING]` | Must precede Orders cancellation cleanup evidence. |
| Warehouse cleanup semantics packet | complete-source-policy | Warehouse owner | Define component-line cleanup for reserved, fulfilled, return, partial-failure, and unknown states | Warehouse `3043cad` contract/docs/verifier | stock DB edits outside approved workflow | paid-provider target state matrix | Warehouse verifier/build/diff-check | Orders now maps calls to release/cancel/return/no-op by component state. |
| Channel checkout cleanup packet | dependency-gated | FlipFlop/channel owner | Define cart/session/local projection cleanup after provider rollback | channel docs/source if approved | external marketplace publication or provider mutation | selected channel and payment mode | `[MISSING]` | Keeps customer-visible state consistent. |
| Final integration smoke | final integration | Catalog/commerce integration owner | Run only after all packets are owner-approved and redaction plan is accepted | cross-repo evidence reports | unapproved checkout/refund/order/Warehouse mutation | all owner packets complete | `[MISSING]` | Merge order: Orders policy -> Payments -> Warehouse -> Channel -> integration. |

## State Update

Decision: `block` for paid/provider runtime progression.

Orders can describe the future rollback choreography without bypassing Payments, but cannot prove side-effect-safe rollback alone. The remaining blocker is `[MISSING: owner-approved refund/cancel rollback plan proving provider refund or cancellation plus Orders/Warehouse cleanup]`.
