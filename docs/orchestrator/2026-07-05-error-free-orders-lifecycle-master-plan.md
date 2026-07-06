# Error-Free Orders Lifecycle Master Plan

status: final-integration-partial-runtime-complete-marketplace-provider-fulfillment-gated
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

Validation -> Existing source verifiers passed on 2026-07-05: `verify:create-order-contract`, `verify:order-reservation-gate`, `verify:order-fulfillment-handoff`, `verify:order-lifecycle-read-model`, `verify:product-sales-statistics`, `verify:channel-lifecycle-surfaces`; channel `verify:orders-lifecycle-ui` passed for Allegro, Bazos, Aukro, Heureka, and FlipFlop. Final integration evidence is recorded in `reports/validation/VAL-W7-error-free-orders-lifecycle-final-integration-2026-07-05.md`. W1/W2 live buyer-bound proof is verified by `npm run verify:w1w2-live-buyer-bound-proof`; W1/W2 cleanup route/policy is source-defined by `npm run verify:w1w2-cleanup-policy`; FlipFlop W6 central action proof is runtime-complete in FlipFlop `df32252`; remaining gates require owner-approved marketplace bearer/session/provider/fulfillment/cleanup-or-retention packets or product decisions, not more autonomous source work.

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
- This is not yet fully proven as production-complete because natural marketplace/provider/fulfillment evidence remains packet-gated. W1/W2 central create/reserve/pay/Warehouse/customer/admin runtime proof is live buyer-bound proven. FlipFlop W6 central Orders lifecycle/action proof is runtime-complete through an Auth-issued action-admin token, Vault-backed `ORDERS_STATUS_SERVICE_TOKEN`, ExternalSecret sync, and guarded create/read/cancel smoke. Runtime packet shape is centralized in docs/orchestrator/2026-07-05-runtime-gate-packet-contracts.md and verified by `npm run verify:runtime-gate-packets`.
- Allegro is source-proven and approved synthetic buyer/admin runtime-proven; remaining Allegro gate is a future real-traffic subject-bound buyer row with forwarded central Orders lifecycle if product requires natural proof beyond the synthetic row.
- Warehouse W2 is source-verified for fulfillment callback projection, but live fulfillment status mutation remains blocked until an owner-approved redacted runtime packet names the exact target, transition, actor, reason/idempotency policy, and readback boundary.
- FlipFlop W6 is runtime-complete for central Orders authority: FlipFlop `df32252` records central lifecycle UI/read-model verification, route-to-Orders admin action wiring, Auth `internal:orders-microservice:action-admin` token projection through Vault/ExternalSecret, prior synthetic cleanup through Orders admin action, and fresh guarded create/read/cancel smoke with create 201, read 200, cleanup 200, blockers empty, providerCall=false, and no raw token/order/customer/payment output. Remaining FlipFlop-adjacent gap is payment/refund/provider correction workflow, which stays fail-closed and outside W6 lifecycle status authority.
- Aukro and Heureka are source/runtime-presence verified; row-level live proof remains gated by approved customer/admin sessions and available non-stale central Orders rows.
- Bazos source/UI proof is accepted. `[RESOLVED/NARROWED: W8 Bazos provider-backed proof is not an autonomous source implementation gap; current Bazos source supports bounded synthetic/internal order ingestion and central Orders UI proof, while true provider-backed webhook/status proof remains product/provider-packet gated]` Real provider-backed proof remains blocked by `[UNKNOWN: live Bazos marketplace webhook support]`, `[MISSING: provider-backed Bazos order item/status ingestion contract]`, `[MISSING: provider-backed Bazos order status transition sample]`, `[MISSING: provider-backed Bazos order item identity mapping sample]`, `[MISSING: Warehouse-owned warehouseId for provider-backed Bazos order items]`, and `[MISSING: approved provider-backed non-secret fixture or live provider smoke packet]`.
- `[MISSING: optional real provider shipment movement beyond bounded sanitized fixtures where product requires live carrier proof]`.

## Parallel Execution

