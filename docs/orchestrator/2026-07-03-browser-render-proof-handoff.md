# Browser Render Lifecycle Proof Handoff

Date: 2026-07-03
Repository of record: `orders-microservice`
Current Orders evidence baseline: use repository `HEAD`; this handoff is enforced by `verify:browser-render-proof-readiness` in `npm test`.

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

Recommended first browser proof lane: FlipFlop only.

Reason:
- Orders live mutation proof already uses `channel=flipflop` and `serviceName=flipflop-service`.
- FlipFlop has deployed customer `/orders` and admin `/admin/orders` routes returning HTTP `200`.
- A FlipFlop-first browser proof avoids Allegro real-buyer bearer/order-row blockers and avoids unknown Bazos provider-webhook scope.

Merge/review order:

1. Orders orchestrator review approves the FlipFlop validation-only browser lane.
2. Run browser smoke against deployed FlipFlop routes using an approved safe human buyer/admin session.
3. If UI evidence fails because rendering/polling is insufficient, stop and produce a channel-specific implementation prompt before any FlipFlop repo edit.
4. After FlipFlop proof is recorded, request separate review for Heureka/Aukro/Bazos/Allegro lanes in that order.
5. Keep Allegro provider/shipment-status lanes separate from browser proof unless the review explicitly combines them.

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
| FlipFlop | Recommended first | Ready for validation-only lane after merge-order review | Needs approved safe human buyer/admin session or explicit approval for service-scoped browser proxy proof. |
| Heureka | Deployed route coverage | Dependency-gated | Needs approved dashboard/auth session and lane review. |
| Aukro | Deployed route coverage | Dependency-gated | Needs approved cabinet/admin session and lane review. |
| Bazos | Deployed route coverage plus protected `/orders` | Dependency-gated | Provider-backed marketplace webhook/order source remains `[UNKNOWN]`; browser proof can only cover synthetic/internal order unless product approves scope. |
| Allegro | Deployed buyer/admin routes | Dependency-gated | Needs real subject-bound Allegro buyer order row and buyer bearer; provider shipment-status runtime remains separate. |

## Handoff Prompt

Objective: run a validation-only browser proof for FlipFlop lifecycle status propagation after an Orders lifecycle mutation. Work from current Orders repository `HEAD`, the completion audit baseline, and the deployed FlipFlop route evidence. Do not edit non-Orders repos unless merge-order review explicitly authorizes an implementation lane after validation fails.

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
