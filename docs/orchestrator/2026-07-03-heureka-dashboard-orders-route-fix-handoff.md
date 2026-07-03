# Heureka Dashboard Orders Route Fix Handoff

Date: 2026-07-03
Repository of record: `orders-microservice`
Target repository: `heureka`
Mode: Orders-owned merge-order handoff; no Heureka source edit, deploy, restart, DB read/write, provider call, browser session, or runtime mutation was run in this lane.

## Intent Chain

- Vision: Heureka customer/admin dashboards must render central Orders lifecycle state from an authenticated dashboard orders API.
- Goal Impact: the blocker is now isolated to a Heureka route collision rather than unknown auth, Orders read-model, or deployment state.
- System: Orders remains lifecycle evidence owner; Heureka owns public dashboard shell and protected dashboard API routing.
- Feature: Heureka dashboard orders list API for browser lifecycle proof.
- Task: diagnose `/heureka/dashboard/orders` 404 and prepare a safe non-Orders implementation lane.
- Execution Plan: inspect source/runtime routes, run redacted in-pod JWT route probes, identify root cause, and stop before non-Orders edits pending merge-order review.
- Coding Prompt: do not print tokens, cookies, customer PII, raw order rows, raw DOM, provider payloads, tracking values, DB rows, or secret values.
- Code: `reports/validation/channel-lifecycle-runtime-evidence/heureka-dashboard-orders-route-collision-current.json` plus this handoff.
- Validation: read-only route probes and source/runtime route inspection only.

## Evidence

- Heureka repo `main` is clean at `358fba9 feat: cover orders lifecycle dashboard labels`.
- Runtime images are `localhost:5000/heureka-service:358fba9` and `localhost:5000/heureka-api-gateway:358fba9`, both ready `1/1`.
- Public shell `https://heureka.alfares.cz/dashboard/orders` returns HTTP `200`.
- In-pod anonymous probe: `/heureka/dashboard/me` and `/heureka/dashboard/admin/stats` return `401`; `/heureka/dashboard/orders` returns `404`.
- In-pod short-lived admin JWT probe: `/heureka/dashboard/me` and `/heureka/dashboard/admin/stats` return `200`; `/heureka/dashboard/orders?limit=5&status=all` still returns `404`. Token value was not printed.
- Runtime `dist/heureka/dashboard/dashboard.controller.js` contains the orders method and detail route metadata, and Nest logs map `/dashboard/orders` plus `/heureka/dashboard/orders/:id`, but do not map protected `/heureka/dashboard/orders`.
- Source `main.ts` excludes exact public shell path `dashboard/orders` from global prefix so `/dashboard/orders` can stay unprefixed. That exclusion also strips the protected DashboardController list route raw path `dashboard/orders`.

## Root Cause

The public shell and protected list API share the same raw route path, `dashboard/orders`, but require different global-prefix behavior. Nest global-prefix exclusions are path based, not controller-owner based. The exact exclusion keeps the public shell available at `/dashboard/orders`, but prevents the protected list route from being mapped as `/heureka/dashboard/orders`. Detail route `/heureka/dashboard/orders/:id` is not exact-matched by the exclusion and remains mapped.

## Proposed Heureka Patch

Allowed files:

- `services/heureka-service/src/heureka/dashboard/dashboard.controller.ts`
- `services/heureka-service/src/public/public.controller.ts`
- `services/heureka-service/src/public/public-dashboard-routes.self-test.ts`
- `scripts/verify_heureka_orders_runtime_readiness.js`
- `docs/orchestrator/2026-07-03-orders-lifecycle-ui-reliability-report.md`
- `docs/orchestrator/TASK-010-channel-parity-checklist.md`

Suggested change:

- Keep public shell `/dashboard/orders` unchanged.
- Keep detail hydration `/heureka/dashboard/orders/:id` unchanged.
- Add a protected list alias outside the excluded raw path, for example `/heureka/dashboard/orders-list`.
- Update dashboard list polling from `/heureka/dashboard/orders?limit=50&status=...` to `/heureka/dashboard/orders-list?limit=50&status=...`.
- Lock the alias in Heureka source verifier and public dashboard self-test.

Forbidden scope:

- Orders runtime code, Warehouse, Auth, Payments, provider/courier code, shared contracts, DB migrations, Kubernetes secrets, and any raw customer/order payload output.

## Validation Plan

Run before commit:

- `npx ts-node --skip-ignore --compiler-options '{"types":["node"]}' services/heureka-service/src/public/public-dashboard-routes.self-test.ts`
- `npm run verify:heureka-orders-runtime-readiness`
- `LOGGING_SERVICE_URL=http://logging-microservice:3367 npm --prefix services/heureka-service run build`
- `git diff --check`

After approved deploy:

- `/dashboard/orders` returns `200`.
- Unauthenticated `/heureka/dashboard/orders-list` returns `401`, not `404`.
- Authenticated in-pod `/heureka/dashboard/orders-list?limit=5&status=all` returns `200` with aggregate-only output: order count, total, central status counts, field names only.
- Rerun Orders `verify:channel-lifecycle-runtime-evidence` and update the Heureka browser proof artifact from blocked route/API to data/row proof status.

## Merge-Order Decision

Status: waiting for explicit approval to edit non-Orders `heureka` source.

Next action: approve the Heureka route-collision fix lane, or provide an alternative proof path for Heureka dashboard orders lifecycle rendering.
