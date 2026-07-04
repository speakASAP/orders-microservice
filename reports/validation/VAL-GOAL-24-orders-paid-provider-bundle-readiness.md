# VAL - GOAL 24 Orders Paid/Provider Bundle Readiness

Date: 2026-07-03

Intent Preservation Chain: Vision -> Goal Impact -> System -> Feature -> Task -> Execution Plan -> Coding Prompt -> Code -> Validation -> State Update.

## Scope

Orders-owned assessment and verifier hardening for the Catalog `catalog.bundle.v1` paid/provider checkout readiness gate.

Allowed work: Orders-owned docs/verifier/source-policy inspection only.

Forbidden work preserved: no live create-order, no paid/provider webhook, no refund, no fulfillment, no marketplace mutation, no Warehouse mutation, no Payments mutation, no deployment, no migration, no secret read/print, and no unrelated dirty shipment-runtime-readiness work.

## Assessment

Orders can safely support the already proven non-mutating and pending-order `catalog.bundle.v1` bundle evidence path:

- `POST /api/orders/validate-create` normalizes `bundleEvidence[]` and reports `mutation=false`, `orderCreated=false`, `warehouseMutation=false`, and `eventPublished=false`.
- `POST /api/orders` persists bounded `bundleEvidence[]` only as nullable order metadata while normal `items[]` remain the component-line order truth.
- `bundleEvidence[]` is not copied into `order_items`, Warehouse reservation payloads, payment payloads, or `orders.order.created.v1` event payloads.
- Orders payment status remains bounded to `orders.payment-status.v1`; raw provider webhooks, provider transaction IDs, payment metadata, refunds, amounts, currency, customer payment payloads, cards, tokens, and secrets remain Payments-owned.

Orders cannot safely advance the Catalog bundle gate to paid/provider checkout from Orders alone. Source inspection now resolves the active checkout central-UUID propagation blocker for the current FlipFlop checkout/payment creation path: FlipFlop creates or accepts a central Orders UUID before Payments creation and passes it as Payments `orderId`, with local callback metadata kept separately; Payments create validation accepts that central order correlation without provider calls. Paid/provider runtime progression remains blocked because provider-specific callback/refund/cancel execution approval, post-fulfillment refund/return event approval, Warehouse stock window/max quantity, exact Orders target facts, and owner acknowledgements are still not present in Orders-owned contracts. Runtime Payments-to-Orders service-token acceptance is now resolved by Payments current bridge evidence and is consumed here as dependency evidence only. Warehouse `3043cad` now resolves/narrows the operation-selection question for component-line cleanup: reserved-only active holds use `release`, fulfilled cancellation rollback uses `cancel`, approved returns use `return`, partial failures are cleaned line-by-line, and unknown component states fail closed. Orders can express the future rollback without manual payment-state bypass only if Payments first proves provider refund/cancellation/reversal and emits bounded `orders.payment-status.v1` evidence, then Orders uses the owner-approved cancellation workflow with side-effect acknowledgements and Warehouse cleanup through the handoff contract.

Source conclusion for the remaining blockers in this lane:

