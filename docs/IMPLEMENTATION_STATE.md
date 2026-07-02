# Orders Implementation State

```yaml
id: ORDERS-IMPLEMENTATION-STATE
status: ready
owner: Orders owner
created: 2026-06-12
last_updated: 2026-07-03
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
current_goal: Goal 7 Production Order Integration Rollout
current_chunk: Marketplace order cabinet polling rollout deployed after k3s recovery
next_recommended_goal: Define delivery-provider shipment-status source after Warehouse handoff
last_completed_goal: Orders event outbox source reliability lane
blockers:
  - DocsRAG session JWT unavailable for live RAG query
  - [MISSING: Cliplot owner-approved live Orders create/idempotency/Warehouse reservation smoke]
  - [MISSING: channel lead attribution source mapping]
  - [MISSING: Delivery provider or shipment-status source contract after Warehouse handoff]
  - [MISSING: owner-approved FlipFlop auth-subject create/read smoke proving persisted customer.authSubject]
  - [MISSING: Cliplot hosted Auth callback/session contract before authenticated checkout can pass Auth subject]
  - non-marketplace app contracts require owner approval before runtime integration
```

## Current Checkpoint

2026-07-03: Notifications Orders events consumer is enabled and live for approved recipient `ssfskype@gmail.com`. Notifications image `866a49f` is deployed, `orders.lifecycle` channel policy was seeded by migration, `/health/orders-events` reports enabled/connected/consuming true, and synthetic event `codex-orders-lifecycle-smoke-1783034533137` produced counters `received=1 sent=1 failed=0` plus a sent notification row. Remaining cross-system blocker is delivery-provider shipment-status source after Warehouse handoff.

2026-07-03: Marketplace order cabinet polling rollout completed after k3s recovery. FlipFlop `3b99ed4`, Bazos `2d47d16`, Aukro `f0847cf`, Heureka `824465e`, and Allegro `c9ba31f` are built, pushed, deployed, and live with bounded visible-tab polling/background refresh for the audited order cabinet or order dashboard surfaces. Kubernetes verification showed FlipFlop, Bazos, Aukro, Heureka service/gateway, and Allegro service/api-gateway/settings/imports/frontend deployments ready `1/1`; public checks returned HTTP 200 for FlipFlop and Allegro. Current remaining gaps are Notifications recipient/consumer enablement, delivery-provider shipment-status source, and product confirmation for any separate Allegro buyer-facing cabinet beyond the existing dashboard.
2026-07-02: Approved Orders outbox migration was applied live and Orders source validation passed (`npm run build`, `npm run verify:event-contracts`, `npm run verify:order-fulfillment-handoff`, `git diff --check`). The deploy wave built/pushed `localhost:5000/orders-microservice:4d9c917`; rollout exposed a local-registry pull-policy issue, so commit `bf74d38` changed the deployment source to `imagePullPolicy: IfNotPresent` and the live deployment template was patched to the immutable image with that policy. The Alfares k3s control-plane then became the active blocker: the deployment is correctly set to `replicas=1` on image `4d9c917`, but the replacement pod remains Pending with no pod IP, service endpoints are empty, and external Orders health returns HTTP 503 `no available server`. k3s logs show repeated `database is locked`, `Slow SQL`, EndpointSlice update timeouts, and node lease update timeouts. Non-interactive restart is unavailable to the current SSH user because `sudo -n systemctl restart k3s` requires a password and plain `systemctl restart k3s` requires interactive authentication. Warehouse WH-G16 deploy, paid-order smoke, and Notifications consumer enablement are paused until the platform/control-plane recovers and Orders `/health` plus `/health/order-events` pass.

2026-07-02: Orders/Warehouse migration-gate preflight completed after the safe runtime wave. Orders source validation passed with build, event-contract, lifecycle read-model, fulfillment-handoff, and reservation-gate verifiers; live `/health/order-events` still returns HTTP 404 and read-only schema inspection found no `order_event_outbox` table. Warehouse commit `4d0fa85` hardens the build to a full non-incremental TypeScript emit so migration jobs include required TypeORM entity files; validation passed with build, data-source require check, focused fulfillment-orders spec, and diff hygiene. Live Warehouse read-only schema inspection found no `fulfillment_orders` / `fulfillment_order_lines` tables and migration history contains only the first three migrations, so `CreateFulfillmentOrders1781500000000` remains pending. No Orders or Warehouse deployment/migration, live stock/order mutation, secret value print, customer/order row dump, or notification send was run.

2026-07-02: Safe runtime deployment wave completed for non-migration services. Bazos is live on `localhost:5000/bazos-service:cdcd739`; FlipFlop was deployed from a detached clean `origin/main` worktree at `216264b` and rolled out service/frontend/product/cart/order/user images; Notifications is live on `localhost:5000/notifications-microservice:583da28` after hardening its deploy script to use immutable image tags. Heureka, Allegro, and Aukro were confirmed ready `1/1` on lifecycle commit-tag images `976a1a8`, `6c64a30`, and `ba61422`. Public root checks returned HTTP 200 for Bazos, FlipFlop, Heureka, Allegro, and Aukro; FlipFlop `/api/products?limit=1` returned HTTP 200; Notifications `/health/orders-events` returned HTTP 200 with the consumer disabled, disconnected, not consuming, and counters at zero. No Orders or Warehouse deployment/migration, production DB/customer/order row read, secret value print, raw Warehouse response dump, or live notification send was run. Remaining gates are owner-approved Orders event outbox migration/deploy, Warehouse WH-G16 migration/deploy, Notifications recipient/enablement flip, and live end-to-end paid order smoke.

