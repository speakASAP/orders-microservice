# Orders Implementation State

```yaml
id: ORDERS-IMPLEMENTATION-STATE
status: ready
owner: Orders owner
created: 2026-06-12
last_updated: 2026-06-13
completeness_level: implemented
upstream:
  - AGENTS.md
  - BUSINESS.md
  - SYSTEM.md
  - README.md
  - TASKS.md
  - docs/orchestrator/INTENT.md
  - docs/orchestrator/GOALS.md
  - docs/orchestrator/PROJECT_INVARIANTS.md
  - docs/orchestrator/PRODUCTION_READINESS_ROADMAP.md
  - docs/orchestrator/CHANNEL_ORDER_CREATE_CONTRACT.md
  - docs/orchestrator/ORDER_IDEMPOTENCY_CONTRACT.md
  - docs/orchestrator/ORDERS_HUB_ROADMAP.md
  - docs/orchestrator/CANDIDATE_APPLICATION_INTEGRATION_DECISIONS.md
downstream:
  - docs/orchestrator/STATUS.md
  - docs/orchestrator/EXECUTION_PLAN.md
related_adrs: []
current_goal: none
current_chunk: none
next_recommended_goal: owner-selected deployment/migration step or future approved candidate contract goal
last_completed_goal: Goal H8 candidate application integration decisions
blockers: []
```

## Current Checkpoint

Goal 4 chunks 4.3-4.6 / Goal H3 are complete in runtime, adapter verification, and database hardening. Orders now looks up existing orders by `contractVersion + channel + channelAccountId + externalOrderId`, returns the existing order for exact replay, and rejects same-key different-payload creates with HTTP 409.

The documented idempotency key is `contractVersion + channel + channelAccountId + externalOrderId`. New clients must send `contractVersion=orders.create.v1`, a supported channel, a stable channel account/store/integration identity, and the upstream order or checkout ID. Safe retries must return the existing canonical order without inserting duplicate `orders` or `order_items` rows, without re-emitting `order.created`, and without rerunning warehouse/payment/notification/CRM side effects. Mismatched duplicates must become bounded `409 ORDER_IDEMPOTENCY_CONFLICT` responses without raw customer/address/payment payloads.

Goal 4 chunks 4.1-4.6 / Goal H3 are complete. Goal H4 is complete for versioned order lifecycle event contracts. `POST /api/orders` has a documented channel-ingestion contract, runtime normalizer for `orders.create.v1`, item-row persistence in the same transaction, documented idempotency expectations, production base table migrations, and a materialized database uniqueness guard for simultaneous duplicate creates.

Goal H1 chunks H1.1-H1.6 remain complete and deployed. The public Orders Hub landing page, admin shell, explicit admin JSON roles, roadmap, deployment, and live route checks are recorded in `docs/orchestrator/STATUS.md` and `docs/orchestrator/ORDERS_HUB_ROADMAP.md`.


Goal H3 chunks H3.5-H3.6 are complete. FlipFlop, Allegro, Aukro, Bazos, and Heureka shared order clients now send contractVersion=orders.create.v1, normalize a stable channelAccountId fallback, preserve the same payload for retry, and surface ORDER_IDEMPOTENCY_CONFLICT as HTTP 409 instead of flattening it to a generic 400. FlipFlop checkout forwarding now sends a stable account scope through ORDERS_CHANNEL_ACCOUNT_ID with fallback flipflop-storefront.

Goal H6 is complete. Orders now exposes a protected `orders.payment-status.v1` callback boundary at `PUT /api/orders/:id/payment-status` for Auth-authorized Orders admins or the Payments service role. Orders stores only bounded payment references (`paymentReferenceId`, `paymentApplicationId`, `paymentMethod`, `paymentStatus`, `paymentUpdatedAt`), maps Payments `completed` to Orders `paid`, emits `orders.order.paid.v1` once, and only advances `pending -> confirmed` on first paid status. Raw provider webhooks, provider transaction identifiers, variable symbols, provider response bodies, metadata, amounts, currency, customer payment payloads, card data, tokens, secrets, refunds, and reconciliation stay in `payments-microservice`.

H6 live schema is not materialized yet. `migrations/005_add_order_payment_status_boundary.sql` is present and must be applied before production use of `PUT /api/orders/:id/payment-status`.