- `[RESOLVED: FlipFlop active checkout payment creation passes central Orders UUIDs to Payments from source]`: FlipFlop source now shows `createCentralOrderBeforePayment`, passes `centralAcceptance.centralOrderId` as Payments `orderId` and `centralOrderId`, builds payment metadata from the central ID, and its verifier forbids using the local order number as Payments `orderId`. Payments create validation accepts the same central order correlation without persistence or provider calls. Runtime smoke is still blocked until the owner-approved packet names target IDs, provider mode, amount, redaction, and rollback authority.
- `[RESOLVED/PARTIAL: Orders/Payments provider-success, provider-cancel, and provider-failure event mapping before fulfillment]`: Orders source maps first `completed -> paid` status updates to `WarehouseReservationClient.fulfillOrderItems(...)` with `PAYMENT_CONFIRMED`, then optionally `OrderFulfillmentHandoffClient.createAfterPaymentFulfillment(...)`. It maps Payments `failed` and `cancelled` statuses to reservation `release` with `PAYMENT_FAILED_RELEASE`. Orders rejects refund-like statuses and paid downgrades, and owner-approved order cancellation maps to Warehouse `cancel` with `ORDER_CANCELLED`.
- `[RESOLVED/NARROWED: Warehouse cleanup operation selection for reserved-only, fulfilled/stock-decremented, return, partial, and unknown component-line states in Warehouse 3043cad]`: Warehouse source-policy now defines `release`, `cancel`, `return`, line-by-line partial cleanup, and fail-closed unknown-state handling. Orders still needs the Payments/provider source event and owner-approved Orders cancellation workflow before invoking `cancel`; a separate return workflow is required only when delivered/customer-received or inventory-return evidence exists.
- `[RESOLVED/NARROWED: Orders return workflow is not a prerequisite for non-delivered Fiobanka completed-transfer refund/reversal/correction cleanup]`: Warehouse `return` remains owner-approved and separate, but Orders should select it only with delivered/customer-received or inventory-return evidence. For a non-delivered completed-transfer refund/reversal/correction, the cleanup selector is owner-approved cancellation plus Warehouse `cancel`, never a Payments-refund-derived return.
- `[RESOLVED/NARROWED: Orders target state matrix, approval shape, reason code, idempotency key, and side-effect acknowledgement gate are source-verified]`: normal cancellation is limited to `pending|confirmed|processing -> cancelled`; `shipped`, `delivered`, and existing `cancelled` fail closed for new cleanup through the normal endpoint; the runtime packet must still supply the actual target order hash/state, named human cancellation actor, sanitized idempotency key, and all payment/warehouse/notification/CRM/channel acknowledgements.
- `[RESOLVED/NARROWED: target order state matrix for Orders normal cancellation is pending|confirmed|processing -> cancelled; shipped/delivered/cancelled fail closed through the normal endpoint]`
- `[RESOLVED/NARROWED: Orders source requires approvalType=human, named actor/approvedBy, safe Goal 24 reason code, optional sanitized approval.idempotencyKey, and sideEffectsHandled.payment|warehouse|notification|crm|channel=true before Warehouse cancel]`
- `[MISSING: owner-approved refund/post-fulfillment cancellation workflow that maps to Orders/Warehouse without inferred stock effects]`: provider rollback proof and cross-service owner acknowledgements remain missing because Orders has no approved Payments refund event intake and no normal paid-to-refunded payment-status transition.

## Orders Correction Runtime Packet Lane

This lane resolves/narrows the Orders-owned packet shape without selecting a live order or running a route. The future smoke must provide `route=PUT /api/orders/:id/status`, `targetOrderHash`, `targetOrderState`, named human `actor` or `approvedBy`, `approvalType=human`, reason `GOAL24_PAID_PROVIDER_ROLLBACK` or `GOAL24_PROVIDER_UNPAID_CANCEL`, sanitized `idempotencyKey`, all `sideEffectsHandled.payment|warehouse|notification|crm|channel=true`, Payments-owned `providerEvidenceHash` or unpaid no-provider-cancel acknowledgement, Warehouse operation decision, and accepted redaction plan.

Resolved/narrowed in Orders: `[RESOLVED/NARROWED: owner-approved Orders cancellation/refund correction packet shape is defined as route, targetOrderHash/state, actor/approvedBy, human approval, safe reason, sanitized idempotency key, all side-effect acknowledgements, provider evidence hash, Warehouse decision, and redaction acceptance]`.

Still missing because this lane did not run live mutations or inspect raw orders: `[MISSING: named runtime Orders cancellation actor/approvedBy and exact target order hash/state for the paid/provider packet]`, `[MISSING: owner-approved payment/warehouse/notification/crm/channel sideEffectsHandled acknowledgements for the selected central order hash]`, `[MISSING: Fiobanka provider-side completed-transfer refund/reversal/correction proof hash, or owner-approved unpaid no-provider-cancel acknowledgement]`, and `[MISSING: approved runtime route invocation evidence; do not call the route until all packet fields are present]`.

