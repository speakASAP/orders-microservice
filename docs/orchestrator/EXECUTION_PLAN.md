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
  - scripts/verify-status-transitions.js
  - package.json
  - docs/orchestrator/STATUS.md
  - docs/IMPLEMENTATION_STATE.md
related_adrs: []
selected_goal: Goal 2 - Order Contract And State Machine Hardening
selected_chunk: 2.4 - Tests or direct verification for transitions
gate_decision: pass-with-exception
```

## Metadata

This plan covers Goal 2 chunk 2.4: add tests or direct API verification for allowed, rejected, and owner-approved transitions.

The chunk is intentionally limited to repeatable verification. Runtime transition behavior was implemented in chunks 2.2 and 2.3; this chunk adds a stable `npm test` path that builds the service and verifies the compiled transition helper.

## Upstream Traceability

- `BUSINESS.md`: cancellations and refunds require explicit human approval.
- `SYSTEM.md`: order status transitions must follow the state machine.
- `docs/orchestrator/INTENT.md`: state jumps, cancellations, refunds, and destructive corrections require explicit owner approval and audit evidence.
- `docs/orchestrator/ORDER_STATUS_TRANSITIONS.md`: defines normal, rejected, item fulfillment, and owner-approved cancellation paths.
- `docs/IMPLEMENTATION_STATE.md`: next recommended goal is Goal 2 chunk 2.4.

## Goal Impact

The implementation turns prior ad hoc direct helper checks into a committed verification command. It increases regression coverage without changing endpoint behavior, persistence, events, payment, warehouse, catalog, notification, CRM, pricing, auth, or shipment ownership.

## Project Invariants

- `ORD-INV-001`: Preserved; Orders remains the canonical lifecycle source.
- `ORD-INV-002`: Strengthened; normal, rejected, item, and owner-approved cancellation transitions now have repeatable verification.
- `ORD-INV-003`: Preserved; cross-service ownership boundaries remain unchanged.
- `ORD-INV-004`: Preserved; verification uses synthetic actor identifiers and no customer/payment data.
- `ORD-INV-005`: Preserved; no API/event contract changes were made.
- `ORD-INV-006`: Not applicable; pricing behavior is unchanged.
- `ORD-INV-007`: Preserved by status and implementation-state updates.
- `ORD-INV-008`: Pass with exception; no session `JWT_TOKEN` is available for DocsRAG.

## Sensitive-Data Handling

Classification: `synthetic`.

The verification script uses synthetic actor IDs, synthetic email domains, synthetic timestamps, reason codes, and boolean side-effect acknowledgements. It does not use production orders, customer addresses, payment details, bearer tokens, database secrets, or raw logs.

## Contract Validation Plan

Verified behavior:

- Normal order transitions: `pending -> confirmed -> processing -> shipped -> delivered`.
- Order item gating for shipped and delivered parent transitions.
- Rejected order jumps, reverse/destructive terminal corrections, refund-like statuses, and unknown statuses.
- Owner-approved cancellation from `pending`, `confirmed`, and `processing` with safe approval audit metadata.
- Rejected cancellation without approval, with non-human approval, with invalid reason code, with missing side-effect acknowledgement, and after shipment.
- Normal item fulfillment transitions: `pending -> reserved -> shipped -> delivered`.
- Rejected item jumps, reversals, terminal changes, synthetic return/refund/cancellation values, and unknown statuses.

Unchanged contracts:

- No endpoint response shape changes.
- No state-machine behavior changes.
- No event schema changes.
- No warehouse, payment, catalog, notification, CRM, pricing, shipment, or auth ownership changes.

## Scope

- Add `scripts/verify-status-transitions.js`.
- Add `npm test` and `npm run verify:transitions` scripts.
- Build and run repeatable verification.
- Record evidence, commit, and skip deployment because runtime behavior did not change.

## Non-Goals

- No database schema migration.
- No endpoint or runtime behavior changes.
- No persisted audit-log table.
- No refund execution or payment reconciliation.
- No warehouse stock release automation.
- No notification delivery or CRM updates.
- No terminal-state correction endpoint.
- No item cancellation/refund/return schema changes.

## Files To Inspect

- `src/orders/status-transitions.ts`
- `docs/orchestrator/ORDER_STATUS_TRANSITIONS.md`
- `package.json`

## Files To Modify

- `scripts/verify-status-transitions.js`
- `package.json`
- `docs/orchestrator/CONTEXT_PACKAGE.md`
- `docs/orchestrator/EXECUTION_PLAN.md`
- `docs/orchestrator/GOALS.md`
- `docs/orchestrator/STATUS.md`
- `docs/orchestrator/ORDER_STATUS_TRANSITIONS.md`
- `docs/IMPLEMENTATION_STATE.md`

## Files To Protect

- `.env*`, K8s secrets, Vault material, production logs, and production order table dumps.
- Runtime transition implementation files unless a verification failure proves a bug.
- Existing unrelated dirty files in the remote worktree.

## Implementation Steps

1. Add a direct verification script against `dist/orders/status-transitions.js`.
2. Cover allowed normal order and item fulfillment transitions.
3. Cover rejected jumps, terminal corrections, refund-like values, synthetic item return/refund/cancellation values, and item gating.
4. Cover owner-approved cancellation and missing/invalid approval rejection cases.
5. Wire `npm test` to build and run verification.
6. Run readiness checks and record evidence.

## Test Plan

- `npm test`
- `node --check dist/main.js`
- Missing-marker scan over IPS docs.
- Sensitive-pattern scan over docs, scripts, package metadata, and affected transition source.
- `git diff --check`

## Gate Decision

`pass-with-exception`: DocsRAG was not queried because no session service `JWT_TOKEN` is available. This is acceptable for this bounded Orders-local verification chunk because the transition contract and runtime helper are local source-of-truth files.

## Rollback Plan

If verification fails, update only the verification script or stop and fix the previously implemented transition helper. Do not revert unrelated worktree changes.

## Completion Checklist

- [x] Transition verification script added.
- [x] `npm test` added.
- [x] Allowed transitions covered.
- [x] Rejected transitions covered.
- [x] Owner-approved transitions covered.
- [x] Build passes.
- [x] Verification command passes.
- [x] IPS status and implementation state updated.
