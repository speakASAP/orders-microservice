# Channel Browser Smoke Order Decision Packet

Date: 2026-07-03
Repository of record: `orders-microservice`

## Decision

Run channel browser-render proof in this order:

1. FlipFlop validation-only browser proof.
2. Heureka rendered dashboard proof.
3. Aukro rendered dashboard/cabinet proof.
4. Bazos only after product decides whether synthetic/internal proof is sufficient or provider-backed marketplace webhook proof is required.
5. Allegro only after a real subject-bound buyer order row and buyer bearer are approved.
6. Provider shipment-status runtime proof only after Warehouse/Allegro deploy, migration, enablement, and safe smoke approvals.

No new source-edit worker should start for the five channel UI repos until the already integrated/deployed UI commits are browser-smoked or explicitly deferred.

## Why FlipFlop First

- Orders runtime mutation proof already uses `channel=flipflop` and `serviceName=flipflop-service`.
- FlipFlop customer `/orders` and admin `/admin/orders` routes are deployed and return HTTP `200`.
- FlipFlop avoids the Allegro real-buyer blocker and Bazos provider-source uncertainty.
- A failed FlipFlop browser proof gives the shortest path to a focused implementation prompt without touching other channel repos.

## Allowed First Lane

Lane: FlipFlop validation-only browser proof.

Allowed:

- Read Orders and FlipFlop docs/source.
- Run Orders `npm run smoke:lifecycle-mutation` only with explicit live gates if a fresh synthetic lifecycle mutation is required.
- Use deployed routes:
  - `https://flipflop.alfares.cz/orders`
  - `https://flipflop.alfares.cz/admin/orders`
- Use an approved safe buyer/admin session, or an explicitly approved service-scoped browser proxy proof if no human session is available.
- Record sanitized validation evidence in Orders docs first.

Forbidden:

- No channel repo edits during validation-only lane.
- No Auth, Cliplot, Marketing, provider/courier, Warehouse, Payments, or shared-contract work from this lane.
- No raw token/cookie output.
- No DB dumps.
- No production customer-data screenshots.
- No provider/courier API calls.
- No raw tracking display or tracking-value screenshots.

## Pass Evidence

The lane is `proven` only if evidence shows:

- Orders lifecycle mutation ran or an existing approved mutation artifact was selected.
- Browser route loaded successfully.
- Rendered customer and/or admin UI shows the mutated lifecycle stage or localized equivalent.
- Refresh mechanism is stated: automatic poll, manual refresh button, or full reload.
- Evidence is sanitized and does not expose tokens, raw order rows, addresses, email, phone, payment reference, tracking value, or provider payload.
- The rendered status is backed by central Orders lifecycle read model or a channel API using that read model.

## Stop Conditions

Stop and produce a channel-specific implementation prompt if:

- UI route is reachable but lifecycle label is stale or local-only.
- Customer session cannot be safely scoped to the synthetic order.
- Admin route renders only route chrome and not lifecycle/order state.
- Evidence would require exposing customer PII, tokens, raw order rows, or tracking values.
- Any required fix would edit FlipFlop or shared contracts.

## Deferred Lanes

Heureka:

- Dependency: FlipFlop lane decision complete.
- Proof target: dashboard/order rendered lifecycle label after mutation or approved central lifecycle API-backed UI proof.

Aukro:

- Dependency: FlipFlop lane decision complete.
- Proof target: rendered central lifecycle cabinet/dashboard hydration.

Bazos:

- Dependency: product decision for provider-backed marketplace webhook/order source.
- If synthetic/internal scope is approved, browser proof can proceed against that scope only.

Allegro:

- Dependency: approved real subject-bound buyer order row and buyer bearer.
- Keep provider shipment-status proof separate unless review explicitly combines it.

Provider shipment status:

- Dependency: Allegro OAuth/scope/account permission, sanitized fixtures, Warehouse ledger/correlation, deploy/runtime smoke approval, and product-approved visibility matrix.

## Output Contract

Validation report must include:

- channel
- route(s)
- proof mode: `safe_human_session` or `service_scoped_proxy`
- order/lifecycle mutation evidence hash or sanitized summary
- rendered lifecycle label/stage
- refresh mechanism
- screenshot/artifact path or hash after redaction review
- result: `proven`, `incomplete`, or `blocked`
- next action

## Current Status

Status: waiting for proof-mode approval.

Next action: approve either a safe buyer/admin session source or explicit service-scoped browser proxy proof for FlipFlop validation-only browser smoke.