## Evidence Reviewed

Catalog current Goal 24 state records:

- `[RESOLVED: owner-approved Rung 1 non-mutating real checkout smoke passed against active catalog.bundle.v1 bundle e38ce03c-d18b-40a4-9898-f82a3f77dc0b]`
- `[RESOLVED: owner-approved Rung 2 live pending-order smoke proved pending Orders create, Warehouse reservation, and payment-status cleanup release for catalog.bundle.v1 bundle 919be990-1c76-4f9c-b100-829281c6a709]`
- `[MISSING: owner-approved paid/provider checkout smoke with stock and refund/cancel rollback plan]`

Orders sources reviewed:

- `src/orders/create-order.dto.ts`
- `src/orders/orders.service.ts`
- `src/orders/orders.controller.ts`
- `src/orders/order-events.service.ts`
- `src/payments/payment-status.dto.ts`
- `scripts/verify-create-order-contract.js`
- `scripts/verify-payment-boundary.js`
- `docs/orchestrator/CHANNEL_ORDER_CREATE_CONTRACT.md`
- `docs/orchestrator/PAYMENT_STATUS_BOUNDARY.md`
- `docs/orchestrator/WAREHOUSE_HANDOFF_CONTRACT.md`
- `src/warehouse/warehouse-reservation.client.ts`
- `src/orders/order-fulfillment-handoff.client.ts`
- `docs/orchestrator/ORDER_STATUS_TRANSITIONS.md`
- `docs/orchestrator/2026-07-03-goal24-orders-cancel-cleanup-rollback-readiness.md`
- FlipFlop `services/order-service/src/orders/orders.service.ts` and `scripts/verify-orders-hub-integration.js`
- Payments `test/payment-create-validation.spec.ts`
- Payments `docs/orchestrator/2026-07-03-goal24-paid-provider-rollback-readiness.md`
- Catalog `docs/contracts/catalog-bundle-paid-provider-channel-implementation-contract.md`
- Warehouse implementation state/component-line readiness notes
- Current dependency heads consumed: Catalog `906a31f merge goal24 flipflop channel supersession consumption`, FlipFlop `5202c15 merge goal24 channel cleanup owner supersession`, Payments `7822f2a merge goal24 cross-service head sync`, Warehouse `46a66dc docs: define goal24 warehouse cleanup packet`; Orders pre-change `6d5dced merge goal24 latest cleanup heads`.
- Payments current rollback packet and provider contract now record `[RESOLVED: runtime verification of Payments Orders service token/role for the current bridge mechanism]`, while preserving Fiobanka refund/reversal hard stops for explicit owner approval, exact target packet, refund-upload token/feature-flag readiness, and bank authorization evidence.
- Catalog/FlipFlop current evidence resolves/narrows deployed quote preflight before checkout only; it does not authorize Orders cancellation or Warehouse cleanup.

## Blockers