2026-07-02: Orders event outbox source lane is implemented and validated. Added `order_event_outbox` entity, guarded SQL migration, publisher bookkeeping so versioned Orders events are recorded as pending before RabbitMQ publish and marked published or failed after the publish attempt, a retry loop for pending/failed order events, and `GET /health/order-events` bounded readiness metadata. `pricing.events` remains outside the Orders outbox. Validation passed: `git diff --check`, `npm run build`, `npm run verify:event-contracts`, and full `npm test`. No deployment, production DB migration, secret read, DB/customer/order row read, or live event publish has been run.

2026-07-02: Runtime gate recheck found Orders and Payments no longer scaled to zero. `orders-microservice`, `payments-microservice`, `warehouse-microservice`, and `catalog-microservice` deployments are `1/1`, rolled out, and external health checks for Orders/Payments/Warehouse/Catalog return HTTP 200. Warehouse WH-G16 remains not deployed: `GET /api/fulfillment-orders/order/<synthetic>` returns HTTP 404. Notifications source branch `codex/notifications-orders-lifecycle-event` now validates and routes `orders.order.lifecycle_changed.v1` to the bounded Orders lifecycle notification path; live consumer runtime remains blocked by `[MISSING: Notifications-owned RabbitMQ consumer module or approved transport dependency]`, `[MISSING: Notifications runtime RABBITMQ_URL or broker secret source]`, queue/DLQ ownership, recipient policy, and deployment approval. No deployment, migration, secret read, DB/customer/order row read, or notification send was performed in this recheck.

2026-07-02: Product-scoped lifecycle/payment/delivery aggregate statistics for Catalog are implemented and validated in Orders source. `GET /api/orders/statistics/products/:productId` now returns `lifecycleStatistics` and `orderDeliveryStatistics` with product-scoped lifecycle, payment, delivery, exception, and per-channel lifecycle counts derived from canonical Orders state, without exposing PII, addresses, payment-provider fields, Warehouse reservation bodies, or item-level Warehouse IDs. Validation passed: `git diff --check`, `npm run build`, `npm run verify:product-sales-statistics`, and full `npm test` in Orders; Catalog consumer revalidation passed with `npm test -- --runInBand src/products/products.service.spec.ts`, `npm run build`, and `cd services/frontend && npm run build`. No deployment or production DB mutation was run. Runtime remains gated by the owner-approved Warehouse WH-G16 deployment and live Catalog product-statistics smoke while Orders/Payments remain healthy.

2026-07-02: O0 cross-repo validation and deployment-readiness sweep completed after sub-agent integration. Repositories are clean and pushed except `notifications-microservice`, which is ahead by one unrelated invoices actor commit. Orders source validation passed with `npm run verify:order-lifecycle-read-model`, `npm run verify:warehouse-handoff`, `npm run verify:order-fulfillment-handoff`, `npm run verify:payment-boundary`, `npm run verify:order-reservation-gate`, and full `npm test`. Warehouse WH-G16 focused test and build passed. Payments bridge spec and build passed. FlipFlop Orders hub verifier, shared/order-service/frontend builds, and non-mutating `npm run verify:guest-checkout-ui` passed after the transient `/cart` 503 cleared. Heureka, Allegro, Aukro, Bazos, Catalog, and Notifications focused validations/builds passed except Aukro synthetic smoke is blocked by `[MISSING: ORDER_SYNTHETIC_SMOKE_TOKEN]`. Earlier runtime gate at that sweep: `https://orders.alfares.cz/health` and `https://payments.alfares.cz/health` returned HTTP 503 because both deployments were scaled to 0; that finding is superseded by the 2026-07-02 runtime recheck above. Live Warehouse still does not expose `/api/fulfillment-orders` because WH-G16 is not deployed. Next action is owner-approved Warehouse WH-G16 migration/deploy.

2026-07-02: AU1 Aukro lifecycle/detail read boundary was added to the O1 contract. Orders now allows `internal:aukro-service:service` through `ORDER_ADMIN_LIFECYCLE_READ_ROLES` and `ORDER_DETAIL_READ_ROLES` for `GET /api/orders/admin/lifecycle` and `GET /api/orders/:id`; the customer lifecycle endpoint remains human-auth scoped. Validation passed: `npm run build`, `npm run verify:order-lifecycle-read-model`, `npm run verify:invoices-read-boundary`, `git diff --check`, and full `npm test`. No deploy or push was run.

2026-07-02: O1 Orders core lifecycle and contracts is implemented and validated in source. Orders now derives the authoritative UX lifecycle stage from existing canonical order status, payment status, item fulfillment status, and Warehouse handoff metadata while preserving the legacy coarse `status` field. Added protected `GET /api/orders/customer/lifecycle` and `GET /api/orders/admin/lifecycle` read models, additive `orders.order.lifecycle_changed.v1` event contract/fixture/publisher, lifecycle transition validation helper, and `scripts/verify-order-lifecycle-read-model.js`. W1 update was wired inside Orders: after first paid transition, Orders keeps the existing reservation `fulfill` calls, reads fulfilled reservations through `GET /api/reservations/order/:orderId`, and posts the approved `POST /api/fulfillment-orders` dispatch handoff with order, delivery, contact, and item reservation payload. Added `src/orders/order-fulfillment-handoff.client.ts` plus `scripts/verify-order-fulfillment-handoff.js`. Validation passed: `npm run build`, `npm run verify:order-lifecycle-read-model`, `npm run verify:order-fulfillment-handoff`, `npm run verify:event-contracts`, `npm run verify:payment-boundary`, `npm run verify:order-reservation-gate`, `git diff --check`, and full `npm test`. No deploy, push, production DB mutation, token value, customer payload dump, raw Warehouse response body, or non-Orders repo edit was used. Remaining blockers: `[MISSING: Delivery provider or shipment-status source contract after Warehouse handoff]`, `[MISSING: FlipFlop runtime smoke proving authenticated central order snapshots carry customer.authSubject]`, `[MISSING: Cliplot hosted Auth callback/session contract before authenticated checkout can pass Auth subject]`, `[MISSING: channel lead attribution source mapping]`.

