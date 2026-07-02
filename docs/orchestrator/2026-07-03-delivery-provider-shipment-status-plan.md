# Delivery Provider Shipment Status Integration Plan

```yaml
id: ORDERS-DELIVERY-PROVIDER-SHIPMENT-STATUS-PLAN
status: blocked-pending-provider-source
owner: Orders orchestrator
created: 2026-07-03
last_updated: 2026-07-03
completeness_level: planned
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
- Execution Plan: keep this slice blocked until the provider repo/API/credential source is identified; do not create fake simulators or move provider ownership into Orders.
- Coding Prompt: remote-only on Alfares; mark missing provider facts explicitly; avoid DB migrations, deploys, secret changes, raw tracking data in events, and broad lifecycle schema changes.
- Code: documentation only in this slice.
- Validation: remote repository/status discovery plus `git diff --check` after docs update.

## Discovery Evidence

Remote repositories inspected under `/home/ssf/Documents/Github` on 2026-07-03:

| Repository | HEAD | Dirty status | Relevant finding |
| --- | --- | --- | --- |
| `orders-microservice` | `58f8a66` | clean before this docs slice | Has legacy `src/shipments/*` CRUD, lifecycle projection, and docs marking provider source missing. |
| `warehouse-microservice` | `8b16fdb` | clean | Owns `fulfillment_orders` and statuses through `handed_to_delivery`, `in_delivery`, `delivered`, `not_delivered`, `returned`; no courier-provider adapter discovered. |
| `notifications-microservice` | `20cd12a` | clean | Consumes bounded Orders lifecycle/shipped events and rejects tracking fields. |
| `suppliers-microservice` | `9745f5f` | clean | No delivery-provider shipment-status source found in focused scan. |
| `catalog-microservice` | `5c6c033` | dirty unrelated docs/contract work | Catalog owns product truth, not shipment provider status. |
| `allegro` | `ed0dedd` | clean | Prior docs note `[MISSING: shipment-management implementation]`. |
| `aukro` | `f0847cf` | clean | No provider tracking source found. |
| `heureka` | `824465e` | clean | No provider tracking source found. |
| `bazos` | `2d47d16` | clean | No provider tracking source found. |
| `flipflop` | `f758f94` | clean | No provider tracking source found. |

Repository-name discovery for `delivery`, `courier`, `carrier`, `shipment`, `shipping`, `tracking`, `provider`, or `fulfillment` returned no standalone delivery/courier/provider/tracking-source repository.

## Boundary Decision

Decision: blocked for implementation now.

Reason: no concrete provider/status source, provider repo, courier webhook contract, polling API, credential source, or owned adapter service was safely discoverable. Implementing an adapter in Orders would invent provider ownership and conflict with existing boundaries.

Exact blockers:

- `[MISSING: delivery-provider/courier owner repository or approved existing service that owns courier credentials and raw tracking payloads.]`
- `[MISSING: provider status source contract: webhook or polling, authentication method, idempotency key, timestamp semantics, retry/error semantics, and sample payloads.]`
- `[MISSING: mapping from provider statuses to Warehouse fulfillment statuses and Orders lifecycle stages after handed_to_delivery.]`
- `[MISSING: approved sensitive-data policy for tracking number/URL visibility by role and event exclusion.]`
- `[MISSING: runtime credential source in Vault/ExternalSecret for the provider owner, not Orders.]`
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
  "provider": "[MISSING: approved provider key]",
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
| P1 Provider discovery | ready now | Orchestrator/discovery owner | repo discovery docs, `docs/orchestrator/STATUS.md`, `docs/IMPLEMENTATION_STATE.md` | code, secrets, DB, deploy | none | name the provider owner repo/service or confirm missing | `find`/`rg` evidence, git status | This slice completed initial discovery and found no source. |
| P2 Warehouse provider-status intake contract | dependency-gated | Warehouse owner | `warehouse-microservice/docs/**`, narrow `src/fulfillment/**` contract/tests after approval | raw provider credentials, Orders code, DB migrations without approval | P1 provider owner and payload contract | accepted statuses after `handed_to_delivery`, idempotency and validation rules | focused fulfillment service tests, build, diff check | Warehouse is the preferred bounded intake before Orders projection. |
| P3 Provider adapter implementation | blocked | Provider owner | owning provider repo adapter/client files and docs | Orders lifecycle schema, fake simulator, Vault mutations without approval | P1/P2 plus credential source | polling/webhook adapter normalizes provider events to Warehouse contract | provider fixture tests, sensitive-field checks, retry/idempotency tests | Must keep raw payloads/credentials in provider owner. |
| P4 Orders lifecycle verification | final integration | Orders owner | Orders lifecycle/event docs and focused verifier only if Warehouse contract changes | DB migration, broad schema change, raw tracking fields in events | P2/P3 | prove Warehouse status callback still maps to lifecycle stages/events | `npm run verify:order-lifecycle-read-model`, `npm run verify:event-contracts`, `git diff --check` | No Orders code expected unless bounded status enum changes. |
| P5 Notifications copy/recipient verification | dependency-gated | Notifications owner | `notifications-microservice/src/notifications/orders-events/**`, docs/tests | direct provider consumption, tracking values in notifications | P4 event evidence | shipment/lifecycle notification remains bounded | focused router spec, build, health smoke if deployed | Existing consumer can route bounded lifecycle events. |

Merge order:

1. Provider discovery/contract docs.
2. Warehouse bounded status intake and tests.
3. Provider-owned adapter and fixture tests.
4. Orders verifier/doc update only if the Warehouse status enum or event projection changes.
5. Notifications copy/routing validation only after bounded Orders event evidence exists.

Integration owner: Orders orchestrator.

Validation owner: final integration lane, with service owners providing focused test/build evidence before merge.

## Agent-Ready Prompts

### Warehouse Contract Agent

Objective: define the Warehouse-owned bounded intake for delivery-provider status updates after fulfillment order `handed_to_delivery`, without raw provider payloads or credentials in Orders. Work remote-only on Alfares in `/home/ssf/Documents/Github/warehouse-microservice`. Allowed files: Warehouse fulfillment docs, focused DTO/service/tests under `src/fulfillment/**` only if an approved provider contract exists. Forbidden: DB migrations, deploys, secrets, raw tracking payload persistence, Orders edits. Output: contract diff, status mapping, idempotency rules, validation commands/results, blockers.

### Provider Adapter Agent

Objective: implement a provider-owned adapter only after the provider repo/API/credential source is identified. Work remote-only on Alfares in the owning provider repo. Allowed files: narrow adapter/client/test docs for the provider owner. Forbidden: Orders/Warehouse broad schema changes, fake simulators, Vault mutations, deploys. Output: provider fixture mapping, sensitive-field rejection, retry/idempotency evidence, and handoff to Warehouse contract owner.

### Orders Verification Agent

Objective: after Warehouse/provider owners provide a bounded status update contract, verify Orders lifecycle projection and event exclusion still hold. Work remote-only on Alfares in `/home/ssf/Documents/Github/orders-microservice`. Allowed files: verifier/docs only unless Warehouse introduces a new approved status value. Forbidden: DB migrations, provider credentials, raw tracking fields in events, deploys. Output: verifier evidence and STATUS/IMPLEMENTATION_STATE update.
