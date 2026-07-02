# Order Event Contracts

```yaml
id: ORDERS-ORDER-EVENT-CONTRACTS
status: implemented
owner: Orders owner
created: 2026-06-13
last_updated: 2026-07-02
completeness_level: implemented
upstream:
  - docs/orchestrator/INTENT.md
  - docs/orchestrator/PROJECT_INVARIANTS.md
  - docs/orchestrator/ORDERS_HUB_ROADMAP.md
downstream:
  - src/orders/order-event-contracts.ts
  - src/orders/order-events.service.ts
  - src/orders/order-event-outbox.entity.ts
  - migrations/007_create_order_event_outbox.sql
  - src/health/health.controller.ts
  - docs/orchestrator/event-fixtures/*
```

## Purpose

Orders publishes versioned lifecycle events on the durable RabbitMQ exchange `orders.events`. These events are safe integration signals for Warehouse, Payments, Notifications, Leads, Marketing, channel services, and operations. Orders remains the lifecycle source of truth; consumers must not treat events as permission to own order state.

## Versioned Routing Keys

| Routing key | Authoritative meaning | Current publisher |
| --- | --- | --- |
| `orders.order.created.v1` | A canonical order was persisted by Orders. | `publishOrderCreated` |
| `orders.order.updated.v1` | The canonical order lifecycle status changed. | `publishOrderUpdated` |
| `orders.order.paid.v1` | Orders observed a payment-success signal owned by Payments. | `publishOrderPaid` from `applyPaymentStatus` on the first paid transition |
| `orders.order.shipped.v1` | Orders observed the order reached shipped state or shipment handoff. | `publishOrderShipped` |
| `orders.order.cancelled.v1` | Orders accepted an owner-approved cancellation. | emitted by `publishOrderUpdated` when status is `cancelled` |
| `orders.order.lifecycle_changed.v1` | Orders lifecycle stage changed for customer/admin read models. | `publishOrderLifecycleChanged` |

## Envelope

Every event has this envelope:

```json
{
  "type": "orders.order.created.v1",
  "eventVersion": 1,
  "eventId": "uuid",
  "occurredAt": "2026-06-13T08:00:00.000Z",
  "source": "orders-microservice",
  "payload": {}
}
```

RabbitMQ message headers repeat `eventType` and `eventVersion`.

## Durable Outbox And Readiness

Orders records every versioned `orders.events` publish attempt in `order_event_outbox` before trying RabbitMQ. Rows start as `pending`, become `published` after an accepted publish, or become `failed` when the broker publish fails or is not accepted. Pending and failed rows are retried by `OrderEventsService` after broker recovery, bounded by `ORDER_EVENT_OUTBOX_MAX_ATTEMPTS`, `ORDER_EVENT_OUTBOX_RETRY_BATCH_SIZE`, and `ORDER_EVENT_OUTBOX_RETRY_INTERVAL_MS`.

The outbox is scoped to Orders lifecycle events only. `pricing.events` continues to publish on its own exchange and must not be stored in `order_event_outbox`.

`GET /health/order-events` exposes bounded readiness metadata: broker connection state, outbox repository configuration, retry loop state, pending/failed counts, retry settings, and last bounded retry error code. It does not expose event payloads, orders, customers, addresses, payment data, tokens, or broker credentials.

Production use requires the guarded migration and deploy to be owner-approved. Until then, source is ready but live readiness remains `[MISSING: Orders event outbox migration/deploy approval and live /health/order-events readiness smoke]`.

## Allowed Payload Fields

- `orderId`
- `channel`
- `leadAttribution.leadId`
- `leadAttribution.source`
- `leadAttribution.campaignId`
- `items[].productId`
- `items[].sku`
- `items[].quantity`
- `items[].unitPrice`
- `items[].totalPrice`
- `currency`
- `status`
- `previousStatus`
- `paymentStatus`
- `paymentReferenceId`
- `shipmentStatus`
- `shipmentLookupRequired`
- `approval.approvalType`
- `approval.reasonCode`
- `approval.sideEffectsHandled`
- `approval.approvedAt`
- `orderNumber`
- `channelAccountId`
- `externalOrderId`
- `previousLifecycleStage`
- `lifecycleStage`
- `fulfillmentStatus`
- `deliveryStatus`
- `total`
- `warehouseHandoff.status`
- `warehouseHandoff.itemCount`
- `warehouseHandoff.reservedCount`
- `warehouseHandoff.failedCount`
- `warehouseHandoff.reasonCode`
- `warehouseHandoff.actor`

