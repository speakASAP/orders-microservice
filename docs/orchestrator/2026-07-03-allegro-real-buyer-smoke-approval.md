# Allegro Real Buyer Cabinet Smoke Approval Packet

Date: 2026-07-03
Owner: Orders reliability orchestrator
Status: approval-gated

## IPS Chain

- Vision: customer-facing marketplace cabinets must show only orders explicitly owned by the authenticated Auth subject while Orders remains the canonical lifecycle source.
- Goal Impact: Allegro buyer cabinet runtime is deployed and synthetic isolation is proven, but real-user list/detail/lifecycle smoke cannot complete until a real Auth subject has at least one approved subject-bound Allegro order row.
- System: Auth owns user identity and bearer subject; Allegro owns marketplace buyer-safe projection and `/cabinet/orders`; Orders owns canonical lifecycle and Warehouse handoff; Warehouse owns stock/fulfillment status.
- Feature: real Allegro buyer personal-cabinet lifecycle smoke.
- Task: prove a real user can see exactly their subject-bound Allegro order in `/cabinet/orders`, and cannot see unbound or other-subject rows.
- Execution Plan: use only an approved subject-bound fixture/order row or an existing already-bound row; do not authorize by email; do not expose raw marketplace ids, tokens, customer data, addresses, provider payloads, or tracking values.
- Coding Prompt: no runtime code change, no provider/courier implementation, no raw payload logging, no production data mutation without explicit owner approval.
- Code: approval packet only.
- Validation: sanitized read-only readiness check over live Auth and Allegro databases.

## Current Runtime Evidence

- k3s node `alfares` is Ready.
- Deployments are Ready `1/1`: `orders-microservice`, `allegro-service`, `allegro-api-gateway`, `allegro-frontend`, and `warehouse-microservice`.
- Live Allegro buyer cabinet runtime remains deployed on tag `aa612fa`.
- Read-only readiness check for approved user email `ssfskype@gmail.com` returned:
  - `auth_user_count=1`
  - `auth_subject_hash=6d0007036f05`
  - `allegro_bound_order_count=0`
- No Auth subject value, token, raw user row, raw order id, buyer data, address, provider payload, or secret was printed.

## Decision

Real buyer smoke cannot be honestly completed from existing data because there is no Allegro order row bound to the approved Auth subject. Synthetic buyer smoke remains useful but does not satisfy the real-user requirement.

## Approval Options

Choose exactly one before runtime mutation:

1. Existing-row binding smoke: product/marketplace owner identifies one existing Allegro order that is safe to bind to the approved Auth subject for smoke. Required approval must name the order-selection rule and cleanup/rollback expectation without exposing raw identifiers in public logs.
2. Synthetic fixture row smoke: approve creating one clearly synthetic Allegro order row and line item, bound to the approved Auth subject, with synthetic marketplace identifiers, synthetic buyer fields, and cleanup after smoke unless product wants a persistent fixture.
3. No mutation: keep the gate blocked until a natural real order is created by the user through an authenticated flow that writes `buyerAuthSubject`.

## Proposed Smoke Contract After Approval

- Acquire or mint an Auth-valid bearer for the approved subject without printing it.
- `GET /api/allegro/buyer/orders` returns HTTP 200 and exactly the approved bound row in the sanitized buyer DTO.
- `GET /api/allegro/buyer/orders/:id` for the approved row returns HTTP 200 and buyer-safe detail.
- A non-owned/missing detail id returns HTTP 404.
- Unauthenticated list returns HTTP 401.
- `/cabinet/orders` returns HTTP 200.
- If the row has a forwarded central Orders id, verify the central lifecycle read model renders; otherwise record `[MISSING: forwarded central Orders lifecycle row for this buyer fixture]`.

## Remaining Blockers

- `[MISSING: owner approval for existing-row binding, synthetic fixture row, or waiting for natural authenticated order creation.]`
- `[MISSING: Auth-valid real buyer bearer acquisition path that does not print token values.]`
- `[MISSING: real forwarded Allegro order lifecycle display smoke, unless the approved row already has central Orders forwarding.]`
- `[BLOCKED: provider/courier runtime remains contract-gated by missing owner/contract/credentials/mapping/tracking visibility policy.]`

Next step: approve one of the three options above, then run the bounded real buyer list/detail/lifecycle smoke.
