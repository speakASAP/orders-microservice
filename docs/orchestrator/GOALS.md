# Orders Goal Backlog

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

Status: pending

Intent: Orders must enforce safe, explicit order lifecycle transitions and keep cancellation/refund/destructive changes owner-approved.

Chunks:

- [ ] 2.1 Document allowed order and item fulfillment status transitions.
- [ ] 2.2 Add or verify runtime validation for order status transitions.
- [ ] 2.3 Add human-approval gates for cancellation, refund-like transitions, and destructive corrections.
- [ ] 2.4 Add tests or direct API verification for allowed, rejected, and owner-approved transitions.

Acceptance criteria:

- Status transition rules are documented and enforced.
- Invalid state jumps fail with clear errors.
- Cancellation/refund/destructive paths require explicit owner approval.
- `npm run build` passes and evidence is recorded.

## Goal 3 - Sensitive Customer Data And Audit Safety

Status: pending

Intent: Orders must be observable without leaking customer addresses, payment data, tokens, or secrets.

Chunks:

- [ ] 3.1 Review order, item, shipment, pricing, event, and logger paths for sensitive fields.
- [ ] 3.2 Add safe structured audit metadata for writes and status changes.
- [ ] 3.3 Add redaction or no-log guarantees for customer, address, payment, token, and secret fields.
- [ ] 3.4 Add regression checks or static scans for sensitive logging.

Acceptance criteria:

- Write/status logs identify operation, actor/source, resource ID, outcome, and duration where practical.
- Raw customer address, payment data, bearer tokens, JWT secrets, and DB secrets are absent from logs and docs.
- Verification evidence is recorded.

## Goal 4 - Channel Order Ingestion Contract

Status: pending

Intent: FlipFlop and marketplace channels must create or forward orders through one stable Orders contract without duplicating order truth.

Chunks:

- [ ] 4.1 Reconcile current `POST /orders` request/response shape with FlipFlop and marketplace expectations.
- [ ] 4.2 Document idempotency expectations for external order IDs and channel account IDs.
- [ ] 4.3 Add duplicate-order protection where missing.
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
