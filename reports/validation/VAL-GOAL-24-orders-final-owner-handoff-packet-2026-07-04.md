# VAL-GOAL-24 Orders Final Owner Handoff Packet - 2026-07-04

Status: source-only validation target prepared; runtime remains blocked by preserved `[MISSING: ...]` inputs.

Scope: Orders-owned final handoff packet for a future paid/provider `catalog.bundle.v1` cleanup after Fiobanka completion/refund/correction.

IPS: Vision -> Goal Impact -> System -> Feature -> Task -> Execution Plan -> Coding Prompt -> Code -> Validation -> State Update.

Prepared artifact: `docs/orchestrator/2026-07-04-goal24-final-source-only-owner-handoff-packet.md`.

State Update: [RESOLVED/NARROWED: Orders final owner handoff packet is source-defined for Goal 24 paid/provider cleanup after Catalog 7c85732 and FlipFlop 99dfe76; runtime route invocation remains hard-stopped until named Payments/bank authority, exact future payment/order/provider hashes, Orders actor/reason/idempotency/sideEffectsHandled, exact Warehouse reservation lookup state, channel acknowledgement, and final redacted evidence exist]

Required runtime fields preserved:

- [MISSING: named human Payments/provider rollback execution owner with bank/refund authority for runtime]
- [MISSING: named bank/refund executor, exact destination/source account proof, amount, reference, deadline, and redacted completion evidence for the future linked payment]
- [MISSING: future paymentId/orderId/variableSymbolHash/providerTransactionHash for exact smoke]
- [MISSING: Fiobanka provider-side completed-transfer refund/reversal/correction proof hash, or owner-approved unpaid no-provider-cancel acknowledgement]
- [MISSING: concrete side-effectful rollback run id and cleanup idempotency keys derived from the future approval id and sanitized payment hash]
- [MISSING: exact Orders target order hash/state, cancellation actor, approval id, safe reason code, idempotency key, and sideEffectsHandled payment|warehouse|notification|crm|channel acknowledgements for the future smoke]
- [MISSING: exact selected Orders cleanup packet runtime values and sideEffectsHandled acknowledgements]
- [MISSING: exact selected Warehouse reservation lookup state for cleanup]
- [MISSING: owner-approved channel side-effect acknowledgement for the selected central order hash]
- [MISSING: final redacted evidence path for required provider, Orders, Warehouse, and channel cleanup proof]


Verifier markers:

- Route shape: `PUT /api/orders/:id/status` with `status=cancelled`.
- Safe reasons: `GOAL24_PAID_PROVIDER_ROLLBACK` and `GOAL24_PROVIDER_UNPAID_CANCEL`.
- Orders idempotency namespace: `orders:goal24:post-paid-correction:<approvalId>:<paymentHash>`.
- Side-effect gate: `sideEffectsHandled.payment|warehouse|notification|crm|channel=true`.
- Provider proof field: `providerEvidenceHash` or owner-approved unpaid no-provider-cancel acknowledgement.
- Warehouse handoff field: `warehouseDecision` from exact selected Warehouse reservation lookup state.
- No-stock-inference boundary: Orders must not infer Warehouse stock effects from Payments refund state, Orders no-go state, Catalog bundle identity, FlipFlop checkout/channel readiness; Orders must not infer Warehouse stock effects from Payments refund state, Orders no-go state, Catalog bundle identity, or FlipFlop checkout/channel readiness.

Boundary: no live checkout, payment creation, provider call, polling, refund/reversal, Orders route invocation, Warehouse mutation, channel cleanup, deploy, migration, DB read/write, secret/token output, raw provider payload, or raw order/customer/payment evidence occurred in this packet update.

Boundary evidence: mutation: false; live_checkout_executed: false; checkout_created: false; payment_created: false; provider_call: false; refund_or_reversal: false; orders_route_invocation: false; orders_mutation: false; warehouse_reservation: false; warehouse_mutation: false; warehouse_cleanup: false; channel_cleanup_mutation: false; deployment: false; migration: false; db_write: false; secret_output: false; token_output: false; raw_provider_payload_output: false; raw_customer_or_payment_evidence: false.

Validation command:

```bash
npm run verify:goal24-paid-provider-bundle-readiness
node --check scripts/verify-goal24-paid-provider-bundle-readiness.js
git diff --check
```

Next step: supply the missing owner-approved runtime fields before any live paid/provider smoke, refund/reversal, Orders route invocation, Warehouse mutation, or channel cleanup.