| Workstream | Status | Owner role | Scope | Allowed files | Forbidden files | Validation evidence | Handoff |
|---|---|---|---|---|---|---|---|
| W1 Orders runtime proof | live-buyer-bound-proven; cleanup route/policy source-defined; runtime cleanup-or-retention gated | Orders validation owner | Prove central create/reserve/pay/fulfillment/status callback and define cleanup decision policy with approved non-secret runtime path | orders scripts/reports/docs only unless verifier needs tiny source fix | unapproved cleanup/replay/retention, secrets, raw PII | `verify:w1w2-live-buyer-bound-proof` and `verify:w1w2-cleanup-policy` passed; W1/W2 report records redacted buyer-bound customer/admin readback and fail-closed cleanup policy | no further W1/W2 mutation or retention decision unless cleanup/replay/readback packet is approved |
| W2 Warehouse fulfillment callback proof | source-verified-runtime-mutation-gated | Warehouse validation owner | Prove fulfillment order status update syncs to Orders lifecycle | warehouse scripts/reports/docs, fulfillment tests | stock/fulfillment mutation without approved packet | Warehouse fulfillment tests passed; Orders callback/lifecycle verifiers passed; W2 report records runtime packet blockers | live transition smoke requires owner packet |
| W3 Allegro buyer/admin cabinet smoke | synthetic-buyer-admin-runtime-proven; real-traffic-gated | Allegro UI owner | Prove `/cabinet/orders`/admin views use central lifecycle | Allegro frontend/order client/verifier docs | ownership fallback by email, raw Allegro payloads | `verify:orders-lifecycle-ui`; approved synthetic buyer/admin bearer smoke passed in Allegro `c246b1e` | future natural proof needs real traffic row/session |
| W4/W8 Bazos cabinet/status and provider gate | source-verified-provider-product-packet-gated | Bazos UI/provider-proof owner | Prove Bazos buyer/admin lifecycle and machine-guard provider webhook gaps | Bazos frontend/shared client/verifier docs | inventing provider webhook contract | `verify:orders-lifecycle-ui`, `verify:bazos-provider-proof-gate`, `verify:bazos-provider-proof-boundary`, Orders `verify:w8-bazos-provider-current-gate` | provider proof is not an autonomous source gap; blocked until exact non-secret provider/product packet exists |
| W5 Aukro and Heureka cabinet proof | source/runtime-presence verified, row-level session-gated | Marketplace UI owner | Prove Aukro/Heureka lifecycle views and admin stats | Aukro/Heureka UI/client/verifier docs | broad contract/schema edits | Aukro `verify:orders-lifecycle-ui`; Heureka `verify:orders-lifecycle-ui` plus runtime readiness; Orders `VAL-W5-aukro-heureka-lifecycle-cabinet-proof-2026-07-05.md` | approved live row-level buyer/admin sessions and non-stale rows still required |
| W6 FlipFlop centralization gap | runtime-complete-central-orders-authority-proven | FlipFlop commerce owner | Check local order-service vs central Orders drift and prove central lifecycle/action authority | FlipFlop shared order client, frontend orders/admin pages, verifiers/docs/reports | unrelated checkout/payment/provider mutations | FlipFlop `verify:orders-lifecycle-ui`, `verify:orders-hub-integration`, `verify:admin-status-central-authority`; guarded create/read/cancel smoke create 201/read 200/cleanup 200 | complete in FlipFlop `df32252`; payment/refund/provider correction workflow remains fail-closed outside W6 |
| W7 Final integration | complete-w6b-runtime-closure-consumed | Orchestrator | Merge evidence, update master status, decide remaining product/provider/session gates | docs/orchestrator reports only | code/schema changes | `VAL-W7-error-free-orders-lifecycle-final-integration-2026-07-05.md`, `VAL-W7E-flipflop-action-admin-runtime-closure-2026-07-06.md`, `verify:order-admin-lifecycle-action-contract`, `verify:runtime-gate-packets`, `git diff --check` | no deploy; next action is product/provider/session packet decision only |

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
