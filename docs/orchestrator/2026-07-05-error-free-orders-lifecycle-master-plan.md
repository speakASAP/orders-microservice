# Error-Free Orders Lifecycle Master Plan

status: final-integration-gated
created_at: 2026-07-05
owner: orders-lifecycle-orchestrator
scope: orders-microservice, warehouse-microservice, allegro, bazos, aukro, heureka, flipflop
company_standard: /Users/Sergej.Stasok/Documents/Gitlab/intent-preservation-system

## Intent Preservation Chain

Vision -> Every sellable order is error-free: all order lines are available, reserved before order creation completes, paid orders are handed to Warehouse for picking/dispatch, and every customer/admin cabinet reflects the canonical Orders lifecycle.

Goal Impact -> Prevent overselling, preserve Warehouse as stock authority, give buyers and admins live lifecycle visibility, and keep all sales channels consistent without local lifecycle drift.

System -> Orders owns central order lifecycle and lifecycle events. Warehouse owns stock, reservations, fulfillment orders, picking/packing/delivery status, and stock movement evidence. Marketplace services own channel ingestion/UI only and must not become order lifecycle truth.

Feature -> Reliable order creation, reservation, payment-to-fulfillment handoff, Warehouse status callback, customer order cabinet, admin order/delivery statistics, and channel lifecycle UI refresh.

Task -> Audit current implementation, preserve source-ready contracts, close runtime-smoke gaps, and implement missing channel/runtime links in parallel with explicit file ownership.

Execution Plan -> This document plus repo-local plans in Warehouse and each marketplace repository.

Coding Prompt -> Agents must use remote repo path `/home/ssf/Documents/Github/<repository>`, preserve this chain, mark missing facts as `[MISSING: ...]`, avoid raw customer/payment/tracking/token output, and validate with focused source verifiers before any deploy request.

Code -> Existing verified source: Orders create/reservation/payment/lifecycle endpoints, Warehouse reservation/fulfillment endpoints, and channel UI lifecycle marker verifiers. New code must be narrowly scoped by workstream.

Validation -> Existing source verifiers passed on 2026-07-05: `verify:create-order-contract`, `verify:order-reservation-gate`, `verify:order-fulfillment-handoff`, `verify:order-lifecycle-read-model`, `verify:product-sales-statistics`, `verify:channel-lifecycle-surfaces`; channel `verify:orders-lifecycle-ui` passed for Allegro, Bazos, Aukro, Heureka, and FlipFlop. Final integration evidence is recorded in `reports/validation/VAL-W7-error-free-orders-lifecycle-final-integration-2026-07-05.md`. W1/W2 live buyer-bound proof is verified by `npm run verify:w1w2-live-buyer-bound-proof`; remaining gates require owner-approved marketplace bearer/session/provider/action/fulfillment packets or product decisions, not more autonomous source work.

## Business Process

1. Channel/service submits a central order create request to Orders with `channel`, `externalOrderId`, optional `channelAccountId`, customer identity, item list, per-item unit/total price, subtotal, shipping cost, tax, total, shipping method, and delivery address.
2. Orders normalizes and validates the request, enforces idempotency by channel/external order/account, and rejects malformed or conflicting replays.
3. For sellable channels (`flipflop`, `allegro`, `aukro`, `bazos`, `heureka`, `cliplot`) Orders must reserve every item through Warehouse before emitting `orders.order.created.v1`.
4. If any required Warehouse reservation is disabled, skipped, or failed, Orders rejects creation and compensates any already reserved lines. Orders must not calculate stock truth locally.
5. While unpaid, customer lifecycle reads show `ordered_unpaid`; failed/cancelled payment releases reservation and projects `payment_failed` unless terminal cancellation applies.
6. When Payments marks the order `paid`, Orders confirms the order, calls Warehouse reservation `fulfill`, creates a Warehouse fulfillment order/pick-ticket with fulfilled reservation IDs and delivery details, emits lifecycle/paid events, and stores bounded handoff metadata.
7. Warehouse owns picking/packing/delivery states: `requested`, `collecting`, `forming`, `formed`, `handed_to_delivery`, `in_delivery`, `delivered`, `not_delivered`, `returned`, `cancelled`.
8. Warehouse sends fulfillment status updates back to Orders through `/api/orders/:id/warehouse-fulfillment-status`; Orders projects the canonical lifecycle stage and emits `orders.order.lifecycle_changed.v1`.
9. Customer cabinets read only the authenticated customer lifecycle view and show order lines, totals, shipping cost, delivery address, payment state, fulfillment/delivery state, exceptions, stale/error states, and refresh behavior.
10. Admin cabinets read admin lifecycle/statistics views and show cross-channel order counts, delivery/exception states, product sales statistics, and operational failures without exposing secrets or unnecessary PII.

