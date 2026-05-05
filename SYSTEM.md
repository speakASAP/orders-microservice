# System: orders-microservice

## Stack

NestJS · PostgreSQL · RabbitMQ  
**Port**: 3203 · **Domain**: `orders.alfares.cz`

## Deployment

**Platform**: Kubernetes (k3s) · namespace `statex-apps` · Phase A ✅  
**Image**: `localhost:5000/orders-microservice:latest`  
**Deploy**: `./scripts/deploy.sh`  
**Logs**: `kubectl logs -n statex-apps -l app=orders-microservice -f`

## Secrets

All secrets in Vault at `secret/prod/orders-microservice`.  
Synced via ESO → K8s Secret `orders-microservice-secret`.  
See [`../shared/docs/VAULT.md`](../shared/docs/VAULT.md).

| Secret key | Purpose |
|---|---|
| `DB_PASSWORD` | PostgreSQL password |
| `JWT_SECRET` | JWT signing key |

## Integrations

| Dependency | Internal URL |
|---|---|
| database-server | `db-server-postgres:5432` |
| logging-microservice | `logging-microservice.statex-apps.svc.cluster.local:3367` |
| auth-microservice | `auth-microservice.statex-apps.svc.cluster.local:3370` |
| RabbitMQ | `amqp://192.168.88.53:5672` (host node · K8s DNS: `host.k3s.internal`) · exchange `orders.events` |

## Order State Machine

`pending → confirmed → processing → shipped → delivered | cancelled`

No state jumps. See `BUSINESS.md` for constraints.

## Events Published

| Event | Trigger |
|---|---|
| `order.created` | New order ingested |
| `order.updated` | Status changed |
| `order.shipped` | Shipment created |

## Pricing Domain

This service owns the pricing/AI-suggestion domain (not `payments-microservice`).  
Canonical surface: `GET/POST /admin/pricing/*` and `/pricing/*`.

## Current State
<!-- AI-maintained -->
Stage: production · Health: ok

## Known Issues
<!-- AI-maintained -->
- None
