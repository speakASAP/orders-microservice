# Orders Context Package

```yaml
id: ORDERS-CONTEXT-PACKAGE
status: active
owner: Orders owner
created: 2026-06-13
last_updated: 2026-06-13
selected_goal: Goal H3 - Channel Idempotency And Duplicate Protection / Goal 4 - Channel Order Ingestion Contract
selected_chunk: H3.1-H3.4 / 4.2-4.3
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
- `src/orders/create-order.dto.ts`
- `src/orders/orders.service.ts`
- `src/orders/orders.controller.ts`
- `src/orders/order.entity.ts`
- `src/items/order-item.entity.ts`
- `scripts/verify-create-order-contract.js`

## Ecosystem Context Used

Sub-agent repository discovery on 2026-06-13 reviewed neighboring remote repositories for FlipFlop, Catalog, Warehouse, Payments, Notifications, Marketing, Leads, Auth, Speak ASAP, School Committee, Rentabox, and Marathon. DocsRAG live retrieval was not used because no session `JWT_TOKEN` was available.

## Excluded Context

- Raw environment values and secrets.
- Production database contents.
- Customer addresses, payment details, bearer tokens, JWT contents, and raw production customer data.
- Runtime changes in neighboring repositories.

## Scope Boundary

This chunk may define and implement create-order idempotency for `contractVersion + channel + channelAccountId + externalOrderId`. It may not add login/session ownership, user management, payment processing, stock authority, product truth, notification delivery, lead consent management, or CRM campaign logic inside Orders.
