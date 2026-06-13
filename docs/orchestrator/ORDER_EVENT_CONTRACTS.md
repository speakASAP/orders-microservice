# Order Event Contracts

```yaml
id: ORDERS-ORDER-EVENT-CONTRACTS
status: implemented
owner: Orders owner
created: 2026-06-13
last_updated: 2026-06-13
completeness_level: implemented
upstream:
  - docs/orchestrator/INTENT.md
  - docs/orchestrator/PROJECT_INVARIANTS.md
  - docs/orchestrator/ORDERS_HUB_ROADMAP.md
downstream:
  - src/orders/order-event-contracts.ts
  - src/orders/order-events.service.ts
  - docs/orchestrator/event-fixtures/*
```

## Purpose

Orders publishes versioned lifecycle events on the durable RabbitMQ exchange `orders.events`. These events are safe integration signals for Warehouse, Payments, Notifications, Leads, Marketing, channel services, and operations. Orders remains the lifecycle source of truth; consumers must not treat events as permission to own order state.

## Versioned Routing Keys

| Routing key | Authoritative meaning | Current publisher |
| --- | --- | --- |
| `orders.order.created.v1` | A canonical order was persisted by Orders. | `publishOrderCreated` |
| `orders.order.updated.v1` | The canonical order lifecycle status changed. | `publishOrderUpdated` |
| `orders.order.paid.v1` | Orders observed a payment-success signal owned by Payments. | reserved helper, no current runtime caller |
| `orders.order.shipped.v1` | Orders observed the order reached shipped state or shipment handoff. | `publishOrderShipped` |
| `orders.order.cancelled.v1` | Orders accepted an owner-approved cancellation. | emitted by `publishOrderUpdated` when status is `cancelled` |

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

## Allowed Payload Fields

- `orderId`
- `channel`
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

## Forbidden Payload Fields

Events must not include customer objects, customer addresses, billing addresses, street/postal fields, payment method details, provider secrets, bearer tokens, JWTs, passwords, raw credentials, tracking numbers, tracking URLs, operator email addresses, or approver display identities.

Consumers that require address, payment, or tracking data must use an authorized service API owned by the relevant domain. Notifications own delivery, Warehouse owns stock and reservations, Payments owns provider identity and reconciliation, and Leads/Marketing own CRM/campaign processing.

## Fixtures And Verification

Fixtures live in `docs/orchestrator/event-fixtures/`. Run:

```bash
npm run verify:event-contracts
```

The verifier checks that all five versioned events exist, match the code-level contract helpers, include version metadata, and do not contain forbidden sensitive fields.
