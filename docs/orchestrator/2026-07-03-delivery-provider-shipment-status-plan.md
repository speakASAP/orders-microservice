# Delivery Provider Shipment Status Integration Plan

```yaml
id: ORDERS-DELIVERY-PROVIDER-SHIPMENT-STATUS-PLAN
status: source-contract-landed-implementation-gated
owner: Orders orchestrator
created: 2026-07-03
last_updated: 2026-07-03
completeness_level: source-contract-landed
upstream:
  - docs/IMPLEMENTATION_ORCHESTRATOR.md
  - docs/IMPLEMENTATION_STATE.md
  - docs/orchestrator/ORDER_LIFECYCLE_READ_MODEL.md
  - docs/orchestrator/ORDER_EVENT_CONTRACTS.md
  - docs/orchestrator/ORDER_STATUS_TRANSITIONS.md
  - warehouse-microservice docs/intent-preservation/context-packages/CP-WH-G16.md
  - warehouse-microservice src/fulfillment/*
downstream:
  - docs/orchestrator/STATUS.md
  - docs/IMPLEMENTATION_STATE.md
related_adrs: []
```

## Intent Chain

- Vision: customers and admins should see accurate post-warehouse delivery progress without Orders becoming a courier system or exposing tracking secrets in events.
- Goal Impact: the already-live Warehouse fulfillment callback proves `requested -> collecting` can flow to Orders; the next slice must connect only an approved delivery-provider status source after Warehouse hands a parcel to a carrier.
- System: Warehouse owns fulfillment and carrier handoff state; a delivery-provider owner must own courier credentials, provider polling/webhooks, and raw tracking payloads; Orders owns canonical lifecycle projection and bounded lifecycle events; Notifications consumes bounded Orders events.
- Feature: delivery-provider shipment/tracking status integration after Warehouse fulfillment status projection.
- Task: discover provider ownership, define the bounded status contract, then implement the smallest adapter only after a concrete provider/source exists.
- Execution Plan: use Allegro Ship with Allegro/shipment APIs as the approved initial provider source for Allegro-origin orders, then keep implementation blocked until source-specific contracts, credentials, mapping, and sensitive-data policy are resolved; do not create fake simulators or move provider ownership into Orders.
- Coding Prompt: remote-only on Alfares; mark missing provider facts explicitly; avoid DB migrations, deploys, secret changes, raw tracking data in events, and broad lifecycle schema changes.
- Code: documentation only in this slice.
- Validation: remote repository/status discovery, Worker E `019f265e-7e9e-7a03-b621-f030cc2ffd4e` and Worker F `019f265e-a504-78b3-acd8-c8ff42c745c1` creation evidence, plus `git diff --check` after docs update.

## Discovery Evidence

Remote repositories inspected under `/home/ssf/Documents/Github` on 2026-07-03:

| Repository | HEAD | Dirty status | Relevant finding |
| --- | --- | --- | --- |
| `orders-microservice` | `58f8a66` | clean before this docs slice | Has legacy `src/shipments/*` CRUD, lifecycle projection, and docs marking provider source missing. |
| `warehouse-microservice` | `8b16fdb` | clean | Owns `fulfillment_orders` and statuses through `handed_to_delivery`, `in_delivery`, `delivered`, `not_delivered`, `returned`; no courier-provider adapter discovered. |
| `notifications-microservice` | `20cd12a` | clean | Consumes bounded Orders lifecycle/shipped events and rejects tracking fields. |
| `suppliers-microservice` | `9745f5f` | clean | No delivery-provider shipment-status source found in focused scan. |
| `catalog-microservice` | `5c6c033` | dirty unrelated docs/contract work | Catalog owns product truth, not shipment provider status. |
| `allegro` | `ee7b2ad` | clean | Approved initial provider/courier owner source for Allegro-origin orders: Allegro Ship with Allegro/shipment APIs in `allegro`; docs still gate OAuth scopes, fulfillment owner, read-only shipment projection, credential source, and write actions. |
| `aukro` | `f0847cf` | clean | No provider tracking source found. |
| `heureka` | `824465e` | clean | No provider tracking source found. |
| `bazos` | `2d47d16` | clean | No provider tracking source found. |
| `flipflop` | `f758f94` | clean | No provider tracking source found. |

