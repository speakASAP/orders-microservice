# Browser Render Lifecycle Proof Handoff

Date: 2026-07-03
Repository of record: `orders-microservice`
Current Orders evidence baseline: use repository `HEAD`; this handoff is enforced by `verify:browser-render-proof-readiness` in `npm test`.

## 2026-07-06 Supersession Note

This handoff is historical for the original browser-render lane. Current merge-order authority is `docs/orchestrator/2026-07-03-channel-browser-smoke-order.md`: `recommendedFirstLane=w8_bazos_provider_product_decision`. FlipFlop service-scoped browser-render proof, Heureka service-scoped API/DOM proof, Aukro protected/service-scoped proof, Allegro bounded buyer proof, and Bazos bounded paid multi-product proof are accepted for current implementation readiness; direct safe-human or natural customer-bound browser proof is optional/product-gated when product requires proof beyond accepted bounded/service-scoped evidence.

## Intent Chain

- Vision: customer and admin cabinets must visibly reflect canonical Orders lifecycle changes after order creation, payment, Warehouse fulfillment, and delivery progress.
- Goal Impact: close the remaining browser-render proof gate without changing Orders ownership or silently editing channel repos out of merge order.
- System: Orders remains canonical lifecycle/read-model owner. Channel frontends own rendering, polling/manual refresh, subject-bound cabinet routing, and admin dashboard presentation.
- Feature: browser-render proof for lifecycle status propagation.
- Task: prove at least one real safe customer/admin browser session renders the lifecycle stage changed by Orders after a bounded lifecycle mutation; then expand per channel only after merge-order review.
- Execution Plan: use the already deployed Orders smoke `npm run smoke:lifecycle-mutation` as the backend mutation source, then inspect channel UI through approved browser/session paths and record sanitized screenshots/assertions.
- Coding Prompt: do not print bearer tokens, cookies, customer payloads, raw order rows, DB rows, tracking values, provider payloads, or screenshots containing sensitive customer data.
- Code: no channel code edits are authorized by this handoff; it is an execution/validation handoff only until merge-order review approves a lane.
- Validation: pass/fail evidence must include route, HTTP status, rendered lifecycle label/stage, refresh trigger used, and sanitized artifact path or hash.

## Current Proven Baseline

- Orders runtime propagation is proven for one synthetic FlipFlop-channel sellable order:
  - create order HTTP `201`
  - Warehouse reservation true
  - payment update HTTP `200`
  - Warehouse fulfillment update HTTP `200`
  - customer lifecycle read HTTP `200`
  - admin lifecycle read HTTP `200`
  - both customer/admin read-models saw `warehouse_collecting`
- Channel UI source/deploy route coverage is proven across FlipFlop, Heureka, Bazos, Aukro, and Allegro:
  - FlipFlop `3110c6a`
  - Heureka `358fba9`
  - Bazos `26af3ae`
  - Aukro main integration `08ad5ce`
  - Allegro main integration `4ff3987`
- Remaining evidence gap: a browser-rendered customer/admin cabinet view has not yet been proven against a real safe session after an Orders lifecycle mutation.

## Merge-Order Review Request

Current first non-source lane: W8 Bazos provider/product owner decision; direct FlipFlop safe-human browser proof is optional/product-gated.

Reason:
- Current W7/W8 aggregation no longer treats browser proof as the first autonomous source lane.
- W8 Bazos is owner-decision gated by exactly one product/provider option.
- FlipFlop service-scoped proof is accepted for implementation readiness; direct safe-human browser proof should run only if product requires proof beyond accepted service-scoped evidence.

Merge/review order:

1. Resolve W8 Bazos owner decision if product/provider scope must be closed.
2. Run direct safe-human browser proof only for a channel where product explicitly requires proof beyond accepted bounded/service-scoped evidence.
3. If UI evidence fails because rendering/polling is insufficient, stop and produce a channel-specific implementation prompt before any channel repo edit.
4. Keep Allegro provider/shipment-status lanes separate from browser proof unless the review explicitly combines them.

## Proposed FlipFlop Browser Validation Lane

Owner role: browser validation agent.

