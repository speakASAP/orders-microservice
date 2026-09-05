# Pricing Consolidation And Event Contract

```yaml
id: ORDERS-PRICING-CONSOLIDATION-EVENT-CONTRACT
status: implemented
owner: Orders owner
created: 2026-06-15
last_updated: 2026-06-15
completeness_level: contract-review
upstream:
  - docs/orchestrator/INTENT.md
  - docs/orchestrator/GOALS.md
  - docs/orchestrator/PROJECT_INVARIANTS.md
  - implementation-goals/parallel/P2-pricing-safety-handoff.md
downstream:
  - scripts/verify-pricing-consolidation-contract.js
  - docs/IMPLEMENTATION_STATE.md
  - docs/orchestrator/STATUS.md
related_adrs: []
```

## Purpose

This document closes Goal 6.3 and Goal 6.4 at the contract/reconciliation level. It records what is already safe, what remains in FlipFlop, and which runtime changes require separate owner approval before Orders changes the Catalog write path or pricing event shape.

## Preserved Intent Chain

- Vision: Orders may coordinate human-approved list-pricing suggestions, but Catalog remains product/pricing truth and Payments remains payment capture/reconciliation truth.
- Goal Impact: Goal 6 keeps AI pricing suggestions pending until human approval, bounded by safety limits, and separated from provider payment flows.
- System: Orders exposes pricing suggestion operations; Catalog exposes product pricing writes and current-price reads; FlipFlop consumes Catalog/Orders through gateway and product-service adapters.
- Feature: `POST /pricing/generate`, `PATCH /pricing/suggestions/:id/approve`, `PATCH /pricing/suggestions/:id/reject`, and `pricing.price_changed` publication.
- Task: Reconcile FlipFlop pricing internals and verify pricing event/Catalog boundaries.
- Execution Plan: documentation and verifier only; no runtime event routing, Catalog write, payment, or FlipFlop source changes in this pass.
- Coding Prompt: future runtime packets must be opened separately with explicit owner approval and non-overlapping file ownership.
- Code: only verifier/package/docs changed for this contract chunk.
- Validation: `npm run verify:pricing-consolidation-contract`, `npm test`, docs scans, and `git diff --check`.

## Source Evidence Reviewed

Orders:

- `src/pricing/pricing.controller.ts` routes pricing suggestions through explicit Orders admin roles.
- `src/pricing/pricing.service.ts` generates pending suggestions, enforces the 30 percent approval guard, persists bounded approval/rejection provenance, calls `updateProductPrice`, and publishes a pricing change event only after approval.
- `src/orders/order-events.service.ts` publishes current pricing events to exchange `pricing.events` with routing key `pricing.price_changed`.
- `scripts/verify-pricing-safety.js` verifies pending/approve/reject behavior, the 30 percent safety guard, invalid-price rejection, duplicate approval rejection, and no payment-owned fields.

FlipFlop:

- `SPEC.md` states product list-pricing suggestions currently belonged in FlipFlop order-service historically, but should consolidate into standalone `orders-microservice`.
- `services/api-gateway/src/gateway/gateway.controller.ts` routes `/api/pricing/*` to `orders-microservice` through the `ordersPricing` target.
- `services/api-gateway/src/gateway/gateway.service.ts` resolves `ordersPricing` from `ORDERS_MICROSERVICE_URL` or `http://orders-microservice:3203`.
- `services/product-service/src/products/products.service.ts` reads product prices from Catalog product payloads and does not own shared pricing truth.
- `shared/clients/catalog-client.service.ts` reads Catalog current price through `GET /api/pricing/product/:productId/current`.
- `shared/rabbitmq/pricing-events.publisher.ts` still contains a FlipFlop local publisher for `pricing.price_changed`; no active FlipFlop subscriber for Orders pricing events was found in the reviewed source.

Catalog:

- `src/pricing/pricing.controller.ts` exposes guarded pricing writes through `POST /api/pricing`, `POST /api/pricing/bulk`, and `PUT /api/pricing/:id`, plus current price reads through `GET /api/pricing/product/:productId/current`.
- `src/pricing/pricing.service.ts` owns deterministic current-price selection, pricing validation, sale/base-price rules, validity windows, and bulk human-review guard.
- `src/products/products.controller.ts` exposes product update at `PUT /api/products/:id`, but product update is not the canonical Catalog pricing-write contract.

## Confirmed State

1. FlipFlop storefront product reads now derive displayed price from Catalog product pricing data, not from Orders.
2. FlipFlop gateway pricing routes are already pointed at Orders pricing endpoints, so the customer/operator pricing entrypoint can consolidate around Orders.
3. Orders pricing suggestions are human-approved and bounded, but the Catalog write implementation still uses a legacy generic product-update fallback shape: `PATCH /admin/products/:productId` or `PUT /products/:productId` with `{ price }`.
4. Catalog's confirmed pricing-write boundary is `POST /api/pricing` or `PUT /api/pricing/:pricingId` with `ProductPricing` fields such as `productId`, `basePrice`, `currency`, `priceType`, optional sale/cost/margin fields, validity windows, and protected Catalog auth.
5. Current Orders pricing event publication is a legacy raw payload on exchange `pricing.events`, routing key `pricing.price_changed`.
6. No current reviewed FlipFlop code requires a runtime Orders event-routing change before the Catalog write contract is fixed.

