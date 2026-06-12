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
  - docs/orchestrator/ORDER_STATUS_TRANSITIONS.md
downstream:
  - docs/orchestrator/EXECUTION_PLAN.md
  - docs/orchestrator/STATUS.md
```

## Target Task

Goal 2 - Order Contract And State Machine Hardening, chunk 2.2: add runtime validation for order status transitions and item fulfillment transitions according to `docs/orchestrator/ORDER_STATUS_TRANSITIONS.md`.

This task strengthens Orders as the canonical lifecycle source of truth by rejecting invalid status values, forward jumps, reverse moves, terminal-state changes, and cancellation requests that currently lack the explicit owner-approval workflow scheduled for Goal 2 chunk 2.3.

## Upstream Traceability

- Business constraint: `BUSINESS.md` requires order status transitions to follow a defined state machine and forbids AI-driven cancellation or refund actions without explicit human approval.
- System contract: `SYSTEM.md` defines the normal order path `pending -> confirmed -> processing -> shipped -> delivered | cancelled`.
- API surface: `README.md` exposes `PUT /api/orders/:id/status` and `PUT /api/items/:id/fulfillment`.
- Active backlog: `docs/orchestrator/GOALS.md` marks Goal 2 active and chunk 2.2 pending.
- Transition source: `docs/orchestrator/ORDER_STATUS_TRANSITIONS.md` is the source contract for this runtime enforcement.
- Current implementation gap: `src/orders/orders.service.ts` and `src/items/items.service.ts` currently accept arbitrary status strings.

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
- `src/orders/order.entity.ts`
- `src/orders/orders.service.ts`
- `src/orders/orders.controller.ts`
- `src/items/order-item.entity.ts`
- `src/items/items.service.ts`
- `src/items/items.controller.ts`
- `package.json`

## Excluded Documents And Data

Do not use as source material:

- Raw production logs containing customer data, addresses, tokens, or payment details.
- Decoded secrets from Vault, K8s Secrets, or `.env`.
- Production order table dumps or direct database edits.
- Consuming-service source trees.
- Payment, warehouse, catalog, notification, CRM, or channel service internals.
- Generated `dist/` output except for build and direct pure-function verification.

## Orders Constraints

- Keep Orders as the order lifecycle source of truth.
- Enforce the documented normal order lifecycle and item fulfillment lifecycle.
- Reject cancellation through the normal status endpoint until Goal 2 chunk 2.3 adds explicit owner approval and audit evidence.
- Do not implement refunds, payment identity, stock release, product truth, notification delivery, CRM behavior, or automated side effects.
- Do not silently move a parent order status when item fulfillment changes.
- Do not log, document, expose, or embed secrets, bearer tokens, payment details, raw customer addresses, or raw production customer data.

## Allowed Changes

- Add a small transition-validation module under `src/orders/` or local service helpers.
- Update `src/orders/orders.service.ts` to validate requested order status before saving and publishing `order.updated`.
- Update `src/items/items.service.ts` to validate requested item fulfillment status before saving.
- Add direct pure-function verification if the repo test setup does not support tests.
- Update `docs/orchestrator/STATUS.md` and `docs/IMPLEMENTATION_STATE.md` with evidence.

## Forbidden Changes

- No database migration for this chunk.
- No cancellation approval workflow; cancellation remains rejected until Goal 2 chunk 2.3.
- No refund-like status or destructive correction support.
- No payment-provider, warehouse reservation, catalog truth, notification delivery, CRM campaign, pricing, auth, or event-schema ownership changes.
- No secrets, K8s Secret values, Vault reads, production logs, or production data dumps.

## Validation Instructions

Run:

```bash
npm run build
node -e 'const t=require("./dist/orders/status-transitions"); /* direct transition assertions */'
rg missing-or-unknown-marker-scan
rg sensitive-literal-scan
```

If deployment proceeds, run `./scripts/deploy.sh` and production health or API smoke checks without printing real tokens or customer data.
