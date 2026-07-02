# Order Lifecycle, Warehouse Reservation, and Marketplace Status Rollout Plan

Date: 2026-07-02
Integration owner: Orders orchestrator thread
Source of truth: `/home/ssf/Documents/Github/orders-microservice`
Company method: Intent Preservation System chain, goal-driven development, parallel agent execution

## IPS Chain

Vision:
Every sellable order must be impossible to oversell, must be paid before warehouse release, and must expose one authoritative lifecycle to customer and admin frontends across all Alfares commerce surfaces.

Goal impact:
Orders becomes the canonical lifecycle service for FlipFlop, Bazos, Heureka, Allegro, Aukro, and future selling channels. Warehouse remains the stock authority. Payments remains the payment authority. Storefronts and dashboards render Orders lifecycle state instead of inventing local order truth.

System:
Orders, Warehouse, Payments, Notifications, Catalog, FlipFlop, Bazos, Heureka, Allegro, Aukro, and channel-specific frontend/dashboard services.

Feature:
Reliable order creation, stock reservation, paid-order warehouse handoff, lifecycle event propagation, customer order cabinet, and admin order/delivery statistics.

Task:
Plan first, then split implementation into independently owned workstreams with explicit contracts, blockers, validation, and merge order.

Execution plan:
This document is the master plan. Repo-local lane plans are written in each affected repository under `docs/orchestrator/2026-07-02-*order*plan.md`.

Coding prompt:
No implementation is authorized until this master plan and repo-local plans are present. Agents must use the allowed files and validation commands listed below.

Code:
Pending.

Validation:
Pending. Required final validation is listed in the "Validation Matrix" section.

## Business Process

1. A selling channel requests order creation with `orders.create.v1`.
2. The request must include a canonical product list: product id, SKU or title, quantity, unit price, line total, order subtotal, shipping cost, tax amount, grand total, currency, delivery method, and delivery address.
3. Orders normalizes and validates the payload. For every non-idempotent create attempt, Orders must call Warehouse before accepting the order.
4. Warehouse is the only availability and reservation authority. If any item is unavailable, missing a warehouse route, or cannot be reserved, Orders fails closed and no sellable order is accepted.
5. If some item reservations succeed and another fails, Orders must compensate by releasing the partial reservations before returning the error.
6. Exact idempotent replay may return the already-created order without a second Warehouse reservation. Non-equivalent replay must fail.
7. Accepted orders start in a customer-visible "ordered, not paid" state.
8. Payments reports payment terminal state to Orders through the Orders payment-status boundary. Payment status must not be inferred by storefronts.
9. On the first transition to paid, Orders must trigger Warehouse fulfillment for the reserved items and delivery address. That handoff represents "release this order for picking, packing, and delivery."
10. Every lifecycle change after creation must be recorded by Orders and exposed to frontends through API read models and lifecycle events.
11. Customer cabinets must show every canonical order and its current lifecycle state.
12. Admin cabinets must show order and delivery statistics by lifecycle stage, payment state, channel, and exception state.

## Current Evidence

Implemented or partially implemented:

- Orders already has a Warehouse reservation gate for sellable channels and fail-closed reservation behavior.
- Orders already stores item lines, shipping cost, delivery address, totals, currency, payment status, and `warehouseHandoff`.
- Orders already publishes `orders.order.created.v1`, `orders.order.updated.v1`, `orders.order.paid.v1`, `orders.order.shipped.v1`, and `orders.order.cancelled.v1`.
- Orders already accepts Payments terminal updates through `PUT /api/orders/:id/payment-status`.
- Warehouse already exposes reservation lifecycle endpoints: reserve, release, fulfill, cancel, expire, and return.
- Heureka forwards marketplace orders to Orders and stores the central Orders id.
- FlipFlop has customer and admin order pages, but the current create/payment flow is still partly local and can bypass central payment-to-warehouse fulfillment if Payments receives a local non-UUID order number.
- Notifications has an Orders event router, but the live RabbitMQ consumer/runtime wiring is not confirmed.
- Catalog already has product sales statistics backed by Orders.

Known gaps:

- `[MISSING: Warehouse-owned fulfillment order or pick-ticket contract that persists delivery address and item release instructions for dispatch.]`
- `[MISSING: Delivery provider or shipment-status source contract for after handoff to carrier.]`
- `[MISSING: Notifications live broker consumer module and runtime env confirmation.]`
- `[UNKNOWN: Whether Allegro, Aukro, and Bazos currently expose buyer-facing cabinets or only operator/channel dashboards.]`
- `[UNKNOWN: Whether all marketplace services persist central Orders ids for every imported order path, not only smoke-test paths.]`
- `[MISSING: Cross-repo contract test that proves every channel blocks checkout when Warehouse says unavailable.]`