- `[MISSING: owner-approved paid/provider checkout smoke with stock and refund/cancel rollback plan]`
- `[MISSING: owner-approved refund/cancel rollback plan proving provider refund or cancellation plus Orders/Warehouse cleanup]`
- `[RESOLVED/NARROWED: Fiobanka QR side-effect-safe rollback is pre-completion only; completed-transfer refund/reversal/correction remains missing]`
- `[MISSING: owner-approved paid/provider payment provider source and callback contract]`
- `[RESOLVED/NARROWED: owner-approved Warehouse stock decrement/fulfillment rollback criteria for paid bundle smoke at source-policy level in Warehouse 3043cad; live stock window and max quantity remain missing]`
- `[MISSING: Fiobanka provider-side completed-transfer refund/reversal/correction proof with redacted evidence]`
- `[RESOLVED/NARROWED: owner-approved Orders cancellation/refund correction packet shape is defined as route, targetOrderHash/state, actor/approvedBy, human approval, safe reason, sanitized idempotency key, all side-effect acknowledgements, provider evidence hash, Warehouse decision, and redaction acceptance]`
- `[MISSING: named runtime Orders cancellation actor/approvedBy and exact target order hash/state for the paid/provider packet]`
- `[MISSING: owner-approved payment/warehouse/notification/crm/channel sideEffectsHandled acknowledgements for the selected central order hash]`
- `[MISSING: approved runtime route invocation evidence; do not call the route until all packet fields are present]`
- `[RESOLVED: FlipFlop active checkout payment creation passes central Orders UUIDs to Payments from source]`
- `[RESOLVED/PARTIAL: Orders/Payments provider-success, provider-cancel, and provider-failure event mapping before fulfillment]`
- `[MISSING: owner-approved refund/post-fulfillment cancellation workflow that maps to Orders/Warehouse without inferred stock effects]`
- `[RESOLVED/NARROWED: Orders return workflow is not required unless delivered/customer-received or inventory-return evidence exists]`
- `[RESOLVED: runtime verification of Payments Orders service token/role for the current bridge mechanism]`
- `[MISSING: owner-approved channel/customer checkout owner for initiating paid catalog.bundle.v1 runtime smoke]`

## Parallel Execution

| Workstream | Status | Owner role | Scope | Shared files/contracts | Validation owner | Merge order |
| --- | --- | --- | --- | --- | --- | --- |
| Orders fail-closed readiness verifier | complete | Orders worker | `scripts/verify-goal24-paid-provider-bundle-readiness.js`, this report, package script alias | Orders create, payment boundary, and Warehouse handoff docs | Orders worker | 1 |
| Active checkout central UUID source proof | complete-source-only | Channel/Payments checkout owner | Prove current FlipFlop checkout creator sends the central Orders UUID as Payments `orderId` before provider creation | Orders create response, Payments create contract, channel checkout clients | Payments/channel validation owner | 2 |
| Payments paid/provider rollback contract | dependency-gated | Payments owner | Payments provider callback, refund/cancel rollback contract and verifier | `orders.payment-status.v1`, Payments refund policy | Payments owner | 3 |
| Warehouse paid-bundle cleanup operation matrix | complete-source-policy | Warehouse owner | Source-policy operation mapping for reserved-only, fulfilled/stock-decremented, return, partial, and unknown component-line states | Warehouse `3043cad` reservation/fulfillment boundary | Warehouse owner | 4 |
| Channel checkout smoke owner | dependency-gated | Channel/customer checkout owner | Initiate approved paid/provider bundle runtime smoke without marketplace publication | Catalog bundle visibility and Orders create contract | Integration owner | 5 |
| Final integration | final integration | Catalog/commerce integration owner | Cross-repo evidence reconciliation only after owner-approved contracts exist | Catalog `catalog.bundle.v1` status docs | Integration validator | last |

## Validation

Expected local gate after this report/verifier change:

```bash
npm run verify:goal24-paid-provider-bundle-readiness
npm run build
npm run verify:create-order-contract
npm run verify:payment-boundary
git diff --check
```

Runtime paid/provider smoke is intentionally not run in this lane.

## State Update

Decision: `block` for paid/provider runtime progression beyond existing pending-order evidence.

Orders-owned support is narrowed to source-verified non-mutating validation, pending order create/reservation evidence, bounded payment-status metadata, FlipFlop central Orders UUID propagation into Payments create calls, runtime Payments Orders service-token acceptance from Payments bridge evidence, Warehouse fulfill/release/cancel/return reason-code mappings, and a documented fail-closed rollback choreography. The next transition requires owner-approved provider refund/cancel execution proof, a refund/post-fulfillment cancellation or return event contract that maps safely to the Warehouse `3043cad` operation matrix, Warehouse stock window/max quantity, named Orders target facts/actor, all side-effect acknowledgements, and final integration owner approval before any live paid/provider runtime smoke. Manual Orders payment-state edits remain forbidden.


