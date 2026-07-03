# Heureka Rendered Lifecycle Proof Preflight Blocker

Date: 2026-07-03
Repository: `/home/ssf/Documents/Github/orders-microservice`
Scope: Orders-owned evidence for the next Heureka rendered-proof lane

## Intent Preservation Chain

Vision: Heureka customer/admin dashboards must render a current central Orders lifecycle state for an order that was created through the reliable Orders/Warehouse reservation path.

Goal Impact: the old Heureka route/API blocker is closed, but the rendered proof lane cannot safely create the fresh row until the smoke runner uses current Catalog and Orders auth boundaries.

System: Heureka owns channel ingestion and dashboard rendering; Orders owns central lifecycle and cleanup status mutation; Warehouse owns stock/reservation; Catalog owns product existence; Auth owns the short-lived admin bearer.

Feature: Heureka customer/admin rendered lifecycle proof.

Task: run a non-mutating preflight for the existing Heureka synthetic order smoke and identify the remaining runner/auth blockers before any production data mutation.

Execution Plan: run preflight inside the Heureka pod, probe Orders detail read boundary with a synthetic missing id, record only aggregate/status evidence, and do not create orders until the runner has Catalog auth plus an Orders admin token.

Coding Prompt: do not print token values, raw order rows, customer PII, DB rows, payment references, tracking values, provider payloads, or raw DOM. Do not leave a synthetic order un-cancelled.

Code: no source code change in this lane; evidence artifact `reports/validation/orders-browser-render-proof/heureka-rendered-proof-preflight-blocked.json`.

Validation: pod-local preflight returned Heureka health 200, Warehouse stock 200, one reservable route, required Heureka tables present, but Catalog product preflight returned 401 and missing marker `[MISSING: catalogProductId]`; Orders detail read boundary from the Heureka pod returned 401 for a synthetic missing id.

## Evidence

- `heureka-service` runtime is ready and the dashboard orders API route is already fixed on deployed image `e4b97fe`.
- Existing smoke runner: `heureka/scripts/smoke_heureka_order_ingestion_live.js`.
- Non-mutating preflight did not run `--execute` and did not create an order.
- Preflight ready pieces: `/health` 200, Warehouse stock 200, one reservable warehouse route, `heureka_accounts`, `heureka_offers`, and `heureka_orders` present.
- Current blocker: Catalog product preflight returned HTTP 401 because the runner calls `/api/products/:id` without Catalog internal auth.
- Orders read boundary: Heureka service identity got HTTP 401 for `GET /api/orders/:synthetic-missing-id`; proof readback/cleanup still needs a short-lived Auth-issued Orders admin/global-superadmin bearer.

## Required Next Runner Shape

1. Add Catalog auth to the proof runner preflight using `HEUREKA_INTERNAL_SERVICE_TOKEN` or `CATALOG_INTERNAL_SERVICE_TOKEN` as `x-internal-service-token`, without printing the token.
2. Acquire a short-lived Auth-issued Orders admin/global-superadmin bearer inside the cluster without printing or persisting the token value.
3. Create one synthetic Heureka order through `POST /heureka/orders/ingest`.
4. Before cleanup, probe `/heureka/dashboard/orders-list`, order detail, and admin stats/rendered dashboard evidence for a non-stale central lifecycle stage.
5. Cancel the synthetic order through Orders approved cleanup.
6. Emit sanitized `orders.browser_render_proof.v1` evidence only after cleanup succeeds.

## Remaining Gate

`[MISSING: approved Heureka synthetic rendered-proof runner with Catalog auth header and short-lived Orders admin readback/cleanup token]`