## Current Pricing Event Contract

Exchange: `pricing.events`

Routing key: `pricing.price_changed`

Publisher: `orders-microservice` after an approved pricing suggestion is applied.

Payload fields currently allowed:

- `productId`
- `productName`
- `oldPrice`
- `newPrice`
- `changePercent`
- `approvedAt`
- `suggestionId`

Forbidden payload fields:

- customer objects, addresses, billing fields, order totals, payment provider IDs, payment methods, variable symbols, provider responses, refunds, card data, bearer tokens, JWTs, secrets, passwords, raw AI responses, operator email addresses, and raw approval actor identities.

Compatibility decision:

- Do not silently change the routing key or wrap the payload in a new envelope in this chunk. A future `pricing.price_changed.v1` envelope can be introduced only after consumers are identified and a dual-publish or migration plan is approved.

## Catalog Update Boundary

The desired Orders-to-Catalog pricing update should target Catalog pricing, not product truth:

Catalog remains responsible for:

- validating pricing row shape;
- deterministic current-price selection;
- sale/base-price rules;
- bulk human-review guards;
- product truth, pricing history, and current-price reads.

Orders remains responsible for:

- generating pending suggestions;
- enforcing the Orders-side 30 percent approval guard;
- storing suggestion and approval provenance;
- invoking the approved Catalog pricing contract only after human approval;
- publishing bounded pricing-change signals after successful Catalog update.

Payments remains responsible for provider sessions, payment capture, variable symbols, provider webhooks, reconciliation, refunds, and payment transaction identity. No Goal 6 packet may add provider payment behavior to Orders.

## Owner-Approvable Follow-Up Packets

### G6-A Catalog Pricing Write Adapter

Objective: Replace the legacy product-update fallback in `PricingService.updateProductPrice()` with a Catalog pricing-write adapter that calls `POST /api/pricing` using approved Catalog service authentication.

Likely Orders files:

- `src/pricing/pricing.service.ts`
- optional `src/catalog/catalog-pricing.client.ts`
- `scripts/verify-pricing-safety.js`
- `docs/orchestrator/PRICING_CONSOLIDATION_AND_EVENT_CONTRACT.md`

Dependencies:

- confirmation of whether approved suggestions should create a regular active pricing row or a separate price type such as `orders_suggestion`.

Forbidden outcomes:

- no product description/media/category writes;
- no payment capture or provider fields;
- no raw token logging;
- no bulk/mass price update bypass.

Implementation note, 2026-06-21:

- Orders now writes approved suggestions to Catalog through `POST /api/pricing` with `productId`, `basePrice`, `currency="CZK"`, `priceType="regular"`, and `isActive=true`.
- The legacy `/admin/products/:productId` and `/products/:productId` price fallback is removed.

### G6-B Pricing Event Versioning

Status: dependency-gated.

Objective: Introduce `pricing.price_changed.v1` as a versioned event contract only after consumers and migration behavior are confirmed.

Options:

- keep legacy `pricing.price_changed` and add headers only;
- dual publish legacy plus `pricing.price_changed.v1` for one release window;
- switch routing key after all consumers are updated.

Dependencies:

- consumer inventory for FlipFlop, Catalog, Marketing, Leads, and any analytics service;
- owner-approved migration plan to avoid duplicate consumer processing.

### G6-C FlipFlop Local Pricing Publisher Decommission

Status: dependency-gated.

Objective: Remove or quarantine FlipFlop's local `PricingEventsPublisher` after Orders event contract and any consumers are confirmed.

Allowed repo:

- `flipflop-service` only, in a separate session.

Forbidden outcomes:

- do not change storefront displayed prices, cart price snapshots, checkout totals, or payment state without a dedicated FlipFlop validation plan.

## Parallel Execution

| Workstream | Status | Owner | Files | Dependencies | Validation |
| --- | --- | --- | --- | --- | --- |
| G6-A Catalog pricing adapter | dependency-gated | Orders runtime agent | `src/pricing/*`, optional Catalog client, verifier | approved Catalog service credential and price-row semantics | `npm test`, Catalog contract smoke |
| G6-B Pricing event versioning | dependency-gated | Orders event-contract agent | event contract docs/source/verifier | consumer inventory and migration plan | event verifier and consumer smoke |
| G6-C FlipFlop publisher decommission | dependency-gated | FlipFlop agent | FlipFlop shared/rabbitmq and docs | G6-B decision | FlipFlop build/tests |
| G6-D Coordinator integration | final integration | coordinator | shared IPS state/status | lane evidence | docs scans, full test summary |

## Validation Evidence

This contract is verified by:

```bash
npm run verify:pricing-consolidation-contract
```

The verifier checks that this document records the FlipFlop consolidation facts, Catalog pricing-write boundary, current event routing key and allowed fields, forbidden sensitive/payment fields, and future owner-approved work packets.
