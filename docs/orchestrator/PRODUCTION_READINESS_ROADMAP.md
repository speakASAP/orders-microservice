# Orders Production Readiness Roadmap

```yaml
id: ORDERS-PRODUCTION-READINESS-ROADMAP
status: proposed
owner: Orders owner
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: planning
upstream:
  - BUSINESS.md
  - SYSTEM.md
  - README.md
  - TASKS.md
  - docs/IMPLEMENTATION_STATE.md
  - docs/orchestrator/GOALS.md
  - docs/orchestrator/ORDER_STATUS_TRANSITIONS.md
  - docs-rag-microservice/docs/RAG_USAGE.md
downstream:
  - docs/orchestrator/GOALS.md
  - docs/orchestrator/PLAN.md
  - docs/orchestrator/STATUS.md
related_adrs: []
```

## Purpose

Make `orders-microservice` the production-ready canonical order service for all Statex ecosystem applications, including FlipFlop checkout and marketplace order ingestion.

Production-ready means other services can depend on Orders for order creation, item capture, status lifecycle, shipment records, and order events without duplicating order truth or bypassing warehouse, payments, catalog, auth, notifications, leads, or marketing ownership boundaries.

## Current Baseline

- Orders is deployed on Kubernetes in `statex-apps`, exposes `https://orders.alfares.cz`, and has `GET /health`.
- Orders owns order records, order items, order lifecycle status, shipment records, and `orders.events`.
- Current public API surface includes order CRUD, item fulfillment updates, shipment updates, and pricing suggestion endpoints.
- Current runtime gap: `PUT /api/orders/:id/status` and `PUT /api/items/:id/fulfillment` accept arbitrary status strings.
- Current creation gap: `POST /api/orders` accepts partial entity payloads without a documented channel ingestion DTO, idempotency key, contract version, or full cross-service side-effect policy.
- Current event gap: event payloads are minimal and not yet versioned or backed by consumer contract tests.
- Current observability gap: logs and audit metadata are not yet documented as safe for customer/address/payment data.
- DocsRAG dependency: Orders and ecosystem docs require querying `docs-rag-microservice` for broad cross-service decisions, but live retrieval is currently blocked until service access/JWT/GVT is fixed by the parallel session.

## Production Definition Of Done

Orders can be called safely by FlipFlop and other ecosystem services when all of these are true:

- Order creation is idempotent per `channel + externalOrderId` or a documented idempotency key.
- Request DTOs reject unknown fields and validate totals, items, channel identity, customer fields, and status values.
- Status transitions follow `docs/orchestrator/ORDER_STATUS_TRANSITIONS.md` at runtime.
- Cancellation, refund-like paths, terminal-state corrections, and destructive corrections require explicit human-owner approval and safe audit evidence.
- Auth/RBAC supports service callers and operations/admin users with least-privilege roles.
- Warehouse reservation, payment status, catalog product identity, shipment, notification, leads, and marketing side effects are contractually defined and tested at boundaries.
- RabbitMQ events are versioned, durable, documented, and validated with at least one consumer smoke test.
- Logs, errors, events, validation output, and docs do not expose bearer tokens, secrets, payment details, full customer addresses, or raw production order rows.
- Deployment readiness gate records build/test results, health check, API smoke test, and rollback notes.

## Roadmap

### Phase 0 - DocsRAG And Planning Gate

Goal: unblock authoritative ecosystem-context retrieval before broad implementation.

Deliverables:

- Confirm `docs-rag-microservice` health, JWT/service access, Qdrant collection, Ollama reachability, and recent ingestion status.
- Re-ingest Orders, FlipFlop, catalog, warehouse, payments, auth, notifications, leads, marketing, and marketplace service docs after access is fixed.
- Query DocsRAG for Orders ecosystem boundaries and record source headings in `docs/orchestrator/STATUS.md`.
- Keep repository-source docs as fallback evidence only while live DocsRAG is unavailable.

Exit criteria:

- `POST /retrieval/agent-context` returns usable context for `orders-microservice production readiness`, `flipflop checkout orders contract`, `warehouse payment orders boundary`, and `orders events consumers`.
- Orders status records DocsRAG evidence or a dated blocker.

### Phase 1 - Order Contract And State Machine Hardening

Goal: make the existing order/item lifecycle safe before adding more consumers.

Deliverables:

- Implement runtime validation for order transitions from `pending -> confirmed -> processing -> shipped -> delivered`.
- Implement runtime validation for item fulfillment transitions from `pending -> reserved -> shipped -> delivered`.
- Reject unknown statuses, state jumps, reverse transitions, terminal exits, and item/order mismatches.
- Add owner-approval request fields or workflow for cancellation and destructive corrections.
- Add focused tests or direct API checks for allowed and rejected transitions.

Exit criteria:

- Invalid transition attempts fail with clear 4xx errors.
- `npm run build` passes.
- Gate evidence is appended to `docs/orchestrator/STATUS.md`.

### Phase 2 - Canonical Channel Ingestion Contract

