# Orders Business Health Handoff - Order Reservation Correlation

## Intent Preservation Chain

Vision -> Goal Impact -> System -> Feature -> Task -> Execution Plan -> Coding Prompt -> Code -> Validation

- Vision: A paid customer order must not be accepted as sellable unless Warehouse stock/reservation authority can prove the item is reserved for that order.
- Goal Impact: The business-health control plane can consume an Orders-owned source envelope proving the order create surface is gated by Warehouse reservation correlation before live synthetic mutations are approved.
- System: Orders owns canonical order lifecycle, idempotency, and order/reservation correlation metadata. Warehouse owns stock, availability, reservation rows, expiry, fulfillment, cancellation reversal, and return authority. Payments owns payment truth. Marketplace/channel services own channel ingestion and publication surfaces.
- Feature: Orders service-owned read-only business-health evidence envelope for reservation-before-order-acceptance and order-reservation correlation.
- Task: Add `GET /api/business-health/order-reservation-correlation` without live DB reads, Warehouse calls, order mutations, payment calls, marketplace mutations, deploy changes, schema changes, or auth semantics changes.
- Execution Plan: Add `BusinessHealthModule`, controller, typed service envelope, static verifier, npm script, and this handoff doc. Wire only `src/app.module.ts`.
- Coding Prompt: Preserve source-only proof and keep runtime proof blocked until an approved live evidence packet names the exact order/product/channel, Warehouse lookup scope, cleanup/payment boundary, actor, and schedule.
- Code: `src/business-health/**`, `src/app.module.ts`, `package.json`, `scripts/verify-business-health-orders-reservation-contract.js`, `docs/orchestrator/2026-07-06-orders-business-health-handoff.md`.
- Validation: `npm run verify:business-health-orders-reservation-contract`, `npm run build`, `git diff --check`.

## Public Evidence Envelope

- Endpoint: `GET /api/business-health/order-reservation-correlation`
- Contract ID: `orders.order_reservation_correlation_business_health.v1`
- Business process contract: `stock-order-marketplace-business-health.v1`
- Service: `orders-microservice`
- Status: `warn`
- `mutatesOrders: false`
- `mutatesWarehouse: false`
- `mutatesPayments: false`
- `mutatesMarketplace: false`
- `runtimeDataQueried: false`
- `productionDbQueried: false`
- `liveSyntheticMutationAuthorized: false`

## Source Assertions

- `src/orders/orders.service.ts` calls `warehouseReservations.reserveOrderItems(savedOrder)` inside the create transaction.
- `src/orders/orders.service.ts` calls `assertRequiredWarehouseReservation(savedOrder, handoff)` before `publishOrderCreated` and lifecycle event publication.
- `assertRequiredWarehouseReservation` requires `handoff.status === 'reserved'` for sellable channels and rejects disabled, skipped, or failed Warehouse handoffs.
- Existing idempotent replay returns the existing matching order before the create transaction, so replay does not duplicate Warehouse reservation side effects.
- `src/warehouse/warehouse-reservation.client.ts` owns reserve/release/fulfill/cancel/expire/return handoff surfaces and sanitized handoff summaries.
- `scripts/verify-order-reservation-gate.js` proves disabled/skipped/failed handoffs roll back and do not emit created events.
- `scripts/verify-warehouse-handoff-contract.js` proves Warehouse reservation payload and lifecycle handoff shapes.

## Runtime Blockers Preserved

- `[MISSING: approved live Orders/Warehouse runtime evidence packet for target order/product/channel]`
- `[MISSING: exact target order/product/channel and warehouse reservation lookup scope for live correlation proof]`
- `[MISSING: approved cleanup/payment/provider boundary packet if the runtime proof creates or cancels a real order]`
- `[MISSING: owner-approved schedule and actor for synthetic order create/replay/cancel runtime evidence]`

## Boundary

No deploy was run for this handoff. No live DB was read. No live Warehouse endpoint was called. No order was created, cancelled, updated, or replayed. No payment/provider/channel/marketplace mutation was attempted. This is a source-only business-health evidence surface for the control plane.