## Current Audit Verdict

- Orders source implementation is strong and source-verified for create contract, reservation gate, fulfillment handoff, lifecycle read model, and product/order delivery statistics.
- Warehouse source implementation supports reservation lifecycle, fulfillment order creation, internal/provider delivery status mapping, and callback to Orders.
- Marketplace lifecycle UI source markers exist and pass focused verifiers for Allegro, Bazos, Aukro, Heureka, and FlipFlop.
- Orders customer lifecycle reads were hardened on 2026-07-05 to require Auth `sub` and no longer accept `customer.email` fallback for buyer cabinet ownership.
- This is not yet fully proven as production-complete because natural marketplace/provider/action/fulfillment evidence remains packet-gated. W1/W2 central create/reserve/pay/Warehouse/customer/admin runtime proof is live buyer-bound proven. Runtime packet shape is now centralized in docs/orchestrator/2026-07-05-runtime-gate-packet-contracts.md and verified by `npm run verify:runtime-gate-packets`.
- Allegro is source-proven and approved synthetic buyer/admin runtime-proven; remaining Allegro gate is a future real-traffic subject-bound buyer row with forwarded central Orders lifecycle if product requires natural proof beyond the synthetic row.
- Warehouse W2 is source-verified for fulfillment callback projection, but live fulfillment status mutation remains blocked until an owner-approved redacted runtime packet names the exact target, transition, actor, reason/idempotency policy, and readback boundary.
- FlipFlop W6 is source-guarded fail-closed for central-owned order lifecycle/payment status mutation and has central lifecycle UI verifier coverage hardened in FlipFlop a87212d; route-to-Orders admin action wiring and direct live action-admin/customer session smoke remain gated by approved action-admin session, Auth actor mapping, idempotency/replay policy, cancellation side-effect packet, and response/readback contract.
- Aukro and Heureka are source/runtime-presence verified; row-level live proof remains gated by approved customer/admin sessions and available non-stale central Orders rows.
- Bazos source/UI proof is accepted, but real provider-backed proof remains blocked by `[UNKNOWN: live Bazos marketplace webhook support]`, `[MISSING: provider-backed Bazos order item/status ingestion contract]`, `[MISSING: provider-backed Bazos order status transition sample]`, `[MISSING: provider-backed Bazos order item identity mapping sample]`, `[MISSING: Warehouse-owned warehouseId for provider-backed Bazos order items]`, and `[MISSING: approved provider-backed non-secret fixture or live provider smoke packet]`.
- `[MISSING: optional real provider shipment movement beyond bounded sanitized fixtures where product requires live carrier proof]`.

## Parallel Execution

