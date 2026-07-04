2026-07-04: Goal 24 Orders consumed Payments `445c4e7 docs: add goal24 pre side effect packet` source-only. [RESOLVED/NARROWED: Orders consumed Payments 445c4e7 pre-side-effect runtime execution packet as source-only provider-authenticity handoff evidence; Orders route invocation remains blocked until a separate current side-effect execution window, exact future payment/order/provider hashes, provider proof or unpaid acknowledgement, Orders actor/reason/idempotency/sideEffectsHandled, deterministic Warehouse reservation lookup state, channel acknowledgement, and final redacted evidence exist] Remaining hard stops: [MISSING: current side-effect execution window owned by a separate newer integration owner thread]; [MISSING: future paymentId/orderId/variableSymbolHash/providerTransactionHash for exact smoke]; [MISSING: concrete side-effectful rollback run id and cleanup idempotency keys derived from the future approval id and sanitized payment hash]; [MISSING: Fiobanka provider-side completed-transfer refund/reversal/correction proof hash, or owner-approved unpaid no-provider-cancel acknowledgement]; [MISSING: exact Orders target order hash/state, cancellation actor, approval id, safe reason code, idempotency key, and sideEffectsHandled payment|warehouse|notification|crm|channel acknowledgements for the future smoke]; [MISSING: exact selected Warehouse reservation lookup state for cleanup]; [MISSING: owner-approved channel side-effect acknowledgement for the selected central order hash]; [MISSING: final redacted evidence path for required provider, Orders, Warehouse, and channel cleanup proof]; [MISSING: official/native Fio Banka callback signature contract if provider-authentic bank-originated signatures are required]. Boundary: mutation: false; live_checkout_executed: false; checkout_created: false; payment_created: false; provider_call: false; polling_mutation: false; refund_or_reversal: false; orders_route_invocation: false; orders_mutation: false; warehouse_reservation: false; warehouse_mutation: false; warehouse_cleanup: false; channel_cleanup_mutation: false; deployment: false; migration: false; db_write: false; secret_output: false; token_output: false; raw_provider_payload_output: false; raw_customer_or_payment_evidence: false. Report: reports/validation/VAL-GOAL-24-orders-consume-payments-pre-side-effect-packet-445c4e7-2026-07-04.md.
2026-07-04: Goal 24 Orders consumed Payments `4f21094 docs: record goal24 payments owner authority intake` source-only. [RESOLVED/NARROWED: Orders consumed Payments 4f21094 owner authority intake naming Sergey Stasok / Сергей Сташок as Payments/provider rollback owner, bank/refund authority, and bank/refund executor for Goal 24 runtime planning; Orders route invocation remains blocked until exact target order hash/state, Orders actor/reason/idempotency/sideEffectsHandled, provider proof, exact Warehouse reservation lookup state, channel acknowledgement, and final redacted evidence exist] Remaining hard stops: [MISSING: future paymentId/orderId/variableSymbolHash/providerTransactionHash for exact smoke]; [MISSING: Fiobanka provider-side completed-transfer refund/reversal/correction proof hash, or owner-approved unpaid no-provider-cancel acknowledgement]; [MISSING: concrete side-effectful rollback run id and cleanup idempotency keys derived from the future approval id and sanitized payment hash]; [MISSING: exact Orders target order hash/state, cancellation actor, approval id, safe reason code, idempotency key, and sideEffectsHandled payment|warehouse|notification|crm|channel acknowledgements for the future smoke]; [MISSING: exact selected Warehouse reservation lookup state for cleanup]; [MISSING: owner-approved channel side-effect acknowledgement for the selected central order hash]; [MISSING: final redacted evidence path for required provider, Orders, Warehouse, and channel cleanup proof]. Boundary: mutation: false; live_checkout_executed: false; checkout_created: false; payment_created: false; provider_call: false; refund_or_reversal: false; orders_route_invocation: false; orders_mutation: false; warehouse_reservation: false; warehouse_mutation: false; warehouse_cleanup: false; channel_cleanup_mutation: false; deployment: false; migration: false; db_write: false; secret_output: false; token_output: false; raw_provider_payload_output: false; raw_customer_or_payment_evidence: false. Report: reports/validation/VAL-GOAL-24-orders-consume-payments-owner-authority-4f21094-2026-07-04.md.
# Goal 24 Orders Final Owner Handoff Packet

