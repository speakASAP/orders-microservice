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
downstream:
  - docs/orchestrator/STATUS.md
  - docs/orchestrator/EXECUTION_PLAN.md
related_adrs: []
current_goal: Goal H1 - Public Landing And Admin Access Surface
current_chunk: H1.1-H1.4 landing/admin UI and roadmap
next_recommended_goal: Goal H1 chunk H1.5 route smoke checks and H1.6 deploy verification
last_completed_goal: Goal H1 chunks H1.1-H1.4 landing/admin UI and roadmap preparation
blockers: []
```

## Current Checkpoint

Goal H1 chunks H1.1-H1.4 are complete in source and documentation. The service now has a public Orders Hub landing page planned for `/` and `/landing`, an improved admin shell at `/admin` and `/admin/orders`, and explicit admin roles on protected JSON endpoints.

The admin shell remains public but data-free. Admin data remains under `/api/admin/orders/dashboard` and `/api/admin/orders/:id`, protected by Auth-issued roles `global:superadmin` or `internal:orders-microservice:admin`.

The new `docs/orchestrator/ORDERS_HUB_ROADMAP.md` records the delegated system roadmap for landing/admin access, Auth-owned login, channel idempotency, event contracts, warehouse choreography, payment boundaries, admin console expansion, and candidate application integration decisions.

Goal 4 chunk 4.1 is complete. `POST /api/orders` now has a documented channel-ingestion contract and a runtime normalizer for `orders.create.v1` requests from FlipFlop and marketplace services.

The create endpoint now accepts a stable request shape with `contractVersion`, `channel`, `externalOrderId`, `channelAccountId`, customer summary, shipping/billing address JSON, item lines, totals, payment method/status metadata, shipping method, and customer note. Runtime validation rejects unsupported channels, unsupported contract versions, unknown top-level fields, empty item arrays, invalid totals/currency/timestamps, and create-time statuses outside `pending|confirmed`.

Order creation now persists order item rows from the same `POST /api/orders` request in the same database transaction as the order row, then returns the saved order with saved item rows. Item lines start with `fulfillmentStatus=pending`. Duplicate-order/idempotency behavior remains deliberately deferred to Goal 4 chunks 4.2 and 4.3.

Goal 3 remains complete. Sensitive logging regression checks are wired into `npm test` and continue to pass.

Goal 2 remains complete. Runtime validation still supports documented pre-shipment order cancellation only when explicit human approval evidence is supplied. Refund-like statuses and destructive terminal-state corrections remain blocked from the normal status endpoint.

## Preserved Intent Summary

`orders-microservice` is the canonical order processing and lifecycle service. It stores orders, order items, shipment records, order status, and order events for all sales channels. FlipFlop and marketplace services are clients of Orders, not duplicate order sources of truth. Catalog remains product truth, Warehouse remains stock truth, Payments remains payment identity/reconciliation truth, and Auth remains identity/RBAC truth.

## Current Evidence

- Added `src/orders/create-order.dto.ts` with `orders.create.v1` request normalization and validation.
- Updated `src/orders/orders.controller.ts` to type `POST /orders` as `CreateOrderRequestDto`.
- Updated `src/orders/orders.service.ts` so order creation persists normalized order rows and item rows together.
- Updated `src/orders/orders.module.ts` to register `OrderItem` for the Orders module TypeORM feature set.
- Added `docs/orchestrator/CHANNEL_ORDER_CREATE_CONTRACT.md`.
- Added `scripts/verify-create-order-contract.js` and wired `npm test` to run it.
- Added `src/landing/landing.module.ts`, `src/landing/landing.controller.ts`, and `src/landing/landing-ui.ts`.
- Updated `src/main.ts` and `src/app.module.ts` for public landing routes.
- Updated `src/admin/admin.controller.ts` with explicit admin roles.
- Updated `src/admin/admin-ui.ts` with locked/admin states and clearer ecosystem boundary messaging.
- Added `docs/orchestrator/ORDERS_HUB_ROADMAP.md`.
- Refreshed `docs/orchestrator/CONTEXT_PACKAGE.md` and `docs/orchestrator/EXECUTION_PLAN.md` for Goal H1.
- Preserved database schema, status transition behavior, JWT/RBAC guard behavior, warehouse/catalog/payment ownership boundaries, and existing event publishing contract.
- DocsRAG live query was not run because no session `JWT_TOKEN` was available; repository source-of-truth docs, existing production-readiness roadmap, and sub-agent ecosystem discovery were used as compensating evidence.

## Next Action

Run route smoke checks, deploy, and verify `/`, `/admin/orders`, and protected `/api/admin/orders/dashboard?limit=1`. After the UI slice is deployed, continue Goal 4 chunk 4.2 or Goal H3 chunk H3.1 for idempotency expectations.

## Verification State

Goal 4 chunk 4.1 verification completed:

```bash
npm run build
npm run verify:create-order-contract
npm test
git diff --check
missing-marker scan
```

Verification results:

- `npm run build`: pass.
- `npm run verify:create-order-contract`: pass; `create order contract verification ok`.
- `npm test`: pass; build completed, `status transition verification ok`, `sensitive logging verification ok`, and `create order contract verification ok`.
- `git diff --check`: pass.
- Missing-marker scan: pass; no `[(MISSING|UNKNOWN):` markers found in IPS documentation scope.

Deployment was not run because this chunk was not requested for deployment.
