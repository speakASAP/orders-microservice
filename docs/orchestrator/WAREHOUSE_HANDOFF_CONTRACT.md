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
| sellable channel order created, items have `warehouseId` | create or update active reservation | `POST /api/reservations/reserve` | `ORDER_CREATE_RESERVATION` | Create succeeds only when Warehouse returns `reserved`. |
| sellable channel order created, reservation disabled, any item missing `warehouseId`, or Warehouse request failed, including insufficient available stock | reject create before `order.created` event | none or failed reserve attempt; release any previously reserved create lines | `ORDER_CREATE_RESERVATION`; compensation uses `ORDER_CREATE_RESERVATION_COMPENSATION` | Sellable channel create requests fail closed; Warehouse remains stock authority and Orders does not invent local stock truth. |
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
- optional compensatedCount and compensationFailedCount for create-time partial reservation failure
- reasonCode and actor
- skipReason or failureCode

The metadata must not include stock quantities beyond the order item quantity, Warehouse response bodies, customer data, addresses, payment details, credentials, bearer tokens, or raw error text.

## Runtime Guardrails

- The configured Warehouse bearer value must be an Auth-compatible service JWT issued/provisioned through `auth-microservice`, not a locally signed Orders token. The expected consumer standard is `auth-microservice/docs/SERVICE_IDENTITY_CONSUMER_STANDARD.md`: the token must carry Warehouse service identity metadata, preferably `serviceName`, and the Warehouse receiver role `internal:warehouse-microservice:admin`.
- Orders is only the caller and transport owner for this handoff. User identity, service identity, token issuance, and token validation remain centralized in `auth-microservice`; Orders must not sign, decode, persist, or log the Warehouse service JWT.
- Reservation calls are disabled unless `WAREHOUSE_RESERVATION_ENABLED=true`.
- Orders skips reservation if any item lacks `warehouseId`.
- If one create-time item reservation succeeds and a later item reservation fails, Orders calls `POST /api/reservations/release` for each already reserved line before returning a failed handoff.
- Sellable channel order create requires Warehouse handoff status `reserved`; `disabled`, `skipped`, or `failed` handoff results reject the create before publishing `orders.order.created.v1`.
- Warehouse reservation failures, including insufficient-stock rejections, do not make Orders the stock authority; Orders records bounded failure metadata only for flows that already own a persisted order lifecycle and must not expose Warehouse response bodies, available quantities, requested quantities, or raw error text.
- Idempotent order replay does not call Warehouse again because the create path returns the existing order before handoff.

## Paid Provider Bundle Cleanup Gate

For Goal 24 `catalog.bundle.v1` paid/provider smoke planning, Warehouse cleanup remains state-specific and owner-approved:

- Before paid/fulfillment, Payments `failed` or `cancelled` status causes Orders to call Warehouse `release` with reason `PAYMENT_FAILED_RELEASE`.
- After provider success, Payments `completed` status causes Orders to call Warehouse `fulfill` with reason `PAYMENT_CONFIRMED`; this may represent stock decrement/fulfillment ownership in Warehouse.
- Orders cancellation cleanup calls Warehouse `cancel` with reason `ORDER_CANCELLED` only after the owner-approved Orders cancellation gate passes.
- If a paid provider smoke reaches a fulfilled or stock-decremented state, the runtime packet must state whether Warehouse owner expects `cancel`, `return`, or another approved operation for each bundle component line. Orders must not edit stock truth or infer rollback quantities locally.
- For Fiobanka Goal 24 cleanup, Orders-to-Warehouse handoff is exact and state-based: unpaid pre-completion cancellation uses `release` with `PAYMENT_FAILED_RELEASE`; paid success uses `fulfill` with `PAYMENT_CONFIRMED`; completed-transfer refund/reversal/correction cleanup uses owner-approved Orders cancellation and `cancel` with `ORDER_CANCELLED`; approved return uses `return` with `ORDER_RETURNED`; mixed component states are handled line-by-line; unknown component state is no-op fail-closed.
- Payments refund state, provider correction notes, and local payment metadata are never Warehouse operation selectors. Warehouse owner approval for the observed component state is required before Orders chooses `cancel` or `return` after fulfillment.
