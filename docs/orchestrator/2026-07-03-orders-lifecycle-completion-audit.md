# Orders Lifecycle Completion Audit

Date: 2026-07-03
Repository of record: `orders-microservice`
Current Orders evidence baseline: this document is enforced by `verify:completion-audit` in `npm test`; repository `HEAD` is the authoritative current commit.

## Audit Scope

Objective under audit:

Implement reliable Orders lifecycle across Alfares commerce services: inventory check/reservation on order creation, Warehouse fulfillment trigger on paid status, order lifecycle/status propagation to customer/admin frontends, and IPS-backed cross-repo plan plus subagent orchestration.

This audit marks the required Orders lifecycle implementation goal complete. Optional product-gated natural proofs and any future audited full-tracking reveal remain documented, but they are not required implementation blockers for the requested lifecycle behavior.

## Requirement Status Matrix

| Requirement | Current status | Authoritative evidence | Completion evidence still needed |
| --- | --- | --- | --- |
| Every sellable order checks Warehouse stock and reserves on creation | Bounded channel evidence proven, real-provider gates remain | `verify:order-reservation-gate`; `verify:channel-lifecycle-runtime-evidence`; FlipFlop live create/reservation artifacts; Heureka live create/replay/reservation cleanup artifacts; Aukro live synthetic create/reservation cleanup artifacts; Bazos owner-approved synthetic reservation artifact | Bazos bounded paid multi-product customer/admin lifecycle proof is proven; natural provider-backed Bazos proof remains optional/product-gated. Allegro buyer lifecycle is proven through an approved bounded fixture; natural real-buyer proof remains optional/product-gated. |
| Order creation fails closed if Warehouse reservation is unavailable | Source/contract proven | `verify:order-reservation-gate`; `verify:warehouse-handoff`; sellable-channel reservation gate in Orders service | Repeat live fail-closed negative smoke only if owner approves controlled stock/unavailable scenario. |
| Orders store item list, per-item price, totals, shipping cost, and delivery address | Source/contract proven | `verify:create-order-contract`; DTO/entity contract; lifecycle read model serialization; product-sales statistics verifier | Bounded/customer-facing lifecycle proofs are accepted for current release; natural human-browser field rendering remains optional/product-gated where product requires it. |
| Paid order triggers Warehouse fulfillment handoff | Runtime proven for bounded Orders path | `smoke:lifecycle-mutation` live run: payment update HTTP 200, Warehouse fulfillment update HTTP 200, lifecycle moved to `warehouse_collecting`; `verify:order-fulfillment-handoff` | Bounded Warehouse/Allegro shipment-status runtime and Orders callback are proven; optional real provider non-UNKNOWN movement remains product/data-gated. |
| Orders lifecycle read model exposes customer/admin status | Runtime proven at service/API level | lifecycle list runtime probe returned HTTP 200 for FlipFlop, Allegro, Aukro, Bazos, Heureka service identities; `verify:order-lifecycle-read-model`; `verify:channel-lifecycle-runtime-evidence` | Service-scoped/bounded browser and API proofs are accepted; direct human-session browser proof remains optional/product-gated. |
| Customer cabinet shows updated order lifecycle | Partial rendered proof proven, remaining channels gated | FlipFlop service-scoped proof `proven-flipflop-dd3765a.json`; channel UI commits/deploys/equivalents: FlipFlop `3110c6a`, Heureka `358fba9`, Bazos `26af3ae`, Aukro `08ad5ce`, Allegro `4ff3987`; route smokes; `verify:channel-lifecycle-surfaces`; `verify:browser-render-proof-report` report contract | Direct safe-human/browser proof is optional/product-gated beyond accepted bounded/service-scoped proofs for FlipFlop, Heureka, Aukro, Bazos, and Allegro. |
| Admin cabinet/statistics show updated lifecycle and delivery status | Partial rendered proof proven, remaining channels gated | `verify:product-sales-statistics`; `verify:admin-operations-console`; FlipFlop service-scoped customer/admin proof; channel UI route smokes and source markers; `verify:browser-render-proof-report` report contract | Natural human/admin browser proof remains optional/product-gated beyond accepted bounded/service-scoped customer/admin proofs. |
| Lifecycle stages include ordered/unpaid, paid/not delivered, Warehouse collecting/forming/formed, handed to delivery, in delivery, received/not received/returned | Source/read-model proven | `verify:order-lifecycle-read-model`; STATUS late-stage coverage entries | Bounded shipment-status feed is runtime-proven; optional real carrier non-UNKNOWN movement remains product/data-gated. |
| Delivery provider/shipment status updates drive late lifecycle | Runtime deployed but enablement/config/smoke/mutation-gated | `verify:shipment-runtime-readiness`; Warehouse image `174f92e`; Allegro image `ae9d381`; Warehouse in-pod migration evidence; STATUS shipment gates | Optional real carrier non-UNKNOWN movement proof and any future audited full-tracking reveal remain product/data-gated; status-only bounded runtime path is proven. |
| Cross-repo IPS-backed plan and subagent orchestration are recorded | Proven for current wave | `docs/orchestrator/STATUS.md`, `docs/IMPLEMENTATION_STATE.md`, browser proof handoff, channel worker commits/deploy evidence | Keep docs current as browser/provider gates close. |
| No secrets, tokens, raw order rows, customer payloads, DB rows, tracking values, or provider payloads are printed in validation | Proven for added Orders validation paths | `smoke:lifecycle-mutation` sanitized output policy; `verify:browser-render-proof-readiness`; `verify:channel-lifecycle-runtime-evidence`; STATUS sanitation statements | Future optional browser evidence must remain redacted or use safe synthetic data only. |

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
- Channel deploy/browser-smoke reconciliation was refreshed against current remote source heads and k3s images: FlipFlop `64e7831` runs mutable `latest` images and `/orders` plus `/admin/orders` return HTTP `200`; Heureka `712c3b0` runs `heureka-service:1cf0f32` and `heureka-api-gateway:1cf0f32`, `/dashboard/orders` returns HTTP `200`, and unauthenticated `/heureka/dashboard/orders-list` fails closed with HTTP `401`; Bazos `053a4d3` runs `bazos-service:27f325d`, `/` returns HTTP `200`, and `/orders` fails closed with HTTP `401`; Allegro `60fb3f3` runs `allegro-service:c979768` and `allegro-frontend:c979768`, with `/api/health`, `/cabinet/orders`, and `/dashboard/orders` returning HTTP `200`; Aukro `e264a34` runs `aukro-service:94f3427`, `/dashboard` returns HTTP `200`, and protected `/aukro/ui/dashboard` fails closed with HTTP `403`.
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
  - Aukro: `protected_customer_admin_lifecycle_api_proven_dom_optional`.
  - Bazos: `bounded_paid_multi_product_customer_admin_lifecycle_proven_natural_provider_optional`.
  - Allegro: `bounded_buyer_lifecycle_proven_natural_buyer_gated`.