Goal H4 is complete. Orders now defines `orders.order.created.v1`, `orders.order.updated.v1`, `orders.order.paid.v1`, `orders.order.shipped.v1`, and `orders.order.cancelled.v1`, publishes version metadata and RabbitMQ headers, and verifies fixtures/builders/publisher payloads against forbidden sensitive fields. Goal H5 is complete for reservation choreography and H5.5: Orders maps Warehouse lifecycle endpoints, has a config-gated Warehouse reservation client, stores audit-safe `warehouseHandoff` metadata, fulfills reservations on paid payment status, releases reservations on failed/cancelled payment status, cancels reservations after approved order cancellation, and verifies return remains outside normal Orders status updates. Goal H6 is complete for bounded Payments-owned status updates without taking over payment identity, provider webhooks, reconciliation, transactions, or refunds.

Goal 3 remains complete. Sensitive logging regression checks are wired into `npm test` and continue to pass. Goal 2 remains complete; owner-approved cancellation gates and state-transition validation remain in force.

Goal H7 is complete. The protected admin console now exposes read-only integration health for Auth, Warehouse, Payments, Catalog, Notifications, Leads, and Marketing; idempotency diagnostics for `orders.create.v1` channel/external order keys; safe order detail timeline/lifecycle log panels; role-scoped read-only versus action-capable modes; and a human-approved order status action workflow that delegates to the existing Orders state-machine and cancellation approval gates.

Goal H8 is complete. SpeakASAP, School Committee, Rentabox, and Marathon were reviewed from repository source-of-truth docs and targeted lifecycle evidence. No candidate is approved to feed Orders in this pass. All reviewed candidates keep domain-local lifecycle ownership unless a future owner-approved contract goal explicitly defines the Orders create contract, idempotency key, payment boundary, warehouse/stock boundary, event contract, sensitive-data policy, rollback, and coexistence plan.

## Preserved Intent Summary

`orders-microservice` is the canonical order processing and lifecycle service. It stores orders, order items, shipment records, order status, and order events for all sales channels. FlipFlop and marketplace services are clients of Orders, not duplicate order sources of truth. Catalog remains product truth, Warehouse remains stock truth, Payments remains payment identity/reconciliation truth, and Auth remains identity/RBAC truth.

## Current Evidence

- Added the order idempotency contract document and wired the create-order contract to the full key: contractVersion + channel + channelAccountId + externalOrderId.
- Added runtime deterministic duplicate lookup before create-order insertion.
- Exact same-key replay now returns the existing canonical order and does not insert duplicate order or item rows.
- Same-key different-payload replay now rejects with HTTP 409 before inserts, event publishing, or side effects.
- Added scripts/verify-idempotency-contract.js, scripts/verify-duplicate-order-protection.js, and scripts/verify-channel-adapter-idempotency.js.
- Updated package.json with verify:channel-adapter-idempotency for the cross-repo H3.5 check. npm test remains the Orders-local build and contract suite.
- Updated docs/orchestrator/GOALS.md and docs/orchestrator/ORDERS_HUB_ROADMAP.md to mark Goal H3 through H3.6 complete.
- Added `migrations/000_create_order_core_tables.sql`, a guarded production base schema migration for `orders`, `order_items`, and `shipments`.
- Added `migrations/002_order_idempotency_unique_index.sql`, a guarded uniqueness migration for `(channel, COALESCE(channelAccountId, ''), externalOrderId)` when `public.orders` exists. The current API contract version is validated by Orders but not persisted, so the database guard covers the persisted key dimensions.
- Added `scripts/verify-live-idempotency-index.sh` for repeatable live database index and concurrent duplicate-key verification.
- Added `docs/orchestrator/ORDER_EVENT_CONTRACTS.md`, `docs/orchestrator/event-fixtures/*`, `src/orders/order-event-contracts.ts`, and `scripts/verify-event-contracts.js` for versioned lifecycle event contracts.
- Updated `OrderEventsService` to publish versioned routing keys and message headers, sanitize approval metadata, emit `orders.order.cancelled.v1` for approved cancellation, and omit tracking numbers from shipped events.
- Added `docs/orchestrator/WAREHOUSE_HANDOFF_CONTRACT.md`, `src/warehouse/warehouse-reservation.client.ts`, `migrations/004_add_order_warehouse_handoff.sql`, and `scripts/verify-warehouse-handoff-contract.js` for H5.
- Added `docs/orchestrator/PAYMENT_STATUS_BOUNDARY.md`, `src/payments/payment-status.dto.ts`, `migrations/005_add_order_payment_status_boundary.sql`, and `scripts/verify-payment-boundary.js` for H6.
- Added protected H7 admin operations endpoints `GET /api/admin/operations/overview` and `GET /api/admin/operations/idempotency`.
- Extended the admin UI with read-only integration health, lifecycle operating metrics, and idempotency diagnostic panels.
- Added protected H7 action endpoints `GET /api/admin/operations/actions` and `POST /api/admin/operations/actions/order-status`.
- Added `ADMIN_READ_ROLES` and `ADMIN_ACTION_ROLES`; default `internal:orders-microservice:admin` remains read-only while `global:superadmin` and `internal:orders-microservice:action-admin` can run approved action workflows.
- Added an approved action UI panel that requires human approval metadata and cancellation side-effect acknowledgements before calling the bounded action endpoint.
- Added `scripts/verify-admin-operations-console.js` and wired `npm test` to run `npm run verify:admin-operations-console`.
- Added `docs/orchestrator/CANDIDATE_APPLICATION_INTEGRATION_DECISIONS.md` for H8. It records excluded-for-now decisions for SpeakASAP, School Committee, Rentabox, and Marathon, plus future owner-approved contract gates.
- Applied the live `orders.warehouseHandoff` `jsonb` migration and verified the column exists. The H6 payment status migration is not applied yet.
- DocsRAG live query was not run because no session JWT_TOKEN was available; repository source-of-truth docs and the current create-order/idempotency contracts were sufficient for this bounded Orders-local runtime chunk.

