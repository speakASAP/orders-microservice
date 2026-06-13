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

Goal 2 - Order Contract And State Machine Hardening, chunk 2.3: add human-approval gates for cancellation, refund-like transitions, and destructive corrections.

This task builds on chunk 2.2 runtime validation. It allows only documented order cancellations with explicit human approval evidence, keeps refund-like statuses outside Orders, and keeps destructive terminal-state corrections blocked until a separate owner-approved correction workflow exists.

## Upstream Traceability

- `BUSINESS.md`: AI must never cancel or refund orders without explicit human approval.
- `SYSTEM.md`: order status transitions must follow the state machine.
- `README.md`: `PUT /api/orders/:id/status` is the affected order status mutation endpoint.
- `docs/orchestrator/GOALS.md`: Goal 2 chunk 2.3 is the next recommended chunk.
- `docs/orchestrator/ORDER_STATUS_TRANSITIONS.md`: cancellation paths require approval, side-effect evidence, actor identity, reason, previous/requested/resulting status, and timestamp.
- `docs/IMPLEMENTATION_STATE.md`: chunk 2.3 is the active next action.

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
- `src/orders/orders.controller.ts`
- `src/orders/orders.service.ts`
- `src/orders/order-events.service.ts`
- `src/auth/jwt-roles.guard.ts`
- `src/auth/roles.decorator.ts`
- `package.json`

## Excluded Documents And Data

Do not use as source material:

- Raw production logs containing customer data, addresses, tokens, or payment details.
- Decoded secrets from Vault, K8s Secrets, or `.env`.
- Production order table dumps or direct database edits.
- Payment provider, warehouse reservation, catalog truth, notification delivery, CRM campaign, or channel-service internals.
- Generated `dist/` output except for build and direct pure-function verification.

## Orders Constraints

- Keep Orders as the order lifecycle source of truth.
- Require explicit human approval for cancellation.
- Do not implement refunds or payment identity; refund-like statuses must remain rejected and point to Payments ownership.
- Do not implement terminal-state destructive corrections through the normal status endpoint.
- Do not invent item fulfillment states during order cancellation.
- Do not log, document, expose, or embed secrets, bearer tokens, payment details, raw customer addresses, or raw production customer data.

## Allowed Changes

- Extend the order status transition helper with approval-gate validation for `pending|confirmed|processing -> cancelled`.
- Update `PUT /api/orders/:id/status` request handling to accept an optional approval payload for cancellation.
- Include safe approval metadata in the additive `order.updated` event only for approved cancellation.
- Add direct pure-function verification because the repo has no test script or test directory.
- Update IPS docs with evidence.

## Forbidden Changes

- No database migration for this chunk.
- No refund automation or payment reconciliation changes.
- No warehouse stock release/reservation/decrement implementation.
- No product truth, notification delivery, CRM campaign, pricing, auth, or shipment status ownership changes.
- No terminal-state correction endpoint.
- No secrets, K8s Secret values, Vault reads, production logs, or production data dumps.

## Validation Instructions

Run:

```bash
npm run build
node -e 'const t=require("./dist/orders/status-transitions"); /* direct approval assertions */'
node --check dist/main.js
rg missing-or-unknown-marker-scan
rg sensitive-literal-scan
```

If deployment proceeds, run `./scripts/deploy.sh`, set an immutable image tag if needed, and perform production health plus safe protected-route smoke checks without printing real tokens or customer data.
