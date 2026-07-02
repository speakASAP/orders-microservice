# Order Lifecycle Agent Orchestration Registry

Date: 2026-07-02
Parent plan: `docs/orchestrator/2026-07-02-order-lifecycle-warehouse-status-rollout-plan.md`
Integration owner: original Orders orchestrator thread

## Common Goal

Implement reliable cross-service order lifecycle:

- every sellable order creation validates and reserves stock through Warehouse
- paid Orders trigger Warehouse fulfillment handoff
- every lifecycle/status change is represented in Orders
- customer and admin frontends render canonical Orders lifecycle
- all missing provider/broker/delivery contracts are marked explicitly

## Active Agents

| Lane | Agent | Scope | Status |
| --- | --- | --- | --- |
| O1 Orders core lifecycle | Singer `019f2366-8c98-7433-ba90-49bacea51827` | `orders-microservice` Orders lifecycle, events, APIs, validation | started |
| F1 FlipFlop checkout/cabinets | Pascal `019f2366-af74-7ec0-b3f8-fefc4e8a2b09` | `flipflop` central Orders-first checkout and order UIs | started |
| W1 Warehouse handoff | Wegener `019f2366-cf00-7ae2-8103-421052479539` | `warehouse-microservice` fulfillment handoff/pick-ticket discovery or implementation | completed |
| P1 Payments bridge | Plato `019f2366-ead6-7b42-b2fb-c2ac20910551` | `payments-microservice` Orders payment-status bridge verification/hardening | completed |
| Marketplace status discovery | Epicurus `019f2367-0810-7fb2-a600-b0e0dff5d598` | `heureka`, `allegro`, `aukro`, `bazos` read-only order-status mapping | completed |
| H1 Heureka read model | Rawls `019f236c-f393-79a2-b188-57c5cc09344b` | `heureka` central Orders lifecycle status in dashboard | completed |
| A1 Allegro read model | Turing `019f236d-1f17-7c33-8dd4-73764944883a` | `allegro` central Orders lifecycle status in order UI | started |
| AU1 Aukro read model | Ampere `019f2373-85d0-7f22-97e2-ed5d26d68c0c` | `aukro` central Orders lifecycle status in dashboard | started |
| B1 Bazos read model | gated | `bazos` provider-backed order contract and UI surface | blocked |
| N1 Notifications discovery | Linnaeus `019f2367-2025-7272-bf2c-01924566748c` | `notifications-microservice` broker consumer dependency gate | completed, blocked |

## Coordination Rules

- Agents work only in `/home/ssf/Documents/Github/<repo>` on `alfares`.
- Agents must preserve dirty work and must not revert edits made by others.
- Agents do not deploy or push.
- The integration owner owns merge order and cross-repo validation.
- Each agent must report changed files, validation commands/results, blockers, and handoff notes.
- `[MISSING: ...]` and `[UNKNOWN: ...]` are required for unavailable facts.

## Current Merge Order

1. Orders core lifecycle contract and read endpoints.
2. Warehouse fulfillment handoff contract if needed.
3. Payments bridge verification.
4. FlipFlop central Orders-first checkout and UI integration.
5. Marketplace status read-model workers after discovery.
6. Notifications consumer after broker dependency is confirmed.
7. Catalog/admin statistics after Orders stats endpoints.
8. Integrated smoke and deployment gate.

## Integration Backlog

- Review O1 result before marketplace UI workers depend on new lifecycle endpoints.
- Convert Epicurus discovery into separate Heureka, Allegro, Aukro, and Bazos worker prompts.
- Decide whether W1 requires a new Warehouse fulfillment-order API or only confirms existing `fulfill`.
- Keep FlipFlop work isolated from current product recommendation/catalog-source dirty work.
- Record final validation evidence in Orders `docs/orchestrator/STATUS.md` and `docs/IMPLEMENTATION_STATE.md` when implementation starts integrating.

## Discovery Update: Notifications

