# Claude Instructions

Shared rules live here:

- Claude profile: `/home/ssf/.claude/CLAUDE.md`
- Shared ecosystem instructions: `/home/ssf/Documents/Github/CLAUDE.md`
- Codex profile: `/home/ssf/.codex/AGENTS.md`
- Cross-agent standard: `/home/ssf/.ai-agent-standards/CROSS_AGENT_AUTOMATION_STANDARD.md`
- Repository operations: `AGENT_OPERATIONS.md`

Read those first, then follow the repository-specific notes below and the current planning/status files.


## Repository-Specific Notes

# CLAUDE.md (orders-microservice)

→ Ecosystem: [../shared/CLAUDE.md](../shared/CLAUDE.md) | Reading order: `BUSINESS.md` → `SYSTEM.md` → `AGENTS.md` → `TASKS.md` → `STATE.json`

---

## Knowledge Retrieval

Use `docs-rag-microservice` for bounded discovery when it is healthy, then
verify deployment, security, database, integration and public-contract facts
against the cited Git source. Git remains authoritative.

Authority and fallback rules:
`/home/ssf/Documents/Github/shared/docs/DOCUMENTATION_AUTHORITY.md`.

Do not generate tokens in documentation or assume an unconfident/failed RAG
response means that source documentation does not exist.

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
