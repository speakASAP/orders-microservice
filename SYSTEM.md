# System: orders-microservice

```yaml
id: SYSTEM-orders-microservice
status: approved
owner: project owner
created: 2026-08-01
last_updated: 2026-08-30
completeness_level: validated
upstream:
  - BUSINESS.md
  - docs/01_vision/VISION.md
downstream:
  - docs/06_architecture/INTEGRATION_CONTRACT.md
  - docs/11_tasks/TASK-001-bootstrap-service.md
```

## purpose

orders-microservice is the central order-processing authority for the Alfares e-commerce backbone. It ingests orders from every sales channel, enforces the order status state machine, tracks shipments and fulfillment, owns the pricing/AI-suggestion domain, and publishes versioned order lifecycle events for downstream consumers.

## responsibilities

- Accept and persist orders and order items from flipflop, Allegro, Aukro, Bazos, Heureka and Cliplot channels
- Enforce the order status state machine and reject invalid transitions
- Track shipments and per-item fulfillment status
- Record payment status reported by `payments-microservice` on the order record
- Hand off warehouse reservation metadata to `warehouse-microservice`
- Own AI-assisted pricing suggestion generation and approval workflow (`/admin/pricing/*`, `/pricing/*`)
- Publish `orders.order.created.v1`, `orders.order.updated.v1` and `orders.order.shipped.v1` events to RabbitMQ
- Expose `GET /health` and `GET /health/order-events` for runtime and event-bus connectivity observability

## non-responsibilities

- It is not the source of truth for product catalog, stock or payment processing
- It does not generate invoices or tax documents (owned by `invoices-microservice`)
- It does not autonomously cancel or refund orders without explicit human approval
- It does not own customer identity (owned by `auth-microservice`)

## inputs

- Channel order payloads from `flipflop-service`, `allegro-service`, `aukro-service`, `bazos-service`, `heureka-service` and `cliplot`
- Payment status updates from `payments-microservice` (`PUT /:id/payment-status`)
- Warehouse fulfillment status updates from `warehouse-microservice` (`PUT /:id/warehouse-fulfillment-status`)
- Human-approved order status transitions (`PUT /:id/status`)
- Product/catalog data from `catalog-microservice` for pricing suggestion generation
- AI pricing suggestions from `ai-microservice`

## outputs

- Persisted order, order item and shipment records in PostgreSQL
- `orders.order.created.v1`, `orders.order.updated.v1`, `orders.order.shipped.v1` events on RabbitMQ (`orders.events` exchange)
- Order lifecycle and detail read models consumed by `invoices-microservice`, `marketing-microservice` and channel services
- Approved pricing writes pushed to `catalog-microservice`
- Structured logs sent to `logging-microservice`

## dependencies

- PostgreSQL (`db-server-postgres`) for durable order, item, shipment and pricing suggestion state
- RabbitMQ for publishing order lifecycle events (`amqplib` client in `src/orders/order-events.service.ts`)
- `auth-microservice` for JWT identity and role validation on every protected route
- `logging-microservice` for structured operational logs
- `ai-microservice` for AI-generated pricing suggestions
- `catalog-microservice` for product/pricing read and write access
- `warehouse-microservice` for reservation handoff on order creation
- `payments-microservice` and `invoices-microservice` as authenticated internal-service callers of the order API

## upstream traceability

This system implements the approved intent in `BUSINESS.md` and the product vision in `docs/01_vision/VISION.md`. It preserves the order state machine and the human-approval constraint on cancellation/refund defined there.

## downstream artifacts

- `docs/06_architecture/INTEGRATION_CONTRACT.md`
- `docs/11_tasks/TASK-001-bootstrap-service.md`
- `docs/12_validation/VAL-TASK-001-bootstrap-service.md`
- `docs/21_execution_plans/EP-TASK-001-bootstrap-service.md`

## validation criteria

- `GET /health` and `GET /health/order-events` return healthy status and RabbitMQ connectivity signal
- Order status transitions are rejected when they violate the defined state machine
- Every status-changing transition results in a published lifecycle event
- Payment and warehouse fulfillment updates are role-gated to the correct internal service caller

## open questions

- None at the adoption level. The upstream flipflop `order-service` pricing module consolidation remains a tracked backlog item in `TASKS.md`, not an open architectural question.

## deployment and operations detail

**Platform**: Kubernetes (k3s) · namespace `statex-apps`
**Image**: `localhost:5000/orders-microservice:latest`
**Deploy**: `./scripts/deploy.sh`
**Logs**: `kubectl logs -n statex-apps -l app=orders-microservice -f`

### secrets

All secrets are stored in Vault at `secret/prod/orders-microservice` and synced via ESO into the K8s Secret `orders-microservice-secret`.

| Secret key | Purpose |
|---|---|
| `DB_PASSWORD` | PostgreSQL password |
| `JWT_SECRET` | JWT signing key |
| `JWT_TOKEN` | Service bearer token for DocsRAG agent-context queries |

### order state machine

`pending → confirmed → processing → shipped → delivered | cancelled`

No state jumps. See `BUSINESS.md` for constraints.

### events published

| Event | Trigger |
|---|---|
| `orders.order.created.v1` | New order ingested |
| `orders.order.updated.v1` | Status changed |
| `orders.order.shipped.v1` | Shipment created |

### pricing domain

This service owns the pricing/AI-suggestion domain (not `payments-microservice`). Canonical surface: `GET/POST /admin/pricing/*` and `/pricing/*`.

### warehouse handoff

Orders-to-Warehouse machine identity is governed exclusively by the canonical [SERVICE_IDENTITY_CONSUMER_STANDARD.md](../auth-microservice/docs/SERVICE_IDENTITY_CONSUMER_STANDARD.md); Warehouse remains stock truth.

### current state

Stage: production · Health: ok
