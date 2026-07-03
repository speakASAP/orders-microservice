# Orders Lifecycle Completion Audit

Date: 2026-07-03
Repository of record: `orders-microservice`
Current Orders evidence baseline: this document is enforced by `verify:completion-audit` in `npm test`; repository `HEAD` is the authoritative current commit.

## Audit Scope

Objective under audit:

Implement reliable Orders lifecycle across Alfares commerce services: inventory check/reservation on order creation, Warehouse fulfillment trigger on paid status, order lifecycle/status propagation to customer/admin frontends, and IPS-backed cross-repo plan plus subagent orchestration.

This audit does not mark the goal complete. It records the current proof boundary and the exact evidence still needed.

## Requirement Status Matrix

| Requirement | Current status | Authoritative evidence | Completion evidence still needed |
| --- | --- | --- | --- |
| Every sellable order checks Warehouse stock and reserves on creation | Bounded channel evidence proven, real-provider gates remain | `verify:order-reservation-gate`; `verify:channel-lifecycle-runtime-evidence`; FlipFlop live create/reservation artifacts; Heureka live create/replay/reservation cleanup artifacts; Aukro live synthetic create/reservation cleanup artifacts; Bazos owner-approved synthetic reservation artifact | Real provider-backed Bazos order source remains unknown; Allegro still needs real subject-bound buyer/order proof before provider-backed create/reservation can be called complete. |
| Order creation fails closed if Warehouse reservation is unavailable | Source/contract proven | `verify:order-reservation-gate`; `verify:warehouse-handoff`; sellable-channel reservation gate in Orders service | Repeat live fail-closed negative smoke only if owner approves controlled stock/unavailable scenario. |
| Orders store item list, per-item price, totals, shipping cost, and delivery address | Source/contract proven | `verify:create-order-contract`; DTO/entity contract; lifecycle read model serialization; product-sales statistics verifier | Browser/customer-facing rendered proof of those fields across every cabinet is not complete. |
| Paid order triggers Warehouse fulfillment handoff | Runtime proven for bounded Orders path | `smoke:lifecycle-mutation` live run: payment update HTTP 200, Warehouse fulfillment update HTTP 200, lifecycle moved to `warehouse_collecting`; `verify:order-fulfillment-handoff` | Provider shipment/courier late-stage runtime remains gated; per-channel paid checkout browser proof is incomplete. |
| Orders lifecycle read model exposes customer/admin status | Runtime proven at service/API level | lifecycle list runtime probe returned HTTP 200 for FlipFlop, Allegro, Aukro, Bazos, Heureka service identities; `verify:order-lifecycle-read-model`; `verify:channel-lifecycle-runtime-evidence` | Human/browser-render proof after actual lifecycle mutation remains missing. |
| Customer cabinet shows updated order lifecycle | Source/deploy route proven, rendered proof missing | channel UI commits/deploys: FlipFlop `3110c6a`, Heureka `358fba9`, Bazos `26af3ae`, Aukro `08ad5ce`, Allegro `4ff3987`; route smokes; `verify:channel-lifecycle-surfaces`; `verify:browser-render-proof-report` report contract | Approved safe buyer session or explicitly approved service-scoped browser proxy proof showing rendered lifecycle label after mutation, captured as `orders.browser_render_proof.v1`. |
| Admin cabinet/statistics show updated lifecycle and delivery status | Source/deploy route proven, rendered proof missing | `verify:product-sales-statistics`; `verify:admin-operations-console`; channel UI route smokes and source markers; `verify:browser-render-proof-report` report contract | Approved admin browser/API rendered proof after lifecycle mutation, captured as `orders.browser_render_proof.v1`. |
| Lifecycle stages include ordered/unpaid, paid/not delivered, Warehouse collecting/forming/formed, handed to delivery, in delivery, received/not received/returned | Source/read-model proven | `verify:order-lifecycle-read-model`; STATUS late-stage coverage entries | Provider-backed late-stage runtime feed remains gated. |
| Delivery provider/shipment status updates drive late lifecycle | Source-ready/runtime-gated | `verify:shipment-runtime-readiness`; Warehouse/Allegro source contracts; STATUS shipment gates | Warehouse deploy/migration approval, Allegro deploy/enablement approval, safe runtime smoke with real provider source, and approval before fulfillment-row mutation. |
| Cross-repo IPS-backed plan and subagent orchestration are recorded | Proven for current wave | `docs/orchestrator/STATUS.md`, `docs/IMPLEMENTATION_STATE.md`, browser proof handoff, channel worker commits/deploy evidence | Keep docs current as browser/provider gates close. |
| No secrets, tokens, raw order rows, customer payloads, DB rows, tracking values, or provider payloads are printed in validation | Proven for added Orders validation paths | `smoke:lifecycle-mutation` sanitized output policy; `verify:browser-render-proof-readiness`; `verify:channel-lifecycle-runtime-evidence`; STATUS sanitation statements | Future browser screenshots must be redacted or use safe synthetic data only. |