## Target Contract

Order create remains `orders.create.v1`.

Required create fields:

- `channel`
- `channelAccountId`
- `externalOrderId` or idempotency key
- `customer` identity fields allowed by current privacy rules
- `shippingAddress`
- `shippingMethod`
- `items[]` with `productId`, `sku`, `title`, `quantity`, `unitPrice`, `totalPrice`, and `warehouseId` when the channel already resolved it
- `subtotal`
- `shippingCost`
- `taxAmount`
- `total`
- `currency`

Orders must reject:

- empty item lists
- non-positive quantity
- missing price or inconsistent totals
- missing delivery address for deliverable orders
- missing Warehouse reservation for sellable channels
- reservation response with `skipped`, `disabled`, `failed`, or missing reservation ids
- non-equivalent idempotency replay

## Canonical Lifecycle Model

The existing coarse `status` enum remains as a compatibility projection for older consumers.

New customer/admin lifecycle stage should be additive and authoritative for UX:

- `ordered_unpaid`: created, reserved, payment not completed
- `payment_failed`: payment failed before fulfillment
- `paid_not_delivered`: paid, not yet delivered
- `warehouse_fulfillment_requested`: Orders has handed the paid order to Warehouse
- `warehouse_collecting`: warehouse is collecting/picking items
- `warehouse_forming`: warehouse is forming/packing the shipment
- `warehouse_formed`: order is ready for dispatch
- `handed_to_delivery`: handed to delivery/courier
- `in_delivery`: in delivery
- `received`: customer received the order
- `not_received`: delivery failed or customer did not receive
- `returned`: returned to warehouse/seller
- `cancelled`: cancelled before completion

Compatibility projection:

- `ordered_unpaid` -> `pending`
- `paid_not_delivered`, `warehouse_fulfillment_requested`, `warehouse_collecting`, `warehouse_forming`, `warehouse_formed` -> `confirmed` or `processing`
- `handed_to_delivery`, `in_delivery`, `not_received` -> `shipped`
- `received` -> `delivered`
- `payment_failed`, `returned`, `cancelled` -> current exception-compatible status selected by Orders migration rules

Allowed main path:

`ordered_unpaid -> paid_not_delivered -> warehouse_fulfillment_requested -> warehouse_collecting -> warehouse_forming -> warehouse_formed -> handed_to_delivery -> in_delivery -> received`

Allowed exception paths:

- `ordered_unpaid -> payment_failed`
- `ordered_unpaid -> cancelled`
- `paid_not_delivered -> cancelled` only if Warehouse release or cancel is successful
- `in_delivery -> not_received`
- `not_received -> returned`
- `received -> returned` when return flow is approved

## Event Contract

Orders must continue publishing existing events for backward compatibility.

Add or extend an authoritative lifecycle event:

- exchange: `orders.events`
- routing key: `orders.order.lifecycle_changed.v1`
- required payload: `eventId`, `occurredAt`, `orderId`, `orderNumber`, `channel`, `channelAccountId`, `externalOrderId`, `previousLifecycleStage`, `lifecycleStage`, `status`, `paymentStatus`, `fulfillmentStatus`, `deliveryStatus`, `total`, `currency`, `items[]`, `warehouseHandoff`
- PII rule: event payload should not broadcast full delivery address unless the consumer is Warehouse or an explicitly authorized delivery service. Frontend consumers should retrieve full details through authenticated Orders APIs.

Warehouse handoff event or API payload must include:

- order id and order number
- line items with product id, SKU, warehouse id, quantity
- shipping method
- delivery address
- customer contact fields allowed by privacy rules
- reservation ids

## Required User-Facing Read Models

Customer cabinet:

- list all canonical Orders for the authenticated customer
- show current lifecycle stage with localized label
- show item list, item totals, shipping cost, grand total, currency
- show delivery address
- show timeline/history of lifecycle changes
- refresh from Orders state, not from stale channel-local status only

Admin cabinet:

- list and filter orders by channel, payment status, lifecycle stage, delivery stage, and exception state
- show per-order item list, totals, shipping cost, delivery address, warehouse handoff, and event history
- show aggregate counts and sums by lifecycle stage, payment status, channel, and delivery exception
- expose forwarding/reservation/fulfillment failures as actionable errors

## Parallel Execution Plan

Workstream O0: Integration owner

