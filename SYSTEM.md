# System: orders-microservice

## Architecture

NestJS + PostgreSQL. Multi-channel order ingestion + fulfillment tracking.

- Events published: `order.created`, `order.updated`, `order.shipped` → RabbitMQ
- State machine: pending → confirmed → processing → shipped → delivered | cancelled

### Product pricing (ecosystem rule)

**This service (`orders-microservice`) owns the orders domain, including product list prices and AI price-suggestion workflows** (read suggestions, generate, approve/reject, safety guards, related RabbitMQ events). That logic **must not** live in `payments-microservice` (payment sessions only) or `business-orchestrator` (agent coordination).

Canonical pricing HTTP surface in this service:
- `GET /admin/pricing/suggestions` (also `/pricing/suggestions`)
- `POST /admin/pricing/generate` (also `/pricing/generate`)
- `PATCH /admin/pricing/suggestions/:id/approve` (also `/pricing/suggestions/:id/approve`)
- `PATCH /admin/pricing/suggestions/:id/reject` (also `/pricing/suggestions/:id/reject`)

**Flipflop:** The flipflop monorepo currently ships a colocated Nest **`order-service`** under `flipflop-service/services/order-service/` with the HTTP routes and DB access for the flipflop catalog; treat it as the same bounded context until pricing APIs are fully exposed or merged here.

## Integrations

| Dependency | URL |
|-----------|-----|
| database-server | db-server-postgres:5432 |
| logging-microservice | logging-microservice:3367 |
| RabbitMQ | order events |

## Current State
<!-- AI-maintained -->
Stage: production

## Known Issues
<!-- AI-maintained -->
- None
