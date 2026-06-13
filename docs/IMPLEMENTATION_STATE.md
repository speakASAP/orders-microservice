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
downstream:
  - docs/orchestrator/STATUS.md
  - docs/orchestrator/EXECUTION_PLAN.md
related_adrs: []
current_goal: none
current_chunk: none
next_recommended_goal: Create or reconcile the production orders table migration path so ux_orders_create_idempotency is materialized when public.orders exists
last_completed_goal: Goal 4 chunk 4.5 / Goal H3 database uniqueness migration guard
blockers: []
```

## Current Checkpoint

Goal 4 chunks 4.3 and 4.4 / Goal H3 chunks H3.2-H3.5 are complete in runtime and adapter verification. Orders now looks up existing orders by `contractVersion + channel + channelAccountId + externalOrderId`, returns the existing order for exact replay, and rejects same-key different-payload creates with HTTP 409.

The documented idempotency key is `contractVersion + channel + channelAccountId + externalOrderId`. New clients must send `contractVersion=orders.create.v1`, a supported channel, a stable channel account/store/integration identity, and the upstream order or checkout ID. Safe retries must return the existing canonical order without inserting duplicate `orders` or `order_items` rows, without re-emitting `order.created`, and without rerunning warehouse/payment/notification/CRM side effects. Mismatched duplicates must become bounded `409 ORDER_IDEMPOTENCY_CONFLICT` responses without raw customer/address/payment payloads.

Goal 4 chunks 4.1 and 4.2 remain complete, and chunk 4.4 is complete for FlipFlop and marketplace adapter verification. `POST /api/orders` has a documented channel-ingestion contract, runtime normalizer for `orders.create.v1`, item-row persistence in the same transaction, and documented idempotency expectations. The repository now contains a guarded database uniqueness migration for simultaneous duplicate creates; the live `orders` database currently has no `public.orders` table, so applying the migration succeeds as a no-op until the base table exists.

Goal H1 chunks H1.1-H1.6 remain complete and deployed. The public Orders Hub landing page, admin shell, explicit admin JSON roles, roadmap, deployment, and live route checks are recorded in `docs/orchestrator/STATUS.md` and `docs/orchestrator/ORDERS_HUB_ROADMAP.md`.


Goal H3 chunk H3.5 is complete. FlipFlop, Allegro, Aukro, Bazos, and Heureka shared order clients now send contractVersion=orders.create.v1, normalize a stable channelAccountId fallback, preserve the same payload for retry, and surface ORDER_IDEMPOTENCY_CONFLICT as HTTP 409 instead of flattening it to a generic 400. FlipFlop checkout forwarding now sends a stable account scope through ORDERS_CHANNEL_ACCOUNT_ID with fallback flipflop-storefront.

Goal 3 remains complete. Sensitive logging regression checks are wired into `npm test` and continue to pass. Goal 2 remains complete; owner-approved cancellation gates and state-transition validation remain in force.

## Preserved Intent Summary

`orders-microservice` is the canonical order processing and lifecycle service. It stores orders, order items, shipment records, order status, and order events for all sales channels. FlipFlop and marketplace services are clients of Orders, not duplicate order sources of truth. Catalog remains product truth, Warehouse remains stock truth, Payments remains payment identity/reconciliation truth, and Auth remains identity/RBAC truth.

## Current Evidence

- Added the order idempotency contract document and wired the create-order contract to the full key: contractVersion + channel + channelAccountId + externalOrderId.
- Added runtime deterministic duplicate lookup before create-order insertion.
- Exact same-key replay now returns the existing canonical order and does not insert duplicate order or item rows.
- Same-key different-payload replay now rejects with HTTP 409 before inserts, event publishing, or side effects.
- Added scripts/verify-idempotency-contract.js, scripts/verify-duplicate-order-protection.js, and scripts/verify-channel-adapter-idempotency.js.
- Updated package.json with verify:channel-adapter-idempotency for the cross-repo H3.5 check. npm test remains the Orders-local build and contract suite.
- Updated docs/orchestrator/GOALS.md and docs/orchestrator/ORDERS_HUB_ROADMAP.md to mark Goal 4.3, Goal 4.4, and H3.2-H3.5 complete.
- Added `migrations/002_order_idempotency_unique_index.sql`, a guarded uniqueness migration for `(channel, COALESCE(channelAccountId, ''), externalOrderId)` when `public.orders` exists. The current API contract version is validated by Orders but not persisted, so the database guard covers the persisted key dimensions.
- DocsRAG live query was not run because no session JWT_TOKEN was available; repository source-of-truth docs and the current create-order/idempotency contracts were sufficient for this bounded Orders-local runtime chunk.

## Next Action

Create or reconcile the production base table migration path so `ux_orders_create_idempotency` is materialized when `public.orders` exists, then verify concurrent duplicate creates against the real table.

## Verification State

Goal 4 chunks 4.3-4.4 / Goal H3 chunks H3.2-H3.5 verification completed.

Commands run: npm run verify:duplicate-order-protection; npm run verify:channel-adapter-idempotency; npm test; channel shared builds where dependencies were installed; FlipFlop order-service build; guarded migration apply against `orders` database; table-state confirmation; git diff --check; missing-marker scan.

Verification results:

- npm run verify:duplicate-order-protection: pass; duplicate order protection verification ok.
- npm run verify:channel-adapter-idempotency: pass; channel adapter idempotency verification ok.
- npm test: pass; build completed, status transition verification ok, sensitive logging verification ok, create order contract verification ok, idempotency contract verification ok, and duplicate order protection verification ok.
- Channel compile checks: flipflop-service/shared, allegro-service/shared, bazos-service/shared, and flipflop-service/services/order-service builds passed. Aukro and Heureka shared builds could not run because no local tsc binary is installed in those repos.
- Guarded migration apply: pass; `psql -f migrations/002_order_idempotency_unique_index.sql` returned `DO`.
- Live database table check: `to_regclass('public.orders')` returned null, so no index was materialized in the current schema.
- git diff --check: pass.
- Missing-marker scan: pass; no missing or unknown markers found in IPS documentation scope.

Deployment was not run because the owner requested the implementation chunk only; deploy remains available after review.