2026-07-02: Added source support for `invoices-microservice` to read full
order snapshots through the existing internal service-token boundary. Orders
recognizes `invoices-microservice` as `internal:invoices-microservice:service`
when the runtime token is projected, and `GET /api/orders/:id` now has an
explicit `ORDER_DETAIL_READ_ROLES` list including that role. Orders event
payloads remain trigger-only; no customer, billing, address, payment provider,
or raw payment fields were added to RabbitMQ events. Runtime remains blocked
until Vault projects `secret/prod/invoices-microservice#ORDERS_SERVICE_TOKEN`
into both Orders and Invoices. Validation passed: `npm run
verify:invoices-read-boundary`, `npm run build`, `git diff --check`, and
client-side Kubernetes dry-run for `k8s/external-secret.yaml`. Deployment was
not run.

2026-07-01: Cliplot no-mutation order create validation is implemented,
validated, deployed, and smoke-tested. Orders now exposes protected
`POST /api/orders/validate-create` with the same create-order roles as live
`POST /api/orders`; it normalizes `orders.create.v1`, checks idempotency state,
and returns bounded validation metadata without opening a write transaction,
saving order/item rows, attempting Warehouse reservation, or publishing
`orders.order.created.v1`. Validation passed: `git diff --check`,
`npm run build`, `npm run verify:create-order-contract`, and `npm test`.
Commit `0611e4c` deployed as
`localhost:5000/orders-microservice:0611e4c`; rollout and health passed.
Runtime smoke from the Cliplot pod returned HTTP `201`, `valid=true`,
`mutation=false`, `orderCreated=false`, `warehouseMutation=false`,
`eventPublished=false`, `channel=cliplot`, and
`idempotencyStatus=available`. No secrets, token values, customer payloads,
production rows, DB rows, live order creation, Warehouse mutation, or order
events were printed or created. Cliplot live order creation remains blocked on
approved Warehouse reservation evidence.

2026-07-01: Minimal Cliplot order contract support is implemented and validated in source. Orders now accepts create channel `cliplot`, includes `cliplot` in sellable-channel Warehouse reservation and product-sales channel filters, accepts `cliplot-service` as an internal create-order caller, and maps the Orders-side `CLIPLOT_ORDERS_SERVICE_TOKEN` alias from `secret/prod/cliplot#ORDERS_SERVICE_TOKEN` with guard fallback support for `CLIPLOT_SERVICE_TOKEN`. Validation passed: `git diff --check`, `npm run build`, `npm run verify:create-order-contract`, and `npm test`. No secret values, decoded JWTs, customer payloads, production order rows, DB rows, payment provider code, destructive DB changes, non-Orders repo edits, or deployment were used. Cliplot runtime remains blocked until Vault sync and an owner-approved create/idempotency/Warehouse reservation smoke exist.

2026-07-01: Goal 7.4A Orders lead-attribution event contract for Leads is implemented and validated. Orders `orders.create.v1` accepts optional `leadAttribution` with bounded `leadId`, `source`, and `campaignId` fields; `orders.order.created.v1` publishes `payload.leadAttribution` only when supplied and otherwise preserves the existing `{ orderId, channel }` payload core. The created-event fixture, event contract verifier, create-order verifier, `ORDER_EVENT_CONTRACTS.md`, `CHANNEL_ORDER_CREATE_CONTRACT.md`, `CONTEXT_PACKAGE.md`, and `EXECUTION_PLAN.md` were updated. Validation passed: `git diff --check`, `npm run build`, `npm run verify:create-order-contract`, `npm run verify:event-contracts`, `npm test`, missing-marker scan, and added-line sensitive literal scan. Owner approved continuation after source review, and `./scripts/deploy.sh` deployed commit `5e97a1d` as `localhost:5000/orders-microservice:5e97a1d` with digest `sha256:77a7f4606a5c9ba42981c31f04761b124393d5a49dec4288af8b5a6d38bbb62d`; rollout completed, in-pod health returned `status=healthy`, external health returned `status=healthy`, and post-deploy deployment status was replicas `1`, updated `1`, ready `1`, available `1`. No non-Orders repos, live consumers, DB data, secrets, decoded JWTs, customer payloads, production order rows, DB rows, or payment data were used. Automatic attribution remains blocked until channel callers provide an approved explicit source: `[MISSING: channel lead attribution source mapping]`.

2026-07-01: Goal 7.2 channel caller header/warehouseId wiring and sanitized smokes are integrated at the Orders coordinator level. Remote status checks found Orders clean on `main`, deployed `localhost:5000/orders-microservice:43f9774`, and all relevant deployments ready `1/1`. Channel evidence: FlipFlop `reports/validation/orders-readiness-smoke/report-latest.json` passed with live smoke, auth accepted, HTTP 201, `orders.create.v1`, central order ID present, and Warehouse reservation status present; Allegro commit `ac56dc4` records successful Warehouse UUID smoke after `ec6f97a` forwarded a Warehouse-owned UUID; Aukro commits `4e11cdb`, `df8d16e`, and `12f445e` record runtime token mapping, live Orders smoke, and cleanup; Bazos commit `c028495` records owner-approved create/replay/cancel Warehouse reservation smoke with true live provider ingestion still `[UNKNOWN: live Bazos marketplace webhook support]`; Heureka commit `ac26098` records final sanitized Orders/Warehouse smoke pass with reservation status `reserved`. Heureka's current dirty worktree was classified read-only as separate dashboard/feed/admin work (`TASK-009`, feed mutation guard, dashboard module, JWT user context, Dockerfile/README/report updates), so it was not edited or used as an Orders credential-gate blocker. No token values, decoded JWTs, customer payloads, production order rows, DB rows, or payment data were printed.

