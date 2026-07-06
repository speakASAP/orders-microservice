# W9 Payment Provider Correction Current Gate

status: source_defined_fail_closed_runtime_packet_gated
created_at: 2026-07-06
repository: /home/ssf/Documents/Github/orders-microservice
mutation: false
provider_call: false
refund_or_reversal: false
deploy: false
raw_sensitive_output: forbidden

## Intent Preservation Chain

Vision -> Paid/provider corrections must never make Orders, Warehouse, Payments, channel, notification, or CRM side effects unless the exact runtime packet is complete, owner-approved, idempotent, and redacted.

Goal Impact -> W7 can distinguish the implemented/fail-closed Orders correction contract from the still-missing live provider/refund/route execution packet.

System -> Payments owns provider/payment/refund evidence and bank authority. Orders owns cancellation route, status transition approval, idempotency audit, lifecycle projection, and the Warehouse handoff gate. Warehouse owns stock cleanup state and operation choice. Channel, Notifications, and CRM own their own side-effect acknowledgements.

Feature -> Payment/refund/provider correction current-state gate.

Task -> Consume current Goal 24 paid/provider evidence, Orders payment boundary source, status transition idempotency source, side-effect acknowledgement reports, and no-mutation cross-repo audit; narrow the W7 broad payment/refund/provider blocker without authorizing live execution.

Execution Plan -> Add Orders-side W9 report/verifier and update W7/runtime packet aggregation only. Do not run checkout, payment creation, provider calls, refund/reversal, Orders route invocation, Warehouse mutation, channel cleanup, deploy, migration, DB read/write, token output, or raw evidence output.

Coding Prompt -> Preserve every unavailable runtime fact as `[MISSING: ...]`; do not infer Warehouse stock effects from Payments refund state, provider state, Catalog bundle identity, channel readiness, or no-go planning evidence.

Code -> `reports/validation/VAL-W9-payment-provider-correction-current-gate-2026-07-06.md`, `scripts/verify-w9-payment-provider-correction-current-gate.js`, runtime packet contract, W7 final/master/status docs, and package verifier wiring.

Validation -> `npm run verify:w9-payment-provider-correction-current-gate`; `npm run verify:goal24-paid-provider-bundle-readiness`; `npm run verify:runtime-gate-packets`; `npm run verify:completion-audit`; `npm test`; `git diff --check`.

## Verdict

`[RESOLVED/NARROWED: payment/refund/provider correction workflow is source-defined and fail-closed; Orders cancellation/idempotency/side-effect packet shape is verified, while live refund/provider/Orders route execution remains owner-approved exact-runtime-packet gated]`.

This does not authorize a correction run. It records that Orders already has the source contract and verifiers needed to fail closed until exact runtime values exist:

- `orders.payment-status.v1` accepts bounded payment status updates and rejects refund-like/provider-owned raw fields over the Orders payment bridge.
- Paid success triggers the existing Warehouse fulfillment handoff; failed/cancelled before paid triggers release; refund/correction after paid is blocked into the explicit correction workflow.
- `PUT /api/orders/:id/status` cancellation requires human approval, safe reason, side-effect acknowledgements, and supports sanitized idempotency audit for replay safety.
- Goal 24 owner handoff defines the exact future packet shape for provider evidence, Orders actor/reason/idempotency, sideEffectsHandled payment|warehouse|notification|crm|channel, Warehouse reservation lookup state, channel acknowledgement, and final redacted evidence path.
- Goal 24 no-mutation cross-repo audit consumed Orders, Payments, Warehouse, FlipFlop, and Notifications owner acknowledgements as source-only evidence and did not invoke the route.

## Remaining Runtime Packet Boundary

Live payment/refund/provider correction remains blocked by these exact packet facts:

- `[MISSING: approved exact payment/refund/provider correction runtime packet naming target order hash/state, payment/provider hashes, actor/approvedBy, approval id, safe reason, idempotency key, sideEffectsHandled payment|warehouse|notification|crm|channel, Warehouse lookup state, channel acknowledgement, and final redacted evidence path]`.
- `[MISSING: Fiobanka provider-side completed-transfer refund/reversal/correction proof hash, or owner-approved unpaid no-provider-cancel acknowledgement for the selected future target]`.
- `[MISSING: approved runtime route invocation evidence; do not call the route until all packet fields are present]`.
- `[MISSING: same-request replay proof for the exact future route invocation if live Orders cancellation is later approved]`.

## Boundary

No checkout, payment creation, provider call, refund/reversal, Orders route invocation, Orders mutation, Warehouse reservation/cleanup mutation, channel cleanup, notification send, CRM mutation, deploy, migration, DB read/write, secret output, token output, raw ID output, raw DB row output, raw customer/payment/provider/tracking output, browser session, or screenshot occurred while preparing this report.
