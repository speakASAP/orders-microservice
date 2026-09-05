# Integration Contract

```yaml
id: INTEGRATION-CONTRACT-orders-microservice
status: approved
owner: project owner
created: 2026-08-30
last_updated: 2026-08-30
completeness_level: validated
upstream:
  - ../../SYSTEM.md
  - ../../BUSINESS.md
downstream:
  - ../11_tasks/TASK-001-bootstrap-service.md
  - ../12_validation/VAL-TASK-001-bootstrap-service.md
```

## purpose

This contract records how orders-microservice participates in the Alfares ecosystem: which capabilities are required, which are intentionally not applicable, and what happens when a required dependency is unavailable. The service is the order-processing authority for every sales channel and hands off, but does not own, payment, stock and invoicing truth.

## capability decisions

The machine-readable decisions live in `ips-adoption.json`. This document adds the human-readable architecture and contract links.

For machine service identity, follow the sole canonical [`SERVICE_IDENTITY_CONSUMER_STANDARD.md`](../../../auth-microservice/docs/SERVICE_IDENTITY_CONSUMER_STANDARD.md). It is not reproduced here.

## data ownership

orders-microservice owns order, order item, shipment and pricing-suggestion records. Product/catalog truth remains with `catalog-microservice`; stock and reservation truth remains with `warehouse-microservice`; payment processing truth remains with `payments-microservice`; invoice/tax documents remain with `invoices-microservice`. Order item snapshots stored here are point-in-time copies, not the catalog source of truth.

## authentication and authorization

For machine service identity, follow the sole canonical [`SERVICE_IDENTITY_CONSUMER_STANDARD.md`](../../../auth-microservice/docs/SERVICE_IDENTITY_CONSUMER_STANDARD.md). It is not reproduced here.

## synchronous dependencies

- PostgreSQL reads/writes for all order, item and shipment persistence.
- Auth-microservice-issued JWT validation on every protected request.
- `ai-microservice` and `catalog-microservice` HTTP calls during pricing suggestion generation and approval.
- `warehouse-microservice` reservation handoff calls during order creation.

## asynchronous dependencies

- `orders.order.created.v1`, `orders.order.updated.v1`, `orders.order.shipped.v1` published to RabbitMQ (`orders.events` exchange), consumed by `warehouse-microservice`, `allegro-service`, `aukro-service`, `bazos-service`, `marketing-microservice` and, for the shipped event, `notifications-microservice`.

## degraded operation

When RabbitMQ is unavailable, order processing continues and the failure is logged rather than blocking order creation or status transitions; downstream event-driven consumers fall behind until connectivity is restored. When `warehouse-microservice` or `ai-microservice`/`catalog-microservice` are unavailable, the affected handoff or pricing operation fails explicitly and is surfaced rather than silently succeeding.

## validation

- `GET /health` and `GET /health/order-events` pass under the service health contract.
- Role-gated routes reject unauthorized internal-service callers.
- Order status transitions are validated against the state machine before persistence.
