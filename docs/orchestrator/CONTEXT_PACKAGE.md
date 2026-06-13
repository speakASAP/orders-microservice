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
  - docs/orchestrator/PROJECT_INVARIANTS.md
downstream:
  - docs/orchestrator/EXECUTION_PLAN.md
  - docs/orchestrator/STATUS.md
  - docs/orchestrator/SENSITIVE_DATA_REVIEW.md
```

## Target Task

Goal 3 - Sensitive Customer Data And Audit Safety, chunk 3.1: review order, item, shipment, pricing, event, and logger paths for sensitive fields.

This task classifies sensitive fields and surfaces before implementation hardening. It records where customer, address, payment, shipment tracking, token, event, and log risks exist, then queues bounded follow-up work.

## Upstream Traceability

- `BUSINESS.md`: customer data, payment data, tokens, and secrets must not be logged or exposed.
- `docs/orchestrator/INTENT.md`: sensitive customer data, shipping/billing addresses, payment details, tokens, and secrets must not be logged, copied into docs, or exposed in prompts.
- `docs/orchestrator/GOALS.md`: Goal 3 chunk 3.1 requires review of sensitive fields.
- `docs/orchestrator/PROJECT_INVARIANTS.md`: `ORD-INV-004` requires sensitive-data scans and logging review.
- `docs/IMPLEMENTATION_STATE.md`: Goal 3 chunk 3.1 is the next recommended action.

## Included Documents And Source

Read before documenting:

- `AGENTS.md`
- `BUSINESS.md`
- `SYSTEM.md`
- `README.md`
- `TASKS.md`
- `STATE.json`
- `docs/IMPLEMENTATION_STATE.md`
- `docs/orchestrator/GOALS.md`
- `docs/orchestrator/PLAN.md`
- `docs/orchestrator/PROJECT_INVARIANTS.md`
- `docs/orchestrator/PRE_CODING_GATE.md`
- `docs/orchestrator/READINESS_GATES.md`
- `src/orders/*`
- `src/items/*`
- `src/shipments/*`
- `src/pricing/*`
- `src/logger/*`
- `src/auth/jwt-roles.guard.ts`
- `src/admin/*`
- `src/main.ts`
- `src/app.module.ts`

## Excluded Documents And Data

Do not use as source material:

- Raw production logs.
- Production order table dumps or direct database reads.
- Decoded bearer tokens, JWTs, K8s Secrets, Vault values, or `.env` values.
- Real customer names, emails, phone numbers, addresses, payment details, or shipment tracking numbers.

## Orders Constraints

- Keep Orders as canonical order lifecycle owner.
- Do not copy sensitive runtime data into docs or prompts.
- Do not change runtime behavior in this review chunk.
- Treat order customer JSON, addresses, notes, payment metadata, shipment tracking, bearer tokens, JWT payloads, and secrets as sensitive unless a later owner-approved contract narrows exposure.

## Allowed Changes

- Add a source-based sensitive data review document.
- Update IPS docs with findings and next action.
- Run documentation and sensitive-literal scans.

## Forbidden Changes

- No runtime code changes for chunk 3.1.
- No production data access.
- No decoded secrets, bearer tokens, payment values, customer addresses, or raw tracking values.
- No deployment.

## Validation Instructions

Run the IPS missing-marker scan, sensitive-literal scan, and `git diff --check`.