Repository-name discovery for `delivery`, `courier`, `carrier`, `shipment`, `shipping`, `tracking`, `provider`, or `fulfillment` returned no standalone delivery/courier/provider/tracking-source repository.

## Boundary Decision

Decision: source approved, implementation still blocked.

Approved initial source: `allegro` owns the first provider/courier source lane for Allegro-origin orders, using Allegro Ship with Allegro/shipment APIs. This is not a generic all-channel courier source and does not approve Orders-owned courier integration.

Reason: Allegro is the only inspected repo with a concrete marketplace shipment API surface and existing channel/order projection context. Allegro docs already separate shipment/package/document projection and One Fulfillment from Orders, and mark shipment label/document creation as fulfillment-owner gated. Orders remains only the lifecycle projection owner; Warehouse remains the bounded status intake; Allegro/provider code must own raw provider payloads and credentials.

Exact blockers:

- `[APPROVED: initial delivery-provider/courier owner source is allegro Ship with Allegro/shipment APIs for Allegro-origin orders only.]`
- `[LANDED: Allegro shipment source contract in allegro commit 2183fe8, including endpoint choice, snapshot contract, idempotency/timestamp/retry rules, and sanitized fixture requirements.]`
- `[MISSING: mapping from Allegro shipment/package/fulfillment statuses to Warehouse fulfillment statuses and Orders lifecycle stages after handed_to_delivery.]`
- `[MISSING: approved sensitive-data policy for tracking number/URL visibility by role and event exclusion.]`
- `[MISSING: runtime credential source in Vault/ExternalSecret for allegro-service shipment/fulfillment scope, not Orders.]`
- `[MISSING: validation fixture set with sensitive provider fields redacted or explicitly forbidden.]`

Known non-blockers:

- Orders can already project bounded Warehouse fulfillment statuses into lifecycle events.
- Warehouse can already sync bounded fulfillment-order status updates back to Orders.
- Notifications can already consume bounded Orders lifecycle events and send operational lifecycle notifications.

## Proposed Contract

Provider-owned adapter output should be a bounded internal status update to Warehouse, not a raw provider webhook into Orders:

```json
{
  "status": "handed_to_delivery|in_delivery|delivered|not_delivered|returned",
  "reasonCode": "PROVIDER_STATUS_UPDATE",
  "statusReference": "provider-event-or-poll-id",
  "occurredAt": "2026-07-03T00:00:00.000Z",
  "provider": "allegro",
  "shipmentLookupRequired": true
}
```

Rules:

- Raw tracking number, tracking URL, courier payload, customer address, tokens, provider credentials, and provider response bodies must not enter Orders events.
- Warehouse may persist operational handoff/status metadata needed for fulfillment operations, but provider secrets and raw provider payloads stay in the provider owner.
- Orders receives only Warehouse's bounded fulfillment status callback and publishes the existing bounded lifecycle event.
- Notifications may render shipment/lifecycle copy from Orders event metadata and fetch sensitive details only through an approved role-scoped read API if product requires it.

## Parallel Execution Plan