| Workstream | Status | Owner role | Scope | Allowed files | Forbidden files | Validation evidence | Handoff |
|---|---|---|---|---|---|---|---|
| W1 Orders runtime proof | live-buyer-bound-proven; cleanup policy gated | Orders validation owner | Prove central create/reserve/pay/fulfillment/status callback with approved non-secret runtime path | orders scripts/reports/docs only unless verifier needs tiny source fix | unapproved cleanup/replay, secrets, raw PII | `verify:w1w2-live-buyer-bound-proof` passed; W1/W2 report records redacted buyer-bound customer/admin readback | no further W1/W2 mutation unless cleanup/replay packet is approved |
| W2 Warehouse fulfillment callback proof | source-verified-runtime-mutation-gated | Warehouse validation owner | Prove fulfillment order status update syncs to Orders lifecycle | warehouse scripts/reports/docs, fulfillment tests | stock/fulfillment mutation without approved packet | Warehouse fulfillment tests passed; Orders callback/lifecycle verifiers passed; W2 report records runtime packet blockers | live transition smoke requires owner packet |
| W3 Allegro buyer/admin cabinet smoke | synthetic-buyer-admin-runtime-proven; real-traffic-gated | Allegro UI owner | Prove `/cabinet/orders`/admin views use central lifecycle | Allegro frontend/order client/verifier docs | ownership fallback by email, raw Allegro payloads | `verify:orders-lifecycle-ui`; approved synthetic buyer/admin bearer smoke passed in Allegro `c246b1e` | future natural proof needs real traffic row/session |
| W4/W8 Bazos cabinet/status and provider gate | source-verified-provider-blocked | Bazos UI/provider-proof owner | Prove Bazos buyer/admin lifecycle and machine-guard provider webhook gaps | Bazos frontend/shared client/verifier docs | inventing provider webhook contract | `verify:orders-lifecycle-ui`, `verify:bazos-provider-proof-gate`, `verify:bazos-provider-proof-boundary` | provider proof blocked until exact non-secret packet exists |
| W5 Aukro and Heureka cabinet proof | source/runtime-presence verified, row-level session-gated | Marketplace UI owner | Prove Aukro/Heureka lifecycle views and admin stats | Aukro/Heureka UI/client/verifier docs | broad contract/schema edits | Aukro `verify:orders-lifecycle-ui`; Heureka `verify:orders-lifecycle-ui` plus runtime readiness; Orders `VAL-W5-aukro-heureka-lifecycle-cabinet-proof-2026-07-05.md` | approved live row-level buyer/admin sessions and non-stale rows still required |
| W6 FlipFlop centralization gap | source-guarded-session-gated | FlipFlop commerce owner | Check local order-service vs central Orders drift and close only read-model/status UI gaps | FlipFlop shared order client, frontend orders/admin pages, verifiers/docs | unrelated checkout/payment/provider mutations | `verify:orders-lifecycle-ui`, `verify:orders-hub-integration`; fail-closed central authority guard documented | route-to-Orders action flow remains gated by approved action-admin session, Auth actor mapping, idempotency/replay policy, cancellation side-effect packet, and response/readback contract; live session smoke remains gated |
| W7 Final integration | complete-docs-only-gated-go-no-go | Orchestrator | Merge evidence, update master status, decide deploy/runtime approval needs | docs/orchestrator reports only | code/schema changes | `VAL-W7-error-free-orders-lifecycle-final-integration-2026-07-05.md`, `verify:channel-lifecycle-runtime-evidence`, `verify:completion-audit`, `git diff --check` | no deploy; next action is approved runtime packet or product decision |

Shared contracts: Orders lifecycle stages, Orders create contract, Warehouse reservation/fulfillment endpoints, service JWT/RBAC roles, customer identity subject/email scoping.

Integration owner: original orchestrator thread.

Validation owner: W1 for Orders source/runtime, W2 for Warehouse source/runtime, W7 for cross-repo evidence.

Merge order: W1 and W2 first, W3-W6 in parallel after source contract confirmation, W7 last.

## Agent Rules

- Work directly on `alfares` remote repositories only.
- Do not save project code under local `/Users/Sergej.Stasok/Documents`.
- Do not deploy unless the workstream explicitly reaches a deploy gate with clean status and validation evidence.
- Do not perform live stock, payment, refund, provider, or customer data mutation without an owner-approved runtime packet.
- Preserve `[MISSING: ...]` blockers instead of inventing tokens, ownership rules, webhooks, adapters, or delivery provider contracts.
