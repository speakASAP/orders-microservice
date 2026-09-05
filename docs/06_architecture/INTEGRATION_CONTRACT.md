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

| Capability | Component | Decision | Contract/API/event | Configuration | Failure mode | Validation evidence |
| --- | --- | --- | --- | --- | --- | --- |
| Auth | auth-microservice | required | Human tokens use the human validation standard; machine routes use the service identity standard | Auth validation or approved local RS256 verification; pair credentials use Vault -> ExternalSecret -> Kubernetes Secret -> secretKeyRef | Requests without valid identity and an allowed role are rejected | src/auth/jwt-roles.guard.ts role checks |
| PostgreSQL | `db-server-postgres` | required | Relational persistence for orders, items, shipments and pricing suggestions | `db-server-postgres:5432`, `DB_PASSWORD` in Vault | Service fails closed and surfaces a storage error | Order/shipment CRUD persistence tests |
| Redis | `db-server-redis` | not-applicable | No Redis client or dependency exists in the codebase | not-applicable | not-applicable | `rg redis` returns no matches in `src/` or `package.json` |
| Logging | `logging-microservice` | required | Structured log payloads POSTed via `LOGGING_SERVICE_URL` | `LOGGING_SERVICE_URL` env var, `src/logger/logger.service.ts` | Logging failure degrades observability but does not block order processing | Structured log emission checks |
| Notifications | `notifications-microservice` | not-applicable | orders-microservice does not call notifications-microservice directly; `notifications-microservice` is a downstream consumer of the `orders.order.shipped.v1` event via RabbitMQ, tracked under the event-bus capability | not-applicable | not-applicable | No `NOTIFICATIONS_SERVICE_URL` or direct client in `src/` |
| AI | `ai-microservice` | required | HTTP calls to `AI_SERVICE_URL` for pricing suggestion generation | `AI_SERVICE_URL=http://ai-microservice:3380` in `src/pricing/pricing.service.ts` | Pricing suggestion generation fails without blocking order processing | Pricing generation endpoint smoke test |
| Payments | payments-microservice | required | Payment-status callbacks require the payments-to-orders Auth-issued pair JWT and a least-privilege internal:orders-microservice role | Pair credential delivered Vault -> ExternalSecret -> Kubernetes Secret -> secretKeyRef | Unauthorized callbacks are rejected; order retains last known payment status | src/orders/orders.controller.ts payment-status route and role guard |
| Catalog | catalog-microservice | required | Product reads and pricing writes use the orders-to-catalog Auth-issued pair JWT and target-scoped roles | Pair credential delivered Vault -> ExternalSecret -> Kubernetes Secret -> secretKeyRef | Pricing write fails explicitly rather than silently dropping the approved suggestion | src/pricing/pricing.service.ts catalog write path |
| Orders | `orders-microservice` | not-applicable | This service is the orders domain itself, not a consumer of another orders service | not-applicable | not-applicable | Self-referential capability |
| Warehouse | warehouse-microservice | required | Reservation handoffs use the orders-to-warehouse Auth-issued pair JWT and target-scoped roles | Pair credential delivered Vault -> ExternalSecret -> Kubernetes Secret -> secretKeyRef | Reservation handoff is recorded as absent; order creation still succeeds | src/warehouse/warehouse-reservation.client.ts, src/orders/order-fulfillment-handoff.client.ts |
| Invoices | `invoices-microservice` | required | Authenticated reads of order detail via role `internal:invoices-microservice:service` | Role-gated `GET /:id` and lifecycle read routes | Unauthorized invoice reads are rejected | `ORDER_DETAIL_READ_ROLES` in `src/orders/orders.controller.ts` |
| Object storage | `minio-microservice` | not-applicable | No object-storage client or bucket configuration exists in the codebase | not-applicable | not-applicable | No `minio`/`s3` matches in `src/` |
| Events | RabbitMQ | required | Publishes `orders.order.created.v1`, `orders.order.updated.v1`, `orders.order.shipped.v1` on the `orders.events` exchange via `amqplib` | `RABBITMQ_URL` | Connection failure is logged; order processing continues without blocking on event delivery | `src/orders/order-events.service.ts` |
| Documentation retrieval | `docs-rag-microservice` | required | Direct Git repository ingestion | Repository catalog registration | Git remains authoritative when RAG is degraded | Retrieval source check |
| Monitoring | `monitoring-microservice` | required | `GET /health` and `GET /health/order-events` with Kubernetes readiness probes | K8s manifests in `k8s/` | Readiness failure blocks rollout | `src/health/health.controller.ts` |
| Backups | `backups-microservice` | required | PostgreSQL backup policy for durable order, item and shipment state | Retention and backup schedule managed by `database-server` | Data loss is surfaced and triaged before continued operation | Backup posture defined and reviewed |

## data ownership

orders-microservice owns order, order item, shipment and pricing-suggestion records. Product/catalog truth remains with `catalog-microservice`; stock and reservation truth remains with `warehouse-microservice`; payment processing truth remains with `payments-microservice`; invoice/tax documents remain with `invoices-microservice`. Order item snapshots stored here are point-in-time copies, not the catalog source of truth.

## authentication and authorization

Machine-accessible routes and all outbound HTTP calls follow auth-microservice/docs/SERVICE_IDENTITY_CONSUMER_STANDARD.md. Auth is the only signer; every caller-to-target pair uses its own Auth-registered RS256 bearer JWT with a least-privilege internal:orders-microservice role. Receivers validate through Auth or an approved local RS256 verifier, create a separate service actor, explicitly enforce roles per route, and deny and error-log undecorated routes. Pair credentials flow only through Vault -> ExternalSecret -> Kubernetes Secret -> secretKeyRef. Human access uses the separate consumer JWT validation standard.

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
