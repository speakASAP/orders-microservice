# Goal 24 Orders Runtime Self-Discovery - 2026-07-04

IPS: Vision -> Goal 24 paid/provider cleanup can proceed only with a complete redacted runtime packet; Goal Impact -> owner-approved autonomous search was used to discover available fields instead of asking for every field manually; System -> Orders owns status cleanup, Payments owns provider/bank rollback and Fio token gates, Warehouse owns stock effects, FlipFlop owns channel cleanup; Feature -> runtime packet self-discovery; Task -> inspect docs/reports and sanitized pod env booleans only; Execution Plan -> source/report/verifier update, no live side effects; Coding Prompt -> do not print secrets, tokens, raw order/customer/payment/provider data, or raw DB rows; Code -> Orders report/status/verifier; Validation -> verify:goal24-paid-provider-bundle-readiness and git diff check.

Decision: [RESOLVED/NARROWED: Orders self-discovery used owner-approved autonomous search to inspect only redacted/runtime-safe Goal 24 inputs; Payments Orders bridge token evidence is resolved for service-to-service payment status only, while Fio payment-order write tokens remain absent, refund upload remains disabled, exact future payment/order/provider hashes remain missing, and live Orders/Warehouse/channel side effects remain blocked]

Discovered usable inputs:

- Payments Orders bridge token evidence is already resolved for the current service-to-service payment-status bridge only: runtimeTokensMatch=true and role class internal:payments-microservice:service are documented in Payments; this is not a user/admin token and not Orders cleanup authorization.
- Auth hosted token handoff docs define safe URL-fragment handoff behavior, but no approved Goal 24 user token source file was found by filename search.
- Sanitized Payments pod readback found FIO_BANKA_API_KEY_CZK_PRESENT=true LEN=64, FIO_BANKA_API_KEY_EUR_PRESENT=true LEN=64, and FIO_BANKA_WEBHOOK_SECRET_PRESENT=true LEN=64. Values were not printed.

Discovered hard stops:

- Sanitized Payments pod readback found FIO_BANKA_PAYMENT_ORDER_TOKEN_CZK_PRESENT=false and FIO_BANKA_PAYMENT_ORDER_TOKEN_EUR_PRESENT=false.
- Sanitized Payments pod readback found FIO_BANKA_REFUND_UPLOAD_ENABLED_TRUE=false.
- Docs/reports contain historical retained payment evidence, but no exact future paymentId/orderId/variableSymbolHash/providerTransactionHash for a new linked smoke.
- No live Warehouse target-row readback was used because the execution-time route packet is still incomplete.

Preserved blockers:

- [MISSING: approved Auth user token source path for guarded FlipFlop admin action, with no-print/no-decode/no-persist handling]
- [MISSING: confirmation that the runtime token belongs to actor hash 4215870ba488de17 and carries app:flipflop-service:admin or global:superadmin]
- [MISSING: Vault properties FIO_BANKA_PAYMENT_ORDER_TOKEN_CZK and FIO_BANKA_PAYMENT_ORDER_TOKEN_EUR for owner-approved payment-order upload]
- [MISSING: FIO_BANKA_REFUND_UPLOAD_ENABLED=true for an owner-approved exact future refund upload window]
- [MISSING: named human Payments/provider rollback execution owner with bank/refund authority for runtime]
- [MISSING: future paymentId/orderId/variableSymbolHash/providerTransactionHash for exact smoke]
- [MISSING: named runtime Orders cancellation actor/approvedBy and exact target order hash/state for the paid/provider packet]
- [MISSING: owner-approved payment/warehouse/notification/crm/channel sideEffectsHandled acknowledgements for the selected central order hash]
- [MISSING: live current target row readback at execution time]
- [MISSING: renewed owner-approved execution window and Warehouse hold/release duration]
- [MISSING: final owner approval before any live Warehouse reservation/cleanup mutation]
- [MISSING: final redacted evidence path for required provider, Orders, Warehouse, and channel cleanup proof]

Boundary: no Orders route invocation, checkout, payment creation, provider call, refund/reversal, Warehouse mutation, channel cleanup, deploy, migration, DB write, secret/token output, or raw customer/order/payment/provider evidence occurred.