- Status: final integration, active in this thread
- Objective: keep master plan, contracts, merge order, and validation evidence synchronized
- Allowed files: cross-repo plan docs, Orders docs/status files after implementation starts
- Forbidden files: channel implementation files owned by active worker agents
- Output: final integration report and deployment decision
- Validation owner: integration owner

Workstream O1: Orders core lifecycle and contracts

- Status: ready now after plan save
- Objective: add authoritative lifecycle stage, transition validation, lifecycle event fixture/verifier, authenticated customer/admin read models, and order validation script
- Allowed files: `orders-microservice/src/orders/**`, `orders-microservice/src/items/**`, `orders-microservice/src/auth/**` only if needed, `orders-microservice/scripts/**`, `orders-microservice/docs/orchestrator/**`, `orders-microservice/reports/validation/**`, migrations if this repo uses them
- Forbidden files: current unrelated product-affinity dirty files unless the worker first rebases/coordinates with integration owner
- Dependencies: none for contract design; Warehouse fulfillment-ticket call may use `[MISSING]` placeholder until W1 lands
- Validation: existing Orders tests, `scripts/verify-order-reservation-gate.js`, `scripts/verify-warehouse-handoff-contract.js`, `scripts/verify-payment-boundary.js`, new lifecycle verifier, event fixture verifier

Workstream W1: Warehouse fulfillment handoff

- Status: ready for discovery, implementation dependency-gated by contract decision
- Objective: confirm whether `fulfill` is enough or add a Warehouse fulfillment order/pick-ticket endpoint that persists paid order items and delivery address
- Allowed files: `warehouse-microservice/src/reservations/**`, fulfillment/order modules if present, `warehouse-microservice/docs/**`, `warehouse-microservice/scripts/**`, tests
- Forbidden files: public landing-page dirty files
- Dependencies: Orders O1 handoff payload shape
- Validation: unit tests for fulfill idempotency, pick-ticket creation, address persistence, return/cancel paths, no stock mutation without reservation

Workstream P1: Payments bridge and central order ids

- Status: ready for verification
- Objective: prove Payments always reports terminal status to central Orders UUIDs; where channels still pass local ids, change them to central Orders ids
- Allowed files: `payments-microservice/src/**`, `payments-microservice/docs/**`, bridge tests
- Forbidden files: provider secret/config changes
- Dependencies: channel-specific central id work, especially FlipFlop
- Validation: completed payment triggers Orders payment-status bridge; non-UUID skip remains only for legacy non-central payments with explicit documented fallback

Workstream F1: FlipFlop central Orders-first checkout and cabinets

- Status: ready now, high priority
- Objective: make FlipFlop create central Orders before payment, use central Orders UUID for Payments, stop duplicate local Warehouse decrement for central orders, and render central lifecycle in customer/admin order pages
- Allowed files: `flipflop/services/order-service/**`, `flipflop/shared/clients/**`, `flipflop/services/frontend/app/orders/**`, `flipflop/services/frontend/app/admin/orders/**`, `flipflop/services/frontend/lib/api/orders.ts`, `flipflop/docs/**`, tests
- Forbidden files: current unrelated product recommendation/catalog-source dirty files unless explicitly coordinated
- Dependencies: Orders O1 read/lifecycle contract for final UI labels; interim can poll current Orders status
- Validation: unavailable item cannot checkout, available item creates central order, payment completed updates central Orders and Warehouse, customer page shows lifecycle, admin page shows lifecycle/statistics

Workstream H1: Heureka status read model

- Status: ready after Orders read contract
- Objective: show central Orders lifecycle for forwarded Heureka orders and flag unforwarded or stale rows
- Allowed files: `heureka/services/heureka-service/src/heureka/**`, `heureka/docs/**`, tests
- Forbidden files: unrelated import/sync code unless needed for order id mapping
- Dependencies: Orders O1 read endpoint or lifecycle events
- Validation: dashboard order row displays central lifecycle and central order id; stale local status is not presented as canonical

Workstream A1: Allegro status read model and order create audit

- Status: discovery required, then ready if it has independent files
- Objective: inspect Allegro order ingestion, confirm central Orders forwarding, and render central lifecycle in Allegro order dashboard or buyer cabinet
- Allowed files: Allegro order service/dashboard/frontend files after discovery, `allegro/docs/**`, tests
- Forbidden files: unrelated product publish/status flow
- Dependencies: Orders O1 read endpoint or lifecycle events
- Validation: order list/detail shows central lifecycle; missing central id is flagged

Workstream AU1: Aukro status read model and order create audit