2026-07-03 cleanup-worker update: consumed Payments `PROVIDER_ROLLBACK_EVENT_CONTRACT.md` and `2026-07-03-goal24-owner-approved-rollback-packet.md`. Orders now records the Fiobanka-specific cleanup approval contract: cancellation actor must be a named human Orders approver/Auth subject, reason code must be `GOAL24_PAID_PROVIDER_ROLLBACK` or `GOAL24_PROVIDER_UNPAID_CANCEL`, cleanup idempotency must be supplied by the runtime packet as sanitized approval.idempotencyKey, which the current status endpoint accepts and persists in statusTransitionAudit, and all `payment|warehouse|notification|crm|channel` acknowledgements must be true. Exact Warehouse handoff is `release` before paid, `fulfill` on paid success, `cancel` after provider-proven completed-transfer refund/reversal/correction plus Orders cancellation approval, `return` only through a separate approved return workflow, line-by-line handling for partial states, and fail-closed no-op for unknown component state. Orders must not infer stock effects from Payments refund state.

## 2026-07-04 Latest Cleanup Heads Consumed

Orders consumed current pushed dependency heads Catalog `ca6a3b2`, FlipFlop `1e5102b`, Payments `bf96f5d`, and Warehouse `46a66dc` without running live side effects. This narrows the former token blocker to `[RESOLVED: runtime verification of Payments Orders service token/role for the current bridge mechanism]` because Payments source/runtime evidence records matching service-token bridge acceptance without token output.

Still blocked for Orders runtime execution: `[MISSING: Fiobanka provider-side completed-transfer refund/reversal/correction proof with redacted evidence]`; `[MISSING: named runtime Orders cancellation actor/approvedBy and exact target order hash/state for the paid/provider packet]`; `[MISSING: owner-approved payment/warehouse/notification/crm/channel sideEffectsHandled acknowledgements for the selected central order hash]`; `[MISSING: approved Warehouse stock hold/release window and max quantity]`; `[MISSING: approved runtime route invocation evidence; do not call the route until all packet fields are present]`.

Decision: Orders must not infer stock effects from Payments refund state and must not treat Fiobanka refund-upload source readiness, quote preflight, or service-token acceptance as permission to call `PUT /api/orders/:id/status` or any Warehouse cleanup endpoint.


## 2026-07-04 Latest Head Sync

Orders consumed current pushed heads Catalog `906a31f merge goal24 flipflop channel supersession consumption`, FlipFlop `5202c15 merge goal24 channel cleanup owner supersession`, Payments `7822f2a merge goal24 cross-service head sync`, and Warehouse `46a66dc docs: define goal24 warehouse cleanup packet` as dependency evidence only. [RESOLVED/NARROWED: Codex Goal 24 integration thread supersedes earlier FlipFlop channel executor/runtime owner blockers; channel cleanup runtime remains blocked until bank/refund authority, exact provider proof, Orders side-effect acknowledgements, Warehouse target facts, Auth token source, and final redacted evidence path exist]

This is source/docs/verifier-only. It supersedes historical dependency heads FlipFlop `1e5102b`, Payments `bf96f5d`, and Catalog `ca6a3b2`; it does not authorize live checkout, provider call, refund/reversal, Orders route invocation, Warehouse mutation, DB write, migration, deploy, secret read, raw id, or customer/payment/provider data output.

Orders runtime execution remains blocked by `[MISSING: Fiobanka provider-side completed-transfer refund/reversal/correction proof with redacted evidence]`, `[MISSING: named runtime Orders cancellation actor/approvedBy and exact target order hash/state for the paid/provider packet]`, `[MISSING: owner-approved payment/warehouse/notification/crm/channel sideEffectsHandled acknowledgements for the selected central order hash]`, `[MISSING: approved Warehouse stock hold/release window and max quantity]`, and `[MISSING: approved runtime route invocation evidence; do not call the route until all packet fields are present]`.

## 2026-07-04 Current Source-Governance Head Sync

