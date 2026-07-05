# Unified Order Lifecycle Platform Current State

status: active-open-gates
created_at: 2026-07-05
objective: make Orders the reliable backbone for all marketplace purchases
systems: Orders microservice, Warehouse, FlipFlop, Bazos/Basus, Heureka, Allegro, Aukro, customer personal cabinets, admin cabinets

## Intent Preservation Chain

Vision -> Orders is the reliable backbone for all marketplace purchases.

Goal Impact -> No sellable order can bypass stock reservation, paid orders trigger Warehouse fulfillment, and buyer/admin cabinets show canonical lifecycle status across all marketplaces.

System -> Orders owns lifecycle and order contract. Warehouse owns stock, reservations, fulfillment, and delivery state. Marketplace services own channel adapters and frontend rendering only.

Feature -> Unified order creation contract, stock reservation, paid fulfillment handoff, standardized lifecycle stages, frontend status rendering, and validation scripts.

Task -> Track required outcomes against current source/runtime evidence and child-lane status.

Execution Plan -> Consume W1-W7A reports and continue W6-B contract lane for remaining local-authority drift.

Coding Prompt -> Remote-only docs/evidence update. Do not invent missing contracts or approvals.

Code -> No runtime code changed in this addendum.

Validation -> Report presence, git diff hygiene, and current remote repo status.

## Required Outcomes Audit

| Required outcome | Current authoritative evidence | Status |
|---|---|---|
| Stock check and reservation on every order creation | W1 report `VAL-W1-orders-runtime-proof-2026-07-05.md`; Orders verifiers `verify:create-order-contract`, `verify:order-reservation-gate`; W2 Warehouse callback proof | source-verified; live synthetic mutation remains approval-gated |
| Order schema/contract includes items, prices, totals, delivery cost, and delivery address | W1 create-order contract verifier and lifecycle read-model verifier | source-verified |
| Paid orders trigger Warehouse fulfillment/delivery handoff | W1 fulfillment handoff verifier; W2 Warehouse fulfillment callback proof | source-verified; live fulfillment mutation smoke remains approval-gated |
| Order lifecycle status model standardized across services | W1 lifecycle/event/status verifiers; W3-W6/W6-A frontend/source reports covering 13 lifecycle stages | source-verified |
| Buyer and admin frontends render live status changes | W3 Allegro, W4 Bazos, W5 Aukro/Heureka, W6/W6-A FlipFlop reports | source-verified for rendering; live row-level sessions remain blocked by missing approved bearer/browser packets |
| Validation scripts prove order correctness and lifecycle synchronization | Orders verifier chain, Warehouse focused tests, marketplace `verify:orders-lifecycle-ui`; W6-A expanded FlipFlop verifier to dashboard widgets | source-verified; live mutation/session proofs remain gated |

## Current Open Gates

- W6-B active: central-authority contract for FlipFlop admin status changes. Thread `019f3159-4923-74e2-b424-04157c47febf`.
- W6-C blocked: `[MISSING: approved live customer/admin bearer/session packet]` for FlipFlop browser/API smoke.
- W1/W2 live synthetic create/pay/callback smoke blocked: `[MISSING: RUN_LIVE_LIFECYCLE_MUTATION_SMOKE=1]`, `[MISSING: LIFECYCLE_MUTATION_SMOKE_APPROVAL_ID]`, `[MISSING: LIFECYCLE_MUTATION_SMOKE_CONFIRM=CREATE_PAY_WAREHOUSE_READ]`.
- W3-W5 live row-level marketplace cabinet smokes blocked: `[MISSING: approved buyer/admin bearer/session packets]`.
- Bazos provider-backed webhook/status proof blocked: `[MISSING: Bazos provider-backed webhook/status contract and sample]`.

## Next Action

W6-B is the next non-runtime-gated lane because it addresses a real central-authority gap without requiring live customer sessions or production stock/payment mutations.
