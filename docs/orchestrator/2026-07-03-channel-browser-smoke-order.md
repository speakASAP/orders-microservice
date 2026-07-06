# Channel Browser Smoke Order Decision Packet

Date: 2026-07-03
Repository of record: `orders-microservice`

## Decision

Run remaining channel browser/API proof work in this order:

1. Keep FlipFlop service-scoped browser proof as the current proven browser lifecycle evidence; pursue direct safe-human proof only if an approved safe buyer/admin session is provided.
2. Heureka service-scoped API/DOM lifecycle proof is current-proven; pursue natural human-session proof only if product requires proof beyond approved service-scoped evidence.
3. Aukro protected API plus service-scoped DOM lifecycle proof is current-proven; pursue natural real customer-bound proof only if product requires proof beyond approved service-scoped/bounded evidence.
4. Bazos remains the next product/provider decision lane: provider-backed paid order ingestion and persisted item snapshot source, or an explicit product decision accepting bounded synthetic/internal scope.
5. Allegro bounded buyer lifecycle proof is current-proven; pursue natural real-buyer proof only if product requires proof beyond approved bounded evidence.
6. Provider shipment-status runtime proof only after Allegro enablement, Warehouse URL/token config, safe order selection, sanitized readback, and fulfillment/Orders mutation approval.

No new source-edit worker should start for the five channel UI repos for Heureka/Aukro/Allegro/FlipFlop proof unless product explicitly requires natural proof beyond current service-scoped or bounded evidence.

## Integrated Commit Decisions

- FlipFlop `main` contains `3110c6a`; deployed images use mutable `latest`, so exact runtime commit provenance remains unknown from Kubernetes tags.
- Heureka current W5 evidence is service-scoped API/DOM proven for central Orders lifecycle rendering; direct human-session proof is optional/product-gated.
- Bazos runtime `9059605` contains `26af3ae`; browser proof remains provider-source-blocked, not deploy-blocked.
- Allegro worker commit `529a71d` must not be merged directly; patch-equivalent commit `4ff3987` is already on main lineage and runtime `ae9d381` is later.
- Aukro current W5 evidence is protected-API plus service-scoped DOM proven for central Orders lifecycle rendering; natural real customer-bound proof is optional/product-gated.

## Allowed Next Lanes

FlipFlop direct proof lane, only if a safe session is supplied:

- Allowed: inspect rendered customer/admin lifecycle labels through approved safe buyer/admin session.
- Forbidden: channel source edits, raw token/cookie output, DB dumps, production customer screenshots, provider/courier calls, raw tracking display.
- Pass evidence: sanitized `orders.browser_render_proof.v1` with customer/admin surfaces showing canonical lifecycle stage after approved mutation artifact.

Heureka optional natural proof lane:

- Allowed: approved safe human-session proof only if product requires evidence beyond current service-scoped API/DOM proof.
- Current blocker: no approved human-session packet; not a required implementation blocker while service-scoped proof is accepted.

Aukro optional natural proof lane:

- Allowed: approved natural real customer-bound row proof only if product requires evidence beyond current protected API plus service-scoped DOM proof.
- Current blocker: no approved natural customer/admin session packet; not a required implementation blocker while service-scoped/bounded proof is accepted.

Bazos provider source lane:

- Allowed: Bazos-owned paid order ingestion and persisted item snapshot contract.
- Current blocker: provider-backed source remains fail-closed.

Allegro optional natural buyer proof lane:

- Allowed: approved real buyer bearer plus subject-bound order row only if product requires natural proof beyond current bounded buyer lifecycle evidence.
- Current blocker: no approved natural real-buyer packet; not a required implementation blocker while bounded proof is accepted.

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

Status: required service-scoped/bounded proof complete for current W7 aggregation; remaining natural/provider lanes are product/approval-gated.

Next action: decide W8 Bazos provider/product scope; pursue direct safe-human marketplace proof only if product requires proof beyond current service-scoped or bounded evidence. Use `docs/orchestrator/2026-07-06-w8-bazos-product-decision-intake-packet.md`. [RESOLVED/NARROWED: W8 Bazos product decision intake packet is source-defined; real provider-backed Bazos lifecycle remains blocked until an owner selects one allowed decision option and supplies the required non-secret evidence]