- Status: discovery required, then ready if it has independent files
- Objective: inspect Aukro order ingestion, confirm central Orders forwarding, and render central lifecycle in dashboard or buyer cabinet
- Allowed files: Aukro order service/ui files after discovery, `aukro/docs/**`, tests
- Forbidden files: existing dirty validation report unless intentionally refreshed by validation owner
- Dependencies: Orders O1 read endpoint or lifecycle events
- Validation: order list/detail shows central lifecycle; unforwarded orders are actionable

Workstream B1: Bazos status read model and order create audit

- Status: partially blocked
- Objective: inspect Bazos real order provider path, confirm central Orders forwarding, and render central lifecycle
- Allowed files: Bazos order service/dashboard files after discovery, `bazos/docs/**`, tests
- Forbidden files: provider credentials and unrelated catalog source work
- Dependencies: `[UNKNOWN: Bazos provider-backed order webhook path]`, Orders O1 read endpoint or lifecycle events
- Validation: provider-backed order or documented simulator creates central Orders row; dashboard shows central lifecycle

Workstream N1: Notifications lifecycle consumer

- Status: dependency-gated
- Objective: wire the existing Orders event router to live broker consumption once transport and env are confirmed
- Allowed files: `notifications-microservice/src/notifications/orders-events/**`, notification module/bootstrap/config, `notifications-microservice/docs/**`, tests
- Forbidden files: unrelated templates/channels unless needed by router
- Dependencies: `[MISSING: Notifications-owned RabbitMQ consumer module or approved transport dependency]`
- Validation: lifecycle event maps to customer/admin notification without leaking full delivery address

Workstream C1: Catalog and admin statistics

- Status: ready after Orders stats endpoints
- Objective: expose order and delivery statistics where Catalog/admin surfaces need product/channel analytics
- Allowed files: `catalog-microservice/src/products/**`, `catalog-microservice/services/frontend/**`, `catalog-microservice/docs/**`, tests
- Forbidden files: current product-quality/manual-override dirty work unless coordinated
- Dependencies: Orders O1 stats endpoints
- Validation: product admin shows sales and delivery/order status metrics from Orders

## Merge and Deploy Order

1. O1 Orders contract/read model/event verifier.
2. W1 Warehouse fulfillment handoff if an endpoint change is required.
3. P1 Payments bridge verification and central UUID compatibility.
4. F1 FlipFlop central Orders-first flow.
5. H1, A1, AU1, B1 marketplace status read models in parallel after O1.
6. N1 Notifications consumer after event contract and broker dependency are available.
7. C1 Catalog/admin statistics after Orders stats endpoints.
8. O0 final integrated smoke and deployment notes.

## Validation Matrix

Orders:

- create with unavailable item returns validation error and creates no accepted order
- create with one failing item compensates earlier reservation
- exact idempotency replay returns existing order without duplicate reservation
- paid transition calls Warehouse fulfillment once
- failed/cancelled payment releases reservation
- lifecycle transitions reject invalid paths
- lifecycle events pass fixture verifier

Warehouse:

- reservation cannot oversell
- fulfillment is idempotent
- paid order handoff persists enough data for pick/pack/dispatch
- return path restores or records returned stock per Warehouse rules

Payments:

- terminal completed status calls central Orders UUID
- failed/cancelled status calls central Orders UUID
- non-UUID legacy skip is either eliminated for active channels or explicitly documented as unsupported legacy

Frontends and dashboards:

- customer order list shows all canonical orders
- order detail shows items, item totals, shipping cost, grand total, delivery address, and lifecycle timeline
- admin order list filters by lifecycle/payment/channel/delivery exception
- every channel flags orders missing central Orders id

Cross-repo smoke:

- FlipFlop checkout available item -> central Orders created -> Warehouse reserved -> payment completed -> Warehouse fulfillment requested -> customer and admin pages show paid/warehouse stage
- FlipFlop checkout unavailable item -> blocked before payment
- Heureka, Allegro, Aukro, and Bazos sample forwarded orders show central lifecycle rather than stale local-only status

## Agent Rules

- Use remote repositories under `/home/ssf/Documents/Github/<repo>` only.
- Do not persist service code in `/Users/Sergej.Stasok/Documents/orders`.
- Do not overwrite existing dirty files without reading them and coordinating with O0.
- Do not invent missing provider, broker, delivery, or shipment contracts. Use `[MISSING: ...]` or `[UNKNOWN: ...]`.
- Keep the IPS chain in every repo-local update.
- Each worker must leave validation evidence and a handoff note before integration.