[RESOLVED/NARROWED: Goal 24 frozen source-governance wave GOAL24-SOURCE-WAVE-2026-07-04A records Catalog `e379b54 merge goal24 current source head sync`, FlipFlop `e1f3e3a merge goal24 current source head sync`, Payments `eab6351 merge goal24 current source head sync`, Orders `d53de9f merge goal24 current source head sync`, and Warehouse `11df002 merge goal24 warehouse target facts reconcile` as input heads for runtime planning; post-merge self heads are validation evidence only; runtime Orders route invocation and cleanup side effects remain blocked]

Frozen wave input heads for new runtime planning only: Catalog `e379b54 merge goal24 current source head sync`, FlipFlop `e1f3e3a merge goal24 current source head sync`, Payments `eab6351 merge goal24 current source head sync`, Warehouse `11df002 merge goal24 warehouse target facts reconcile`, and Orders `d53de9f merge goal24 current source head sync`. This does not authorize Orders route invocation or cleanup side effects. Runtime remains blocked by `[MISSING: approved token source path, such as an on-host token file path or in-memory handoff, with explicit no-print/no-decode/no-persist handling]`, `[MISSING: confirmation that the token belongs to actor hash 4215870ba488de17 and carries app:flipflop-service:admin or global:superadmin]`, `[MISSING: named human Payments/provider rollback execution owner with bank/refund authority for runtime]`, `[MISSING: future paymentId/orderId/variableSymbolHash/providerTransactionHash for exact smoke]`, `[MISSING: concrete side-effectful rollback run id and cleanup idempotency keys]`, `[MISSING: exact Orders cleanup packet and sideEffectsHandled acknowledgements]`, `[MISSING: named runtime Orders cancellation actor/approvedBy and exact target order hash/state for the paid/provider packet]`, `[MISSING: owner-approved payment/warehouse/notification/crm/channel sideEffectsHandled acknowledgements for the selected central order hash]`, `[MISSING: renewed owner-approved execution window and Warehouse hold/release duration]`, `[MISSING: final owner approval before any live Warehouse reservation/cleanup mutation]`, `[MISSING: approved runtime route invocation evidence; do not call the route until all packet fields are present]`, `[MISSING: final redacted evidence path for required provider, Orders, Warehouse, and channel cleanup proof]`.

Validation boundary: mutation: false; orders_route_invocation: false; payment_creation: false; provider_call: false; refund_or_reversal: false; warehouse_mutation: false; channel_cleanup_mutation: false; deployment: false; secret_output: false; raw_customer_or_payment_evidence: false.

## 2026-07-04 Orders Token Binding Proof Contract Consumption

[RESOLVED/NARROWED: Orders consumed Catalog 47b652c and FlipFlop f004fe5 token-binding proof contract as source governance only; runtime Orders route invocation remains blocked]

[RESOLVED/NARROWED: Goal 24 token-binding proof may record only token-present, Auth validation status class, actor-hash match, required-role boolean, approval id, runner id, timestamps, and no-output booleans]

[RESOLVED/NARROWED: Goal 24 approved token source shape is owner-approved on-host token file or in-memory handoff read only by the approved runner, never printed, never decoded into reports, never persisted, never committed, and removed or invalidated after the run]

[RESOLVED/NARROWED: Goal 24 Auth token binding does not authorize Orders, Warehouse, Payments/provider, or channel side effects and does not prove stock effects]

Allowed token proof markers remain runtime-gated: `tokenSourceType=on-host-token-file`; `tokenSourceType=in-memory-handoff`; `actorHashMatches=true`; `requiredAdminRolePresent=true`; `tokenOutput=false`; `decodedJwtOutput=false`; `rawUserOutput=false`; `secretOutput=false`; `tokenSourceDestroyedOrInvalidated=true`.

Auth token-binding proof is not Warehouse stock evidence and is not Orders cleanup authorization. Orders must not infer Warehouse stock effects from Payments refund state, provider state, Auth token state, or FlipFlop channel state. Runtime remains blocked by the exact Orders cleanup packet, sideEffectsHandled acknowledgements, Orders-to-Warehouse handoff, owner-approved Warehouse target facts, token source/token-binding proof, provider authority, and final redacted evidence path.
