# Orders Context Package

```yaml
id: ORDERS-CONTEXT-PACKAGE
status: active
owner: Orders owner
created: 2026-06-13
last_updated: 2026-07-01
selected_goal: Goal 7 - Production Order Integration Rollout
selected_chunk: 7.4A Orders lead-attribution event contract for Leads
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
- `docs/orchestrator/event-fixtures/orders.order.created.v1.json`
- `docs/orchestrator/WAREHOUSE_HANDOFF_CONTRACT.md`
- `docs/orchestrator/CANDIDATE_APPLICATION_INTEGRATION_DECISIONS.md`
- `docs/orchestrator/PRODUCTION_ORDER_INTEGRATION_PLAN.md`
- `src/orders/create-order.dto.ts`
- `src/orders/order-event-contracts.ts`
- `src/orders/order-events.service.ts`
- `src/orders/orders.service.ts`
- `scripts/verify-create-order-contract.js`
- `scripts/verify-event-contracts.js`

## Ecosystem Context Used

Owner delegation selected Goal 7.4A to unblock the Leads Goal 7.4 lane. Prior producer verification confirmed Orders publishes `orders.order.created.v1` on RabbitMQ exchange `orders.events`, and the current created payload only includes `orderId` and `channel`. This lane inspected repository source-of-truth docs and source contracts directly on Alfares. DocsRAG live retrieval was not used because no session `JWT_TOKEN` was available: `[MISSING: DocsRAG session JWT]`.

## Excluded Context

- Raw environment values and secrets.
- Production database contents.
- Customer addresses, payment details, bearer tokens, JWT contents, decoded credentials, and raw production customer data.
- Runtime changes in neighboring repositories.
- Deployment actions.
- Leads, Marketing, Notifications, channel-service, Warehouse, Catalog, Auth, and marketplace-service source edits.

## Scope Boundary

This chunk may add a backwards-compatible optional attribution field to `orders.order.created.v1` and accept the same explicit optional field from `orders.create.v1` requests for event publication. It may update fixtures, verifiers, and contract docs. It must not infer lead attribution from customer/contact/address/payment data, add live consumers, mutate production databases, deploy automatically, or edit non-Orders repositories. If a channel does not supply explicit attribution, Orders must omit the field and preserve the existing created-event core shape.
