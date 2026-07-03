# Buyer Personal-Cabinet Ownership Mapping

Date: 2026-07-03
Repository: `/home/ssf/Documents/Github/orders-microservice`
Scope: Orders orchestrator reconciliation for Allegro buyer cabinet ownership

## Intent Preservation Chain

Vision: every buyer personal cabinet must show only orders that are explicitly owned by the authenticated buyer, and lifecycle state must come from Orders rather than marketplace-local status.

Goal Impact: Allegro can keep its deployed buyer cabinet and buyer-safe APIs, but the goal is not complete until a real Auth subject-bound order proves buyer list/detail/lifecycle display end to end.

System: Auth owns human identity and JWT `sub`; Allegro owns marketplace order projection, buyer-safe DTOs, and `/cabinet/orders`; Orders owns canonical lifecycle read models and cross-channel validation evidence; Warehouse owns fulfillment handoff/status authority.

Feature: buyer personal-cabinet ownership mapping.

Task: reconcile whether current source has a safe ownership mapping and define the next implementation gate.

Execution Plan: inspect Allegro schema/controller/service/spec/docs, Auth identity contracts, and Orders lifecycle read contracts; run focused non-mutating verifiers; update Orders orchestrator docs only.

Coding Prompt: do not authorize by `buyerEmail`; do not bind or backfill production rows without approval; do not print tokens, customer PII, raw order rows, provider payloads, tracking values, or database dumps.

Code: documentation-only reconciliation in Orders.

Validation: `LOGGING_SERVICE_URL=http://logging-microservice:3367 npx ts-node services/allegro-service/src/allegro/orders/orders.service.spec.ts` passed in Allegro; `npm run verify:channel-lifecycle-runtime-evidence` passed in Orders with gated status.

## Current Mapping

Approved-safe mapping is Auth subject binding:

- Auth bearer subject: `req.user.sub`, `req.user.id`, or equivalent validated Auth subject.
- Allegro buyer ownership field: `AllegroOrder.buyerAuthSubject`.
- Orders lifecycle ownership fields: immutable order snapshot `customer.authUserId` and `customer.subject`.

The buyer cabinet rule is:

```text
authenticated Auth subject == AllegroOrder.buyerAuthSubject
```

or, for central Orders lifecycle reads:

```text
authenticated Auth subject == Order.customer.authUserId
authenticated Auth subject == Order.customer.subject
```

Email is not an ownership rule. `buyerEmail` and Auth `email` may only be secondary display/recovery signals after subject ownership is already proven and the DTO allows display.

## Allegro Evidence

Current Allegro source/runtime evidence:

- Prisma `AllegroOrder` includes `buyerAuthSubject` and an index.
- `BuyerOrdersController` exposes `GET /allegro/buyer/orders` and `GET /allegro/buyer/orders/:id` behind `JwtAuthGuard`.
- `OrdersService.getBuyerOrders()` builds `where: { buyerAuthSubject: requireBuyerSubject(actor) }`.
- Missing actor subject fails closed with `__no_allegro_buyer_actor__`.
- `OrdersService.getBuyerOrder()` uses `findFirst({ id, buyerAuthSubject })`; cross-buyer and unbound rows return 404.
- `toBuyerSafeOrderDto()` excludes raw Allegro payloads, buyer email/login, delivery address, raw forwarding attempts, and operator diagnostics.
- Seller/operator reads remain separate and workspace-scoped through account ownership/forwarding attempts, not buyer subject binding.

Focused spec evidence:

- Buyer list filters only by `buyerAuthSubject`.
- Buyer A sees only Buyer A rows even when Buyer A and Buyer B share the same email fixture.
- Unbound marketplace rows are hidden.
- Buyer detail for another subject returns 404.
- Seller dashboard read path does not include `buyerAuthSubject`.
- Buyer DTO omits `buyerEmail`, `buyerLogin`, delivery address text, `rawData`, and `forwardingAttempts`.

## Orders Evidence

Orders accepts and normalizes customer Auth subject snapshots in `orders.create.v1`:

- `customer.authSubject`
- `customer.authUserId`
- `customer.subject`

Orders customer lifecycle reads prefer subject matching through `customer.authUserId` and `customer.subject`, with email support still present for legacy customer lifecycle reads. For Allegro buyer ownership, the stronger rule remains subject binding through `buyerAuthSubject` and central Orders customer subject snapshots.

## Current Blocker

The implementation blocker is no longer missing source code for buyer mapping. The remaining blocker is live ownership evidence:

- `[MISSING: real Allegro buyer Auth bearer plus approved subject-bound Allegro order row.]`
- `[MISSING: real forwarded Allegro order whose central Orders lifecycle read model is available to the bound buyer.]`
- `[MISSING: approved historical binding/backfill source if old imported Allegro rows should appear in buyer cabinets.]`

Current live evidence from the Orders verifier keeps Allegro at:

```text
buyer_route_live_isolation_proven_real_order_and_central_lifecycle_blocked
```

## Forbidden Fallbacks

Do not implement any of these without explicit product/Auth/security risk acceptance:

- `Auth.email == AllegroOrder.buyerEmail` as a production authorization rule.
- UI-only filtering of buyer rows.
- Historical marketplace row visibility without a persisted subject binding or approved audited binding resolver.
- Reusing seller/operator `/dashboard/orders` as a buyer personal cabinet.

## Agent-Ready Next Packet

Owner: Allegro real buyer smoke worker.

Objective: prove one real buyer personal-cabinet lifecycle path using a real Auth bearer and one real forwarded Allegro order already subject-bound through buyerAuthSubject.

Allowed actions:

- Read existing Allegro buyer API/UI routes.
- Use an approved real buyer bearer without printing token values.
- Use a real forwarded subject-bound order row; synthetic fixture evidence remains historical and does not close the real lifecycle display gate.
- Verify buyer list/detail and central lifecycle display using sanitized counts/statuses only.

Forbidden actions:

- No email-only binding.
- No unapproved DB row update/backfill.
- No provider writes.
- No raw order/customer/provider/tracking output.
- No fulfillment status mutation.

Expected validation:

- Buyer API list returns 200 and includes exactly the approved bound order.
- Buyer detail returns 200 for the bound order.
- Cross-buyer or unbound detail returns 404.
- Buyer DTO contains no raw buyer email/login/address/rawData/forwarding internals.
- `centralOrderReadModel.state=available` for the forwarded central order.
- Browser or API proof records the visible lifecycle stage without raw DOM or PII.

Next action: get approval for one real subject-bound Allegro order source, then run the bounded real buyer list/detail/lifecycle smoke.
