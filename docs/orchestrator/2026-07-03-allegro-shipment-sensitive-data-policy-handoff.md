# Allegro Shipment Sensitive Data Policy Handoff

Date: 2026-07-03

Worker: P3 Orders orchestrator provider/courier lane

## Intent Chain

- Vision: customers and admins should see accurate post-warehouse delivery progress without Orders becoming a courier system or leaking courier/provider secrets through events, logs, or broad read models.
- Goal Impact: the approved Allegro provider source can move toward contract work only after sensitive tracking visibility, event exclusion, and log exclusion rules are explicit.
- System: `allegro` owns Allegro-origin provider/courier source integration through Ship with Allegro/shipment APIs; Warehouse owns bounded fulfillment status intake; Orders owns canonical lifecycle projection and bounded events; Notifications consumes bounded Orders events only.
- Feature: sensitive-data policy for Allegro shipment/tracking visibility and event exclusion.
- Task: draft documentation-only policy for what Orders, Warehouse, Allegro, and Notifications may expose or must exclude.
- Execution Plan: preserve existing Orders event contracts and logger checks; keep raw provider payloads and credentials in the provider owner; require role-scoped read APIs before any tracking number or tracking URL is displayed.
- Coding Prompt: remote-only on Alfares; no runtime code, migrations, deploys, secret mutation, fake providers, raw provider payload handling, or production data queries.
- Code: documentation-only handoff in this file.
- Validation: read-only source inspection plus `git diff --check`; no tests, deploys, migrations, or secrets touched.

## Repository Evidence

Commands were run remotely through `ssh alfares` in `/home/ssf/Documents/Github/*`.

| Repository | HEAD | Dirty status observed | Evidence used |
| --- | --- | --- | --- |
| `orders-microservice` | `be3a6d3 docs: record flipflop admin rbac hardening` | dirty docs before this worker: `docs/IMPLEMENTATION_STATE.md`, `docs/orchestrator/2026-07-03-delivery-provider-shipment-status-plan.md`, `docs/orchestrator/STATUS.md` | Orders event contracts, sensitive-data review, logger redaction verifier, shipment/admin surfaces, lifecycle read model, delivery provider plan. |
| `notifications-microservice` | `20cd12a docs: record orders lifecycle notification smoke` | clean | Orders event DTO and router reject forbidden payload keys and route only bounded event summary fields. |

Files inspected:

- `orders-microservice/docs/orchestrator/ORDER_EVENT_CONTRACTS.md`
- `orders-microservice/docs/orchestrator/SENSITIVE_DATA_REVIEW.md`
- `orders-microservice/docs/orchestrator/2026-07-03-delivery-provider-shipment-status-plan.md`
- `orders-microservice/docs/orchestrator/2026-07-02-marketplace-notifications-worker-handoff.md`
- `orders-microservice/docs/orchestrator/ORDER_LIFECYCLE_READ_MODEL.md`
- `orders-microservice/docs/orchestrator/event-fixtures/orders.order.shipped.v1.json`
- `orders-microservice/docs/orchestrator/event-fixtures/orders.order.lifecycle_changed.v1.json`
- `orders-microservice/scripts/verify-event-contracts.js`
- `orders-microservice/scripts/verify-sensitive-logging.js`
- `orders-microservice/src/orders/order-event-contracts.ts`
- `orders-microservice/src/orders/orders.controller.ts`
- `orders-microservice/src/orders/order-events.service.ts`
- `orders-microservice/src/logger/logger.service.ts`
- `orders-microservice/src/shipments/shipment.entity.ts`
- `orders-microservice/src/shipments/shipments.controller.ts`
- `orders-microservice/src/admin/admin.service.ts`
- `notifications-microservice/src/notifications/orders-events/order-event.dto.ts`
- `notifications-microservice/src/notifications/orders-events/orders-event-notification.router.ts`
- `notifications-microservice/src/notifications/orders-events/orders-event-notification.router.spec.ts`

## Source Decision

