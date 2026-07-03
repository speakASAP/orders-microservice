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


## Fiobanka Paid Provider Cleanup Approval Contract

This Orders-owned contract consumes the Payments Fiobanka rollback packet dated 2026-07-03 and remains fail-closed after Fiobanka completion, refund, or correction evidence.

### Preconditions

- Payments must prove the selected Fiobanka QR payment reached the relevant state through a bounded provider callback/reconciliation path. Orders accepts provider success only as `orders.payment-status.v1` with `status=completed`.
- Payments must prove any completed-transfer refund, reversal, or correction before Orders cancellation cleanup starts. Orders must not infer provider rollback from local `paymentStatus`, `refunded`, `refund`, `partially_refunded`, payment metadata, or a Payments local refund row.
- Runtime evidence must be redacted to hashes, statuses, counts, endpoint/status, approved ids, and booleans only. No raw provider payloads, raw order/customer/payment identifiers, raw DB rows, bank data, or token values may be printed.

### Cancellation Actor, Reason, And Idempotency

- Cancellation actor: the runtime packet must name the human Orders cleanup approver or Auth subject that supplies `approval.approvalType=human`. Payments service identity is not an Orders cancellation actor. If the exact actor is not named, keep `[MISSING: named Orders cancellation actor/approvedBy for Goal 24 paid/provider cleanup]`.
- Cancellation reason: use safe reason code `GOAL24_PAID_PROVIDER_ROLLBACK` for provider-refund/correction cleanup, or `GOAL24_PROVIDER_UNPAID_CANCEL` only for unpaid pre-completion cancellation. Free-text reasons, provider ids, customer data, bank references, and raw payment ids are forbidden.
- Idempotency: the runtime packet must provide an Orders cleanup idempotency key derived from sanitized facts only: approval id, central Orders UUID hash, Payments payment id hash, provider rollback evidence hash, target status, and Warehouse operation matrix version. Orders source now accepts optional `approval.idempotencyKey`, validates it as a sanitized 8-160 character key, and persists it in `orders.statusTransitionAudit` through migration `009_add_order_status_transition_audit.sql`; live cleanup remains `[RESOLVED: migration/deploy approval executed for persisted Orders cleanup idempotency key; migration pre_column_count=0 post_column_count=1, deployed image localhost:5000/orders-microservice:adddafb, health healthy]` until that migration/deploy is approved.

### Side-Effect Acknowledgements

Orders cancellation may call `PUT /api/orders/:id/status` with `status=cancelled` only when `approval.approved=true`, `approval.approvalType=human`, `approval.reasonCode` is one of the Goal 24 safe reason codes above, and all acknowledgement flags are true:

- `payment=true`: Payments owner has provided provider refund/reversal/correction proof or explicitly approved unpaid no-provider-cancel policy.
- `warehouse=true`: Warehouse owner has approved the line-by-line operation matrix for the observed component state.
- `notification=true`: notification owner has approved whether customer/admin notifications are suppressed, sent, or manually handled for the cleanup.
- `crm=true`: CRM/marketing owner has approved whether lead/order projections are retained, cancelled, or excluded.
- `channel=true`: FlipFlop/channel owner has approved cart/session/local projection cleanup for the same central order.

### Exact Orders-To-Warehouse Handoff

Orders invokes Warehouse only through `WarehouseReservationClient` after its own state gate passes:

| Observed state | Orders action | Warehouse endpoint | Reason code | Runtime decision |
| --- | --- | --- | --- | --- |
| Fiobanka QR created but unpaid, order still reserved/not fulfilled | Payments `failed` or `cancelled` status before paid | `POST /api/reservations/release` | `PAYMENT_FAILED_RELEASE` | allowed only before `paymentStatus=paid`; no provider refund call |
| Fiobanka completion accepted as paid | Payments `completed` status | `POST /api/reservations/fulfill`, then fulfillment handoff when configured | `PAYMENT_CONFIRMED` | success path only; not cleanup evidence |
| Completed Fiobanka transfer later refunded/reversed/corrected with provider proof, order is `pending|confirmed|processing` | Owner-approved Orders cancellation | `POST /api/reservations/cancel` | `ORDER_CANCELLED` | allowed only after all side-effect acknowledgements and Warehouse owner approval |
| Approved return workflow after fulfillment/customer receipt | separate owner-approved return workflow | `POST /api/reservations/return` | `ORDER_RETURNED` | not implemented as normal cancellation; only required when delivered/customer-received or return evidence exists; remains `[MISSING: owner-approved Orders return workflow for Goal 24 paid/provider cleanup when delivered/customer-received state exists]` |
| Partial component-line failure or mixed Warehouse state | line-by-line owner-approved matrix | `release`, `cancel`, or `return` per component line | matching reason above | fail closed for any unknown line |
| Unknown Warehouse component state | none | none | none | fail closed; do not infer stock effects from Payments refund state |

Orders must not mutate Warehouse directly, edit stock truth, downgrade `paymentStatus=paid`, consume `refunded` as `orders.payment-status.v1`, or treat a Payments refund/correction as permission to choose `release`, `cancel`, or `return` without the Warehouse-owned state matrix.
Orders must not infer stock effects from Payments refund state. `return` is not a default paid-provider refund cleanup path; it is gated by separate delivered/customer-received or inventory-return evidence. When the observed order is not delivered/customer-received and the provider refund/reversal/correction proof exists, the Orders-owned cleanup selector remains cancellation plus Warehouse `cancel` with `ORDER_CANCELLED`, subject to all side-effect acknowledgements.

## Required Owner-Approved Runtime Packet

A paid/provider `catalog.bundle.v1` bundle smoke is blocked until the packet names all of the following:

- `[RESOLVED/NARROWED: selected method is Fiobanka QR, paymentMethod=fiobanka, applicationId=flipflop-service, maximum 300 CZK, but live execution remains gated]`
- `[MISSING: Fiobanka provider-side completed-transfer refund/reversal/correction proof with redacted evidence]`
- `[RESOLVED/NARROWED: Payments emits bounded orders.payment-status.v1 for completed/failed/cancelled only; refunded is intentionally not bridged]`
- `[RESOLVED/NARROWED: Orders source accepts sanitized approval.idempotencyKey and persists statusTransitionAudit; runtime packet must still name target central Orders UUID hash, status before rollback, cleanup idempotency key, cancellation actor/approvedBy, reasonCode GOAL24_PAID_PROVIDER_ROLLBACK or GOAL24_PROVIDER_UNPAID_CANCEL, and payment/warehouse/notification/crm/channel side-effect acknowledgements]`
- `[RESOLVED/NARROWED: Warehouse owner-approved cleanup operation for reserved-only, fulfilled/stock-decremented cancellation, delivered/customer-received return, partial, and unknown bundle component-line states in Warehouse 3043cad; live stock window/max quantity remains missing]`
- `[RESOLVED/NARROWED: Orders return workflow is not required for normal Fiobanka completed-transfer refund/reversal/correction cleanup unless delivered/customer-received or inventory-return evidence exists; absent that evidence, cleanup remains cancellation plus Warehouse cancel after provider proof and side-effect acknowledgements]`
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

Orders can describe the future rollback choreography without bypassing Payments, but cannot prove side-effect-safe rollback alone. The remaining blocker is `[MISSING: owner-approved refund/cancel rollback plan proving provider refund or cancellation plus Orders/Warehouse cleanup]`. The former broad return-workflow ambiguity is narrowed: `return` remains `[MISSING: owner-approved Orders return workflow for Goal 24 paid/provider cleanup when delivered/customer-received state exists]`, but it is not a prerequisite for a non-delivered Fiobanka refund/reversal/correction cleanup packet that selects cancellation plus Warehouse `cancel`.