| Workstream | Status | Owner role | Allowed files | Forbidden files/actions | Dependencies | Expected output | Validation evidence | Handoff notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1 Provider discovery | completed | Orders orchestrator | repo discovery docs, `docs/orchestrator/STATUS.md`, `docs/IMPLEMENTATION_STATE.md` | code, secrets, DB, deploy | none | approved initial source: `allegro` Ship with Allegro/shipment APIs for Allegro-origin orders only | `find`/`rg` evidence, git status | Source is named; implementation remains contract-gated. |
| P2 Warehouse provider-status intake contract | contract landed: Warehouse `f104202` | Warehouse owner | `warehouse-microservice/docs/**`, narrow `src/fulfillment/**` contract/tests after Allegro status contract is drafted | raw provider credentials, Orders code, DB migrations without approval | Allegro source approval; exact Allegro status payloads may remain `[MISSING]` | accepted statuses after `handed_to_delivery`, idempotency and validation rules | focused fulfillment service tests, build, diff check | Warehouse is the bounded intake before Orders projection. |
| P3 Allegro provider contract/adapter lane | source contract landed: Allegro `2183fe8`; adapter dependency-gated | Allegro provider owner | `allegro` docs plus narrow read-only shipment client/projection files after contract approval | Orders/Warehouse broad schema changes, fake simulator, Vault mutations without approval, shipment label/document writes | P2 plus OAuth scopes and credential source | read-only Allegro shipment polling/projection normalizes provider events to Warehouse contract | provider fixture tests, sensitive-field checks, retry/idempotency tests | Must keep raw payloads/credentials in Allegro owner. |
| P4 Orders lifecycle verification | final integration | Orders owner | Orders lifecycle/event docs and focused verifier only if Warehouse contract changes | DB migration, broad schema change, raw tracking fields in events | P2/P3 | prove Warehouse status callback still maps to lifecycle stages/events | `npm run verify:order-lifecycle-read-model`, `npm run verify:event-contracts`, `git diff --check` | No Orders code expected unless bounded status enum changes. |
| P5 Notifications copy/recipient verification | dependency-gated | Notifications owner | `notifications-microservice/src/notifications/orders-events/**`, docs/tests | direct provider consumption, tracking values in notifications | P4 event evidence | shipment/lifecycle notification remains bounded | focused router spec, build, health smoke if deployed | Existing consumer can route bounded lifecycle events. |

Merge order:

1. Provider source approval docs.
2. Allegro shipment source contract and sensitive-data policy. Completed for source contract in Allegro `2183fe8`; sensitive-data policy in Orders `6743613`.
3. Warehouse bounded status intake contract. Completed in Warehouse `f104202`; implementation/tests remain gated by adapter source and idempotency ledger decision.
4. Allegro-owned read-only provider adapter and fixture tests.
5. Orders verifier/doc update only if the Warehouse status enum or event projection changes.
6. Notifications copy/routing validation only after bounded Orders event evidence exists.

Integration owner: Orders orchestrator.

Validation owner: final integration lane, with service owners providing focused test/build evidence before merge.

## Agent-Ready Prompts

### Warehouse Contract Agent

Objective: define the Warehouse-owned bounded intake for Allegro shipment status updates after fulfillment order `handed_to_delivery`, without raw provider payloads or credentials in Orders. Work remote-only on Alfares in `/home/ssf/Documents/Github/warehouse-microservice`. Approved source: `allegro` Ship with Allegro/shipment APIs for Allegro-origin orders only. Allowed files: Warehouse fulfillment docs, focused DTO/service/tests under `src/fulfillment/**` only after the Allegro status contract is drafted. Forbidden: DB migrations, deploys, secrets, raw tracking payload persistence, Orders edits. Output: contract diff, status mapping, idempotency rules, validation commands/results, blockers.

### Allegro Provider Contract Agent

Objective: draft the Allegro-owned read-only shipment status source contract for Ship with Allegro/shipment APIs. Work remote-only on Alfares in `/home/ssf/Documents/Github/allegro`. Allowed files: Allegro orchestrator docs and, after contract approval only, narrow read-only client/projection/test files. Forbidden: Orders/Warehouse edits, fake simulators, Vault mutations, deploys, shipment label/document writes. Output: endpoint/source choice, OAuth scope blockers, sanitized payload contract, sensitive-field rejection, retry/idempotency policy, and handoff to Warehouse contract owner.

### Orders Verification Agent

Objective: after Warehouse/provider owners provide a bounded status update contract, verify Orders lifecycle projection and event exclusion still hold. Work remote-only on Alfares in `/home/ssf/Documents/Github/orders-microservice`. Allowed files: verifier/docs only unless Warehouse introduces a new approved status value. Forbidden: DB migrations, provider credentials, raw tracking fields in events, deploys. Output: verifier evidence and STATUS/IMPLEMENTATION_STATE update.