2026-07-01: Goal 7.2B Allegro create/idempotency/Warehouse reservation smoke is complete after Orders Warehouse service JWT rotation and token-header trimming. Created Auth service principals for `orders-microservice` Warehouse handoff and temporary smoke cleanup without printing token values; stored only `WAREHOUSE_SERVICE_TOKEN` in Vault `secret/prod/orders-microservice` and forced ESO sync. Fixed `WarehouseReservationClient` to trim the runtime token before Axios header construction, because the synced value was Auth-valid and Warehouse-authorized but Axios rejected the untrimmed header as `Invalid character in header content ["Authorization"]`. Validation passed: `git diff --check`, `npm run build`, `npm run verify:warehouse-handoff`, `npm run verify:order-reservation-gate`, and `npm test`. Deployed commit `43f9774` as `localhost:5000/orders-microservice:43f9774`; rollout and in-pod health passed. Post-deploy Axios reserve/cancel from Orders pod succeeded. Owner-approved Allegro smoke created synthetic order `6898c3fa-e3e8-4eed-a723-11b58fc2ea3b`, exact replay returned the same order, Warehouse handoff was `reserved` with `reservedCount=1`, cleanup cancellation returned status `cancelled` and Warehouse handoff `cancelled`, and Warehouse readback showed `active=0`, `cancelled=1`. No raw token values, decoded JWTs, customer payloads, production order rows, or payment data were printed.

2026-07-01: Goal 7.2 Orders-side runtime credential and deploy gate is implemented, validated, and deployed. Preflight confirmed remote source was clean on `main` at `d1c5a48` and that Kubernetes still ran `localhost:5000/orders-microservice:dba03dc`, so the 7.1 allowlist was present in source but not deployed. Orders ExternalSecret now maps `FLIPFLOP_INTERNAL_SERVICE_TOKEN` from `secret/prod/flipflop-service#ORDERS_SERVICE_TOKEN`, and maps `ALLEGRO_INTERNAL_SERVICE_TOKEN`, `AUKRO_INTERNAL_SERVICE_TOKEN`, `BAZOS_INTERNAL_SERVICE_TOKEN`, and existing `HEUREKA_INTERNAL_SERVICE_TOKEN` from the respective channel service `JWT_TOKEN` properties. Channel ExternalSecrets were checked by status/key name only and all relevant source keys were `SecretSynced=True`; no token values were printed or created. Validation passed: `git diff --check`, `npm run build`, `npm run verify:create-order-contract`, `npm test`, Kubernetes server dry-run for `k8s/external-secret.yaml`, sensitive literal scan, and missing-marker scan with documented blockers. Deployed commit `342f003` as image `localhost:5000/orders-microservice:342f003`; rollout completed, external `/health` returned `status=healthy`, and runtime env-name presence confirmed all five channel aliases. No channel repositories, Vault values, DB rows, customer data, or production order rows were changed or printed. The remote branch is ahead of origin with the local runtime credential commit; push was not run because deployment did not require it. Next: channel repositories must wire/verify `x-internal-service-token` plus `x-service-name`, forward Warehouse `warehouseId`, and run sanitized create/idempotency/reservation smokes.

2026-06-30: Goal 7.1 production order integration rollout planning is implemented and validated in source/docs. Orders create role and machine-auth allowlists now include FlipFlop, Allegro, Aukro, Bazos, and Heureka service actors, but runtime secret wiring for newly added channel tokens is not changed in this chunk. `docs/orchestrator/PRODUCTION_ORDER_INTEGRATION_PLAN.md` records the cross-app decisions and parallel workstreams. Read-only subagent audits found FlipFlop and Heureka closest to production create readiness; Allegro, Aukro, and Bazos still need accepted Orders auth headers plus Warehouse `warehouseId` forwarding; Leads, Marketing, and Notifications do not yet consume `orders.events`; Marathon, SpeakASAP, School Committee, and Rentabox remain domain-local pending owner-approved contracts. Validation passed: `git diff --check`, `npm run build`, `npm run verify:create-order-contract`, and `npm test`. Sensitive literal scan returned no matches. Missing-marker scan shows documented blockers including `[MISSING: DocsRAG session JWT]` plus pre-existing IPS handoff debt.

2026-06-29: Sellable-channel Warehouse reservation fail-closed gate is implemented and validated. Orders create now requires `warehouseHandoff.status=reserved` for FlipFlop, Allegro, Aukro, Bazos, and Heureka before the create transaction commits or `orders.order.created.v1` publishes. `disabled`, `skipped`, and `failed` handoff results reject with bounded metadata, preserving Warehouse as stock authority and avoiding local stock truth. Validation passed: `git diff --check`, `npm run build && npm run verify:order-reservation-gate && npm run verify:warehouse-handoff`, and `npm test`. Deployment passed on 2026-06-29 as image `localhost:5000/orders-microservice:dba03dc`; in-pod `/health` returned `status=healthy`.

2026-06-27: Auth-owned Catalog service token source is live for Orders. `CATALOG_INTERNAL_SERVICE_TOKEN` is sourced from `secret/prod/auth-microservice#CATALOG_INTERNAL_SERVICE_TOKEN`, not Bazos-owned credentials; ExternalSecret is `SecretSynced=True`; Orders pod `orders-microservice-757696f875-8gprf` rolled out; sanitized Catalog bridge smoke via Catalog pod `catalog-microservice-77b79bd855-5xj9t` returned sales HTTP 200, `success=true`, `sourceStatus=available`, five channel rows, zero recent-history rows, and no customer/payment/address/provider markers. Source validation passed: `git diff --check`, `npm run verify:product-sales-statistics`, and `npm run build`.

