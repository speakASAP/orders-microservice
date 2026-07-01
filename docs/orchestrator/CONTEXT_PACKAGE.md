# Orders Context Package

```yaml
id: ORDERS-CONTEXT-PACKAGE
status: active
owner: Orders owner
created: 2026-06-13
last_updated: 2026-07-01
selected_goal: Goal 7 - Production Order Integration Rollout
selected_chunk: 7.2 Orders-side runtime credential and deploy gate
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
- `k8s/external-secret.yaml`
- `k8s/configmap.yaml`
- `k8s/deployment.yaml`
- channel ExternalSecret status/key-name checks for FlipFlop, Allegro, Aukro, Bazos, and Heureka

## Ecosystem Context Used

Read-only subagent audits on 2026-06-30 inspected channel services, event consumers, and non-marketplace candidate apps directly on Alfares. On 2026-07-01 this lane used read-only Kubernetes and channel-manifest structural checks: ExternalSecrets are `SecretSynced=True`, requested channel secret key names are present, and Orders pod env-name presence was checked without printing values. DocsRAG live retrieval was not used because no session `JWT_TOKEN` was available.

## Excluded Context

- Raw environment values and secrets.
- Production database contents.
- Customer addresses, payment details, bearer tokens, JWT contents, decoded credentials, and raw production customer data.
- Runtime changes in neighboring repositories.
- Deployment actions.

## Scope Boundary

This chunk may map Orders-side runtime aliases for already supported sellable channels and deploy after validation so channel smoke lanes can authenticate against the live Orders guard. It may not mint, copy, print, or decode token values; edit channel repositories; mutate production databases; add local product/stock/payment truth; implement Leads/Marketing campaigns; or integrate Marathon/SpeakASAP/School Committee/Rentabox without owner-approved per-application contracts.