Allowed actions:
- Read Orders and FlipFlop docs/source.
- Use approved browser automation or Playwright against deployed URLs.
- Use approved safe credentials/session only.
- Run `npm run smoke:lifecycle-mutation` in Orders with explicit live gates if another synthetic lifecycle mutation is needed.
- Capture sanitized screenshots with visible lifecycle label and no exposed tokens, addresses, email, phone, raw order IDs, or payment references.
- Record validation report in Orders docs first; channel repo report only after merge-order approval.

Forbidden actions:
- No edits in `flipflop`, `heureka`, `bazos`, `aukro`, `allegro`, Auth, Cliplot, Marketing, Payments, Warehouse, or shared contracts during validation-only lane.
- No raw token/cookie printing.
- No DB dumps.
- No provider/courier API calls.
- No production customer data screenshots.
- No lifecycle ownership changes in channel services.

Expected evidence:
- Orders smoke command and sanitized result.
- Browser route URL and HTTP status.
- UI selector or visible text proving lifecycle label after mutation.
- Refresh mechanism used: automatic poll, manual refresh button, or full reload.
- Screenshot artifact path/hash after redaction review.
- Statement whether the UI evidence proves customer cabinet, admin cabinet, or both.

Pass criteria:
- A real safe browser session renders the mutated order's lifecycle stage or localized equivalent after Orders changed it.
- Evidence proves the rendered view came from the canonical Orders lifecycle read model or channel API backed by it.
- Admin view includes aggregate or per-order lifecycle status after refresh.

Failure criteria:
- UI only proves route availability.
- UI uses stale local order status instead of Orders lifecycle.
- Evidence depends on unscoped service reads but claims human customer proof.
- Any artifact exposes secrets, token values, customer PII, raw rows, tracking values, or provider payloads.

## Channel Lane Readiness

| Channel | Status | Browser proof readiness | Blockers |
| --- | --- | --- | --- |
| FlipFlop | Service-scoped proof accepted | Optional/product-gated direct safe-human proof | Needs approved safe human buyer/admin session only if product requires proof beyond accepted service-scoped evidence. |
| Heureka | Service-scoped API/DOM proof accepted | Optional/product-gated direct human proof | Needs approved dashboard/auth session only if product requires proof beyond accepted service-scoped API/DOM evidence. |
| Aukro | Protected/service-scoped proof accepted | Optional/product-gated natural customer proof | Needs approved cabinet/admin session only if product requires natural real customer-bound proof beyond accepted bounded/service-scoped evidence. |
| Bazos | Bounded paid multi-product proof accepted | W8 owner-decision gated for provider-backed proof | Provider-backed marketplace webhook/order source remains `[UNKNOWN]`; close scope through the W8 owner decision packet. |
| Allegro | Bounded buyer proof accepted | Optional/product-gated natural buyer proof | Needs real subject-bound Allegro buyer order row and buyer bearer only if product requires natural proof beyond accepted bounded evidence; provider shipment-status runtime remains separate. |

## Handoff Prompt

Objective: only run a direct safe-human browser proof for FlipFlop if product explicitly requires proof beyond accepted service-scoped lifecycle status propagation; otherwise pursue the current W8 Bazos owner-decision lane. Work from current Orders repository `HEAD`, the completion audit baseline, and the deployed FlipFlop route evidence. Do not edit non-Orders repos unless merge-order review explicitly authorizes an implementation lane after validation fails.

Scope:
- Orders repo: read docs, run `npm run smoke:lifecycle-mutation` only with explicit live gates, write sanitized validation report if approved.
- Browser: deployed `https://flipflop.alfares.cz/orders` and `https://flipflop.alfares.cz/admin/orders`.
- Forbidden: Auth/Cliplot/Marketing workstreams, provider shipment-status work, channel code edits, shared contract edits, raw secret output, DB dumps.

Expected output:
- Sanitized browser validation report.
- Exact routes tested.
- Rendered lifecycle label/stage observed.
- Refresh mechanism.
- Evidence classification: `proven`, `incomplete`, or `blocked`.
- Next action if incomplete.
