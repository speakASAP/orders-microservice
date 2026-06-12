# Orders Context Package

```yaml
id: ORDERS-CONTEXT-PACKAGE
status: active
owner: Orders owner
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: implementation-ready
upstream:
  - docs/orchestrator/GOALS.md
  - docs/orchestrator/INTENT.md
  - docs/IMPLEMENTATION_STATE.md
downstream:
  - docs/orchestrator/EXECUTION_PLAN.md
  - docs/orchestrator/PROMPTS.md
```

## Target Task

Owner-selected task: create an orders admin frontend so operators can see orders from all applications/services, filter by source and state, inspect order details, and review safe order lifecycle logs.

This task is selected by explicit owner request and temporarily supersedes the default next recommendation, Goal 2 chunk 2.2. It supports the preserved Orders intent by improving operational visibility into the canonical order source of truth without changing status transition behavior.

## Upstream Traceability

- Original Orders intent: `docs/orchestrator/INTENT.md`
- Current state: `docs/IMPLEMENTATION_STATE.md`
- Owner request: admin panel for all orders, source application/service tracking, details, logs, dashboard filters
- Orders service contract surface: `README.md`, `SYSTEM.md`, `src/orders/*`, `src/items/*`, `src/shipments/*`, `src/auth/*`
- Verification standard: `docs/orchestrator/READINESS_GATES.md`

## Included Documents And Source

Read before coding:

- `AGENTS.md`
- `BUSINESS.md`
- `SYSTEM.md`
- `README.md`
- `TASKS.md`
- `STATE.json`
- `docs/IMPLEMENTATION_STATE.md`
- `docs/IMPLEMENTATION_ORCHESTRATOR.md`
- `docs/orchestrator/MASTER_PROMPT.md`
- `docs/orchestrator/INTENT.md`
- `docs/orchestrator/GOALS.md`
- `docs/orchestrator/PLAN.md`
- `docs/orchestrator/PROJECT_INVARIANTS.md`
- `docs/orchestrator/PRE_CODING_GATE.md`
- `docs/orchestrator/EXECUTION_PLAN.md`
- `docs/orchestrator/READINESS_GATES.md`
- `docs/orchestrator/STATUS.md`
- `implementation-goals/README.md`
- `src/main.ts`
- `src/app.module.ts`
- `src/auth/jwt-roles.guard.ts`
- `src/auth/roles.decorator.ts`
- `src/orders/order.entity.ts`
- `src/orders/orders.service.ts`
- `src/orders/orders.controller.ts`
- `src/items/order-item.entity.ts`
- `src/items/items.service.ts`
- `src/shipments/shipment.entity.ts`
- `src/shipments/shipments.service.ts`

## Excluded Documents And Data

Do not use as source material:

- Raw production logs containing customer data, addresses, tokens, or payment details.
- Decoded secrets from Vault, K8s Secrets, or `.env`.
- Production order table dumps.
- Consuming-service source trees.
- Generated `dist/` output except build validation.

## Orders Constraints

- Keep Orders as the order lifecycle source of truth.
- Do not move product, stock, payment identity, auth, notification delivery, CRM, gateway, or database ownership into Orders.
- Do not log, document, expose, or embed secrets, bearer tokens, payment details, raw customer addresses, or raw production customer data.
- Do not change status transition behavior in this chunk.
- Do not directly write production order tables.
- Record evidence in `docs/orchestrator/STATUS.md` and compressed continuation state in `docs/IMPLEMENTATION_STATE.md`.

## Allowed Changes

- Add `src/admin/*` for the admin UI shell and protected dashboard read APIs.
- Update `src/app.module.ts` to register the admin module.
- Update `src/main.ts` to expose non-API admin frontend routes.
- Update `docs/orchestrator/CONTEXT_PACKAGE.md`, `docs/orchestrator/EXECUTION_PLAN.md`, `docs/orchestrator/STATUS.md`, and `docs/IMPLEMENTATION_STATE.md` with plan and evidence.

## Forbidden Changes

- No schema migration for this chunk.
- No order status mutation flow changes.
- No cancellation, refund, pricing, payment-provider, warehouse reservation, catalog truth, notification delivery, or CRM campaign changes.
- No secrets, K8s Secret values, Vault reads, or production data dumps.

## Validation Instructions

Run `npm run build`, the IPS missing-marker scan, and the sensitive-pattern scan over docs plus `src/admin`, `src/app.module.ts`, and `src/main.ts`. Treat existing environment-variable references such as `process.env.DB_PASSWORD` as false positives when no literal secret value is present.
