# VAL-W5 Aukro And Heureka Lifecycle Cabinet Proof

Date: 2026-07-05
Status: source-and-runtime-presence-verified-row-level-session-gated
Owner: Orders lifecycle orchestrator
Workstream: W5 Aukro and Heureka cabinet proof

## Vision

Unified Order Lifecycle Platform: every customer/admin cabinet reflects canonical Orders lifecycle without moving lifecycle truth into marketplace services.

## Goal Impact

Aukro and Heureka source surfaces are verified to consume central Orders lifecycle/readiness fields. Runtime status-only checks prove public routes are healthy and protected APIs fail closed without session. Live row-level buyer/admin proof remains gated by approved bearer/browser sessions and current non-stale rows.

## System

- Orders owns canonical lifecycle and read model.
- Aukro and Heureka own channel UI/order-client rendering and may only read central lifecycle state.
- Warehouse/provider/customer/payment data remain outside this W5 proof lane.

## Feature

Aukro dashboard/admin stats and Heureka dashboard/admin stats render central Orders lifecycle/status fields and operational stale/missing states.

## Task

Aggregate committed W5 handoff evidence from Aukro and Heureka into the Orders orchestration ledger while preserving live row-level blockers.

## Execution Plan

1. Verify Aukro and Heureka remote heads and clean states.
2. Read each W5 report.
3. Record exact commits, validation commands, runtime status-only evidence, and remaining blockers in Orders.
4. Run Orders completion/evidence validation.

## Coding Prompt

Do not invent live row-level smoke evidence. Record only source/runtime-presence proof and preserve missing approved session and non-stale row blockers. Do not print tokens, customer rows, payment data, provider payloads, or DB rows.

## Code

No Aukro or Heureka source code changed in this aggregation pass. Source evidence is already committed in the channel repos:

- Aukro commit `2085ae54c5ee3aa95c0082c9b4094d08953d4df2` (`docs: record w5 aukro lifecycle cabinet proof`)
- Heureka commit `0c0c4d7ebbf1e3d7139ea2099d23a93ee0236245` (`docs: record w5 heureka lifecycle cabinet proof`)

Orders aggregation code is this report plus the master plan status update.

## Aukro Evidence

Evidence report:

- `/home/ssf/Documents/Github/aukro/reports/validation/2026-07-05-w5-aukro-orders-lifecycle-cabinet-proof.md`

Validation:

- `npm run verify:orders-lifecycle-ui` - PASS with `success=true`, `lifecycleStagesCovered=13`, polling/manual refresh/spec coverage true.

Source proof:

- Dashboard/admin stats call central Orders through `OrderClientService.getOrderReadModel(orderId)`.
- Aggregations use central `status`, `lifecycleStage`, `paymentStatus`, `fulfillmentStatus`, and `deliveryStatus`.
- Central read status is explicit: `available`, `missing_order_id`, or `unavailable`.

Runtime status-only proof:

- `https://aukro.alfares.cz/` returned HTTP 200.
- `https://aukro.alfares.cz/health` returned HTTP 200.
- Protected `https://aukro.alfares.cz/aukro/ui/dashboard` returned HTTP 403 without session.
- Protected `https://aukro.alfares.cz/aukro/ui/admin/services` returned HTTP 403 without session.
- Pod env presence was checked by length/presence only: `ORDER_SERVICE_URL`, `JWT_TOKEN`, `AUKRO_INTERNAL_SERVICE_TOKEN` present.

Remaining Aukro blockers:

- `[MISSING: approved live Aukro customer/admin bearer or browser session packet for row-level dashboard/admin smoke]`
- `[MISSING: live proof that at least one Aukro row has a central Orders orderId linked to a current non-stale lifecycle stage]`
- `[UNKNOWN: whether current production data contains Aukro orders with central lifecycle status available]`

## Heureka Evidence

Evidence report:

- `/home/ssf/Documents/Github/heureka/reports/validation/2026-07-05-w5-heureka-orders-lifecycle-cabinet-proof.md`

Validation:

- `npm run verify:orders-lifecycle-ui` - PASS in source/read-only mode; blockers empty.
- Pod-local `node scripts/verify_heureka_orders_runtime_readiness.js --runtime` - PASS; blockers empty.

Source proof:

- Dashboard list/detail and admin stats render central lifecycle/status counts through protected Orders-backed APIs.
- All 13 lifecycle labels are covered.
- Runtime readiness verified `ORDER_SERVICE_URL`, `JWT_TOKEN`, `HEUREKA_INTERNAL_SERVICE_TOKEN`, and `WAREHOUSE_SERVICE_TOKEN` presence only, with values redacted.

Runtime status-only proof:

- `https://heureka.alfares.cz/dashboard/orders` returned HTTP 200.
- `https://heureka.alfares.cz/api/health` returned HTTP 200.
- Protected `https://heureka.alfares.cz/api/heureka/dashboard/orders-list?limit=5` returned HTTP 401 without session.
- Protected `https://heureka.alfares.cz/api/heureka/dashboard/admin/stats` returned HTTP 401 without session.

Remaining Heureka blockers:

- `[MISSING: approved live Heureka customer/admin bearer or browser session packet for row-level dashboard/admin smoke]`
- `[MISSING: approved row-level proof that at least one Heureka dashboard/admin response renders a current non-stale canonical Orders lifecycle stage]`
- `[UNKNOWN: whether current production data contains Heureka rows with central lifecycle status available]`

## Validation

Orders-side validation for this aggregation pass:

- `npm run verify:completion-audit` - PASS before this report update.
- `git diff --check` - PASS before commit.

## Outcome

W5 is complete as source/runtime-presence proof and remains gated for live row-level customer/admin smoke. This evidence should be consumed by W7/final integration as proof that Aukro and Heureka surfaces are source-wired to central Orders lifecycle, with live row-level data proof still requiring approved sessions and eligible current rows.
