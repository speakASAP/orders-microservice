# Orders Context Package

```yaml
id: ORDERS-CONTEXT-PACKAGE
status: active
owner: Orders owner
created: 2026-06-12
last_updated: 2026-06-13
completeness_level: implementation-ready
upstream:
  - docs/orchestrator/GOALS.md
  - docs/orchestrator/INTENT.md
  - docs/IMPLEMENTATION_STATE.md
  - docs/orchestrator/ORDER_STATUS_TRANSITIONS.md
downstream:
  - docs/orchestrator/EXECUTION_PLAN.md
  - docs/orchestrator/STATUS.md
```

## Target Task

Goal 2 - Order Contract And State Machine Hardening, chunk 2.4: add tests or direct API verification for allowed, rejected, and owner-approved transitions.

This task builds on chunks 2.2 and 2.3. It adds repeatable direct verification for the compiled transition helper so normal transitions, invalid/rejected transitions, item fulfillment transitions, and owner-approved cancellation gates are covered by a durable command.

## Upstream Traceability

- `BUSINESS.md`: cancellations and refunds require explicit human approval.
- `SYSTEM.md`: order status transitions must follow the state machine.
- `README.md`: `PUT /api/orders/:id/status` and `PUT /api/items/:id/fulfillment` are the affected mutation endpoints.
- `docs/orchestrator/GOALS.md`: Goal 2 chunk 2.4 requires tests or direct API verification.
- `docs/orchestrator/ORDER_STATUS_TRANSITIONS.md`: defines allowed, rejected, and owner-approved transition behavior.
- `docs/IMPLEMENTATION_STATE.md`: chunk 2.4 is the active next action.

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
- `docs/orchestrator/READINESS_GATES.md`
- `implementation-goals/README.md`
- `docs/orchestrator/ORDER_STATUS_TRANSITIONS.md`
- `src/orders/status-transitions.ts`
- `package.json`

## Excluded Documents And Data

Do not use as source material:

- Raw production logs containing customer data, addresses, tokens, or payment details.
- Decoded secrets from Vault, K8s Secrets, or `.env`.
- Production order table dumps or direct database edits.
- Payment provider, warehouse reservation, catalog truth, notification delivery, CRM campaign, or channel-service internals.

## Orders Constraints

- Keep Orders as the order lifecycle source of truth.
- Verify explicit human approval for cancellation.
- Do not implement refunds or payment identity; refund-like statuses must remain rejected and point to Payments ownership.
- Do not implement terminal-state destructive corrections through the normal status endpoint.
- Do not invent item fulfillment states during order cancellation.
- Do not log, document, expose, or embed secrets, bearer tokens, payment details, raw customer addresses, or raw production customer data.

## Allowed Changes

- Add a repeatable verification script for compiled status transition helpers.
- Add npm scripts to run build plus transition verification.
- Update IPS docs with evidence.

## Forbidden Changes

- No runtime service behavior changes for this chunk.
- No database migration.
- No refund automation or payment reconciliation changes.
- No warehouse stock release/reservation/decrement implementation.
- No product truth, notification delivery, CRM campaign, pricing, auth, or shipment status ownership changes.
- No terminal-state correction endpoint.
- No deployment unless runtime behavior changes separately.

## Validation Instructions

Run `npm test`, `node --check dist/main.js`, the IPS missing-marker scan, the sensitive-literal scan, and `git diff --check`.