## Current Proven Evidence

- Orders standard validation includes:
  - `verify:order-reservation-gate`
  - `verify:order-fulfillment-handoff`
  - `verify:order-lifecycle-read-model`
  - `verify:shipment-runtime-readiness`
  - `verify:channel-lifecycle-surfaces`
  - `verify:channel-lifecycle-runtime-evidence`
  - `verify:browser-render-proof-readiness`
- Orders runtime mutation smoke proved one sellable FlipFlop-channel path:
  - create HTTP `201`
  - Warehouse reservation true
  - payment update HTTP `200`
  - Warehouse fulfillment update HTTP `200`
  - customer lifecycle read HTTP `200`
  - admin lifecycle read HTTP `200`
  - both customer/admin read-models saw `warehouse_collecting`
- Deployed channel UI route coverage exists for FlipFlop, Heureka, Bazos, Aukro, and Allegro.
- Browser-B channel gate reconciliation refined route/deploy evidence: FlipFlop routes returned HTTP `200` but deployed commit is `[UNKNOWN: mutable latest tag]`; Heureka source/deployed `358fba9` and Aukro source/deployed `08ad5ce` remain aligned; Bazos source `1ccb93d` is ahead of deployed `9059605`; Allegro source `ae9d381` is ahead of deployed `4ff3987`; protected order APIs returned HTTP `401` where authentication is required.
- Anonymous FlipFlop browser-render preflight is blocked, not proven: artifact `/tmp/flipflop-browser-render-preflight-2026-07-03T09-34-31-524Z.json` SHA-256 `450f71e08497c99f545176d97ce047ace28496f66e0b263b182570c781fc22eb`; public `/orders` and `/admin/orders` HTML returned HTTP `200`, anonymous backing APIs `/api/orders` and `/api/admin/orders` returned HTTP `401`, and empty-profile Chromium found no rendered lifecycle labels/stages.
- Fresh gated FlipFlop route smoke returned HTTP `200` for `https://flipflop.alfares.cz/orders` and `https://flipflop.alfares.cz/admin/orders` with no browser session, lifecycle mutation, provider call, DB read, or token output. This is route readiness only, not rendered lifecycle proof.
- FlipFlop first browser lane readiness is recorded in `docs/orchestrator/2026-07-03-flipflop-browser-proof-readiness-evidence.md`: `/orders` and `/admin/orders` return HTML `200`, customer/admin source uses central lifecycle display data, and refresh is manual plus 30-second visible polling. This is readiness evidence only, not rendered lifecycle proof.
- Browser-render proof must be submitted as sanitized `orders.browser_render_proof.v1` JSON and validated by `verify:browser-render-proof-report`; checked-in fixtures prove the contract accepts a sanitized FlipFlop service-scoped report and rejects a sensitive-key report. Fixtures are not rendered proof.
- Browser proof report guard now rejects anonymous/public-shell evidence: `invalid-public-shell-route.json` must fail because route-only HTML, anonymous DOM snapshots, and backing API `401`/`403` responses cannot prove rendered lifecycle propagation.
- Browser proof report guard now requires both customer and admin rendered surfaces for `status=proven`: at least one `customer_cabinet` route plus at least one `admin_cabinet` or `admin_dashboard` route.
- Browser proof report guard now requires `mutationEvidence.expectedLifecycleStage` for `status=proven`, and every customer/admin route must render that exact canonical lifecycle stage.
- Browser proof report verifier now rejects `invalid-mismatched-stage.json`, proving customer/admin lifecycle stage divergence cannot close the rendered proof gate.
- Browser proof report verifier now rejects `invalid-unknown-channel.json`, proving arbitrary channel names cannot close the rendered proof gate; allowed channels are `flipflop`, `heureka`, `bazos`, `aukro`, and `allegro`.
- Browser proof report verifier now rejects `invalid-proof-mode-mismatch.json`, proving reports cannot mix `proofMode` and route `authContext` semantics.
- Browser proof report verifier now rejects `invalid-head-commit.json`, proving `ordersEvidenceCommit=HEAD` cannot close the rendered proof gate; proven reports must use an immutable 40-character git commit hash.
- Browser proof report verifier now rejects `invalid-expected-commit-mismatch.json`, proving a supplied real report must match `BROWSER_RENDER_PROOF_EXPECTED_COMMIT` exactly.
- Orders service identity lifecycle list endpoints return HTTP `200` for FlipFlop, Allegro, Aukro, Bazos, and Heureka.
- Channel create/reservation evidence boundary from `verify:channel-lifecycle-runtime-evidence`:
  - FlipFlop: `live_create_reservation_smoke_proven`.
  - Heureka: `live_create_replay_reservation_cleanup_smoke_proven`.
  - Aukro: `live_synthetic_create_reservation_cleanup_proven_source_cabinet_stats_proven`.
  - Bazos: `synthetic_create_reservation_smoke_proven_provider_webhook_unknown`.
  - Allegro: `buyer_route_live_isolation_proven_real_order_smoke_missing`.

