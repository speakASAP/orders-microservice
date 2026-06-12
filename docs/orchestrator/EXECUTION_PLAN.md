# Orders Execution Plan

```yaml
id: ORDERS-EXECUTION-PLAN
status: active
owner: Orders owner
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: implementation-ready
upstream:
  - AGENTS.md
  - BUSINESS.md
  - SYSTEM.md
  - README.md
  - TASKS.md
  - docs/orchestrator/INTENT.md
  - docs/orchestrator/GOALS.md
  - docs/orchestrator/ORDER_STATUS_TRANSITIONS.md
  - docs/orchestrator/PROJECT_INVARIANTS.md
  - docs/IMPLEMENTATION_STATE.md
downstream:
  - src/orders/status-transitions.ts
  - src/orders/orders.service.ts
  - src/items/items.service.ts
  - docs/orchestrator/STATUS.md
  - docs/IMPLEMENTATION_STATE.md
related_adrs: []
selected_goal: Goal 2 - Order Contract And State Machine Hardening
selected_chunk: 2.2 - Runtime validation for order and item fulfillment transitions
gate_decision: pass-with-exception
```

## Metadata

This plan covers Goal 2 chunk 2.2: enforce the documented state machine at runtime for `PUT /api/orders/:id/status` and `PUT /api/items/:id/fulfillment`.

The chunk is intentionally limited to validation. Cancellation approval, refund-like flows, terminal-state correction workflows, stock-release coordination, and audit persistence are deferred to Goal 2 chunk 2.3 or later owner-approved chunks.

## Upstream Traceability

- `BUSINESS.md`: order status transitions must follow a defined state machine; AI must never cancel or refund without explicit human approval.
- `SYSTEM.md`: normal order path is `pending -> confirmed -> processing -> shipped -> delivered | cancelled`.
- `README.md`: exposes the two mutation endpoints affected by this chunk.
- `docs/orchestrator/GOALS.md`: Goal 2 is active and chunk 2.2 is pending.
- `docs/orchestrator/ORDER_STATUS_TRANSITIONS.md`: source contract for allowed and forbidden transitions.
- `docs/IMPLEMENTATION_STATE.md`: next recommended goal is Goal 2 chunk 2.2.

## Goal Impact

The implementation closes the current arbitrary-string status gap and makes Orders enforce its canonical lifecycle contract before publishing order update events or saving item fulfillment changes.

## Project Invariants

- `ORD-INV-001`: Preserved; Orders remains the canonical source for order and item lifecycle state.
- `ORD-INV-002`: Strengthened; invalid state jumps, reverse moves, terminal-state changes, and cancellation without approval are rejected.
- `ORD-INV-003`: Preserved; no product, stock, payment, auth, notification, CRM, or channel ownership moves into Orders.
- `ORD-INV-004`: Preserved; validation uses status strings and IDs only, with no customer address, payment data, tokens, secrets, or production data logging.
- `ORD-INV-005`: Additive-compatible validation hardens existing endpoints; invalid requests now fail with `400 Bad Request` instead of silently mutating state.
- `ORD-INV-006`: Not applicable; pricing behavior is unchanged.
- `ORD-INV-007`: Preserved by status and implementation-state updates.
- `ORD-INV-008`: Pass with exception; no session `JWT_TOKEN` is available for DocsRAG. Repository source-of-truth docs are sufficient for this bounded Orders-local validation chunk.

## Sensitive-Data Handling

Classification: `none` for implementation data.

The code reads only existing order and item status fields needed for transition validation. It must not log or document customer addresses, payment details, bearer tokens, JWT secrets, database secrets, decoded credentials, or raw production customer data.

## Contract Validation Plan

Changed behavior:

- `PUT /api/orders/:id/status` rejects unrecognized statuses, jumps, reverse transitions, terminal-state changes, and cancellation until an approval workflow exists.
- `PUT /api/items/:id/fulfillment` rejects unrecognized fulfillment statuses, jumps, reverse transitions, terminal-state changes, and synthetic cancellation, refund, or return values.
- `PUT /api/orders/:id/status` rejects `shipped` unless every item is at least `shipped`, and rejects `delivered` unless every item is `delivered`.

Unchanged contracts:

- Request body shape remains `{ "status": "..." }`.
- Successful response shape remains `{ success: true, data: ... }`.
- JWT/RBAC, RabbitMQ event names, create-order, shipment, pricing, warehouse, payment, catalog, notification, and CRM contracts remain unchanged.

## Scope

- Add reusable pure validation helpers for order and item status transitions.
- Update orders service to validate before save and before `order.updated` publication.
- Update items service to load the current item, validate before save, and return `404` for missing item instead of returning `null` after update.
- Run build and direct helper verification.
- Record evidence and commit the remote changes.
- Deploy only after checks pass.

## Non-Goals

- No database schema migration.
- No new status values.
- No owner-approval implementation for cancellation or destructive corrections.
- No refund automation or payment reconciliation changes.
- No warehouse stock release, reservation, or decrement changes.
- No automatic parent order status updates from item fulfillment changes.
- No event payload schema changes.

## Files To Inspect

- `src/orders/order.entity.ts`
- `src/orders/orders.service.ts`
- `src/orders/orders.controller.ts`
- `src/items/order-item.entity.ts`
- `src/items/items.service.ts`
- `src/items/items.controller.ts`
- `package.json`

## Files To Create

- `src/orders/status-transitions.ts`

## Files To Modify

- `src/orders/orders.service.ts`
- `src/items/items.service.ts`
- `docs/orchestrator/CONTEXT_PACKAGE.md`
- `docs/orchestrator/EXECUTION_PLAN.md`
- `docs/orchestrator/STATUS.md`
- `docs/IMPLEMENTATION_STATE.md`

## Files To Protect

- `.env*`, K8s secrets, Vault material, production logs, and production order table dumps.
- Existing unrelated dirty files in the remote worktree.

## Implementation Steps

1. Add status constants, ordering helpers, and validation functions matching `ORDER_STATUS_TRANSITIONS.md`.
2. Reject cancellation through the normal status endpoint with a clear approval-required error.
3. Enforce item alignment before order `shipped` and `delivered` transitions.
4. Update services to call validators before persistence.
5. Build and run direct pure-function verification because the repo has no test script or test directory.
6. Update IPS evidence docs, commit, and deploy if validation passes.

## Test Plan

- `npm run build`
- Direct Node verification against compiled `dist/orders/status-transitions.js` for allowed and rejected order and item transitions.
- Missing-marker scan over IPS docs.
- Sensitive-pattern scan over docs plus `src/orders` and `src/items`.
- Deployment smoke after successful deploy: production `/health` and protected endpoint behavior if a safe token is available, without printing token or customer data.

## Gate Decision

`pass-with-exception`: DocsRAG was not queried because no session service `JWT_TOKEN` is available. This is acceptable for this bounded Orders-local validation chunk because the source transition contract and affected endpoint code are in the repository.

## Rollback Plan

If build or validation fails, revert only this chunk validation helper and scoped service changes plus the evidence docs for this chunk. Do not revert unrelated pre-existing dirty files.

## Completion Checklist

- [ ] Transition validator added.
- [ ] Order status endpoint validation added.
- [ ] Item fulfillment endpoint validation added.
- [ ] Build passes.
- [ ] Direct verification evidence recorded.
- [ ] IPS status and implementation state updated.
- [ ] Remote commit created.
- [ ] Deployment completed if runtime behavior is ready.