```yaml
id: ORDERS-GOAL24-FINAL-OWNER-HANDOFF-PACKET
status: source-defined-runtime-hard-stopped
owner: orders-lifecycle-owner
created: 2026-07-04
scope: Orders-owned final owner handoff for future paid/provider cleanup after Fiobanka completion, refund, reversal, or correction
```

## Intent Preservation Chain

Vision -> Goal Impact -> System -> Feature -> Task -> Execution Plan -> Coding Prompt -> Code -> Validation -> State Update

- Vision: paid/provider cleanup may mutate Orders only when provider truth, order lifecycle correction, Warehouse component cleanup, and channel cleanup are all owner-approved, idempotent, and redacted before the first side effect.
- Goal Impact: the remaining Orders runtime blockers are consolidated into one owner-facing handoff packet without weakening `[MISSING: ...]` hard stops.
- System: Payments owns Fiobanka provider/payment/refund proof and bank/refund authority. Orders owns cancellation actor, reason, idempotency, side-effect acknowledgement gate, route invocation, and the Warehouse handoff trigger. Warehouse owns component reservation lookup state and stock effects. FlipFlop/channel owns checkout initiation, cart/session/local projection cleanup, and selected-order channel acknowledgement. Catalog owns bundle identity and approval planning.
- Feature: final Orders owner handoff packet for Goal 24 paid/provider cleanup.
- Task: enumerate every runtime field that must be supplied before `PUT /api/orders/:id/status` can be used for the future selected smoke.
- Execution Plan: docs/verifier/report only. Do not run live checkout, payment creation, provider calls, polling, refund/reversal, Orders route invocation, Warehouse mutation, channel cleanup, deploy, migration, DB read/write, secret/token output, raw provider payload output, or raw order/customer/payment evidence output.
- Coding Prompt: fail closed; preserve all unavailable facts as `[MISSING: ...]`; do not infer Warehouse stock effects from Payments refund state, Orders no-go state, Catalog bundle identity, or FlipFlop checkout/channel readiness.
- Code: this packet, `reports/validation/VAL-GOAL-24-orders-final-owner-handoff-packet-2026-07-04.md`, status/state top-line markers, `scripts/verify-goal24-final-source-only-owner-handoff-packet.js`, and `scripts/verify-goal24-paid-provider-bundle-readiness.js`.
- Validation: `npm run verify:goal24-paid-provider-bundle-readiness`, `node --check scripts/verify-goal24-paid-provider-bundle-readiness.js`, and `git diff --check`.
- State Update: [RESOLVED/NARROWED: Orders final owner handoff packet is source-defined for Goal 24 paid/provider cleanup after Catalog 7c85732 and FlipFlop 99dfe76 plus Payments 4f21094 owner authority; runtime route invocation remains hard-stopped until exact future payment/order/provider hashes, Orders actor/reason/idempotency/sideEffectsHandled, exact Warehouse reservation lookup state, channel acknowledgement, provider proof, and final redacted evidence exist]


## Consumed Current Heads

- Orders `434b1de docs: consume goal24 catalog flipflop no-go heads`
- Payments `cc49c08 docs: record goal24 live no-go preflight`
- Warehouse `eee2f20 docs: consume goal24 orders no-go preflight`
- Catalog `7c85732 docs: consume goal24 orders warehouse no-go heads`
- FlipFlop `99dfe76 docs: consume goal24 current no-go heads`

These heads are source-governance evidence only. They do not authorize checkout, payment creation, provider calls, refund/reversal, Orders route invocation, Warehouse mutation, channel cleanup, deploy, migration, DB write, secret/token output, raw provider payload output, or raw order/customer/payment evidence output.

## Non-Approval Boundary

This packet is a source-only handoff checklist. It does not approve live checkout, payment creation, provider calls, polling, Fiobanka refund/reversal, bank transfer, Orders mutation, Warehouse mutation, channel cleanup, deployment, migration, DB read/write, secret/token handling, raw evidence output, or marketplace/customer-visible side effects.

Any `[MISSING: ...]` value below is a hard stop before the next side effect.

## Required Runtime Fields

