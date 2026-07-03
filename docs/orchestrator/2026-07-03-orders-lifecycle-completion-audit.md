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
| Every sellable order checks Warehouse stock and reserves on creation | Bounded channel evidence proven, real-provider gates remain | `verify:order-reservation-gate`; `verify:channel-lifecycle-runtime-evidence`; FlipFlop live create/reservation artifacts; Heureka live create/replay/reservation cleanup artifacts; Aukro live synthetic create/reservation cleanup artifacts; Bazos owner-approved synthetic reservation artifact | Bazos paid replay source is deployed, but live eligible paid multi-product evidence and customer/admin lifecycle proof remain missing; Allegro still needs real subject-bound buyer/order proof before provider-backed create/reservation can be called complete. |
| Order creation fails closed if Warehouse reservation is unavailable | Source/contract proven | `verify:order-reservation-gate`; `verify:warehouse-handoff`; sellable-channel reservation gate in Orders service | Repeat live fail-closed negative smoke only if owner approves controlled stock/unavailable scenario. |
| Orders store item list, per-item price, totals, shipping cost, and delivery address | Source/contract proven | `verify:create-order-contract`; DTO/entity contract; lifecycle read model serialization; product-sales statistics verifier | Browser/customer-facing rendered proof of those fields across every cabinet is not complete. |
| Paid order triggers Warehouse fulfillment handoff | Runtime proven for bounded Orders path | `smoke:lifecycle-mutation` live run: payment update HTTP 200, Warehouse fulfillment update HTTP 200, lifecycle moved to `warehouse_collecting`; `verify:order-fulfillment-handoff` | Provider shipment/courier late-stage runtime remains gated; per-channel paid checkout browser proof is incomplete. |
| Orders lifecycle read model exposes customer/admin status | Runtime proven at service/API level | lifecycle list runtime probe returned HTTP 200 for FlipFlop, Allegro, Aukro, Bazos, Heureka service identities; `verify:order-lifecycle-read-model`; `verify:channel-lifecycle-runtime-evidence` | Human/browser-render proof after actual lifecycle mutation remains missing. |
| Customer cabinet shows updated order lifecycle | Partial rendered proof proven, remaining channels gated | FlipFlop service-scoped proof `proven-flipflop-dd3765a.json`; channel UI commits/deploys/equivalents: FlipFlop `3110c6a`, Heureka `358fba9`, Bazos `26af3ae`, Aukro `08ad5ce`, Allegro `4ff3987`; route smokes; `verify:channel-lifecycle-surfaces`; `verify:browser-render-proof-report` report contract | Direct safe-human FlipFlop proof if required; Heureka runner auth plus non-stale lifecycle proof; Aukro non-stale lifecycle row; Bazos provider-backed source; Allegro real buyer bearer and subject-bound row. |
| Admin cabinet/statistics show updated lifecycle and delivery status | Partial rendered proof proven, remaining channels gated | `verify:product-sales-statistics`; `verify:admin-operations-console`; FlipFlop service-scoped customer/admin proof; channel UI route smokes and source markers; `verify:browser-render-proof-report` report contract | Approved admin browser/API rendered proof for Heureka, Aukro, Bazos, and Allegro after each channel's route/data/auth blocker is cleared. |
| Lifecycle stages include ordered/unpaid, paid/not delivered, Warehouse collecting/forming/formed, handed to delivery, in delivery, received/not received/returned | Source/read-model proven | `verify:order-lifecycle-read-model`; STATUS late-stage coverage entries | Provider-backed late-stage runtime feed remains gated. |
| Delivery provider/shipment status updates drive late lifecycle | Runtime deployed but enablement/config/smoke/mutation-gated | `verify:shipment-runtime-readiness`; Warehouse image `174f92e`; Allegro image `ae9d381`; Warehouse in-pod migration evidence; STATUS shipment gates | Allegro correlation enablement, Warehouse URL/token config projection, safe runtime smoke with real provider source, sanitized Warehouse/Orders readback, and approval before fulfillment-row mutation. |
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
- Channel deploy/browser-smoke reconciliation refined current evidence: FlipFlop `main` contains `3110c6a` and routes return HTTP `200`, but runtime uses mutable `latest`; Heureka source/runtime is `a0dbb24`; `/heureka/dashboard/orders-list` returns HTTP `200` with aggregate data and non-stale central lifecycle rows; Bazos runtime `7365edc` contains `26af3ae` and protected replay returns HTTP `200` with zero records/candidates; Allegro `529a71d` is superseded by patch-equivalent `4ff3987` and runtime `ae9d381` is later; Aukro `f6502bb` is superseded by patch-equivalent `08ad5ce` and runtime `68784d7` includes it.
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
  - FlipFlop: `live_create_reservation_and_browser_lifecycle_proven`.
  - Heureka: `live_create_replay_reservation_cleanup_orders_list_non_stale_lifecycle_api_proven_dom_optional`.
  - Aukro: `live_synthetic_create_reservation_cleanup_proven_cabinet_protected_data_auth_blocked`.
  - Bazos: `synthetic_create_reservation_smoke_proven_paid_replay_source_deployed_live_evidence_blocked`.
  - Allegro: `buyer_route_live_isolation_proven_real_order_and_central_lifecycle_blocked`.

