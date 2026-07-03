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

Orders cannot safely advance the Catalog bundle gate to paid/provider checkout from Orders alone. Paid/provider runtime progression remains blocked because the owner-approved provider source, stock decrement/fulfillment rollback criteria, refund/cancel rollback workflow, active checkout central-UUID proof, and runtime Payments-to-Orders service-token proof are not present in Orders-owned contracts.

Source conclusion for the two remaining blockers in this lane:

- `[MISSING: proof that active checkout paths pass central Orders UUIDs to Payments]`: Orders source owns `POST /api/orders`, `POST /api/orders/validate-create`, and `PUT /api/orders/:id/payment-status`. It does not contain an active Payments checkout creation client, `PAYMENTS_SERVICE_URL`, `payments/create`, `CreatePayment`, or `createPayment(...)` path. Therefore Orders can prove that payment-status callbacks are keyed by the route `:id` central Orders UUID, but cannot prove that channel checkout initiators pass that same central UUID into Payments. This remains a channel/Payments checkout-path blocker.
- `[MISSING: Orders/Payments provider-success, provider-cancel, refund, and post-fulfillment cancellation event contract that maps to Warehouse fulfill/cancel/return calls]`: Orders source maps first `completed -> paid` status updates to `WarehouseReservationClient.fulfillOrderItems(...)` with `PAYMENT_CONFIRMED`, then optionally `OrderFulfillmentHandoffClient.createAfterPaymentFulfillment(...)`. It maps Payments `failed` and `cancelled` statuses to reservation `release` with `PAYMENT_FAILED_RELEASE`. Orders rejects refund-like statuses and paid downgrades, and owner-approved order cancellation maps to Warehouse `cancel` with `ORDER_CANCELLED`. A post-fulfillment cancellation/refund/return contract remains missing because Orders has no approved Payments refund event intake and no normal paid-to-refunded/returned payment-status transition.

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
- Payments `docs/orchestrator/2026-07-03-goal24-paid-provider-rollback-readiness.md`
- Catalog `docs/contracts/catalog-bundle-paid-provider-channel-implementation-contract.md`
- Warehouse implementation state/component-line readiness notes

## Blockers

- `[MISSING: owner-approved paid/provider checkout smoke with stock and refund/cancel rollback plan]`
- `[MISSING: owner-approved paid/provider payment provider source and callback contract]`
- `[MISSING: owner-approved Warehouse stock decrement/fulfillment rollback criteria for paid bundle smoke]`
- `[MISSING: owner-approved Payments refund/cancel rollback workflow for paid bundle smoke]`
- `[MISSING: proof that active checkout paths pass central Orders UUIDs to Payments]`
- `[MISSING: Orders/Payments provider-success, provider-cancel, refund, and post-fulfillment cancellation event contract that maps to Warehouse fulfill/cancel/return calls]`
- `[MISSING: runtime verification of Payments Orders service token/role]`
- `[MISSING: owner-approved channel/customer checkout owner for initiating paid catalog.bundle.v1 runtime smoke]`

## Parallel Execution

| Workstream | Status | Owner role | Scope | Shared files/contracts | Validation owner | Merge order |
| --- | --- | --- | --- | --- | --- | --- |
| Orders fail-closed readiness verifier | complete | Orders worker | `scripts/verify-goal24-paid-provider-bundle-readiness.js`, this report, package script alias | Orders create, payment boundary, and Warehouse handoff docs | Orders worker | 1 |
| Active checkout central UUID proof | dependency-gated | Channel/Payments checkout owner | Prove deployed checkout creators send the central Orders UUID as Payments `orderId` before provider creation | Orders create response, Payments create contract, channel checkout clients | Payments/channel validation owner | 2 |
| Payments paid/provider rollback contract | dependency-gated | Payments owner | Payments provider callback, refund/cancel rollback contract and verifier | `orders.payment-status.v1`, Payments refund policy | Payments owner | 3 |
| Warehouse paid-bundle stock rollback contract | dependency-gated | Warehouse owner | Stock decrement/fulfillment/cancel/return criteria for bundle component lines | Warehouse reservation/fulfillment boundary | Warehouse owner | 4 |
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

Orders-owned support is narrowed to source-verified non-mutating validation, pending order create/reservation evidence, bounded payment-status metadata, and Warehouse fulfill/release/cancel/return reason-code mappings. Orders cannot prove active checkout central-UUID propagation to Payments because Orders does not own or contain the checkout payment-creation path. The next transition requires channel/Payments source proof that the central Orders UUID is passed into Payments before provider creation, plus an owner-approved provider-success/provider-cancel/refund/post-fulfillment cancellation contract that maps safely to Warehouse fulfill/cancel/return behavior before any live paid/provider runtime smoke.