2026-06-26: Catalog Goal 17 Workstream A is implemented and validated. Orders added a protected product sales statistics read model for Catalog at `GET /api/orders/statistics/products/:productId` without moving product truth, payment truth, stock truth, or Auth ownership into Orders. The endpoint aggregates `order_items` joined to `orders` by canonical `order_items.productId`, defaults to non-cancelled sales lifecycle statuses, uses `grossItemRevenue` wording instead of paid/settled revenue, and groups mixed-currency data instead of flattening it. Validation passed: `git diff --check`, `npm run build`, `npm run verify:product-sales-statistics`, and `npm test`. Deployment was not run or approved in this workstream. Follow-up evidence: Catalog-owned consumer smoke later passed after deployment approval, and the final Catalog service role contract is confirmed by Auth-owned Vault source `secret/prod/auth-microservice#CATALOG_INTERNAL_SERVICE_TOKEN` plus `internal:catalog-microservice:service`.

2026-06-13 parallel planning refactor completed in the IPS operating docs. Future planning must maximize safe parallel agent execution by splitting work into independent goal lanes, recording blockers and dependencies, assigning non-overlapping file ownership, and listing all parallel-ready next tasks for separate Codex sessions. Coordinator-owned shared docs and integration gates remain sequential. Current startable packets: P1 Auth-owned admin login contract/role policy documentation, P2 pricing suggestion safety review, and P4 normal traffic monitoring evidence. P3 candidate application contract work remains blocked until owner approval names a concrete integration.

2026-06-13 post-deploy monitoring and deploy-timeout hardening is complete. Live Orders health is passing, the Kubernetes deployment has one ready replica with zero pod restarts, and the recent application log stream includes a safe successful `order.create` audit entry. `scripts/deploy.sh` now passes an Orders-scoped `ORDERS_ROLLOUT_TIMEOUT` value, defaulting to `300s`, to the shared rollout helper so slow init-container replacement has a longer bounded wait window.

Goal 4 chunks 4.3-4.6 / Goal H3 are complete in runtime, adapter verification, and database hardening. Orders now looks up existing orders by `contractVersion + channel + channelAccountId + externalOrderId`, returns the existing order for exact replay, and rejects same-key different-payload creates with HTTP 409.

The documented idempotency key is `contractVersion + channel + channelAccountId + externalOrderId`. New clients must send `contractVersion=orders.create.v1`, a supported channel, a stable channel account/store/integration identity, and the upstream order or checkout ID. Safe retries must return the existing canonical order without inserting duplicate `orders` or `order_items` rows, without re-emitting `order.created`, and without rerunning warehouse/payment/notification/CRM side effects. Mismatched duplicates must become bounded `409 ORDER_IDEMPOTENCY_CONFLICT` responses without raw customer/address/payment payloads.

Goal 4 chunks 4.1-4.6 / Goal H3 are complete. Goal H4 is complete for versioned order lifecycle event contracts. `POST /api/orders` has a documented channel-ingestion contract, runtime normalizer for `orders.create.v1`, item-row persistence in the same transaction, documented idempotency expectations, production base table migrations, and a materialized database uniqueness guard for simultaneous duplicate creates.

Goal H1 chunks H1.1-H1.6 remain complete and deployed. The public Orders Hub landing page, admin shell, explicit admin JSON roles, roadmap, deployment, and live route checks are recorded in `docs/orchestrator/STATUS.md` and `docs/orchestrator/ORDERS_HUB_ROADMAP.md`.


Goal H3 chunks H3.5-H3.6 are complete. FlipFlop, Allegro, Aukro, Bazos, and Heureka shared order clients now send contractVersion=orders.create.v1, normalize a stable channelAccountId fallback, preserve the same payload for retry, and surface ORDER_IDEMPOTENCY_CONFLICT as HTTP 409 instead of flattening it to a generic 400. FlipFlop checkout forwarding now sends a stable account scope through ORDERS_CHANNEL_ACCOUNT_ID with fallback flipflop-storefront.

Goal H6 is complete. Orders now exposes a protected `orders.payment-status.v1` callback boundary at `PUT /api/orders/:id/payment-status` for Auth-authorized Orders admins or the Payments service role. Orders stores only bounded payment references (`paymentReferenceId`, `paymentApplicationId`, `paymentMethod`, `paymentStatus`, `paymentUpdatedAt`), maps Payments `completed` to Orders `paid`, emits `orders.order.paid.v1` once, and only advances `pending -> confirmed` on first paid status. Raw provider webhooks, provider transaction identifiers, variable symbols, provider response bodies, metadata, amounts, currency, customer payment payloads, card data, tokens, secrets, refunds, and reconciliation stay in `payments-microservice`.

H6 live schema is materialized. `migrations/005_add_order_payment_status_boundary.sql` was replayed against the live `orders` database on 2026-06-13 and verified `paymentReferenceId`, `paymentApplicationId`, and `paymentUpdatedAt` on `public.orders`.

Goal H4 is complete. Orders now defines `orders.order.created.v1`, `orders.order.updated.v1`, `orders.order.paid.v1`, `orders.order.shipped.v1`, and `orders.order.cancelled.v1`, publishes version metadata and RabbitMQ headers, and verifies fixtures/builders/publisher payloads against forbidden sensitive fields. Goal H5 is complete for reservation choreography and H5.5: Orders maps Warehouse lifecycle endpoints, has a config-gated Warehouse reservation client, stores audit-safe `warehouseHandoff` metadata, fulfills reservations on paid payment status, releases reservations on failed/cancelled payment status, cancels reservations after approved order cancellation, and verifies return remains outside normal Orders status updates. Goal H6 is complete for bounded Payments-owned status updates without taking over payment identity, provider webhooks, reconciliation, transactions, or refunds. On 2026-06-13, the Warehouse reservation client was hardened to send the configured runtime Warehouse service bearer token on reserve, release, fulfill, cancel, expire, and return handoff calls.

Goal 3 remains complete. Sensitive logging regression checks are wired into `npm test` and continue to pass. Goal 2 remains complete; owner-approved cancellation gates and state-transition validation remain in force.