Agent: Linnaeus `019f2367-2025-7272-bf2c-01924566748c`
Status: completed read-only discovery, implementation blocked

Findings:

- `OrdersEventNotificationRouter` exists and is registered/exported through `src/notifications/notifications.module.ts`.
- It supports existing Orders events: created, updated, paid, shipped, cancelled.
- No live RabbitMQ, Nest RMQ, controller route, or broker consumer wiring exists.
- No `RABBIT*` or `ORDERS_EVENTS*` runtime config was found in repo or Kubernetes config.
- Current idempotency uses `templateData.ordersEvent.eventId`.
- PII guard exists, but lifecycle work must explicitly forbid delivery-address broadcast.

Blockers:

- `[MISSING: Orders producer source/fixture for orders.order.lifecycle_changed.v1.]`
- `[MISSING: Notifications-owned RabbitMQ consumer module or approved transport dependency.]`
- `[MISSING: Notifications runtime RABBITMQ_URL or broker secret source.]`
- `[MISSING: Orders-events queue name, binding ownership, retry/DLQ policy, and deployment owner.]`
- `[MISSING: Production ORDERS_EVENTS_NOTIFICATION_RECIPIENT or approved customer/admin recipient lookup/channel policy.]`
- `[MISSING: approved authenticated Orders lookup contract if Notifications needs PII.]`

## Discovery Update: Marketplace Read Models

Agent: Epicurus `019f2367-0810-7fb2-a600-b0e0dff5d598`
Status: completed read-only discovery

Findings by repository:

- Heureka: central Orders forwarding exists through `services/heureka-service/src/heureka/orders/orders.service.ts`; central id is stored in `HeurekaOrder.orderId`; dashboard currently renders local `heureka_orders.status`, not central lifecycle. Ready for worker after Orders lifecycle read contract.
- Allegro: order import uses `OrdersService.syncOrdersFromAllegro()` and Allegro checkout forms; forwarding is guarded by `forwardToOrdersMicroservice=true`; central id is only in latest `AllegroOrderForwardingAttempt.responseSummary.id`, not directly on `AllegroOrder`. Ready for worker with missing-id flags.
- Aukro: order ingest/webhook exists; forwarding stores central id in `AukroOrder.orderId`; dashboard renders local/stale sold-product status, not central lifecycle. Ready for worker with webhook-shape uncertainty preserved.
- Bazos: synthetic/internal order ingestion exists; provider-backed webhook and order-item contract remain unknown; no customer/admin order cabinet render found. Bazos stays dependency-gated except for a limited synthetic/internal order panel.

Marketplace blockers:

- `[MISSING: Orders lifecycle read contract/client method.]`
- `[MISSING: direct central order id on AllegroOrder.]`
- `[UNKNOWN: whether every active Allegro order has a FORWARDED attempt.]`
- `[UNKNOWN: real Aukro webhook shape.]`
- `[UNKNOWN: every provider-backed Aukro order forwards.]`
- `[UNKNOWN: live Bazos marketplace webhook support.]`
- `[MISSING: Bazos order item ingestion contract.]`
- `[MISSING: Warehouse-owned warehouseId for Bazos order item.]`
- `[MISSING: customer/admin order UI surface in Bazos.]`

## Worker Start Update: Marketplace Read Models

Started:

- Heureka read model worker Rawls `019f236c-f393-79a2-b188-57c5cc09344b`.
- Allegro read model worker Turing `019f236d-1f17-7c33-8dd4-73764944883a`.

Queued:

- Aukro read model worker Ampere `019f2373-85d0-7f22-97e2-ed5d26d68c0c` started after Payments P1 completed.
- Bazos read model worker: blocked until live provider-backed order contract, item ingestion contract, warehouseId source, and order UI surface are supplied or explicitly scoped to synthetic/internal orders.

## Worker Completion Update: Payments P1

Agent: Plato `019f2366-ead6-7b42-b2fb-c2ac20910551`
Status: completed

Results:

- Terminal `completed`, `failed`, and `cancelled` payment transitions call Orders only once.
- Repeated same-terminal updates no longer call Orders again.
- Non-UUID `orderId` values are explicit unsupported legacy skips, logged without raw non-UUID id.

Validation:

- `npm test -- --runTestsByPath test/payments-orders-status-bridge.spec.ts`: passed, 11 tests.
- `npm run build`: passed.
- `git diff --check`: passed.
- Strict doc audit failed on pre-existing Task 007 IPS drift, recorded as validation debt in the Payments repo.

Handoff:

- `[MISSING: proof that all active checkout paths pass central Orders UUIDs to Payments.]`
- FlipFlop/channel lanes must send central Orders UUIDs; local order numbers are now unsupported legacy behavior.
- `[MISSING: runtime Orders service-token presence/role verification.]`

## Worker Completion Update: Warehouse W1

Agent: Wegener `019f2366-cf00-7ae2-8103-421052479539`
Status: completed

Results:

- Confirmed existing `POST /api/reservations/fulfill` only finalizes stock and does not persist delivery address, shipping method, order item ids, SKU/title snapshots, or contact fields.
- Added Warehouse-owned fulfillment handoff endpoints:
  - `POST /api/fulfillment-orders`
  - `GET /api/fulfillment-orders/order/:orderId`
  - `POST /api/fulfillment-orders/order/:orderId/cancel`
  - `POST /api/fulfillment-orders/order/:orderId/return`
- Added migration tables `fulfillment_orders` and `fulfillment_order_lines`.
- Added contract doc `warehouse-microservice/docs/contracts/fulfillment-handoff-contract.md`.

Orders integration contract:

- Orders must first fulfill reservation rows through the existing reservation lifecycle.
- Orders must then call `POST /api/fulfillment-orders` with order id, order number, channel, shipping method, delivery address, allowed customer contact, and item lines containing order item id, reservation id, product id, SKU/title, warehouse id, and quantity.
- Warehouse rejects missing reservation ids, non-fulfilled reservations, mismatches, duplicate reservation ids, and non-equivalent idempotency replay.

Validation:

- `npm test -- --runInBand`: passed, 10 suites, 69 tests.
- `npm run build`: passed.
- `git diff --check`: passed.
- `STATE.json` parse: passed.

Handoff:

- Orders O1 has been notified to wire the fulfillment-order call after payment fulfillment.
- `[MISSING: delivery provider or shipment-status source contract after Warehouse hands the parcel to a carrier.]`
- Warehouse deploy/migration requires explicit owner approval.

## Worker Completion Update: Heureka H1

Agent: Rawls `019f236c-f393-79a2-b188-57c5cc09344b`
Status: completed

Results:

- Added tolerant `OrderClientService.getOrderById()` for `GET /api/orders/:orderId`.
- Dashboard order list/detail enriches rows from stored `heureka_orders.orderId`.
- Central lifecycle is exposed as `centralLifecycle`; local Heureka status remains `localStatus`.
- Missing central id shows `unknown/stale` with `[MISSING: central Orders id]`.
- Orders read failure shows `unknown/stale` with `[MISSING: Orders lifecycle read contract/client method]`.
- Public dashboard separates Lifecycle, Local, and Forwarding.

Validation:

- `git diff --check`: passed.
- `npm --prefix shared run build`: passed.
- focused `dashboard-order-read-model.self-test.ts`: passed.
- `npm run verify:heureka-order-ingestion`: passed.
- `npm run verify:heureka-orders-runtime-readiness`: passed.
- `LOGGING_SERVICE_URL=http://logging-microservice:3367 npm --prefix services/heureka-service run build`: passed.
- `dashboard-operations-history.self-test.ts`: passed.

Caveat:

- Unrelated concurrent `local-resale` dirty work causes `dashboard-list-products.self-test.ts` to fail; H1 left that lane untouched.
- `[UNKNOWN: exact stable Orders lifecycle DTO field names.]`
