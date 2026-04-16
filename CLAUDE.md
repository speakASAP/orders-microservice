# CLAUDE.md (orders-microservice)

Ecosystem defaults: sibling [`../CLAUDE.md`](../CLAUDE.md) and [`../shared/docs/PROJECT_AGENT_DOCS_STANDARD.md`](../shared/docs/PROJECT_AGENT_DOCS_STANDARD.md).

Read this repo's `BUSINESS.md` → `SYSTEM.md` → `AGENTS.md` → `TASKS.md` → `STATE.json` first.

---

## orders-microservice

**Purpose**: Central order processing hub for all sales channels. Manages order state machine and shipment tracking.  
**Port**: 3203  
**Domain**: https://orders.alfares.cz  
**Stack**: NestJS · PostgreSQL · RabbitMQ

### Key constraints
- Never cancel or refund orders without explicit human approval
- Order status transitions must follow the defined state machine — no jumping states
- Never log sensitive customer data (address, payment info)
- All marketplace services (allegro, aukro, bazos) forward orders here — do not store locally

### Events published
- `order.created`, `order.updated`, `order.shipped` → RabbitMQ

### Consumers
flipflop-service, allegro-service, aukro-service, bazos-service, marketing-microservice.

### Quick ops
```bash
curl http://orders-microservice:3203/health
docker compose logs -f
./scripts/deploy.sh
```
