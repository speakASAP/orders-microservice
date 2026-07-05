# Error-Free Orders Lifecycle Master Plan

status: active
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

Validation -> Existing source verifiers passed on 2026-07-05: `verify:create-order-contract`, `verify:order-reservation-gate`, `verify:order-fulfillment-handoff`, `verify:order-lifecycle-read-model`, `verify:product-sales-statistics`, `verify:channel-lifecycle-surfaces`; channel `verify:orders-lifecycle-ui` passed for Allegro, Bazos, Aukro, Heureka, and FlipFlop. Remaining gate is live customer/admin API or browser smoke per channel.

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
- This is not yet fully proven as production-complete because the central verifier reports `source_ready_runtime_smoke_gated`: live customer/admin smoke remains required per channel.
- `[MISSING: approved live customer/admin bearer/session packets per channel for end-to-end cabinet smoke]`.
- `[RESOLVED/NARROWED: Orders admin lifecycle action contract source-validated on 2026-07-05]`; remaining implementation gate is FlipFlop route-to-Orders admin action wiring plus approved live action-admin session.
- `[RESOLVED/NARROWED: Bazos provider-backed proof gate committed in bazos 2970794]`; real provider-backed proof remains blocked by `[UNKNOWN: live Bazos marketplace webhook support]`, `[MISSING: provider-backed Bazos order item/status ingestion contract]`, `[MISSING: provider-backed Bazos order status transition sample]`, `[MISSING: provider-backed Bazos order item identity mapping sample]`, `[MISSING: Warehouse-owned warehouseId for provider-backed Bazos order items]`, and `[MISSING: approved provider-backed non-secret fixture or live provider smoke packet]`.
- `[MISSING: optional real provider shipment movement beyond bounded sanitized fixtures where product requires live carrier proof]`.

## Parallel Execution

| Workstream | Status | Owner role | Scope | Allowed files | Forbidden files | Validation evidence | Handoff |
|---|---|---|---|---|---|---|---|
| W1 Orders runtime proof | ready now | Orders validation owner | Prove central create/reserve/pay/fulfillment/status callback with existing non-secret runtime path or document exact blockers | orders scripts/reports/docs only unless verifier needs tiny source fix | DB mutation without approved packet, secrets, raw PII | focused npm verifiers plus redacted live/API smoke if approved token exists | report exact commands/results |
| W2 Warehouse fulfillment callback proof | ready now | Warehouse validation owner | Prove fulfillment order status update syncs to Orders lifecycle | warehouse scripts/reports/docs, fulfillment tests | stock mutation without approved packet | focused fulfillment/reservation tests and redacted callback smoke | record status mapping evidence |
| W3 Allegro buyer/admin cabinet smoke | ready now but auth-gated | Allegro UI owner | Prove `/cabinet/orders`/admin views use central lifecycle | Allegro frontend/order client/verifier docs | ownership fallback by email, raw Allegro payloads | `verify:orders-lifecycle-ui`, buyer/admin smoke or `[MISSING]` bearer | report buyer subject binding evidence |
| W4/W8 Bazos cabinet/status and provider gate | source-verified-provider-blocked | Bazos UI/provider-proof owner | Prove Bazos buyer/admin lifecycle and machine-guard provider webhook gaps | Bazos frontend/shared client/verifier docs | inventing provider webhook contract | `verify:orders-lifecycle-ui`, `verify:bazos-provider-proof-gate`, `verify:bazos-provider-proof-boundary` | provider proof blocked until exact non-secret packet exists |
| W5 Aukro and Heureka cabinet proof | ready now | Marketplace UI owner | Prove Aukro/Heureka lifecycle views and admin stats | Aukro/Heureka UI/client/verifier docs | broad contract/schema edits | existing verifiers plus live/API smoke where token exists | report per-channel status |
| W6 FlipFlop centralization gap | ready now | FlipFlop commerce owner | Check local order-service vs central Orders drift and close only read-model/status UI gaps | FlipFlop shared order client, frontend orders/admin pages, verifiers/docs | unrelated checkout/payment/provider mutations | `verify:orders-lifecycle-ui`, `verify:orders-hub-integration`, live smoke if auth available | report whether local order-service still authoritative anywhere |
| W7 Final integration | final integration | Orchestrator | Merge evidence, update master status, decide deploy/runtime approval needs | docs/orchestrator reports only | code/schema changes | all workstream handoff reports | final go/no-go |

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
