# Orders Context Package

```yaml
id: ORDERS-CONTEXT-PACKAGE
status: active
owner: Orders owner
created: 2026-06-13
last_updated: 2026-06-13
selected_goal: Goal H1 - Public Landing And Admin Access Surface
selected_chunk: H1.1-H1.4
```

## Included Context

- `AGENTS.md`
- `BUSINESS.md`
- `SYSTEM.md`
- `README.md`
- `docs/IMPLEMENTATION_ORCHESTRATOR.md`
- `docs/IMPLEMENTATION_STATE.md`
- `docs/orchestrator/INTENT.md`
- `docs/orchestrator/GOALS.md`
- `docs/orchestrator/PROJECT_INVARIANTS.md`
- `docs/orchestrator/PRE_CODING_GATE.md`
- `docs/orchestrator/READINESS_GATES.md`
- `src/main.ts`
- `src/app.module.ts`
- `src/admin/*`
- `src/auth/*`

## Ecosystem Context Used

Sub-agent repository discovery on 2026-06-13 reviewed neighboring remote repositories for FlipFlop, Catalog, Warehouse, Payments, Notifications, Marketing, Leads, Auth, Speak ASAP, School Committee, Rentabox, and Marathon. DocsRAG live retrieval was not used because no session `JWT_TOKEN` was available.

## Excluded Context

- Raw environment values and secrets.
- Production database contents.
- Customer addresses, payment details, bearer tokens, JWT contents, and raw production customer data.
- Runtime changes in neighboring repositories.

## Scope Boundary

This chunk may add public marketing HTML, improve the admin shell, and make admin roles explicit. It may not add login/session ownership, user management, payment processing, stock authority, product truth, notification delivery, lead consent management, or CRM campaign logic inside Orders.
