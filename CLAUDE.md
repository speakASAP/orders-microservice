# CLAUDE.md (orders-microservice)

→ Ecosystem: [../shared/CLAUDE.md](../shared/CLAUDE.md) | Reading order: `BUSINESS.md` → `SYSTEM.md` → `AGENTS.md` → `TASKS.md` → `STATE.json`

---

## Knowledge Retrieval — docs-rag-microservice (MANDATORY, query before reading files)

**Query the RAG before reading source files** — saves 2000-5000 tokens per answer.

```bash
kubectl -n statex-apps exec deployment/business-orchestrator -- curl -s -X POST http://docs-rag-microservice:3397/retrieval/agent-context \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(cat ~/.claude/rag-token)" \
  -d '{"query": "YOUR QUESTION HERE", "maxTokens": 3000}'
```


---

## orders-microservice

**Purpose**: Central order processing hub. Manages order state machine and shipment tracking.  
**Port**: 3203 · **Domain**: `https://orders.alfares.cz`  
**Stack**: NestJS · PostgreSQL · RabbitMQ  
**Constraints**: → [`BUSINESS.md`](BUSINESS.md)

**Ops**: `curl http://orders-microservice:3203/health` · `kubectl logs -n statex-apps -l app=orders-microservice -f` · `./scripts/deploy.sh`

## Key facts for agents

- Never cancel or refund orders without explicit human approval
- State machine: `pending → confirmed → processing → shipped → delivered | cancelled` — no jumps
- Never log customer address or payment info
- All marketplace services (allegro, aukro, bazos) forward orders here
- Secrets: Vault `secret/prod/orders-microservice` → see [`SYSTEM.md`](SYSTEM.md)
- Events: `order.created`, `order.updated`, `order.shipped` → RabbitMQ
- Consumers: flipflop-service, allegro-service, aukro-service, bazos-service, marketing-microservice
