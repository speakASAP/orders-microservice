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
| Stock check and reservation on every order creation | W1/W2 live buyer-bound proof plus Orders verifiers | source-verified and live buyer-bound synthetic proven; cleanup/retention packet-gated |
| Order schema/contract includes items, prices, totals, delivery cost, and delivery address | W1 create-order contract verifier and lifecycle read-model verifier | source-verified |
| Paid orders trigger Warehouse fulfillment/delivery handoff | W1 fulfillment handoff verifier; W2 Warehouse callback current gate | source-verified and W1/W2/W2 synthetic callback/readback proven; extra live target/status smoke packet-gated |
| Order lifecycle status model standardized across services | W1 lifecycle/event/status verifiers; W3-W6/W6-A frontend/source reports covering 13 lifecycle stages | source-verified |
| Buyer and admin frontends render live status changes | W3-W6 reports plus W5 current reconciliation | bounded/service-scoped rendering proven for current release; natural human-session/customer-bound proof optional-product-gated where product requires it |
| Validation scripts prove order correctness and lifecycle synchronization | Orders verifier chain, Warehouse focused tests, marketplace `verify:orders-lifecycle-ui`; W6-A expanded FlipFlop verifier to dashboard widgets | source-verified; live mutation/session proofs remain gated |

## Current Open Gates

- W6-B resolved: FlipFlop central Orders action authority is runtime-complete and consumed by W7.
- FlipFlop direct safe-human browser proof remains optional/product-gated beyond proven service-scoped proof.
- W1/W2 live buyer-bound synthetic create/pay/callback proof is resolved; cleanup or explicit retention remains gated by the W1/W2 cleanup policy packet.
- W3-W5 natural human-session/customer-bound marketplace cabinet smokes remain optional/product-gated where product requires proof beyond approved bounded/service-scoped artifacts.
- Bazos provider-backed webhook/status proof remains product/provider-packet gated: UNKNOWN live Bazos marketplace webhook support plus missing provider item/status/warehouseId fixture or explicit out-of-scope decision.

## Next Action

The next non-source gate is W8 Bazos provider/product decision packet, or an explicit product decision that provider-backed Bazos marketplace lifecycle is out of scope.

## 2026-07-06 W5 Current Gate Reconciliation Addendum

[RESOLVED/NARROWED: W5 Aukro/Heureka current gate is service-scoped API/DOM proven for central Orders lifecycle rendering; natural human-session or natural real customer-bound proof remains optional/product-gated if product requires proof beyond approved service-scoped/bounded evidence]. Historical row-level/session-gated wording in this report is superseded for Aukro/Heureka current aggregation by reports/validation/VAL-W5-aukro-heureka-current-gate-2026-07-06.md and npm run verify:w5-aukro-heureka-current-gate. Natural human-session/customer-bound proof remains optional/product-gated if product requires proof beyond approved service-scoped/bounded evidence.
