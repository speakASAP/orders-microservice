# Orders Warehouse Handoff Contract

```yaml
id: ORDERS-WAREHOUSE-HANDOFF-CONTRACT
status: implemented
owner: Orders owner
created: 2026-06-13
last_updated: 2026-06-13
completeness_level: implemented
upstream:
  - docs/orchestrator/INTENT.md
  - docs/orchestrator/PROJECT_INVARIANTS.md
  - /home/ssf/Documents/Github/warehouse-microservice/docs/contracts/availability-contracts.md
  - /home/ssf/Documents/Github/warehouse-microservice/implementation-goals/GOAL-04-reservation-lifecycle.md
downstream:
  - src/warehouse/warehouse-reservation.client.ts
  - src/orders/orders.service.ts
  - scripts/verify-warehouse-handoff-contract.js
```

## Purpose

Orders records order lifecycle and item snapshots. Warehouse remains the stock, reservation, movement, availability, and fulfillment inventory authority. Orders may ask Warehouse to reserve, release, fulfill, cancel, expire, or return reservation state, but Orders must not calculate stock truth or mutate stock tables directly.

## Lifecycle Mapping

| Orders lifecycle state | Warehouse handoff | Endpoint | Reason code | Notes |
| --- | --- | --- | --- | --- |
| order created, items have `warehouseId` | create or update active reservation | `POST /api/reservations/reserve` | `ORDER_CREATE_RESERVATION` | Disabled unless `WAREHOUSE_RESERVATION_ENABLED=true`. |
| order created, any item missing `warehouseId` | skip reservation and record metadata | none | `ORDER_CREATE_RESERVATION` | Warehouse routing must be selected by Warehouse/Catalog/channel workflow first. |
| payment failed before fulfillment | release active reservation | `POST /api/reservations/release` | `PAYMENT_FAILED_RELEASE` | Implemented via the approved H6 payment status boundary for failed or cancelled payment statuses. |
| payment confirmed | fulfill reservation | `POST /api/reservations/fulfill` | `PAYMENT_CONFIRMED` | Implemented via the approved H6 payment status boundary for completed payments; Warehouse performs stock decrement. |
| owner-approved cancellation | cancel reservation | `POST /api/reservations/cancel` | `ORDER_CANCELLED` | Cancellation still requires side-effect acknowledgement in Orders status transition. |
| reservation TTL elapsed | expire reservation | `POST /api/reservations/expire` | `RESERVATION_EXPIRED` | Scheduler/worker ownership is a follow-up. |
| return after fulfillment | return reservation | `POST /api/reservations/return` | `ORDER_RETURNED` | Return workflow remains owner-approved follow-up and is verified as excluded from normal Orders status updates. |

## Reserve Payload

Orders sends one request per order item:

```json
{
  "productId": "catalog-product-1",
  "warehouseId": "warehouse-1",
  "quantity": 2,
  "orderId": "orders-uuid",
  "channel": "flipflop",
  "expiresAt": "2026-06-13T09:15:00.000Z",
  "reasonCode": "ORDER_CREATE_RESERVATION",
  "actor": "orders-microservice",
  "reference": "external-order-id"
}
```

## Orders Metadata

Orders stores audit-safe `orders.warehouseHandoff` metadata:

- status: `disabled`, `skipped`, `reserved`, or `failed`
- attemptedAt and completedAt timestamps
- itemCount, reservedCount, failedCount
- reasonCode and actor
- skipReason or failureCode

The metadata must not include stock quantities beyond the order item quantity, Warehouse response bodies, customer data, addresses, payment details, credentials, bearer tokens, or raw error text.

## Runtime Guardrails

- Orders sends Warehouse reservation lifecycle requests with Authorization bearer auth when WAREHOUSE_SERVICE_TOKEN or WAREHOUSE_INTERNAL_SERVICE_TOKEN is configured. Token values are runtime-only and must not be logged or documented.
- Production maps `WAREHOUSE_SERVICE_TOKEN` from Vault path `secret/prod/orders-microservice` through External Secrets Operator and enables `WAREHOUSE_RESERVATION_ENABLED=true` through Kubernetes ConfigMap.
- Reservation calls are disabled unless `WAREHOUSE_RESERVATION_ENABLED=true`.
- Orders skips reservation if any item lacks `warehouseId`.
- Warehouse reservation failures do not make Orders the stock authority; Orders records `failed` handoff metadata for operator retry/follow-up.
- Idempotent order replay does not call Warehouse again because the create path returns the existing order before handoff.