## Remaining Gates

The goal is not complete until these are closed or explicitly descoped by product/owner decision:

1. Direct safe-human FlipFlop browser proof if product requires it beyond the already proven service-scoped proxy proof.
2. Heureka optional browser DOM render capture if API-backed dashboard lifecycle proof is not sufficient.
3. Aukro approved human/admin bearer or bounded fixture for protected customer/admin lifecycle proof.
4. Real subject-bound Allegro buyer order row and buyer bearer before Allegro buyer cabinet lifecycle can be called live-complete.
5. Bazos paid replay source is deployed, but current aggregate has totalOrders=0; live paid multi-product evidence and approved customer/admin lifecycle proof remain missing.
6. Warehouse/Allegro shipment-status runtime enablement gates:
   - Approval to enable `ALLEGRO_WAREHOUSE_SHIPMENT_CORRELATION_ENABLED=true`.
   - Warehouse URL/token configuration projected into Allegro runtime.
   - Owner-approved live runtime smoke with safe selection and real token source.
   - Sanitized Warehouse correlation readback proving no raw provider/customer fields enter Orders events.
   - Approval before runtime fulfillment-row mutation or Orders lifecycle callback smoke.

## Recommended Next Execution Order

1. Keep FlipFlop service-scoped proof as current proven browser evidence; collect direct safe-human proof only if a safe session is provided.
2. Run Heureka browser DOM capture only if product requires visible-label proof beyond the API-backed dashboard lifecycle proof.
3. Provide an approved Aukro human/admin bearer or approved bounded fixture, then rerun protected customer/admin lifecycle proof.
4. Bazos after a real eligible paid multi-product Bazos order or approved bounded fixture exists; current aggregate has totalOrders=0, then authenticated customer/admin lifecycle proof can run.
5. Allegro buyer proof only after real subject-bound buyer order row and bearer are approved.
6. Shipment-status runtime proof after Allegro enablement, Warehouse URL/token config, safe live smoke, sanitized readback, and mutation approvals.

## Completion Decision

Status: incomplete.

Reason:

- Backend create/reservation/payment/Warehouse/read-model propagation is strongly proven for the bounded Orders/FlipFlop synthetic path.
- Cross-channel source/deploy route readiness is proven or patch-equivalent for the current wave.
- FlipFlop service-scoped browser-render proof is proven, but remaining channel browser/data/auth proofs and provider-backed late shipment lifecycle proof are still missing.
- Therefore the active goal must remain open.