| Area | Required runtime value | Current state |
| --- | --- | --- |
| Final approval intake | Approval id, time window, amount cap, provider/method, environment, target bundle, component quantities, and one-attempt limit | `[RESOLVED/NARROWED: owner-approved bounded paid/provider smoke intake GOAL24-PAID-PROVIDER-SMOKE-20260704-CODEX-OWNER-APPROVED-003 covers Fiobanka QR, flipflop-service, catalog.bundle.v1 919be990-1c76-4f9c-b100-829281c6a709, component qty 1 each, max 300 CZK, one attempt, window 2026-07-04T09:00:08+02:00 through 2026-07-04T23:59:59+02:00 Europe/Prague, and sanitized evidence path reports/validation/VAL-GOAL-24-live-paid-provider-runtime-evidence-2026-07-04.md; runtime remains blocked until bank/refund authority, exact provider proof, Orders/Warehouse packets, and final redacted evidence exist]` |
| Payments/provider authority | Named human Payments/provider rollback owner with bank/refund authority and evidence review responsibility | `[RESOLVED/NARROWED: Sergey Stasok / Сергей Сташок is the owner-stated human Payments/provider rollback execution owner with bank/refund authority for runtime planning]` |
| Bank/refund executor | Named executor, exact destination/source account proof, amount, reference, deadline, and redacted completion evidence | `[RESOLVED/NARROWED: Sergey Stasok / Сергей Сташок is the owner-stated bank/refund executor for runtime planning]`; `[MISSING: exact destination/source account proof, amount, reference, deadline, and redacted completion evidence for the future linked payment]` |
| Payment identity | Sanitized payment id hash, central Orders UUID hash, variable-symbol hash, provider transaction hash, amount, currency, provider state, and source of truth | `[MISSING: future paymentId/orderId/variableSymbolHash/providerTransactionHash for exact smoke]` |
| Provider proof | Redacted Fiobanka completion plus refund/reversal/correction proof, or unpaid no-provider-cancel acknowledgement before payment completion | `[MISSING: Fiobanka provider-side completed-transfer refund/reversal/correction proof hash, or owner-approved unpaid no-provider-cancel acknowledgement]` |
| Rollback run id | Concrete side-effectful rollback run id and replay-safe service cleanup keys derived from approval id plus sanitized payment hash | `[MISSING: concrete side-effectful rollback run id and cleanup idempotency keys derived from the future approval id and sanitized payment hash]` |
| Orders target | Target central Orders UUID hash and current Orders state immediately before cleanup | `[MISSING: exact Orders target order hash/state]` |
| Orders actor | Named human Orders cleanup actor or `approvedBy` Auth subject; Payments service identity, Catalog planning owner, FlipFlop channel executor, and Codex operator alone are not sufficient | `[MISSING: named runtime Orders cancellation actor/approvedBy]` |
| Orders approval | `approval.approved=true`, `approval.approvalType=human`, approval id, safe reason code, sanitized idempotency key, and provider proof hash or unpaid acknowledgement | `[MISSING: exact Orders target order hash/state, cancellation actor, approval id, safe reason code, idempotency key, and sideEffectsHandled payment|warehouse|notification|crm|channel acknowledgements for the future smoke]` |
| Side-effect acknowledgements | `sideEffectsHandled.payment|warehouse|notification|crm|channel=true` for the same target central order hash | `[MISSING: owner-approved payment/warehouse/notification/crm/channel sideEffectsHandled acknowledgements for the selected central order hash]` |
| Warehouse packet | Component hashes, selected reservation lookup state, Warehouse operation decision, and final owner approval for the observed component-line state | `[MISSING: exact selected Warehouse reservation lookup state for cleanup]` |
| Channel packet | FlipFlop/channel acknowledgement for cart/session/local projection cleanup and customer-visible retry state for the same central order hash | `[MISSING: owner-approved channel side-effect acknowledgement for the selected central order hash]` |
| Evidence path | Final report path with hashes/statuses/counts/booleans only | `[MISSING: final redacted evidence path for required provider, Orders, Warehouse, and channel cleanup proof]` |

## Orders Runtime Packet Shape

The future exact packet must supply all fields below before Orders route invocation:

```yaml
route: PUT /api/orders/:id/status
targetStatus: cancelled
targetOrderHash: "[MISSING: exact Orders target order hash/state]"
targetOrderState: pending|confirmed|processing
actorOrApprovedBy: "[MISSING: named runtime Orders cancellation actor/approvedBy]"
approval:
  approved: true
  approvalType: human
  approvalId: "[MISSING: approval id for the future selected smoke]"
  reasonCode: GOAL24_PAID_PROVIDER_ROLLBACK | GOAL24_PROVIDER_UNPAID_CANCEL
  idempotencyKey: "[MISSING: Orders cleanup idempotency key]"
providerEvidenceHash: "[MISSING: Fiobanka provider-side completed-transfer refund/reversal/correction proof hash, or owner-approved unpaid no-provider-cancel acknowledgement]"
sideEffectsHandled:
  payment: "[MISSING: payment side-effect acknowledgement]"
  warehouse: "[MISSING: warehouse side-effect acknowledgement]"
  notification: "[MISSING: notification side-effect acknowledgement]"
  crm: "[MISSING: crm side-effect acknowledgement]"
  channel: "[MISSING: channel side-effect acknowledgement]"
warehouseDecision: "[MISSING: exact selected Warehouse reservation lookup state for cleanup]"
evidencePath: "[MISSING: final redacted evidence path for required provider, Orders, Warehouse, and channel cleanup proof]"
```

Allowed reason codes:

- `GOAL24_PAID_PROVIDER_ROLLBACK` only after completed Fiobanka payment plus owner-proven refund, reversal, or correction.
- `GOAL24_PROVIDER_UNPAID_CANCEL` only for an owner-approved unpaid pre-completion cancellation where no provider refund is required.

Forbidden reason contents: raw order id, raw payment id, bank reference, provider transaction id, token value, account number, card/customer data, raw provider payload, raw DB row excerpt, or free-text customer data.

Required idempotency namespaces:

- `payments:goal24:fiobanka-refund:<approvalId>:<paymentHash>`
- `orders:goal24:post-paid-correction:<approvalId>:<paymentHash>`
- `warehouse:goal24:component-cleanup:<approvalId>:<paymentHash>:<componentHash>`
- `channel:goal24:checkout-cleanup:<approvalId>:<paymentHash>`

The future Orders key must be sanitized, unused before the first side effect, replayable only for the same request hash, and captured in redacted evidence. Missing key, collision, mismatched request hash, ambiguous prior use, or owner mismatch is a hard stop.

## Exact Orders-To-Warehouse Handoff

Payments does not choose Warehouse stock effects. Payments supplies provider/payment evidence to Orders. Orders decides whether the lifecycle gate is satisfied, then calls Warehouse only through the Orders-owned Warehouse client and only after all side-effect acknowledgements exist.

| Runtime condition | Payments input to Orders | Orders decision | Warehouse handoff | Rule |
| --- | --- | --- | --- | --- |
| Fiobanka QR unpaid before provider completion | `orders.payment-status.v1 status=failed` or `status=cancelled` | pre-paid release path, no refund proof required | `POST /api/reservations/release` with `PAYMENT_FAILED_RELEASE` | Allowed only before `paymentStatus=paid`. |
| Fiobanka completion accepted | `orders.payment-status.v1 status=completed` | mark paid/confirm per source policy | `POST /api/reservations/fulfill` with `PAYMENT_CONFIRMED` | Success path only; not cleanup proof. |
| Completed Fiobanka transfer later refunded/reversed/corrected and order is `pending`, `confirmed`, or `processing` | provider proof hash in owner packet, not `refunded` over bridge | owner-approved Orders cancellation with `GOAL24_PAID_PROVIDER_ROLLBACK` | `POST /api/reservations/cancel` with `ORDER_CANCELLED` | Requires all side-effect acknowledgements and Warehouse owner approval. |
| Delivered/customer-received or inventory-return evidence exists | separate owner-approved return packet | return workflow, not normal cancellation | `POST /api/reservations/return` with `ORDER_RETURNED` | `[MISSING: owner-approved Orders return workflow for Goal 24 paid/provider cleanup when delivered/customer-received state exists]`. |
| Partial component-line or mixed Warehouse state | line-by-line Warehouse owner matrix | per-line decision only after Orders gate | `release`, `cancel`, or `return` per component line | Unknown line fails closed. |
| Unknown Warehouse component state | none | no route call for cleanup | none | Fail closed. |

Orders must not infer Warehouse stock effects from Payments refund state, Orders no-go state, Catalog bundle identity, FlipFlop checkout/channel readiness; Orders must not infer Warehouse stock effects from Payments refund state, Orders no-go state, Catalog bundle identity, or FlipFlop checkout/channel readiness, provider notes, local payment metadata, Auth token state, or channel cleanup state.

## Abort Rules

Stop before the next side effect when any of these are true:

