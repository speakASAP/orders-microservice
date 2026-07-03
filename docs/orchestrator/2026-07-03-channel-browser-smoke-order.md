# Channel Browser Smoke Order Decision Packet

Date: 2026-07-03
Repository of record: `orders-microservice`

## Decision

Run remaining channel browser/API proof work in this order:

1. Keep FlipFlop service-scoped browser proof as the current proven browser lifecycle evidence; pursue direct safe-human proof only if an approved safe buyer/admin session is provided.
2. Heureka next only after `/heureka/dashboard/orders` and `/api/heureka/dashboard/orders` are fixed or an approved alternative proof path is defined.
3. Aukro next only after an approved live row links to a current non-stale canonical Orders lifecycle stage.
4. Bazos only after a provider-backed paid order ingestion and persisted item snapshot source exists, unless product explicitly accepts synthetic/internal scope.
5. Allegro only after a real subject-bound buyer order row and buyer bearer are approved.
6. Provider shipment-status runtime proof only after Allegro enablement, Warehouse URL/token config, safe order selection, sanitized readback, and fulfillment/Orders mutation approval.

No new source-edit worker should start for the five channel UI repos until these proof/data/route blockers are resolved or explicitly deferred.

## Integrated Commit Decisions

- FlipFlop `main` contains `3110c6a`; deployed images use mutable `latest`, so exact runtime commit provenance remains unknown from Kubernetes tags.
- Heureka source/runtime is `358fba9`; browser proof remains route/API-blocked, not deploy-blocked.
- Bazos runtime `9059605` contains `26af3ae`; browser proof remains provider-source-blocked, not deploy-blocked.
- Allegro worker commit `529a71d` must not be merged directly; patch-equivalent commit `4ff3987` is already on main lineage and runtime `ae9d381` is later.
- Aukro worker commit `f6502bb` must not be merged directly; patch-equivalent commit `08ad5ce` is already on main lineage and runtime `68784d7` includes it.

## Allowed Next Lanes

FlipFlop direct proof lane, only if a safe session is supplied:

- Allowed: inspect rendered customer/admin lifecycle labels through approved safe buyer/admin session.
- Forbidden: channel source edits, raw token/cookie output, DB dumps, production customer screenshots, provider/courier calls, raw tracking display.
- Pass evidence: sanitized `orders.browser_render_proof.v1` with customer/admin surfaces showing canonical lifecycle stage after approved mutation artifact.

Heureka route/API unblock lane:

- Allowed: owner-reviewed Heureka route/API fix in a separate merge-order lane if approved.
- Current blocker: dashboard orders route/API unavailable for rendered proof.

Aukro data proof lane:

- Allowed: approved non-stale canonical Orders lifecycle row selection or replay path.
- Current blocker: live rows do not prove a current canonical lifecycle stage.

Bazos provider source lane:

- Allowed: Bazos-owned paid order ingestion and persisted item snapshot contract.
- Current blocker: provider-backed source remains fail-closed.

Allegro buyer proof lane:

- Allowed: approved real buyer bearer plus subject-bound order row.
- Current blocker: live admin stats show no central-forwarded real buyer order proof.

Shipment-status lane:

- Allowed only after explicit runtime enablement/config/smoke/mutation approvals.
- Current blocker: correlation runtime is deployed and migrations are applied, but producer enablement and safe readback/mutation proof remain gated.

## Output Contract

Any future proof report must include:

- channel
- route(s) or API proof path
- proof mode: `safe_human_session`, `service_scoped_proxy`, or `approved_api_smoke`
- order/lifecycle mutation evidence hash or sanitized summary
- rendered lifecycle label/stage or API-backed lifecycle field
- refresh mechanism
- redacted artifact path or hash
- result: `proven`, `incomplete`, or `blocked`
- next action

## Current Status

Status: partial proof complete, remaining lanes data/route/approval-gated.

Next action: fix/approve the Heureka route/API proof path or provide safe-human FlipFlop session if direct proof is required; do not start more channel source-edit workers.