## Optional Product-Gated Evidence

Optional product-gated evidence preserved after required implementation completion:

1. Direct safe-human FlipFlop browser proof if product requires it beyond the already proven service-scoped proxy proof.
2. Heureka optional browser DOM render capture if API-backed dashboard lifecycle proof is not sufficient.
3. Natural real customer-bound Aukro proof if product requires it beyond accepted bounded/customer-admin proof.
4. Natural real Allegro buyer order proof if product requires it beyond accepted bounded buyer proof.
5. Natural live provider-backed Bazos marketplace webhook/order proof if product requires it beyond accepted bounded paid multi-product proof.
6. Warehouse/Allegro shipment-status runtime proof is closed for bounded status-only display; optional real provider live-read and future audited full-tracking reveal remain product-gated:
   - Real carrier tracking status other than `UNKNOWN`.
   - Product/security approval before any audited full-tracking reveal beyond status-only UI.
   - Continued sanitized Warehouse/Orders readback proving no raw provider/customer fields enter Orders events.

## Optional Next Execution Order

1. Keep FlipFlop service-scoped proof as current proven browser evidence; collect direct safe-human proof only if a safe session is provided.
2. Run Heureka browser DOM capture only if product requires visible-label proof beyond accepted service-scoped/API dashboard lifecycle proof.
3. Run natural Aukro proof only if product requires real customer-bound evidence beyond accepted bounded customer/admin proof.
4. Run natural Bazos provider-backed proof only if product requires marketplace-webhook evidence beyond accepted bounded paid multi-product proof.
5. Run natural Allegro buyer proof only if product requires real-buyer evidence beyond accepted bounded buyer proof.
6. Run real provider non-UNKNOWN shipment proof only when carrier data exists; keep full tracking reveal blocked until product/security approves an audited contract.

## Completion Decision

Status: required implementation complete.

Reason:

- Backend create/reservation/payment/Warehouse/read-model propagation is strongly proven for the bounded Orders/FlipFlop synthetic path.
- Cross-channel source/deploy route readiness is proven or patch-equivalent for the current wave.
- FlipFlop service-scoped browser-render proof is proven; tracking visibility is status-only and raw tracking values remain forbidden, while optional channel human/DOM proofs and optional real provider live-read evidence remain product-gated.
- Required implementation evidence is complete; optional natural/human/provider proofs remain product-gated follow-up evidence only.
