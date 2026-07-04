# Goal 24 Orders Source-Only Current Heads Consumption

scope: source-only Orders consumer sync after Payments cc49c08, Catalog d1eef3d, Warehouse 686d49c, and FlipFlop 9a7c664

IPS: Vision -> paid/provider cleanup must mutate Orders only after provider-authentic payment evidence and a complete cleanup packet exist; Goal Impact -> Orders consumes current no-go/source-governance inputs without weakening cancellation actor, reason, idempotency, sideEffectsHandled, or Warehouse handoff gates; System -> Orders owns lifecycle correction and route invocation, Payments owns Fiobanka provider/payment/refund proof, Warehouse owns component reservation lookup state and stock effects, Catalog owns bundle approval planning, FlipFlop owns durable bundle-id migration/provider readiness and channel cleanup acknowledgement; Feature -> Goal 24 Orders current-head no-go consumer; Task -> align Orders readiness with Payments live no-go preflight, Catalog no-go consumption, Warehouse blocker wording, and FlipFlop durable migration provider marker; Execution Plan -> docs/verifier/report only, no live checkout, payment creation, provider call, refund/reversal, Orders route invocation, Warehouse mutation, channel cleanup, deploy, migration, DB write, secret/token/raw evidence output; Coding Prompt -> preserve [MISSING: ...] runtime facts, require explicit cancellation actor/reason/idempotency/sideEffectsHandled, and do not infer Warehouse stock effects from Payments refund state; Code -> docs/orchestrator/STATUS.md, docs/IMPLEMENTATION_STATE.md, docs/orchestrator/2026-07-03-goal24-orders-cancel-cleanup-rollback-readiness.md, reports/validation/VAL-GOAL-24-orders-paid-provider-bundle-readiness.md, scripts/verify-goal24-paid-provider-bundle-readiness.js; Validation -> npm run verify:goal24-paid-provider-bundle-readiness, node --check, and git diff --check.

State Update: [RESOLVED/NARROWED: Orders consumed Payments cc49c08 live no-go preflight, Catalog d1eef3d live no-go preflight consumption, Warehouse 686d49c blocker wording, and FlipFlop 9a7c664 durable migration provider marker as source-governance inputs only; runtime Orders route invocation and cleanup side effects remain blocked]

Consumed upstream markers:

- Payments `cc49c08 docs: record goal24 live no-go preflight`: `status: runtime-ready-but-side-effect-hard-stopped`; Decision: `block` before checkout/payment/provider side effects.
- Catalog `d1eef3d docs: consume goal24 live no-go preflight`: Catalog consumed Payments cc49c08 and Warehouse 686d49c as a hard stop, not runtime permission.
- Warehouse `686d49c docs: polish goal24 warehouse blocker wording`: hold duration and one-attempt final bounded reservation approval are source-defined for packet planning only, while exact selected reservation lookup state remains missing.
- FlipFlop `9a7c664 docs: sync goal24 durable migration provider marker`: durable migration/provider-readiness governance only; durable migration provider marker is not Orders cleanup authorization.

Orders-owned runtime packet remains:

- Route: `PUT /api/orders/:id/status` with `status=cancelled` only after all packet fields are present.
- Target: [MISSING: exact Orders target order hash/state]; allowed source-defined target states remain `pending|confirmed|processing` only.
- Actor: [MISSING: named runtime Orders cancellation actor/approvedBy]; must be a named human actor/approvedBy, not a generic automation phrase.
- Approval: [MISSING: approval id for the future selected smoke]; `approvalType=human` remains required for paid/provider cleanup.
- Reason: safe reason code remains source-defined as `GOAL24_PAID_PROVIDER_ROLLBACK` for provider-refund/reversal/correction cleanup or `GOAL24_PROVIDER_UNPAID_CANCEL` only for an owner-approved unpaid no-provider-cancel path.
- Idempotency: [MISSING: concrete side-effectful rollback run id and cleanup idempotency keys derived from the future approval id and sanitized payment hash]; future Orders key namespace remains `orders:goal24:post-paid-correction:<approvalId>:<paymentHash>` and the verifier fixture key is test-only.
- Acknowledgements: [MISSING: owner-approved payment/warehouse/notification/crm/channel sideEffectsHandled acknowledgements for the selected central order hash]; all `sideEffectsHandled.payment|warehouse|notification|crm|channel=true` must be present before route invocation.
- Provider proof: [MISSING: Fiobanka provider-side completed-transfer refund/reversal/correction proof hash, or owner-approved unpaid no-provider-cancel acknowledgement].
- Warehouse handoff: exact Orders-to-Warehouse handoff remains selected central order hash/state, approved cancellation actor/approvedBy, safe reason, cleanup idempotency key, sideEffectsHandled acknowledgements, Warehouse-owned reservation lookup state, and Warehouse operation decision. Orders must not infer Warehouse stock effects from Payments refund state.

Remaining runtime blockers:

- [MISSING: named human Payments/provider rollback execution owner with bank/refund authority for runtime]
- [MISSING: named bank/refund executor, exact destination/source account proof, amount, reference, deadline, and redacted completion evidence for the future linked payment]
- [MISSING: future paymentId/orderId/variableSymbolHash/providerTransactionHash for exact smoke]
- [MISSING: exact Orders target order hash/state, cancellation actor, approval id, safe reason code, idempotency key, and sideEffectsHandled payment|warehouse|notification|crm|channel acknowledgements for the future smoke]
- [MISSING: exact selected Orders cleanup packet runtime values and sideEffectsHandled acknowledgements]
- [MISSING: deterministic Warehouse component reservation state for cleanup]
- [MISSING: exact selected Warehouse reservation lookup state for cleanup]
- [MISSING: owner-approved channel side-effect acknowledgement for the selected central order hash]
- [MISSING: approved runtime route invocation evidence; do not call the route until all packet fields are present]
- [MISSING: final redacted evidence path for required provider, Orders, Warehouse, and channel cleanup proof]

Boundary evidence:

- mutation: false
- live_checkout_executed: false
- checkout_created: false
- payment_created: false
- payment_creation: false
- provider_call: false
- polling_mutation: false
- refund_or_reversal: false
- orders_route_invocation: false
- orders_mutation: false
- warehouse_reservation: false
- warehouse_mutation: false
- warehouse_cleanup: false
- channel_cleanup_mutation: false
- deployment: false
- migration: false
- db_write: false
- secret_output: false
- token_output: false
- raw_provider_payload_output: false
- raw_customer_or_payment_evidence: false

Parallel execution state:

| Workstream | Status | Owner role | Remaining blocker | Merge/order dependency |
| --- | --- | --- | --- | --- |
| Orders current-head no-go consumer sync | source-complete | Orders lifecycle owner | none for source sync | before renewed runtime planning |
| Payments provider/refund authority | blocked | named human with bank/refund authority | [MISSING: named human Payments/provider rollback execution owner with bank/refund authority for runtime] | before checkout/payment side effects |
| Orders correction packet | dependency-gated | Orders lifecycle owner | exact target order hash/state, actor, reason, idempotency, sideEffectsHandled | after exact payment identity exists |
| Warehouse cleanup packet | dependency-gated | Warehouse reservation owner | deterministic reservation lookup state for selected order | after selected order/reservation exists |
| FlipFlop channel cleanup | dependency-gated | channel cleanup executor | selected central order hash acknowledgement and final evidence path | after provider/Orders/Warehouse evidence |
| Final live smoke | blocked-final-integration | Goal 24 integration validator | all above blockers | last |

Docs-rag: [MISSING: docs-rag JWT_TOKEN].