Approved source decision from the Orders orchestrator:

- `allegro` is the initial provider/courier owner source for Allegro-origin orders only.
- The intended provider surface is Ship with Allegro/shipment APIs.
- This approval does not make Orders the courier integration owner.
- This approval does not authorize all-channel tracking implementation.

Implementation remains blocked by:

- `[MISSING: Allegro shipment status source contract: read/polling endpoint selection, OAuth scopes, authentication method, idempotency key, timestamp semantics, retry/error semantics, and sanitized sample payloads.]`
- `[MISSING: mapping from Allegro shipment/package/fulfillment statuses to Warehouse fulfillment statuses and Orders lifecycle stages after handed_to_delivery.]`
- `[MISSING: runtime credential source in Vault/ExternalSecret for allegro-service shipment/fulfillment scope, not Orders.]`
- `[MISSING: validation fixture set with sensitive provider fields redacted or explicitly forbidden.]`
- `[MISSING: product-approved tracking number/URL display requirements by user role, channel, and order state.]`

## Sensitive Data Classification

| Data | Classification | Owner | Policy |
| --- | --- | --- | --- |
| Provider credentials, OAuth tokens, refresh tokens, client secrets, bearer values | secret | Allegro/Auth/Vault owner | Never stored, logged, documented, emitted, or read by Orders. |
| Raw Allegro shipment/package/fulfillment response bodies | provider raw payload | Allegro provider owner | Never copied into Orders events, Orders logs, Notifications events, or Warehouse callbacks. Store only if Allegro owner has an approved raw-payload policy. |
| Tracking number | sensitive operational delivery data | Provider/Warehouse/approved read API owner | Excluded from events/logs by default. Future display requires role-scoped read policy and masked-by-default DTO. |
| Tracking URL | sensitive operational delivery data | Provider/Warehouse/approved read API owner | Excluded from events/logs by default. Future display requires role-scoped read policy and URL safety validation. |
| Courier label/document URL or binary | sensitive courier document | Allegro/provider owner | Never exposed through Orders events. Shipment label/document writes are out of scope for this lane. |
| Customer name, email, phone, shipping address, billing address, tax id | customer PII/address data | Orders/Auth/channel owners | Excluded from provider events/logs and lifecycle events; read APIs remain role-scoped. |
| Provider status code, normalized delivery status, occurredAt, provider event id/poll id | bounded operational metadata | Provider/Warehouse/Orders | Allowed only after normalization and allowlist validation. |
| Order id, channel, lifecycle stage, payment status name, fulfillment status name, delivery status name | bounded Orders lifecycle metadata | Orders | Allowed in Orders lifecycle events if it contains no sensitive nested fields. |

## Event Exclusion Rules

Orders events, Notifications Orders-event DTOs, Warehouse callbacks, and provider handoffs must exclude these fields at every nesting level:

- `trackingNumber`
- `trackingUrl`
- raw tracking URLs embedded in messages, notes, context, or provider metadata
- courier/provider response body
- provider webhook body
- shipment label URL, document URL, binary document reference, or printable payload
- provider credentials, OAuth tokens, refresh tokens, bearer tokens, JWTs, secrets, passwords, client secrets, API keys
- customer object, customer email, customer phone, shipping address, billing address, street, postal code, tax id
- raw payment provider details, card/bank fields, reconciliation payloads
- raw Warehouse response bodies, reservation records, or warehouse item internals
- free-text customer notes, internal notes, operator notes, provider error descriptions that may contain copied PII

Allowed event-level shipment signal:

```json
{
  "orderId": "order-1001",
  "shipmentStatus": "shipped",
  "shipmentLookupRequired": true
}
```

Allowed lifecycle delivery signal:

```json
{
  "orderId": "order-1001",
  "lifecycleStage": "handed_to_delivery|in_delivery|received|not_received|returned",
  "deliveryStatus": "bounded-status-name",
  "warehouseHandoff": {
    "status": "bounded-warehouse-status",
    "reasonCode": "PROVIDER_STATUS_UPDATE",
    "actor": "warehouse-microservice"
  }
}
```

