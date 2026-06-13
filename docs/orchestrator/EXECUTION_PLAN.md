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
  - docs/orchestrator/PROJECT_INVARIANTS.md
  - docs/IMPLEMENTATION_STATE.md
downstream:
  - docs/orchestrator/SENSITIVE_DATA_REVIEW.md
  - docs/orchestrator/STATUS.md
  - docs/IMPLEMENTATION_STATE.md
related_adrs: []
selected_goal: Goal 3 - Sensitive Customer Data And Audit Safety
selected_chunk: 3.1 - Review sensitive fields
gate_decision: pass-with-exception
```

## Metadata

This plan covers Goal 3 chunk 3.1: review order, item, shipment, pricing, event, and logger paths for sensitive fields.

The chunk is documentation-only. It maps sensitive surfaces and defines follow-up hardening work without changing runtime behavior.

## Upstream Traceability

- `BUSINESS.md`: customer data, payment data, tokens, and secrets must not be logged or exposed.
- `docs/orchestrator/INTENT.md`: sensitive customer data, shipping/billing addresses, payment details, tokens, and secrets must not be logged, copied into docs, or exposed in prompts.
- `docs/orchestrator/GOALS.md`: Goal 3 chunk 3.1 is the selected chunk.
- `docs/orchestrator/PROJECT_INVARIANTS.md`: `ORD-INV-004` requires sensitive-data scans and logging review.

## Goal Impact

The review identifies concrete surfaces that need structured audit metadata, redaction, or no-log guarantees in chunks 3.2 through 3.4.

## Project Invariants

- `ORD-INV-001`: Preserved; Orders remains canonical lifecycle source.
- `ORD-INV-002`: Preserved; state-machine behavior unchanged.
- `ORD-INV-003`: Preserved; cross-service ownership unchanged.
- `ORD-INV-004`: Strengthened; sensitive fields and logging/event/API surfaces are now documented.
- `ORD-INV-005`: Preserved; no API/event contract changes.
- `ORD-INV-006`: Preserved; pricing automation unchanged.
- `ORD-INV-007`: Preserved by status and implementation-state updates.
- `ORD-INV-008`: Pass with exception; no session `JWT_TOKEN` is available for DocsRAG, and this is a bounded local source review.

## Sensitive-Data Handling

Classification: `sensitive-source-review`.

The task reads source files only. It does not read production rows, logs, decoded secrets, bearer tokens, payment credentials, real customer addresses, or real shipment tracking values.

## Contract Validation Plan

Reviewed behavior:

- Core order API returns full order entities under JWT guard.
- Item API returns operational line data without direct customer PII fields.
- Shipment API returns tracking values.
- Pricing service logs product-level diagnostics and error strings.
- Order events avoid customer/address/payment fields except `order.shipped` includes tracking number.
- Logger has no redaction boundary.
- Admin detail exposes customer email and shipment tracking to authenticated admins.

Unchanged contracts:

- No endpoint response shape changes.
- No event shape changes.
- No auth, payment, warehouse, catalog, notification, CRM, pricing, shipment, or state-machine behavior changes.

## Scope

- Review source paths for sensitive fields.
- Add `docs/orchestrator/SENSITIVE_DATA_REVIEW.md`.
- Update Goal 3 chunk status and IPS handoff docs.
- Run documentation readiness checks.

## Non-Goals

- No redaction implementation in chunk 3.1.
- No audit-log implementation in chunk 3.1.
- No response DTO or event schema changes.
- No production data inspection.
- No deployment.

## Files To Inspect

- `src/orders/*`
- `src/items/*`
- `src/shipments/*`
- `src/pricing/*`
- `src/logger/*`
- `src/auth/jwt-roles.guard.ts`
- `src/admin/*`
- `src/main.ts`
- `src/app.module.ts`

## Files To Modify

- `docs/orchestrator/SENSITIVE_DATA_REVIEW.md`
- `docs/orchestrator/CONTEXT_PACKAGE.md`
- `docs/orchestrator/EXECUTION_PLAN.md`
- `docs/orchestrator/GOALS.md`
- `docs/orchestrator/PLAN.md`
- `docs/orchestrator/STATUS.md`
- `docs/IMPLEMENTATION_STATE.md`
- `implementation-goals/README.md`

## Files To Protect

- `.env*`, K8s secrets, Vault material, production logs, and production order table dumps.
- Runtime source files for this review-only chunk.

## Implementation Steps

1. Read IPS checkpoint and Goal 3 requirements.
2. Scan source for sensitive field names, logging calls, event payloads, response surfaces, and auth/token handling.
3. Read affected source files for concrete classification.
4. Add a review report with findings and follow-ups.
5. Update IPS docs and run readiness checks.

## Test Plan

- Missing-marker scan over IPS docs.
- Sensitive-literal scan over docs and reviewed source paths.
- `git diff --check`.

## Gate Decision

`pass-with-exception`: DocsRAG was not queried because no session service `JWT_TOKEN` is available. This is acceptable for this local source review chunk because no cross-service contract or runtime behavior changes are made.

## Rollback Plan

If the review is inaccurate, update only the review and IPS docs. Do not revert unrelated worktree changes.

## Completion Checklist

- [x] Sensitive fields reviewed.
- [x] Logging/event/API surfaces reviewed.
- [x] Findings documented.
- [x] Follow-up chunks named.
- [x] IPS status and implementation state updated.