## Next Action

Continue with an owner-selected deployment/migration step or a future approved candidate contract goal.

## Verification State

Goal 4 chunks 4.3-4.6 / Goal H3 verification completed.

Commands run: npm run verify:duplicate-order-protection; npm run verify:channel-adapter-idempotency; npm run verify:event-contracts; npm run verify:warehouse-handoff; npm run verify:payment-boundary; npm test; channel shared builds where dependencies were installed; FlipFlop order-service build; guarded base schema and idempotency migrations against `orders` database; table/index-state confirmation; scripts/verify-live-idempotency-index.sh; git diff --check; missing-marker scan.

Verification results:

- `npm run verify:payment-boundary`: pass; bounded status mapping, forbidden Payments-owned fields, paid event idempotency, paid-reference replacement rejection, paid downgrade rejection, and cancelled-order paid rejection passed.
- `npm run verify:admin-operations-console`: pass; read-only integration health, idempotency diagnostics, protected route declarations and role metadata, read-only/action-capable mode policy, approved order status workflow delegation, UI panels, and sensitive response exclusions passed.
- Local Playwright render smoke against the admin HTML: pass; Integration health, Idempotency diagnostics, and Approved actions panels rendered; the action button starts disabled with `Read-only mode`; no visible error banner was present.
- H8 documentation verification: pass; candidate decisions recorded, no application approved without owner approval, no runtime integration goals created, future contract gates documented.
- H6 guarded migration apply: not run in this chunk; `migrations/005_add_order_payment_status_boundary.sql` must be applied before production use.

- npm run verify:duplicate-order-protection: pass; duplicate order protection verification ok.
- npm run verify:channel-adapter-idempotency: pass; channel adapter idempotency verification ok.
- npm run verify:event-contracts: pass; fixture, builder, publisher route/header, and sensitive-field checks passed.
- npm run verify:warehouse-handoff: pass; disabled, reserve, skip, failure, release, fulfill, cancel, expire, and return handoff checks passed.
- npm run verify:payment-boundary: pass; bounded payment status, paid confirmation, warehouse fulfill, failed release, refund rejection, and provider-field rejection checks passed.
- npm test: pass; build completed, status transition verification ok, sensitive logging verification ok, create order contract verification ok, idempotency contract verification ok, duplicate order protection verification ok, event contract verification ok, warehouse handoff verification ok, payment boundary verification ok, and admin operations console verification ok.
- Channel compile checks: flipflop-service/shared, allegro-service/shared, aukro-service/shared, bazos-service/shared, heureka-service/shared, and flipflop-service/services/order-service builds passed. Aukro and Heureka dependencies were restored with npm ci before their shared builds.
- Guarded base schema migration apply: pass; `orders`, `order_items`, and `shipments` were created in the live `orders` database.
- Guarded idempotency migration apply: pass; `ux_orders_create_idempotency` is materialized on `orders`.
- Live database concurrency check: pass; two concurrent inserts with the same channel/account/external ID produced one success, one duplicate-key failure, one surviving row, and cleanup deleted the test row.
- git diff --check: pass.
- Missing-marker scan: pass; no missing or unknown markers found in IPS documentation scope.

Application deployment completed for the affected channel services. Bazos and FlipFlop deploy scripts rebuilt and rolled out their images. Allegro was rebuilt with the service Dockerfile after fixing Prisma generation to run with OpenSSL in the builder stage and wiring ENCRYPTION_KEY and JWT_SECRET as Kubernetes secret references. Aukro and Heureka were manually rebuilt with their root Dockerfiles and rolled out after the standard deploy scripts were found to apply manifests without rebuilding images.