Provider-owned adapter output to Warehouse must be normalized before Orders sees it:

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

The normalized callback must not include tracking number, tracking URL, raw provider status object, raw provider error body, customer address, or credential material.

## Log Exclusion Rules

Logs may include:

- operation name
- service/context name that does not include sensitive terms
- order id or shipment id
- provider key `allegro`
- normalized status
- safe reason code
- bounded outcome
- duration, retry count, processed count
- redacted or coarse error code

Logs must not include:

- raw provider request/response body
- raw exception body from Allegro, Warehouse, Orders, Auth, or Notifications if it could contain payload data
- customer/contact/address/payment/tracking fields or values
- tokens, headers, cookies, authorization strings, OAuth credentials, Vault/ExternalSecret values
- tracking number or tracking URL, even partially, until a product/security policy explicitly approves a masked form for logs

Orders currently has logger redaction and static checks in `scripts/verify-sensitive-logging.js`; future Allegro/Warehouse work should add equivalent service-local checks or extend existing checks before enabling provider traffic.

## Role-Scoped Read Visibility Requirements

Default rule: tracking number and tracking URL are hidden from all Orders events, Notifications events, logs, and aggregate dashboards.

Future display is blocked until product/security approves a read contract:

- `[MISSING: product-approved tracking visibility matrix for buyer, support/operator, admin, warehouse operator, and service-to-service readers.]`
- `[MISSING: whether buyers may see full tracking number, masked tracking number, direct courier URL, or only a "tracking available" indicator.]`
- `[MISSING: whether Allegro-origin orders should link to Allegro-managed tracking UI instead of exposing courier URL directly.]`
- `[MISSING: whether support/operator roles may reveal full tracking only after explicit action/audit.]`
- `[MISSING: audit requirements for tracking reveal: actor id, order id, timestamp, reason code, and whether reveal count must be stored.]`
- `[MISSING: retention and deletion rules for tracking number/URL if persisted outside Allegro provider owner.]`

Minimum future read policy if display is approved:

| Reader | Default visibility | Full value allowed? | Required guard |
| --- | --- | --- | --- |
| Buyer/customer | status only; `trackingAvailable: true` allowed | `[MISSING: product/security approval]` | Auth `sub` must match persisted customer subject/order ownership; no email-only authorization. |
| Marketplace seller/operator | status and masked tracking indicator only | `[MISSING: product/security approval]` | Channel/service-scoped role plus order channel/account scope. |
| Orders read-only/admin dashboard | status, masked tracking indicator, tracking URL present boolean | `[MISSING: product/security approval for reveal]` | `internal:orders-microservice:readonly` or admin role; full reveal requires stronger role if approved. |
| Orders action admin / support | masked by default; explicit reveal only if approved | `[MISSING: product/security approval]` | `global:superadmin` or approved support/action role plus audit event. |
| Warehouse service | normalized status metadata only | No raw provider value by default | `internal:warehouse-microservice:service`; no raw provider payload. |
| Notifications service | bounded lifecycle/shipped event fields only | No | Orders event validator rejects forbidden tracking fields. |
| Allegro provider adapter | provider raw value during provider processing | Yes inside provider owner boundary only | Allegro-owned credentials and redaction; no Orders event/log propagation. |

If role requirements remain missing, implementation must fail closed:

- do not add tracking fields to Orders DTOs;
- do not add tracking fields to event fixtures;
- do not include tracking fields in Notifications template data;
- do not expose courier URLs in customer/admin UI;
- return only bounded status and `shipmentLookupRequired` / `trackingAvailable` booleans if required.

## Agent-Ready Handoff

### Allegro Provider Worker

Objective: draft the Allegro-owned Ship with Allegro/shipment status source contract for Allegro-origin orders without leaking raw provider payloads or credentials into Orders, Warehouse, or Notifications.

Allowed scope:

- remote repo `/home/ssf/Documents/Github/allegro`
- Allegro orchestrator docs
- source-contract docs for endpoint choice, OAuth scope blockers, polling/idempotency, sanitized fixture shape
- narrow read-only client/projection code only after the source contract is accepted

Forbidden:

- Orders code edits
- Warehouse code edits
- Vault/ExternalSecret mutation
- deploys
- migrations
- shipment label/document writes
- fake providers or simulated courier truth
- raw tracking number/URL in events/logs/fixtures

Expected output:

- endpoint/source choice or `[MISSING: endpoint/source choice]`
- required OAuth scopes or `[MISSING: OAuth scope confirmation]`
- sanitized sample payload with sensitive provider fields redacted
- mapping proposal to Warehouse bounded statuses
- retry/idempotency policy
- evidence that tests/fixtures reject tracking fields outside approved provider boundary

### Warehouse Worker

Objective: define the Warehouse-owned bounded intake for normalized Allegro shipment status updates after fulfillment handoff without storing raw provider payloads or exposing tracking fields to Orders.

Allowed scope:

- remote repo `/home/ssf/Documents/Github/warehouse-microservice`
- fulfillment docs and focused contract/tests after Allegro source contract is drafted

Forbidden:

- courier credentials
- raw Allegro payload persistence unless separately approved by Warehouse owner
- Orders lifecycle schema changes
- tracking number/URL propagation to Orders events
- migrations/deploys without owner approval

Expected output:

- accepted normalized statuses
- idempotency key rule using `provider=allegro` plus provider event/poll reference
- status timestamp semantics
- rejection of tracking fields in inbound-to-Orders payloads
- validation evidence and remaining `[MISSING: ...]` facts

### Orders/Notifications Integration Worker

Objective: after Allegro and Warehouse contracts exist, prove Orders lifecycle events and Notifications routing remain bounded and reject tracking/customer/provider fields.

Allowed scope:

- Orders event docs/verifiers and Notifications Orders-event router tests
- no provider credentials, no production data, no deploy

Validation commands:

- `npm run verify:event-contracts`
- `npm run verify:sensitive-logging`
- focused Notifications Orders-event router spec
- `git diff --check`

## Validation Evidence

Read-only commands used for this handoff:

- `ssh alfares 'cd /home/ssf/Documents/Github/orders-microservice && pwd && git status --short --branch && git branch --show-current && git log -1 --oneline ...'`
- `ssh alfares 'cd /home/ssf/Documents/Github/orders-microservice && sed -n ... docs/orchestrator/ORDER_EVENT_CONTRACTS.md ...'`
- `ssh alfares 'cd /home/ssf/Documents/Github/orders-microservice && rg -n "tracking|shipment|carrier|customer|address|Sensitive|role|admin|lifecycle|Orders event|forbidden" src docs/orchestrator scripts ...'`
- `ssh alfares 'cd /home/ssf/Documents/Github/notifications-microservice && pwd && git status --short --branch && git log -1 --oneline ...'`
- `ssh alfares 'cd /home/ssf/Documents/Github/notifications-microservice && sed -n ... src/notifications/orders-events/order-event.dto.ts ...'`

No deploy, migration, secret read, Vault mutation, production order/customer query, runtime provider call, or code test was run by this worker.

Post-write validation to run:

- `git diff --check`
- `git status --short --branch`

## Final Policy Decision

Until the missing role/product requirements are approved, tracking number and tracking URL must remain excluded from:

- Orders events
- Notifications Orders-event DTO/template data
- Warehouse-to-Orders callbacks
- Orders logs and audit logs
- provider handoff fixtures outside the Allegro provider owner boundary
- customer/admin UI DTOs except safe booleans such as `trackingAvailable` or `shipmentLookupRequired`

Orders may continue to publish bounded shipment and lifecycle status signals. Allegro and Warehouse workers must treat any request to expose raw tracking values as blocked by `[MISSING: product-approved tracking visibility matrix]`.