## Remaining Gates

The goal is not complete until these are closed or explicitly descoped by product/owner decision:

1. Merge-order review approval for the FlipFlop validation-only browser lane.
2. Approved safe human buyer/admin session or explicitly approved service-scoped browser proxy proof.
3. Rendered customer/admin UI evidence after an Orders lifecycle mutation, submitted as sanitized `orders.browser_render_proof.v1` and validated with `BROWSER_RENDER_PROOF_REPORT_PATH`.
4. Real subject-bound Allegro buyer order row and buyer bearer before Allegro buyer cabinet lifecycle can be called live-complete.
5. Provider-backed Bazos marketplace webhook/order source decision.
6. Warehouse/Allegro shipment-status runtime enablement approvals:
   - Warehouse deploy/migration for provider shipment correlations.
   - Allegro deploy with shipment dead-letter runtime config.
   - Approval to enable `ALLEGRO_WAREHOUSE_SHIPMENT_CORRELATION_ENABLED=true`.
   - Owner-approved live runtime smoke with safe selection and real token source.
   - Approval before runtime fulfillment-row mutation.

## Recommended Next Execution Order

1. FlipFlop browser-render validation lane, validation-only.
2. If FlipFlop browser evidence fails due UI behavior, produce a channel-specific implementation prompt and wait for merge-order review before editing FlipFlop.
3. Heureka and Aukro browser/API rendered hydration proof.
4. Bazos only after product decides whether synthetic/internal order proof is sufficient or provider-backed webhook is required.
5. Allegro buyer proof only after real subject-bound buyer order row and bearer are approved.
6. Shipment-status runtime proof after Warehouse/Allegro deploy/migration/enablement approvals.

## Completion Decision

Status: incomplete.

Reason:

- Backend create/reservation/payment/Warehouse/read-model propagation is strongly proven for the bounded Orders/FlipFlop synthetic path.
- Cross-channel source/deploy route readiness is proven.
- Browser-render proof and provider-backed late shipment lifecycle proof are still missing.
- Therefore the active goal must remain open.