Goal H7 is complete. The protected admin console now exposes read-only integration health for Auth, Warehouse, Payments, Catalog, Notifications, Leads, and Marketing; idempotency diagnostics for `orders.create.v1` channel/external order keys; safe order detail timeline/lifecycle log panels; role-scoped read-only versus action-capable modes; and a human-approved order status action workflow that delegates to the existing Orders state-machine and cancellation approval gates.

Goal H8 is complete. SpeakASAP, School Committee, Rentabox, and Marathon were reviewed from repository source-of-truth docs and targeted lifecycle evidence. No candidate is approved to feed Orders in this pass. All reviewed candidates keep domain-local lifecycle ownership unless a future owner-approved contract goal explicitly defines the Orders create contract, idempotency key, payment boundary, warehouse/stock boundary, event contract, sensitive-data policy, rollback, and coexistence plan.

The owner-approved H7/H8 runtime deployment is complete. Commit `2f82535` was built as `localhost:5000/orders-microservice:2f82535`, pushed with `latest`, rolled out to Kubernetes namespace `statex-apps`, and passed the live `/health` check from the deployed pod. Commit `7591b98` was built and pushed for Warehouse handoff auth hardening as image digest sha256:7c50721a35a759a12637a8053e6ff7035003fc6e8607cdfbd66d34d2a8bf8e5b. After a delayed Kubernetes replacement-pod rollout, the fixed image is live. An owner-approved synthetic order reservation smoke passed with Warehouse reservation and cancellation handoff. The temporary Warehouse service token was then removed and reservation handoff was disabled again so production does not depend on an unmanaged expiring deployment token.

2026-06-13: Managed Orders-to-Warehouse reservation handoff credential wiring completed. Created a Vault-backed WAREHOUSE_SERVICE_TOKEN under secret/prod/orders-microservice without printing or committing token values, mapped it through k8s/external-secret.yaml, enabled WAREHOUSE_RESERVATION_ENABLED=true through k8s/configmap.yaml with the in-cluster Warehouse URL and 15 minute TTL, and changed scripts/deploy.sh to roll out the immutable commit image tag instead of mutable latest. Validation passed: Kubernetes server dry-run for ConfigMap/ExternalSecret, npm run verify:warehouse-handoff, npm test, and git diff --check. Runtime deployment and persistent production smoke are complete. Deployed commit 634d570 as localhost:5000/orders-microservice:634d570, verified ESO projected WAREHOUSE_SERVICE_TOKEN without printing values, and verified active runtime config shows WAREHOUSE_RESERVATION_ENABLED, WAREHOUSE_SERVICE_TOKEN, WAREHOUSE_SERVICE_URL, and JWT_SECRET present. Persistent smoke order 5c277990-acb6-411e-8895-89cd9826981e / external codex-reservation-persistent-1781373803 reserved one Warehouse reservation and cancellation returned warehouseHandoff status cancelled with reservedCount=1, failedCount=0.


2026-06-15: Goal 6.1/6.2 pricing suggestion safety hardening is implemented, validated, migrated, and deployed in production. Pricing routes now declare explicit `PRICING_ADMIN_ROLES`, approval/rejection receives the authenticated Auth actor from the request, `price_suggestion` stores bounded `approvedAt`, `approvedBy`, `rejectedAt`, and `rejectedBy` provenance, and `scripts/verify-pricing-safety.js` is wired into `npm test`. Added guarded migration `migrations/006_add_price_suggestion_approval_metadata.sql`. Validation passed: `npm run build`, `npm run verify:pricing-safety`, `npm test`, and `git diff --check`. Live migration applied `migrations/001_create_price_suggestion.sql` because the table was absent, then applied `migrations/006_add_price_suggestion_approval_metadata.sql`; post-check verified `approvedAt`, `approvedBy`, `rejectedAt`, and `rejectedBy`. Commit `2280b32` deployed as `localhost:5000/orders-microservice:2280b32`, rollout completed, and external `/health` returned HTTP 200.


2026-06-15: Goal 6.3/6.4 pricing consolidation and event/Catalog contract review is complete. Added `docs/orchestrator/PRICING_CONSOLIDATION_AND_EVENT_CONTRACT.md` and `scripts/verify-pricing-consolidation-contract.js`, wired the verifier into `npm test`, and marked Goal 6 complete. Confirmed FlipFlop gateway routes `/api/pricing/*` to Orders, FlipFlop product-service reads prices from Catalog product/pricing data, Catalog owns current-price reads and guarded pricing writes through `/api/pricing`, and Orders currently emits legacy `pricing.price_changed` payloads on `pricing.events`. No runtime pricing adapter, event routing, Catalog credential, FlipFlop source, payment, cart, checkout, or product truth behavior changed in this chunk. Owner-approvable follow-ups are G6-A Catalog Pricing Write Adapter, G6-B Pricing Event Versioning, and G6-C FlipFlop Local Pricing Publisher Decommission.


2026-06-15: Pricing rationale bound is validated and deployed. `PricingService` now normalizes AI rationale text, removes control characters/repeated whitespace, and caps persisted rationale to 280 characters. This preserves the existing approved pricing safety model without changing Catalog writes, payment boundaries, FlipFlop source, or the legacy `pricing.price_changed` event contract. Validation passed: `npm run build && npm run verify:pricing-safety`, `npm run verify:event-contracts`, `npm run verify:pricing-consolidation-contract`, and full `npm test`. Commit `b79e5d9` deployed as `localhost:5000/orders-microservice:b79e5d9`, rollout completed, and external `/health` returned HTTP 200 with status `healthy`.


2026-06-15: Post-deploy monitoring after pricing rationale deployment passed. Kubernetes deployment `orders-microservice` is `1/1` ready on image `localhost:5000/orders-microservice:b79e5d9`, active pod `orders-microservice-86c49fcd85-cs5hc` is running with zero restarts, external `https://orders.alfares.cz/health` returned HTTP 200 with body status `healthy`, and the redacted log sample showed pricing routes initialized plus the known startup `Failed to connect to RabbitMQ` line before `Nest application successfully started`. No secrets, tokens, customer data, payment data, or table rows were captured.

