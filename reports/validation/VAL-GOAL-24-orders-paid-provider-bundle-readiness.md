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

Orders cannot safely advance the Catalog bundle gate to paid/provider checkout from Orders alone. Source inspection now resolves the active checkout central-UUID propagation blocker for the current FlipFlop checkout/payment creation path: FlipFlop creates or accepts a central Orders UUID before Payments creation and passes it as Payments `orderId`, with local callback metadata kept separately; Payments create validation accepts that central order correlation without provider calls. Paid/provider runtime progression remains blocked because provider-specific callback/refund/cancel execution approval, post-fulfillment refund/return event approval, Warehouse stock window/max quantity, and runtime Payments-to-Orders service-token acceptance are still not present in Orders-owned contracts. Warehouse `3043cad` now resolves/narrows the operation-selection question for component-line cleanup: reserved-only active holds use `release`, fulfilled cancellation rollback uses `cancel`, approved returns use `return`, partial failures are cleaned line-by-line, and unknown component states fail closed. Orders can express the future rollback without manual payment-state bypass only if Payments first proves provider refund/cancellation/reversal and emits bounded `orders.payment-status.v1` evidence, then Orders uses the owner-approved cancellation workflow with side-effect acknowledgements and Warehouse cleanup through the handoff contract.

Source conclusion for the remaining blockers in this lane:

- `[RESOLVED: FlipFlop active checkout payment creation passes central Orders UUIDs to Payments from source]`: FlipFlop source now shows `createCentralOrderBeforePayment`, passes `centralAcceptance.centralOrderId` as Payments `orderId` and `centralOrderId`, builds payment metadata from the central ID, and its verifier forbids using the local order number as Payments `orderId`. Payments create validation accepts the same central order correlation without persistence or provider calls. Runtime smoke is still blocked until the owner-approved packet names target IDs, provider mode, amount, redaction, and rollback authority.
- `[RESOLVED/PARTIAL: Orders/Payments provider-success, provider-cancel, and provider-failure event mapping before fulfillment]`: Orders source maps first `completed -> paid` status updates to `WarehouseReservationClient.fulfillOrderItems(...)` with `PAYMENT_CONFIRMED`, then optionally `OrderFulfillmentHandoffClient.createAfterPaymentFulfillment(...)`. It maps Payments `failed` and `cancelled` statuses to reservation `release` with `PAYMENT_FAILED_RELEASE`. Orders rejects refund-like statuses and paid downgrades, and owner-approved order cancellation maps to Warehouse `cancel` with `ORDER_CANCELLED`.
- `[RESOLVED/NARROWED: Warehouse cleanup operation selection for reserved-only, fulfilled/stock-decremented, return, partial, and unknown component-line states in Warehouse 3043cad]`: Warehouse source-policy now defines `release`, `cancel`, `return`, line-by-line partial cleanup, and fail-closed unknown-state handling. Orders still needs the Payments/provider source event and owner-approved Orders cancellation or return workflow before invoking those operations.
- `[MISSING: Payments refund and post-fulfillment cancellation/return event contract that maps to Orders and Warehouse without inferred stock effects]`: a post-fulfillment cancellation/refund/return contract remains missing because Orders has no approved Payments refund event intake and no normal paid-to-refunded/returned payment-status transition.

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

## Blockers

- `[MISSING: owner-approved paid/provider checkout smoke with stock and refund/cancel rollback plan]`
- `[MISSING: owner-approved refund/cancel rollback plan proving provider refund or cancellation plus Orders/Warehouse cleanup]`
- `[MISSING: provider-specific side-effect-safe rollback contract for the selected payment method]`
- `[MISSING: owner-approved paid/provider payment provider source and callback contract]`
- `[RESOLVED/NARROWED: owner-approved Warehouse stock decrement/fulfillment rollback criteria for paid bundle smoke at source-policy level in Warehouse 3043cad; live stock window and max quantity remain missing]`
- `[MISSING: owner-approved Payments refund/cancel rollback workflow for paid bundle smoke]`
- `[RESOLVED: FlipFlop active checkout payment creation passes central Orders UUIDs to Payments from source]`
- `[RESOLVED/PARTIAL: Orders/Payments provider-success, provider-cancel, and provider-failure event mapping before fulfillment]`
- `[MISSING: Payments refund and post-fulfillment cancellation/return event contract that maps to Orders and Warehouse without inferred stock effects]`
- `[MISSING: runtime verification of Payments Orders service token/role]`
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

Orders-owned support is narrowed to source-verified non-mutating validation, pending order create/reservation evidence, bounded payment-status metadata, FlipFlop central Orders UUID propagation into Payments create calls, Warehouse fulfill/release/cancel/return reason-code mappings, and a documented fail-closed rollback choreography. The next transition requires owner-approved provider refund/cancel execution proof, a refund/post-fulfillment cancellation or return event contract that maps safely to the Warehouse `3043cad` operation matrix, Warehouse stock window/max quantity, runtime Payments Orders service-token acceptance, and final integration owner approval before any live paid/provider runtime smoke. Manual Orders payment-state edits remain forbidden.
