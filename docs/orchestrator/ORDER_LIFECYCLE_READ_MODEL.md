# Orders Lifecycle Read Model

```yaml
id: ORDERS-LIFECYCLE-READ-MODEL
status: implemented
owner: Orders O1 worker
created: 2026-07-02
upstream:
  - docs/orchestrator/2026-07-02-order-lifecycle-warehouse-status-rollout-plan.md
  - docs/orchestrator/ORDER_STATUS_TRANSITIONS.md
  - docs/orchestrator/WAREHOUSE_HANDOFF_CONTRACT.md
  - docs/orchestrator/PAYMENT_STATUS_BOUNDARY.md
downstream:
  - src/orders/order-lifecycle.ts
  - src/orders/orders.controller.ts
  - src/orders/orders.service.ts
  - src/orders/order-event-contracts.ts
  - docs/orchestrator/event-fixtures/orders.order.lifecycle_changed.v1.json
  - scripts/verify-order-lifecycle-read-model.js
```

## IPS Chain

Vision: every sellable order exposes one authoritative lifecycle to customer and admin frontends while Warehouse, Payments, Catalog, Auth, Notifications, Leads, and Marketing keep their own ownership boundaries.

Goal impact: customer cabinets and admin dashboards can consume canonical Orders lifecycle state without inventing local order truth or relying only on the coarse compatibility `status` field.

System: Orders owns order lifecycle read models, compatibility status projection, lifecycle transition validation, and lifecycle events. Warehouse remains stock and fulfillment authority. Payments remains payment authority. Auth remains identity and RBAC authority.

Feature: additive lifecycle stage/read model and `orders.order.lifecycle_changed.v1` event contract.

Task: implement O1 from the July 2 rollout plan.

Execution plan: derive lifecycle from existing canonical Orders columns, publish additive lifecycle events on create/payment/status changes, expose protected customer/admin read models, and validate with focused scripts plus existing Orders verifiers.

Coding prompt: do not persist service code locally, do not deploy or push, preserve existing dirty work, keep old `status` backward-compatible, and use `[MISSING: ...]` for unresolved Warehouse/delivery contracts.

Code: `src/orders/order-lifecycle.ts`, `src/orders/order-fulfillment-handoff.client.ts`, Orders controller/service lifecycle endpoints, event contract builder/publisher, lifecycle fixture, and verifiers.

Validation: `npm run build`, `npm run verify:order-lifecycle-read-model`, `npm run verify:order-fulfillment-handoff`, `npm run verify:event-contracts`, plus broader verifier commands listed in the worker handoff.

## Lifecycle Stage Contract

The authoritative UX lifecycle stages are:

- `ordered_unpaid`
- `payment_failed`
- `paid_not_delivered`
- `warehouse_fulfillment_requested`
- `warehouse_collecting`
- `warehouse_forming`
- `warehouse_formed`
- `handed_to_delivery`
- `in_delivery`
- `received`
- `not_received`
- `returned`
- `cancelled`

The existing `orders.status` field remains the compatibility projection for older consumers. It is not removed or renamed.

## Read Surfaces

Customer cabinet API:

- `GET /api/orders/customer/lifecycle`
- Auth: any Auth-valid human bearer token through `authenticated:user`, plus Orders admin/read/operator roles.
- Scope: returns only orders whose persisted `customer.email` matches the authenticated actor email.
- Output: lifecycle stage, compatibility status, totals, item list, shipping method, delivery address, timeline, and audit-safe Warehouse handoff summary.

Admin cabinet API:

- `GET /api/orders/admin/lifecycle`
- Auth: `global:superadmin`, `internal:orders-microservice:admin`, `internal:orders-microservice:readonly`, or `internal:orders-microservice:operator`.
- Filters: `channel`, `status`, `paymentStatus`, `lifecycleStage`, `from`, `to`, `limit`.
- Output: lifecycle order read models plus aggregate counts by lifecycle stage, payment status, channel, delivery status, exception state, and totals by currency.

## Transition Validation

Strict lifecycle transitions follow the rollout plan main and exception paths. Runtime event publication uses `coarse_projection` mode only to keep existing coarse `status` behavior backward-compatible with existing Orders status transitions.

W1 Warehouse fulfillment handoff is implemented as an Orders-side client call after the existing paid-transition reservation `fulfill` calls. Orders reads fulfilled reservations through `GET /api/reservations/order/:orderId` and posts `POST /api/fulfillment-orders` with order id, order number, channel, shipping method, delivery address, allowed customer contact, and item lines that include order item id, reservation id, product id, SKU, title, warehouse id, and quantity.

Blocker: `[MISSING: Delivery provider or shipment-status source contract for after handoff to carrier.]`

## Sensitive Data Rules

- Lifecycle events never include full customer, shipping address, billing address, customer note, payment provider, tracking, token, secret, or raw Warehouse response data.
- Authenticated read APIs may expose delivery address and order items because customer/admin UIs require them, but they do not log those payloads or include them in event fixtures.
- Customer read filtering currently depends on `customer.email` because Orders has no persisted Auth subject field on legacy order rows.

Blocker: `[MISSING: Auth customer subject-to-order identity contract for non-email customer matching.]`
