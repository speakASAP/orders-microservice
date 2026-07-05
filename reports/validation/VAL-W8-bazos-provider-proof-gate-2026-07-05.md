# VAL-W8 Bazos Provider Proof Gate

Date: 2026-07-05
Status: source-gated-provider-backed-proof-blocked
Owner: Orders lifecycle orchestrator
Consumer repo: bazos
Bazos commit: `2970794 docs: gate Bazos provider-backed lifecycle proof`

## Vision

Unified Order Lifecycle Platform: every sellable order flows through canonical Orders lifecycle and marketplace cabinets must not claim provider-backed lifecycle proof without real provider evidence.

## Goal Impact

Bazos is now guarded against overclaiming source/UI lifecycle proof as provider-backed marketplace webhook/status proof. The provider-backed gap is not closed as complete; it is narrowed to exact missing packet fields and machine-checked in Bazos.

## System

- Orders owns canonical lifecycle, status events, and Warehouse handoff.
- Warehouse owns stock, reservation, and fulfillment state.
- Bazos owns channel-local synthetic/internal ingestion, UI read-model projection, and proof boundaries.
- External Bazos/provider systems own any real marketplace webhook semantics.

## Feature

Bazos W8 provider-proof gate.

## Task

Replace broad `[MISSING: Bazos provider webhook/status contract sample]` ambiguity with committed source verifiers and reports that prove the blocker is explicit and prevent source-only evidence from being reported as provider-backed evidence.

## Execution Plan

1. Inspect Bazos W4/Goal17 reports and current order service source.
2. Add Bazos static verifier for provider-proof gate.
3. Integrate concurrent worker boundary verifier/report.
4. Validate Bazos lifecycle UI and provider-boundary verifiers.
5. Commit Bazos evidence.
6. Record cross-repo W8 evidence in Orders.

## Coding Prompt

Do not invent provider webhook payloads, call live providers, mutate DB/runtime, deploy, or print customer/payment/token/provider data. Preserve missing provider facts and make them machine-checkable.

## Code

Bazos commit `2970794` includes:

- `package.json`
- `scripts/verify-bazos-provider-proof-gate.js`
- `scripts/verify-bazos-provider-proof-boundary.js`
- `reports/validation/2026-07-05-W8-bazos-provider-proof-gate.md`
- `reports/validation/2026-07-05-W8-bazos-provider-backed-order-lifecycle-proof-blocker.md`

## Validation

Validated in Bazos before commit:

- `npm run verify:bazos-provider-proof-gate` - PASS
- `npm run verify:bazos-provider-proof-boundary` - PASS
- `npm run verify:orders-lifecycle-ui` - PASS, 13 lifecycle stages and manual customer/admin refresh markers
- `git diff --check` - PASS

## Remaining Blockers

- `[UNKNOWN: live Bazos marketplace webhook support]`
- `[MISSING: provider-backed Bazos order item/status ingestion contract]`
- `[MISSING: provider-backed Bazos order status transition sample]`
- `[MISSING: provider-backed Bazos order item identity mapping sample]`
- `[MISSING: Warehouse-owned warehouseId for provider-backed Bazos order items]`
- `[MISSING: approved provider-backed non-secret fixture or live provider smoke packet]`
- `[MISSING: approved live Bazos buyer/admin bearer/session packet]`

## Outcome

W8 is complete as a source-proof gate and remains blocked for real provider-backed proof. This is stronger than the previous broad missing marker because future claims must now satisfy a verifier-guarded packet boundary.
