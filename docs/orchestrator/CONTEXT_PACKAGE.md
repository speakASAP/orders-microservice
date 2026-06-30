# Orders Context Package

```yaml
id: ORDERS-CONTEXT-PACKAGE
status: active
owner: Orders owner
created: 2026-06-13
last_updated: 2026-06-30
selected_goal: Goal 7 - Production Order Integration Rollout
selected_chunk: 7.1 Orders create caller allowlist and production integration plan
```

## Included Context

- `AGENTS.md`
- `BUSINESS.md`
- `SYSTEM.md`
- `README.md`
- `STATE.json`
- `docs/IMPLEMENTATION_ORCHESTRATOR.md`
- `docs/IMPLEMENTATION_STATE.md`
- `docs/orchestrator/INTENT.md`
- `docs/orchestrator/GOALS.md`
- `docs/orchestrator/PROJECT_INVARIANTS.md`
- `docs/orchestrator/PRE_CODING_GATE.md`
- `docs/orchestrator/READINESS_GATES.md`
- `docs/orchestrator/CHANNEL_ORDER_CREATE_CONTRACT.md`
- `docs/orchestrator/ORDER_EVENT_CONTRACTS.md`
- `docs/orchestrator/WAREHOUSE_HANDOFF_CONTRACT.md`
- `docs/orchestrator/CANDIDATE_APPLICATION_INTEGRATION_DECISIONS.md`
- `docs/orchestrator/PRODUCTION_ORDER_INTEGRATION_PLAN.md`
- `src/auth/jwt-roles.guard.ts`
- `src/orders/orders.controller.ts`
- `src/orders/create-order.dto.ts`
- `src/orders/orders.service.ts`
- `scripts/verify-create-order-contract.js`

## Ecosystem Context Used

Read-only subagent audits on 2026-06-30 inspected channel services, event consumers, and non-marketplace candidate apps directly on Alfares. DocsRAG live retrieval was not used because no session `JWT_TOKEN` was available.

## Excluded Context

- Raw environment values and secrets.
- Production database contents.
- Customer addresses, payment details, bearer tokens, JWT contents, decoded credentials, and raw production customer data.
- Runtime changes in neighboring repositories.
- Deployment actions.

## Scope Boundary

This chunk may expand the Orders create-order role and machine-auth allowlist for already supported sellable channels and document the production integration plan. It may not mint or copy token values, create Vault secrets, deploy, add local product/stock/payment truth, implement Leads/Marketing campaigns, or integrate Marathon/SpeakASAP/School Committee/Rentabox without owner-approved per-application contracts.