- Any required runtime owner, actor, executor, exact hash, idempotency key, acknowledgement, or evidence path remains `[MISSING: ...]`.
- Provider proof is ambiguous, unredacted, duplicate, mismatched, pending authorization only, or not tied to the target payment hash.
- Orders cleanup actor is missing or is only a service/Codex identity.
- Orders reason code is not one of the two Goal 24 safe reason codes.
- Orders route invocation would occur before `sideEffectsHandled.payment|warehouse|notification|crm|channel=true`.
- Warehouse cleanup would be inferred from Payments refund state instead of an Orders/Warehouse-owned state matrix.
- Channel cleanup owner/evidence is missing for the same target order hash.
- Any command would output tokens, raw provider payloads, full bank data, card/customer data, raw DB rows, raw order ids, raw payment ids, or raw channel order ids.

## Parallel Execution

| Workstream | Status | Owner role | Allowed scope | Remaining blocker | Merge order |
| --- | --- | --- | --- | --- | --- |
| Payments provider/refund authority | blocked | named human with bank/refund authority | Payments provider/refund packet and redacted proof | `[RESOLVED/NARROWED: Sergey Stasok / Сергей Сташок is the owner-stated human Payments/provider rollback execution owner with bank/refund authority for runtime planning]` | 1 |
| Orders owner handoff packet | complete-source-only | Orders lifecycle owner | Orders docs/verifier/source gate | exact future actor, target, reason, idempotency, sideEffectsHandled | 2 |
| Warehouse cleanup packet | dependency-gated | Warehouse reservation owner | Warehouse docs/verifier/source gate and selected reservation lookup | `[MISSING: exact selected Warehouse reservation lookup state for cleanup]` | 3 |
| FlipFlop channel acknowledgement | dependency-gated | FlipFlop/channel owner | channel docs/verifier/source gate and selected-order cleanup acknowledgement | `[MISSING: owner-approved channel side-effect acknowledgement for the selected central order hash]` | 4 |
| Final runtime execution | blocked-final-integration | runtime validation owner | one approved side effect at a time | all `[MISSING: ...]` fields above | 5 |

## State Update

Decision: `block` for side-effectful runtime progression; `ready-source-handoff` for owner review.

[RESOLVED/NARROWED: Orders final owner handoff packet is source-defined for Goal 24 paid/provider cleanup after Catalog 7c85732 and FlipFlop 99dfe76 plus Payments 4f21094 owner authority; runtime route invocation remains hard-stopped until exact future payment/order/provider hashes, Orders actor/reason/idempotency/sideEffectsHandled, exact Warehouse reservation lookup state, channel acknowledgement, provider proof, and final redacted evidence exist]

Runtime remains blocked by [RESOLVED/NARROWED: Sergey Stasok / Сергей Сташок is the owner-stated human Payments/provider rollback execution owner with bank/refund authority for runtime planning]; [MISSING: exact destination/source account proof, amount, reference, deadline, and redacted completion evidence for the future linked payment]; [MISSING: future paymentId/orderId/variableSymbolHash/providerTransactionHash for exact smoke]; [MISSING: Fiobanka provider-side completed-transfer refund/reversal/correction proof hash, or owner-approved unpaid no-provider-cancel acknowledgement]; [MISSING: exact Orders target order hash/state, cancellation actor, approval id, safe reason code, idempotency key, and sideEffectsHandled payment|warehouse|notification|crm|channel acknowledgements for the future smoke]; [MISSING: exact selected Orders cleanup packet runtime values and sideEffectsHandled acknowledgements]; [MISSING: exact selected Warehouse reservation lookup state for cleanup]; [MISSING: owner-approved channel side-effect acknowledgement for the selected central order hash]; [MISSING: final redacted evidence path for required provider, Orders, Warehouse, and channel cleanup proof].

Boundary: mutation: false; live_checkout_executed: false; checkout_created: false; payment_created: false; provider_call: false; refund_or_reversal: false; orders_route_invocation: false; orders_mutation: false; warehouse_reservation: false; warehouse_mutation: false; warehouse_cleanup: false; channel_cleanup_mutation: false; deployment: false; migration: false; db_write: false; secret_output: false; token_output: false; raw_provider_payload_output: false; raw_customer_or_payment_evidence: false.

Next step: Supply the missing owner-approved runtime fields before any live paid/provider smoke, refund/reversal, Orders route invocation, Warehouse mutation, or channel cleanup.
