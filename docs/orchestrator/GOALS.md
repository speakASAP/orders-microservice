# Orders Goal Backlog

```yaml
id: ORDERS-GOAL-BACKLOG
status: approved
owner: Orders owner
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: validated
upstream:
  - docs/orchestrator/INTENT.md
  - BUSINESS.md
  - TASKS.md
downstream:
  - docs/orchestrator/PLAN.md
  - docs/orchestrator/EXECUTION_PLAN.md
  - implementation-goals/README.md
related_adrs: []
```


Status values: `pending`, `active`, `done`, `blocked`.

## Goal 1 - Orders Intent Preservation Pack

Status: done

Intent: Orders must have a durable local workflow for future development that preserves ecosystem ownership boundaries and customer-data safety.

Chunks:

- [x] 1.1 Search existing orders docs, indexed docs, shared architecture docs, and neighboring IPS packs.
- [x] 1.2 Add service-local orchestrator pack under `docs/orchestrator/`.
- [x] 1.3 Add state-driven continuation docs and implementation-goal templates.
- [x] 1.4 Update agent guidance so future sessions follow the pack.
- [x] 1.5 Run documentation-only IPS verification.

Acceptance criteria:

- `MASTER_PROMPT.md`, `INTENT.md`, `GOALS.md`, `PLAN.md`, `STATUS.md`, `PROMPTS.md`, `PROJECT_INVARIANTS.md`, `CONTEXT_PACKAGE.md`, `EXECUTION_PLAN.md`, `PRE_CODING_GATE.md`, and `READINESS_GATES.md` exist.
- `docs/IMPLEMENTATION_STATE.md`, `docs/IMPLEMENTATION_ORCHESTRATOR.md`, and `implementation-goals/templates/*` exist.
- The pack names Orders ownership and non-ownership boundaries.
- The workflow includes goal selection, planning stages, gate checks, verification, status evidence, and next-task reporting.

## Goal 2 - Order Contract And State Machine Hardening

Status: complete

Intent: Orders must enforce safe, explicit order lifecycle transitions and keep cancellation/refund/destructive changes owner-approved.

Chunks:

- [x] 2.1 Document allowed order and item fulfillment status transitions.
- [x] 2.2 Add or verify runtime validation for order status transitions.
- [x] 2.3 Add human-approval gates for cancellation, refund-like transitions, and destructive corrections.
- [x] 2.4 Add tests or direct API verification for allowed, rejected, and owner-approved transitions.

Acceptance criteria:

- Status transition rules are documented and enforced.
- Invalid state jumps fail with clear errors.
- Cancellation/refund/destructive paths require explicit owner approval.
- `npm run build` passes and evidence is recorded.

## Goal 3 - Sensitive Customer Data And Audit Safety

Status: complete

Intent: Orders must be observable without leaking customer addresses, payment data, tokens, or secrets.

Chunks:

- [x] 3.1 Review order, item, shipment, pricing, event, and logger paths for sensitive fields.
- [x] 3.2 Add safe structured audit metadata for writes and status changes.
- [x] 3.3 Add redaction or no-log guarantees for customer, address, payment, token, and secret fields.
- [x] 3.4 Add regression checks or static scans for sensitive logging.

Acceptance criteria:

- Write/status logs identify operation, actor/source, resource ID, outcome, and duration where practical.
- Raw customer address, payment data, bearer tokens, JWT secrets, and DB secrets are absent from logs and docs.
- Verification evidence is recorded.

## Goal 4 - Channel Order Ingestion Contract

Status: active

Intent: FlipFlop and marketplace channels must create or forward orders through one stable Orders contract without duplicating order truth.

Chunks:

- [x] 4.1 Reconcile current `POST /orders` request/response shape with FlipFlop and marketplace expectations.
- [x] 4.2 Document idempotency expectations for external order IDs and channel account IDs.
- [x] 4.3 Add duplicate-order protection where missing.
- [ ] 4.4 Verify consumers can use the contract without storing duplicate canonical order records.

