# Orders Execution Plan

```yaml
id: ORDERS-EXECUTION-PLAN
status: active
owner: Orders owner
created: 2026-06-12
last_updated: 2026-06-13
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
  - src/orders/orders.controller.ts
  - src/orders/orders.service.ts
  - src/orders/order-events.service.ts
  - docs/orchestrator/STATUS.md
  - docs/IMPLEMENTATION_STATE.md
related_adrs: []
selected_goal: Goal 2 - Order Contract And State Machine Hardening
selected_chunk: 2.3 - Human-approval gates for cancellation and destructive paths
gate_decision: pass-with-exception
```

## Metadata

This plan covers Goal 2 chunk 2.3: add explicit human-approval gates for cancellation, refund-like transitions, and destructive corrections.

The chunk is intentionally limited. It supports approved order cancellation from documented pre-shipment states, rejects refund-like statuses as Payments-owned/non-Orders transitions, and keeps terminal-state corrections blocked from the normal status endpoint until a separate correction workflow is owner-approved.

## Upstream Traceability

- `BUSINESS.md`: cancellations and refunds require explicit human approval.
- `docs/orchestrator/INTENT.md`: state jumps, cancellations, refunds, and destructive corrections require explicit owner approval and audit evidence.
- `docs/orchestrator/ORDER_STATUS_TRANSITIONS.md`: cancellation from `pending`, `confirmed`, and `processing` is allowed only with approval and side-effect evidence.
- `docs/IMPLEMENTATION_STATE.md`: next recommended goal is Goal 2 chunk 2.3.

## Goal Impact

The implementation removes the temporary chunk 2.2 blanket cancellation rejection and replaces it with an explicit approval gate for the documented cancellation path while preserving all non-Orders boundaries.

## Project Invariants

- `ORD-INV-001`: Preserved; Orders remains the canonical lifecycle source for order status.
- `ORD-INV-002`: Strengthened; cancellation requires explicit approval and destructive/refund-like paths remain blocked without approved workflows.
- `ORD-INV-003`: Preserved; payment, stock, catalog, notification, CRM, and channel side effects are acknowledged but not implemented by Orders.
- `ORD-INV-004`: Preserved; approval metadata is constrained to safe actor IDs, reason codes, booleans, statuses, and timestamps.
- `ORD-INV-005`: Additive-compatible API/event hardening; `approval` is optional and required only for cancellation.
- `ORD-INV-006`: Not applicable; pricing behavior is unchanged.
- `ORD-INV-007`: Preserved by status and implementation-state updates.
- `ORD-INV-008`: Pass with exception; no session `JWT_TOKEN` is available for DocsRAG. Repository source-of-truth docs are sufficient for this bounded Orders-local validation chunk.

## Sensitive-Data Handling

Classification: `masked`.

The approval payload must not contain customer address, payment details, tokens, secrets, or raw production data. Runtime validation accepts only safe approval metadata: approval boolean, human approval marker, actor ID/email from Auth where available, a constrained reason code, side-effect booleans, previous/requested/resulting status, and timestamp.

## Contract Validation Plan

Changed behavior:

- `PUT /api/orders/:id/status` accepts optional `approval` metadata.
- `pending|confirmed|processing -> cancelled` succeeds only when approval metadata is complete.
- Cancellation without approval returns `400 Bad Request`.
- Refund-like statuses remain rejected as unsupported by Orders and owned by Payments.
- Reverse moves, jumps, and transitions out of terminal states remain rejected.
- `order.updated` may include additive approval metadata for approved cancellation events.

Unchanged contracts:

- Normal status body `{ "status": "confirmed" }` remains supported.
- Successful response shape remains `{ success: true, data: ... }`.
- No warehouse, payment, catalog, notification, CRM, pricing, shipment, or auth ownership changes.

## Scope

- Add approval payload types and validation helpers.
- Update controller to pass Auth actor identity and approval payload to the service.
- Update service to validate approval before saving and publish safe cancellation metadata.
- Update order event service to support optional additive metadata.
- Build and run direct helper verification.
- Record evidence, commit, and deploy if checks pass.

## Non-Goals

- No database schema migration.
- No persisted audit-log table.
- No refund execution or payment reconciliation.
- No warehouse stock release automation.
- No notification delivery or CRM updates.
- No terminal-state correction endpoint.
- No item cancellation/refund/return schema changes.

## Files To Inspect

- `src/orders/status-transitions.ts`
- `src/orders/orders.controller.ts`
- `src/orders/orders.service.ts`
- `src/orders/order-events.service.ts`
- `src/auth/jwt-roles.guard.ts`
- `package.json`

## Files To Modify

- `src/orders/status-transitions.ts`
- `src/orders/orders.controller.ts`
- `src/orders/orders.service.ts`
- `src/orders/order-events.service.ts`
- `docs/orchestrator/CONTEXT_PACKAGE.md`
- `docs/orchestrator/EXECUTION_PLAN.md`
- `docs/orchestrator/GOALS.md`
- `docs/orchestrator/STATUS.md`
- `docs/IMPLEMENTATION_STATE.md`

## Files To Protect

- `.env*`, K8s secrets, Vault material, production logs, and production order table dumps.
- Existing unrelated dirty files in the remote worktree.

## Implementation Steps

1. Add constrained approval types and validation for cancellation.
2. Require `approval.approved === true`, `approval.approvalType === "human"`, actor identity, reason code, and side-effect acknowledgements for payment, warehouse, notification, CRM, and channel.
3. Allow only `pending|confirmed|processing -> cancelled` with approval.
4. Keep refund-like statuses and destructive corrections blocked with explicit errors.
5. Include safe approval metadata in the additive order-updated event payload for approved cancellation.
6. Build, run direct helper verification, update docs, commit, and deploy if ready.

## Test Plan

- `npm run build`
- Direct Node verification against compiled `dist/orders/status-transitions.js` for approved cancellation, missing approval rejection, refund-like rejection, destructive correction rejection, and normal transition preservation.
- `node --check dist/main.js`
- Missing-marker scan over IPS docs.
- Sensitive-pattern scan over docs plus `src/orders` and `src/items`.
- Production deployment health and live container helper verification after deploy.

## Gate Decision

`pass-with-exception`: DocsRAG was not queried because no session service `JWT_TOKEN` is available. This is acceptable for this bounded Orders-local approval-gate chunk because the source transition contract and affected endpoint code are in the repository.

## Rollback Plan

If build or validation fails, revert only chunk 2.3 approval helper/controller/service/event changes plus the evidence docs for this chunk. Do not revert unrelated worktree changes.

## Completion Checklist

- [x] Approval payload validator added.
- [x] Approved cancellation path implemented.
- [x] Refund-like and destructive correction paths remain blocked.
- [x] Safe event metadata added for approved cancellation.
- [x] Build passes.
- [x] Direct verification evidence recorded.
- [x] IPS status and implementation state updated.
- [ ] Remote commit created.
- [ ] Deployment completed if runtime behavior is ready.
