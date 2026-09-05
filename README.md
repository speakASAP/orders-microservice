# orders-microservice

Central order processing service. Handles orders from all sales channels.

## status

orders-microservice is a validated, production runtime service in the Alfares ecosystem (marked completed/frozen 2026-06-21 with no active goals or blockers). The repository is aligned to the IPS adoption standard.

## documentation authority

This project keeps Git and the approved upstream intent documents as the source of truth. The effective authority chain is:

- `BUSINESS.md` for order-processing intent and constraints
- `docs/01_vision/VISION.md` for the target outcome
- `SYSTEM.md` for service responsibilities and dependencies
- `docs/17_governance/PROJECT_INVARIANTS.md` for guardrails
- `docs/orchestrator/*` and `docs/IMPLEMENTATION_ORCHESTRATOR.md` for the pre-existing implementation-orchestrator execution discipline

## capabilities

- Order and order-item ingestion from every sales channel (flipflop, Allegro, Aukro, Bazos, Heureka, Cliplot)
- Order status state machine enforcement with no invalid transitions
- Shipment and per-item fulfillment tracking
- Payment-status and warehouse-reservation handoff recording
- AI-assisted pricing suggestion generation and approval workflow
- Versioned order lifecycle events published to RabbitMQ

## interfaces

- HTTP API exposed through the NestJS service on port 3203
- PostgreSQL for persisted order, item, shipment and pricing suggestion state
- RabbitMQ for order lifecycle events (`orders.events` exchange)
- Auth, logging, AI, catalog, warehouse, payments and invoices ecosystem integrations

## development

- Stack: NestJS, TypeScript, PostgreSQL, RabbitMQ
- Local service entry: `npm run start:dev` (see `package.json` scripts)
- Test entry: `npm test`
- Keep edits compatible with the existing order state machine and role-guard model

## configuration

- Runtime namespace: `statex-apps`
- Domain: `https://orders.alfares.cz`
- Service port: `3203`
- Environment values are managed through `.env.example`, Kubernetes ConfigMap and the Vault/ESO secret flow (`secret/prod/orders-microservice`); secrets are never committed to Git

## deployment

- Deploy command: `./scripts/deploy.sh`
- Target: Kubernetes (k3s) in `statex-apps`, image `localhost:5000/orders-microservice:latest`
- Health requirement: `GET /health` passes before rollout completion
- Deployment remains serialized via the shared deployment lock and rollout gate

## health and observability

- Health endpoints: `GET /health` and `GET /health/order-events` (RabbitMQ connectivity)
- Structured logging via `logging-microservice`
- Monitoring via `monitoring-microservice`
- Operator checks: `kubectl logs -n statex-apps -l app=orders-microservice -f`

## approval

Status: approved
Approved by: project owner
Approval evidence: owner-confirmation: orders-microservice-onboarding-approved

## API Endpoints

### Orders

| Method | Path | Description |
|---|---|---|
| GET | `/api/orders` | List orders (filter: channel, status) |
| GET | `/api/orders/:id` | Order detail |
| POST | `/api/orders` | Create order |
| PUT | `/api/orders/:id/status` | Update order status |

### Items

| Method | Path | Description |
|---|---|---|
| GET | `/api/items/order/:orderId` | List order items |
| POST | `/api/items/order/:orderId` | Add item |
| PUT | `/api/items/:id/fulfillment` | Update fulfillment status |

### Shipments

| Method | Path | Description |
|---|---|---|
| GET | `/api/shipments/order/:orderId` | List shipments |
| POST | `/api/shipments` | Create shipment |
| PUT | `/api/shipments/:id/tracking` | Update tracking |
| PUT | `/api/shipments/:id/status` | Update shipment status |

### Pricing (AI suggestions)

| Method | Path | Description |
|---|---|---|
| GET | `/admin/pricing/suggestions` | List suggestions |
| POST | `/admin/pricing/generate` | Generate suggestions |
| PATCH | `/admin/pricing/suggestions/:id/approve` | Approve |
| PATCH | `/admin/pricing/suggestions/:id/reject` | Reject |

### Health

`GET /health` · `GET /health/order-events`

## Infrastructure

- **K8s**: `statex-apps` namespace · k3s ✅
- **Secrets**: Vault `secret/prod/orders-microservice` → ESO → K8s Secret

## Related Services

| Service | Internal URL |
|---|---|
| catalog-microservice | `catalog-microservice:3200` |
| warehouse-microservice | `warehouse-microservice:3201` |
| allegro-service | `allegro-service:3403` |
| flipflop-service | `flipflop-service:3000` |
| auth-microservice | `auth-microservice:3370` |

## Warehouse Handoff