2026-06-15: Parallel P2/P4 handoffs are integrated. P2 pricing safety review is accepted and superseded by the deployed Goal 6 hardening/rationale-bound work. P4 monitoring evidence is accepted; startup RabbitMQ warning and missing explicit Warehouse reservation TTL are not release blockers, with RabbitMQ kept under normal monitoring and TTL recorded as low-priority Warehouse handoff config hygiene.

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
- Added `docs/orchestrator/WAREHOUSE_HANDOFF_CONTRACT.md`, `src/warehouse/warehouse-reservation.client.ts`, `migrations/004_add_order_warehouse_handoff.sql`, and `scripts/verify-warehouse-handoff-contract.js` for H5. The Warehouse client now attaches the configured runtime service bearer token to reservation lifecycle calls without logging or persisting the token value.
- Added `docs/orchestrator/PAYMENT_STATUS_BOUNDARY.md`, `src/payments/payment-status.dto.ts`, `migrations/005_add_order_payment_status_boundary.sql`, and `scripts/verify-payment-boundary.js` for H6.
- Added protected H7 admin operations endpoints `GET /api/admin/operations/overview` and `GET /api/admin/operations/idempotency`.
- Extended the admin UI with read-only integration health, lifecycle operating metrics, and idempotency diagnostic panels.
- Added protected H7 action endpoints `GET /api/admin/operations/actions` and `POST /api/admin/operations/actions/order-status`.
- Added `ADMIN_READ_ROLES` and `ADMIN_ACTION_ROLES`; default `internal:orders-microservice:admin` remains read-only while `global:superadmin` and `internal:orders-microservice:action-admin` can run approved action workflows.
- Added an approved action UI panel that requires human approval metadata and cancellation side-effect acknowledgements before calling the bounded action endpoint.
- Added `scripts/verify-admin-operations-console.js` and wired `npm test` to run `npm run verify:admin-operations-console`.
- Added `docs/orchestrator/CANDIDATE_APPLICATION_INTEGRATION_DECISIONS.md` for H8. It records excluded-for-now decisions for SpeakASAP, School Committee, Rentabox, and Marathon, plus future owner-approved contract gates.
- Applied the live `orders.warehouseHandoff` `jsonb` migration and verified the column exists.
- Applied/replayed the live H6 payment status boundary migration and verified `orders.paymentReferenceId`, `orders.paymentApplicationId`, and `orders.paymentUpdatedAt` exist with bounded varchar/timestamp types. The guarded replay emitted only expected existing-column notices.
- Deployed the owner-approved H7/H8 runtime release from commit `2f82535`; Kubernetes reported `deployment/orders-microservice` successfully rolled out with one ready updated replica and the live health endpoint returned `{"status":"healthy","service":"orders-microservice"}`.
- DocsRAG live query was not run because no session JWT_TOKEN was available; repository source-of-truth docs and the current create-order/idempotency contracts were sufficient for this bounded Orders-local runtime chunk.
- Implemented Goal 6.1/6.2 pricing suggestion safety hardening: explicit pricing admin roles, bounded approval/rejection actor provenance, guarded migration `006_add_price_suggestion_approval_metadata.sql`, and `scripts/verify-pricing-safety.js` wired into `npm test`.
- Added Goal 6.3/6.4 contract reconciliation in `docs/orchestrator/PRICING_CONSOLIDATION_AND_EVENT_CONTRACT.md` plus `scripts/verify-pricing-consolidation-contract.js` for FlipFlop pricing internals, current pricing event shape, Catalog pricing-write/read boundaries, and follow-up work packets.

## Next Action

G6-A Catalog Pricing Write Adapter is implemented in source. Runtime secret wiring maps `CATALOG_INTERNAL_SERVICE_TOKEN` from Auth-owned Vault source `secret/prod/auth-microservice#CATALOG_INTERNAL_SERVICE_TOKEN`; Bazos-owned credentials are not used for Catalog-to-Orders authentication. G6-B Pricing Event Versioning and G6-C FlipFlop Local Pricing Publisher Decommission remain dependency-gated. P3 candidate application contract work remains blocked until owner approval names a concrete integration. P4 RabbitMQ startup warning remains under normal monitoring; explicit Warehouse reservation TTL is low-priority config hygiene.

## Verification State

Goal 4 chunks 4.3-4.6 / Goal H3 verification completed.

Commands run: npm run verify:duplicate-order-protection; npm run verify:channel-adapter-idempotency; npm run verify:event-contracts; npm run verify:warehouse-handoff; npm run verify:payment-boundary; npm test; channel shared builds where dependencies were installed; FlipFlop order-service build; guarded base schema and idempotency migrations against `orders` database; table/index-state confirmation; scripts/verify-live-idempotency-index.sh; git diff --check; missing-marker scan.

Verification results:

- `npm run verify:payment-boundary`: pass; bounded status mapping, forbidden Payments-owned fields, paid event idempotency, paid-reference replacement rejection, paid downgrade rejection, and cancelled-order paid rejection passed.
- `npm run verify:admin-operations-console`: pass; read-only integration health, idempotency diagnostics, protected route declarations and role metadata, read-only/action-capable mode policy, approved order status workflow delegation, UI panels, and sensitive response exclusions passed.
- Local Playwright render smoke against the admin HTML: pass; Integration health, Idempotency diagnostics, and Approved actions panels rendered; the action button starts disabled with `Read-only mode`; no visible error banner was present.
- H8 documentation verification: pass; candidate decisions recorded, no application approved without owner approval, no runtime integration goals created, future contract gates documented.
- H6 guarded migration apply: pass; pre-check found `paymentReferenceId`, `paymentApplicationId`, and `paymentUpdatedAt` already present, guarded replay skipped the existing columns as expected, and post-check verified all three columns remained present on `public.orders`.

