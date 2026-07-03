# Child Lane Cleanup Reconciliation

Date: 2026-07-03
Repository of record: `orders-microservice`

## Purpose

This document integrates the session-cleanup child lane update into Orders IPS state without rerunning completed workers or starting new workers.

## Source Cleanup Update Consumed

- Frontend-A:
  - FlipFlop `3110c6a feat: improve orders lifecycle UI reliability`
  - Heureka `358fba9 feat: cover orders lifecycle dashboard labels`
  - Cleanup status: source validation/builds passed; no deploy recorded by that child lane.
  - Child remaining gate: `[MISSING: browser smoke]`.
- Frontend-B:
  - Allegro `529a71d feat: cover orders lifecycle UI refresh`
  - Bazos `26af3ae feat: verify orders lifecycle UI labels`
  - Aukro `f6502bb feat: cover orders lifecycle dashboard refresh`
  - Cleanup status: source validation/builds passed; no deploy recorded by that child lane.
  - Child remaining gates: `[MISSING: runtime browser smoke after deploy]`, `[UNKNOWN: production bundles contain these source changes before deploy]`.
- Provider/courier P3:
  - Orders `5efa4c9 docs: integrate allegro shipment sensitive data policy`
  - Raw tracking display remains blocked by product-approved visibility matrix.
- Warehouse Worker F:
  - Warehouse `f104202 docs: define fulfillment provider status intake`
  - No deploy, migration, or runtime changes.
- Provider/courier P1/P2/P4/P5 and follow-up boundary workers:
  - Completed docs/read-only handoffs.
  - Runtime remains blocked on Allegro OAuth/scope/account permission, sanitized fixtures, Warehouse ledger/correlation, and deploy/runtime smoke approval.

## Current Orders Orchestrator Reconciliation

The cleanup update is accepted as child-lane evidence, but several child lane statuses are superseded by later orchestrator integration evidence already recorded in Orders:

- FlipFlop `3110c6a`, Heureka `358fba9`, Bazos `26af3ae`, Aukro main integration `08ad5ce`, and Allegro main integration `4ff3987` are recorded as deployed in `docs/orchestrator/STATUS.md`.
- The child-lane `no deploy` statements are therefore historical lane-local state, not the current production state.
- Runtime route smokes are recorded for deployed channel routes, but rendered browser proof after lifecycle mutation remains missing.
- Allegro worker commit `529a71d` was not pushed to production directly; it was cherry-picked safely onto current main as `4ff3987` to avoid reverting shipment-correlation work.
- Aukro worker commit `f6502bb` was integrated onto current main as `08ad5ce`.

## Current Decision

- Do not rerun completed source workers.
- Do not edit the five channel UI repos until the already-integrated/deployed commits are browser-smoked or explicitly deferred.
- Do not start Orders runtime provider integration until Allegro source capability and Warehouse ledger/correlation/runtime approvals are resolved.
- Safe next cross-repo action remains a validation-only browser proof lane, starting with FlipFlop after merge-order review and approved proof/session mode.

## Remaining Gates

- `[MISSING: merge-order review approval for FlipFlop browser validation lane.]`
- `[MISSING: approved safe human buyer/admin session or explicitly approved service-scoped browser proxy proof.]`
- `[MISSING: rendered customer/admin UI evidence after Orders lifecycle mutation.]`
- `[MISSING: real subject-bound Allegro buyer order row and buyer bearer.]`
- `[UNKNOWN: provider-backed Bazos marketplace webhook/order source decision.]`
- `[MISSING: product-approved tracking visibility matrix before raw tracking display.]`
- `[MISSING: Allegro OAuth/scope/account permission, sanitized fixtures, Warehouse ledger/correlation, deploy/runtime smoke approval for provider runtime.]`

## Next Decision Point

Decide whether to:

1. Approve FlipFlop validation-only browser proof using a safe buyer/admin session.
2. Approve explicit service-scoped browser proxy proof if no human session is available.
3. Defer browser proof and keep the goal open with the documented missing gate.
