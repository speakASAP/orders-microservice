# Orders Hub Roadmap

```yaml
id: ORDERS-HUB-ROADMAP
status: active
owner: Orders owner
created: 2026-06-13
last_updated: 2026-06-13
completeness_level: delegation-ready
upstream:
  - docs/orchestrator/INTENT.md
  - docs/orchestrator/GOALS.md
  - docs/orchestrator/CHANNEL_ORDER_CREATE_CONTRACT.md
  - docs/orchestrator/PROJECT_INVARIANTS.md
  - docs/orchestrator/ORDER_STATUS_TRANSITIONS.md
downstream:
  - docs/orchestrator/GOALS.md
  - docs/orchestrator/PLAN.md
  - docs/orchestrator/STATUS.md
  - docs/IMPLEMENTATION_STATE.md
related_adrs: []
```

## Preserved Intent

Orders Hub is the public and operational product surface for `orders-microservice`.

`orders-microservice` remains the canonical order lifecycle service. It owns order records, order item snapshots, order status, shipment links, and lifecycle events. It must not take ownership of product truth, stock authority, payment identity/reconciliation, identity/RBAC, notification delivery, lead consent, CRM campaigns, or channel-specific business workflows.

## Current UI Scope

The first product slice is intentionally narrow:

- Public landing page at `/` and `/landing`.
- Admin shell at `/admin` and `/admin/orders`.
- Admin JSON remains protected at `/api/admin/orders/dashboard` and `/api/admin/orders/:id`.
- Admin API access requires Auth-issued roles `global:superadmin` or `internal:orders-microservice:admin`.
- The admin shell must not embed order records, customer addresses, payment details, secrets, or tokens.

## Ecosystem Integration Map

| Area | Integration Direction | Orders Responsibility | External Owner |
| --- | --- | --- | --- |
| FlipFlop | `flipflop-service` forwards completed/channel orders to `POST /api/orders` using `orders.create.v1`. | Accept normalized order creation, preserve external ID, publish lifecycle events. | FlipFlop owns storefront and channel workflow until migration is complete. |
| Marketplaces | Allegro, Aukro, Bazos, Heureka are accepted channel names in the Orders create contract. | Store channel order lifecycle and source metadata. | Channel adapters own marketplace API details. |
| Catalog | Orders stores product snapshots and product IDs only. | Reference product identity and preserve item snapshots. | Catalog owns product truth, pricing source, media, channel readiness. |
| Warehouse | Orders must coordinate reservation/release/fulfill/cancel/return by contract. | Trigger or record warehouse handoffs tied to lifecycle state. | Warehouse owns stock truth, reservations, availability, returns. |
| Payments | Orders stores payment method/status references only. | Link payment status to order lifecycle without minting payment identity. | Payments owns provider sessions, variable symbols, reconciliation, refunds, callbacks. |
| Auth | Admin and service APIs validate Auth-issued JWT roles. | Enforce roles and keep route intent explicit. | Auth owns identity, login, token issuance, role assignment. |
| Notifications | Orders may request customer/order lifecycle messages. | Emit safe notification requests or lifecycle events. | Notifications owns delivery infrastructure and provider state. |
| Leads | Orders may publish safe order signals. | Provide order-created/updated signals without becoming CRM. | Leads owns lead contact, consent, unsubscribe, CRM records. |
| Marketing | Marketing reads Orders for segmentation signals. | Expose safe read/event contracts. | Marketing owns campaign segmentation and execution. |
| Speak ASAP | No direct Orders integration confirmed. | Treat as candidate migration only after owner decision. | Speak ASAP currently has education-commerce order/payment flows. |
| School Committee | No direct Orders integration confirmed. | Treat committee payment/order concepts as separate until approved. | School Committee owns school-domain approval workflow. |
| Rentabox | No direct Orders integration confirmed. | Treat reservation/rental lifecycle as separate until approved. | Rentabox owns rental reservations. |
| Marathon | No direct Orders integration confirmed. | Treat VIP checkout/payment attempt ledger as separate until approved. | Marathon owns participant/VIP lifecycle. |

## Goal Backlog For Delegation

### Goal H1 - Public Landing And Admin Access Surface

Status: active

Intent: Give customers a public product surface for Orders Hub and make the admin section clearly Auth-protected without moving login/RBAC ownership into Orders.

Chunks:

- [x] H1.1 Add public landing HTML route for `/` and `/landing`.
- [x] H1.2 Add landing CTAs for registration and admin entry.
- [x] H1.3 Improve admin shell locked/authenticated states without embedding order data.
- [x] H1.4 Make admin JSON route roles explicit.
- [x] H1.5 Add route smoke checks for public/private split.
- [x] H1.6 Deploy and verify landing/admin reachability.

Acceptance criteria:

- Public landing returns HTML and contains no admin data.
- `/admin/orders` returns the admin shell only.
- `/api/admin/orders/dashboard` returns 401/403 without valid admin role.
- Valid admin role can load dashboard/detail data.
- No public route returns customer addresses, payment details, bearer tokens, JWTs, or raw production customer data.

Verification stages:

1. Build: `npm run build`.
2. Regression: `npm test`.
3. Static safety: missing-marker scan and sensitive-pattern scan.
4. Route smoke: `curl -I /`, `curl -I /admin/orders`, `curl -i /api/admin/orders/dashboard?limit=1`.
5. Browser visual check for desktop and mobile landing/admin shell.
6. Deployment health: `/health`, `/`, `/admin/orders`, protected admin JSON without JWT.

### Goal H2 - Auth-Owned Login And Role Experience

Status: pending

Intent: Replace token-paste admin access with an Auth-owned login/session flow while keeping Orders as a consumer of identity.

Chunks:

- [ ] H2.1 Confirm Auth microservice frontend/session contract for application-scoped admin roles.
- [ ] H2.2 Define Orders admin role policy for superadmin, orders admin, read-only operator, and service caller.
- [ ] H2.3 Add admin UI entry that redirects to Auth or consumes Auth-owned session state.
- [ ] H2.4 Remove persistent browser token storage once Auth session flow is available.
- [ ] H2.5 Add 401/403 UX states and route checks.

Acceptance criteria:

- Orders does not mint users, passwords, sessions, or roles.
- Auth remains the authority for registration, login, JWT issuance, and role assignment.
- Admin visibility and data access are role-scoped.
- Browser-held secrets are minimized.

Verification stages:

1. Auth contract evidence recorded.
2. Route-level 401/403/200 checks.
3. Browser login/admin flow check.
4. Sensitive token storage review.

### Goal H3 - Channel Idempotency And Duplicate Protection

Status: active

Intent: Ensure every channel can safely retry order creation without creating duplicate canonical orders.

Chunks:

- [x] H3.1 Document idempotency key shape: channel, external order ID, channel account ID, contract version.
- [x] H3.2 Add deterministic duplicate lookup. Database uniqueness remains a hardening follow-up.
- [x] H3.3 Return stable existing order response on safe retry.
- [x] H3.4 Add conflict response for mismatched duplicate payloads.
- [x] H3.5 Verify FlipFlop and marketplace adapters can retry safely.

Acceptance criteria:

- Duplicate handling is deterministic and documented.
- Channel services remain clients of Orders.
- No direct production database edits are required.

Verification stages:

1. Contract test for same-payload retry.
2. Contract test for mismatched duplicate.
3. `npm test`.
4. Consumer smoke with FlipFlop sample payload.

### Goal H4 - Event Contract Versioning

Status: pending

Intent: Make order lifecycle events stable for Warehouse, Payments, Notifications, Leads, Marketing, and channel services.

Chunks:

- [ ] H4.1 Define `orders.order.created.v1`, `orders.order.updated.v1`, `orders.order.paid.v1`, `orders.order.shipped.v1`, `orders.order.cancelled.v1`.
- [ ] H4.2 Classify allowed and forbidden payload fields.
- [ ] H4.3 Add event publisher version metadata.
- [ ] H4.4 Add fixture-based event contract checks.
- [ ] H4.5 Coordinate consumers and record compatibility.

Acceptance criteria:

- Events are versioned and contain no raw address, payment detail, secret, or token fields.
- Consumers know which events are authoritative and which are read-only signals.
- Leads/Marketing consume signals without owning order truth.

Verification stages:

1. Fixture schema validation.
2. Sensitive-field scan of event fixtures.
3. Consumer contract review.
4. RabbitMQ smoke where available.

### Goal H5 - Warehouse Reservation Choreography

Status: pending

Intent: Coordinate stock reservation and fulfillment without making Orders the stock authority.

Chunks:

- [ ] H5.1 Map order lifecycle states to Warehouse reservation endpoints.
- [ ] H5.2 Define failure/retry behavior for reserve, release, fulfill, cancel, expire, and return.
- [ ] H5.3 Add outbound Warehouse client behind explicit service configuration.
- [ ] H5.4 Record warehouse handoff status in Orders audit-safe metadata.
- [ ] H5.5 Verify payment-success, cancellation, and return flows.

Acceptance criteria:

- Warehouse remains stock and reservation truth.
- Orders records handoff evidence but does not calculate stock truth.
- Failures are observable and retryable.

Verification stages:

1. Contract fixture tests.
2. Mock Warehouse client tests.
3. Integration smoke in staging when available.
4. Sensitive logging scan.

### Goal H6 - Payments Callback And Status Boundary

Status: pending

Intent: Align Orders with Payments status updates while Payments remains provider identity and reconciliation authority.

Chunks:

- [ ] H6.1 Decide whether Orders receives payment callbacks directly or via channel services.
- [ ] H6.2 Define payment reference fields Orders may store.
- [ ] H6.3 Define paid/failed/cancelled status transition rules.
- [ ] H6.4 Add read-only payment status lookup or callback handler only after contract approval.
- [ ] H6.5 Verify refund-like operations remain outside normal Orders status updates.

Acceptance criteria:

- Orders does not create provider sessions, variable symbols, reconciliation records, or refunds.
- Payment-driven order state changes preserve the state machine and approval rules.
- Payment data is not logged or exposed publicly.

Verification stages:

1. Payments contract evidence.
2. State-machine tests.
3. Sensitive-data tests.
4. API smoke with protected service role.

### Goal H7 - Admin Operations Console

Status: pending

Intent: Expand the admin panel into a useful operational console while keeping mutating actions explicitly approved and role-scoped.

Chunks:

- [ ] H7.1 Add read-only integration health/status panels for Auth, Warehouse, Payments, Catalog, Notifications, Leads, Marketing.
- [ ] H7.2 Add idempotency diagnostics for channel/external order IDs.
- [ ] H7.3 Add event/audit timeline and safe lifecycle log panels.
- [ ] H7.4 Add role-scoped read-only versus action-capable admin modes.
- [ ] H7.5 Add human-approved action workflows only for approved transitions.

Acceptance criteria:

- Default admin remains read-only.
- No cancellation, refund, destructive correction, or high-impact pricing change happens without explicit approval evidence.
- Admin responses follow DTO sensitive-data policy.

Verification stages:

1. Browser workflow checks.
2. Route role checks.
3. Sensitive response fixture scans.
4. State-machine action tests when mutating actions are introduced.

### Goal H8 - Candidate Application Integration Decisions

Status: pending

Intent: Decide which non-marketplace applications should feed Orders and which should keep domain-local order/payment lifecycles.

Chunks:

- [ ] H8.1 Review Speak ASAP order/payment lifecycle with owner.
- [ ] H8.2 Review School Committee payment/contribution lifecycle with owner.
- [ ] H8.3 Review Rentabox reservation/rental lifecycle with owner.
- [ ] H8.4 Review Marathon VIP checkout/payment-attempt ledger with owner.
- [ ] H8.5 For approved integrations, create per-application contract goals; for rejected integrations, document exclusion.

Acceptance criteria:

- No application is forced into central Orders without owner approval.
- Approved integrations have explicit contract, idempotency, event, payment, and warehouse boundary plans.
- Excluded domains are documented to prevent future drift.

Verification stages:

1. Owner decision recorded.
2. Contract impact review.
3. IPS invariant review.
4. Follow-up goals created only for approved integrations.

## Cross-Cutting Verification Gates

Every goal must run the narrowest applicable checks from this list and record evidence in `docs/orchestrator/STATUS.md`:

- IPS missing-marker scan.
- Sensitive-data scan for docs, UI bundles, fixtures, and logs.
- `npm run build`.
- `npm test`.
- Route-level Auth checks for public, unauthenticated, wrong-role, and authorized cases.
- Contract fixtures for order creation, idempotency, events, payment status, warehouse handoff, and admin DTOs.
- Browser visual checks for UI changes.
- Deployment health and public route checks when deployed.

## Delegation Notes

Future agents should pick one goal and one chunk, refresh `CONTEXT_PACKAGE.md` and `EXECUTION_PLAN.md`, run the pre-coding gate, implement the smallest complete change, record evidence, and leave one next action.

Do not weaken the ownership boundaries in `docs/orchestrator/INTENT.md`. If a requested integration conflicts with those boundaries, stop and record the conflict before coding.