Goal: make FlipFlop and marketplace services clients of one stable Orders API.

Deliverables:

- Define `CreateOrderRequest` DTO with contract version, channel, external order ID, customer summary, safe address structure, items, totals, currency, payment reference, shipping method, and idempotency key.
- Add duplicate-detection/idempotent create behavior for `channel + externalOrderId`.
- Validate catalog product IDs/SKUs at the contract boundary without moving product truth into Orders.
- Document FlipFlop checkout flow: cart checkout -> warehouse reservation -> payment initiation -> order create/update -> notifications/events.
- Add channel-service examples for FlipFlop, Allegro, Aukro, Bazos, and Heureka.

Exit criteria:

- Replaying the same channel order does not create duplicate canonical order records.
- FlipFlop has a documented call sequence and error handling policy for order creation.
- API examples contain no raw customer/payment production data.

### Phase 3 - Warehouse, Payment, Shipment, And Event Boundary Alignment

Goal: make Orders reliable in the ecosystem without taking over other service domains.

Deliverables:

- Define when Orders calls or records warehouse reservation results and how warehouse remains stock authority.
- Define payment fields Orders may store, excluding payment identity ownership, variable-symbol generation, provider sessions, refunds, and reconciliation.
- Link shipment creation/status updates to `order.shipped` publishing and item fulfillment alignment.
- Version event payloads for `order.created`, `order.updated`, `order.shipped`, and pricing events.
- Add event schema docs and consumer expectations for notifications, leads, marketing, and channel services.

Exit criteria:

- Event payloads have `schemaVersion`, `eventId`, timestamp, order ID, channel, status where applicable, and safe metadata.
- At least one consumer smoke test or documented RabbitMQ publish/consume verification exists.

### Phase 4 - Auth, RBAC, And Service Access

Goal: allow ecosystem services to call Orders with least privilege.

Deliverables:

- Map service roles for FlipFlop, marketplace services, operations/admin users, and internal maintenance.
- Protect write endpoints with explicit roles instead of only default admin roles.
- Keep `GET /health` public and all business endpoints authenticated.
- Document token issuance expectations from `auth-microservice`.

Exit criteria:

- Role matrix exists and matches decorators/guards.
- Unauthorized, wrong-role, and allowed-role API checks are recorded.

### Phase 5 - Sensitive Data, Audit, And Observability

Goal: make Orders diagnosable without leaking customer or payment data.

Deliverables:

- Add safe audit metadata for create, status change, item fulfillment, shipment, pricing approval/rejection, and event publish outcomes.
- Redact or avoid logging customer addresses, payment details, bearer tokens, JWT secrets, DB secrets, and raw production order rows.
- Define error responses that are useful to client services but do not expose sensitive internals.
- Add static scans or regression checks for sensitive logging patterns.

Exit criteria:

- Audit records identify operation, actor/service, resource ID, outcome, reason where applicable, and duration.
- Sensitive-data scan passes before deployment.

### Phase 6 - Production Readiness And Rollout

Goal: make Orders a service other applications can depend on operationally.

Deliverables:

- Add or confirm migrations for all production schema requirements.
- Add build/test/deployment gate evidence.
- Add API smoke checks for health, authenticated create, idempotent replay, status update, item fulfillment, shipment, and event publish.
- Define rollback and incident response notes.
- Coordinate rollout with FlipFlop first, then marketplace services, then leads/marketing consumers.

Exit criteria:

- Deployment readiness gate is accepted.
- FlipFlop can place or simulate an order through Orders without duplicating canonical order truth.
- `docs/IMPLEMENTATION_STATE.md` names the next service integration after FlipFlop.

## Initial Implementation Sequence

1. Finish Goal 2 chunk 2.2: runtime validation for order and item fulfillment transitions.
2. Finish Goal 2 chunk 2.3: owner approval for cancellation and destructive corrections.
3. Finish Goal 2 chunk 2.4: transition tests/API verification.
4. Start Goal 4: channel ingestion contract and idempotent order creation, with FlipFlop as the first reference client.
5. Start Goal 5: warehouse/payment/event boundary alignment.
6. Start Goal 3: sensitive-data logging and audit safety.
7. Reconcile Goal 6 pricing consolidation after the core order contract is stable.

## Open Decisions

- Whether Orders should expose a dedicated `/api/orders/channel` endpoint for channel clients or evolve `POST /api/orders` with strict DTOs and role-specific access.
- Whether cancellation approval is a synchronous API field, a two-step workflow, or an operations-only admin action.
- Whether warehouse reservation happens before order creation, during order creation, or through an eventual-consistency reservation event.
- Which event schema registry or shared contract location should own cross-service event versions.
- Which service identity roles FlipFlop and each marketplace service should receive from `auth-microservice`.

## Current Next Action

Start Goal 2 chunk 2.2 in `orders-microservice`: add runtime validation for order status and item fulfillment transitions according to `docs/orchestrator/ORDER_STATUS_TRANSITIONS.md`.