- npm run verify:duplicate-order-protection: pass; duplicate order protection verification ok.
- npm run verify:channel-adapter-idempotency: pass; channel adapter idempotency verification ok.
- npm run verify:event-contracts: pass; fixture, builder, publisher route/header, and sensitive-field checks passed.
- npm run verify:warehouse-handoff: pass; disabled, reserve, skip, failure, release, fulfill, cancel, expire, and return handoff checks passed.
- npm run verify:payment-boundary: pass; bounded payment status, paid confirmation, warehouse fulfill, failed release, refund rejection, and provider-field rejection checks passed.
- npm test: pass; build completed, status transition verification ok, sensitive logging verification ok, create order contract verification ok, idempotency contract verification ok, duplicate order protection verification ok, event contract verification ok, warehouse handoff verification ok, payment boundary verification ok, pricing safety verification ok, pricing consolidation contract verification ok, and admin operations console verification ok.
- Channel compile checks: flipflop-service/shared, allegro-service/shared, aukro-service/shared, bazos-service/shared, heureka-service/shared, and flipflop-service/services/order-service builds passed. Aukro and Heureka dependencies were restored with npm ci before their shared builds.
- Guarded base schema migration apply: pass; `orders`, `order_items`, and `shipments` were created in the live `orders` database.
- Guarded idempotency migration apply: pass; `ux_orders_create_idempotency` is materialized on `orders`.
- Live database concurrency check: pass; two concurrent inserts with the same channel/account/external ID produced one success, one duplicate-key failure, one surviving row, and cleanup deleted the test row.
- git diff --check: pass.
- Missing-marker scan: pass; no missing or unknown markers found in IPS documentation scope.

Application deployment completed for the affected channel services. Bazos and FlipFlop deploy scripts rebuilt and rolled out their images. Allegro was rebuilt with the service Dockerfile after fixing Prisma generation to run with OpenSSL in the builder stage and wiring ENCRYPTION_KEY and JWT_SECRET as Kubernetes secret references. Aukro and Heureka were manually rebuilt with their root Dockerfiles and rolled out after the standard deploy scripts were found to apply manifests without rebuilding images.

2026-07-02: Added source-level Orders support for stable Auth customer subject
snapshots required by invoices account matching. `orders.create.v1` now accepts
`customer.authSubject` plus matching aliases, validates the value as UUID, and
persists normalized `customer.authUserId`/`customer.subject` without adding
customer identity to Orders RabbitMQ events. Customer lifecycle reads prefer
Auth subject matching and retain email fallback for legacy rows. Validation
passed: `npm test`, `npm run verify:invoices-read-boundary`, and
`git diff --check`. No deploy, DB row read/write, migration, secret read, or
customer/order row dump was run.

2026-07-02 continuation: Runtime proof now confirms deployed Orders includes
the Auth-subject accepting contract: Kubernetes reports
`localhost:5000/orders-microservice:537a103`, `git merge-base --is-ancestor
c4f1332 537a103` exited `0`, and `npm run verify:invoices-read-boundary`
plus `npm run verify:create-order-contract` passed in `orders-microservice`.
FlipFlop authenticated checkout source now forwards the UUID-shaped local Auth
user id to central Orders as `customer.authSubject` before payment creation.
Remaining blockers are `[MISSING: owner-approved FlipFlop auth-subject
create/read smoke proving persisted customer.authSubject]` and `[MISSING:
Cliplot hosted Auth callback/session contract before authenticated checkout can
pass Auth subject]`.

2026-07-02 continuation: FlipFlop `flipflop-order-service` now has the
Auth-subject forwarding runtime marker live. The normal Dockerfile rebuild path
hit npm registry `ETIMEDOUT`, so the runtime update used a patch image based on
the current live `localhost:5000/flipflop-order-service:latest` and overlaid the
already built order-service/shared artifacts from commit `23b22e0`. Rollout
completed in `statex-apps`; live pod grep found the `authSubject:
this.isUuid(user?.id) ? user.id : undefined` payload builder in the runtime,
public FlipFlop `/` and `/api/products?limit=1` returned HTTP 200, and
`WRITE_AUTH_SUBJECT_SMOKE_REPORT=0 node scripts/smoke-orders-auth-subject.js`
failed closed with `mutation=false`, `providerCall=false`, ready deployment
preflight, and only approval/confirmation env blockers. No production order,
DB row read/write, payment provider call, secret value print, or consumer
enablement was run.

2026-07-03 continuation: k3s recovery was verified first, then the paid Orders-to-Warehouse core path was completed live. Orders commits `af0a4ea` and `fff0314` are pushed and deployed; `af0a4ea` exposes `/health/order-events` outside `/api`, and `fff0314` normalizes fulfillment delivery country names such as `Czech Republic` to ISO2 `CZ`. Warehouse image `4d0fa85` is deployed with `CreateFulfillmentOrders1781500000000` applied. Fresh FlipFlop live smoke order `ORD-1783032147411-920` / central order `94ce9a4b-7c6a-4625-85c7-8d1b13228b2d` was marked paid through the internal Payments boundary and produced `warehouseHandoff.status=fulfilled`, `fulfillmentOrderHandoff.status=requested`, and Warehouse fulfillment order `6ada14af-20f8-4928-9a37-94a331d97be2` with one line and delivery country `CZ`. Orders `/health/order-events` remained ready with pending/failed `0` and outbox counts `published|42`. Remaining blockers: `[MISSING: Notifications orders-events recipient/consumer gate]`, `[MISSING: marketplace customer/admin cabinet realtime or polling refresh]`, and `[MISSING: delivery-provider shipment status source after Warehouse handoff]`. Existing unrelated dirty Orders repo changes were preserved and not staged.