## Created Event Product Affinity Snapshot

`orders.order.created.v1` may include a bounded `payload.items[]` snapshot for ecosystem product-affinity consumers. The item snapshot is derived from persisted `order_items` and may contain only `productId`, optional `sku`, `quantity`, optional `unitPrice`, and optional `totalPrice`. The event may also include order-level `currency`. It must not include product descriptions, customer data, addresses, payment details, provider identifiers, warehouse reservation details, tracking data, or mutable checkout state.

This snapshot is the approved producer-side source for related-products co-purchase graphs, buy-together set candidates, aggregate cross-sell analytics, and marketplace bundle planning. Consumers must treat it as event evidence, not as permission to mutate Catalog products, Orders history, checkout totals, payment totals, or Warehouse stock.

## Created Event Lead Attribution

`orders.order.created.v1` may include optional `payload.leadAttribution` only when an approved create-order caller supplies explicit attribution metadata:

```json
{
  "leadAttribution": {
    "leadId": "lead-1001",
    "source": "lead-form",
    "campaignId": "campaign-1001"
  }
}
```

Allowed nested fields are `leadId`, `source`, and `campaignId`. Orders must not infer lead attribution from customer names, email addresses, phone numbers, shipping or billing addresses, payment fields, notes, or channel-local payloads. If attribution is absent, Orders omits `leadAttribution` from the event payload. Current channel mapping remains blocked until each channel has an approved source field: `[MISSING: channel lead attribution source mapping]`.

## Paid Event

`orders.order.paid.v1` is emitted only after Orders accepts an
`orders.payment-status.v1` update from the Payments-owned boundary and observes
the first transition to paid. The event is a trigger signal for downstream
consumers such as invoices and notifications; consumers that need legal,
customer, billing, or payment reconciliation details must read them through
their approved internal Orders or Payments read contracts.

## Lifecycle Changed Event

`orders.order.lifecycle_changed.v1` is the additive authoritative UX lifecycle event for customer and admin frontends. It does not replace older coarse routing keys; existing `orders.order.created.v1`, `orders.order.updated.v1`, `orders.order.paid.v1`, `orders.order.shipped.v1`, and `orders.order.cancelled.v1` continue for backward compatibility.

Required payload fields: `eventId`, `occurredAt`, `orderId`, `orderNumber`, `channel`, `channelAccountId`, `externalOrderId`, `previousLifecycleStage`, `lifecycleStage`, `status`, `paymentStatus`, `fulfillmentStatus`, `deliveryStatus`, `total`, `currency`, bounded `items[]`, and audit-safe `warehouseHandoff`.

The lifecycle event must not include full customer objects, delivery addresses, billing addresses, customer notes, payment provider details, tracking numbers, tokens, secrets, Warehouse response bodies, raw reservation records, or item `warehouseId` values. Authenticated frontends must fetch sensitive detail through Orders read APIs.

W1 Warehouse handoff update: after first paid transition, Orders now calls Warehouse reservations `fulfill`, reads fulfilled reservations by order id, and posts `POST /api/fulfillment-orders` with the W1-approved dispatch payload. The remaining external blocker is `[MISSING: Delivery provider or shipment-status source contract for after handoff to carrier.]`.

## Forbidden Payload Fields

Events must not include customer objects, customer addresses, billing addresses, street/postal fields, payment method details, provider secrets, bearer tokens, JWTs, passwords, raw credentials, tracking numbers, tracking URLs, operator email addresses, or approver display identities.

Consumers that require address, payment, or tracking data must use an authorized service API owned by the relevant domain. Notifications own delivery, Warehouse owns stock and reservations, Payments owns provider identity and reconciliation, and Leads/Marketing own CRM/campaign processing.

## Fixtures And Verification

Fixtures live in `docs/orchestrator/event-fixtures/`. Run:

```bash
npm run verify:event-contracts
```

The verifier checks that all six versioned events exist, match the code-level contract helpers, include version metadata, cover optional created-event lead attribution, preserve absence when attribution is not supplied, do not contain forbidden sensitive fields, store only Orders events in the outbox, keep pricing events out of the Orders outbox, and retry a pending outbox row after broker recovery.