Acceptance criteria:

- Create-order contract is documented.
- External ID + channel duplicate handling is defined and verified.
- Channel services remain clients of Orders.

## Goal 5 - Warehouse, Payment, And Event Boundary Alignment

Status: pending

Intent: Orders must coordinate stock, payment status, shipments, and events without taking over Warehouse, Payments, Notifications, Leads, or Marketing responsibilities.

Chunks:

- [ ] 5.1 Document order-created, order-updated, order-shipped, order-paid, and order-cancelled event payload expectations.
- [ ] 5.2 Verify warehouse reservation/release/decrement boundaries and identify missing implementation.
- [ ] 5.3 Verify payments integration boundary for payment references and statuses.
- [ ] 5.4 Verify notifications/leads/marketing event consumption expectations.

Acceptance criteria:

- Event contracts are documented with owners and consumers.
- Missing runtime integration is split into bounded follow-up goals.
- Orders does not implement payment identity, stock authority, notification delivery, or CRM campaigns.

## Goal 6 - Pricing Suggestion Safety And Consolidation

Status: pending

Intent: Product list-pricing suggestions in Orders must remain human-approved, bounded, and correctly separated from payment capture.

Chunks:

- [ ] 6.1 Review current `/pricing/*` and `/admin/pricing/*` behavior against business safety rules.
- [ ] 6.2 Confirm pending/approve/reject flows and 30 percent safety limit.
- [ ] 6.3 Reconcile remaining FlipFlop order-service pricing internals slated for consolidation.
- [ ] 6.4 Verify pricing events and catalog update boundaries.

Acceptance criteria:

- AI-generated suggestions cannot auto-apply without approval.
- High-impact changes are blocked or explicitly approved.
- Payments remains payment-capture-only.
- Consolidation work is documented into owner-approvable chunks.

## Orders Hub Program Goals

The detailed roadmap for these goals lives in `docs/orchestrator/ORDERS_HUB_ROADMAP.md`.

## Goal H1 - Public Landing And Admin Access Surface

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

## Goal H2 - Auth-Owned Login And Role Experience

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

## Goal H3 - Channel Idempotency And Duplicate Protection

Status: active

Intent: Ensure every channel can safely retry order creation without creating duplicate canonical orders.

Chunks:

- [x] H3.1 Document idempotency key shape: channel, external order ID, channel account ID, contract version.
- [x] H3.2 Add deterministic duplicate lookup. Database uniqueness remains a hardening follow-up.
- [x] H3.3 Return stable existing order response on safe retry.
- [x] H3.4 Add conflict response for mismatched duplicate payloads.
- [ ] H3.5 Verify FlipFlop and marketplace adapters can retry safely.

Acceptance criteria:

- Duplicate handling is deterministic and documented.
- Channel services remain clients of Orders.

## Goal H4 - Event Contract Versioning

Status: pending

Intent: Make order lifecycle events stable for Warehouse, Payments, Notifications, Leads, Marketing, and channel services.

Chunks:

- [ ] H4.1 Define `orders.order.created.v1`, `orders.order.updated.v1`, `orders.order.paid.v1`, `orders.order.shipped.v1`, and `orders.order.cancelled.v1`.
- [ ] H4.2 Classify allowed and forbidden payload fields.
- [ ] H4.3 Add event publisher version metadata.
- [ ] H4.4 Add fixture-based event contract checks.
- [ ] H4.5 Coordinate consumers and record compatibility.

Acceptance criteria:

- Events are versioned and contain no raw address, payment detail, secret, or token fields.
- Consumers know which events are authoritative and which are read-only signals.

## Goal H5 - Warehouse Reservation Choreography

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

## Goal H6 - Payments Callback And Status Boundary

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

## Goal H7 - Admin Operations Console

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

## Goal H8 - Candidate Application Integration Decisions

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
