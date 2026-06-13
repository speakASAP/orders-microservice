# Candidate Application Integration Decisions

```yaml
id: ORDERS-CANDIDATE-APPLICATION-INTEGRATION-DECISIONS
status: accepted
owner: Orders owner
created: 2026-06-13
last_updated: 2026-06-13
completeness_level: validated
upstream:
  - docs/orchestrator/INTENT.md
  - docs/orchestrator/PROJECT_INVARIANTS.md
  - docs/orchestrator/ORDERS_HUB_ROADMAP.md
downstream:
  - docs/orchestrator/GOALS.md
  - docs/orchestrator/STATUS.md
  - docs/IMPLEMENTATION_STATE.md
related_adrs: []
```

## Purpose

Goal H8 decides whether selected non-marketplace applications should feed canonical Orders or keep their order, payment, contribution, reservation, rental, or participant lifecycle local to their own service.

Decision rule: do not force any application into Orders without explicit owner approval and a documented per-application contract goal covering create contract, idempotency key, payment boundary, warehouse/stock boundary, event contract, sensitive-data policy, and rollback.

## Summary Decision

No reviewed candidate is approved to feed `orders-microservice` in this H8 pass.

All four reviewed applications keep domain-local lifecycle ownership unless a future owner-approved contract goal explicitly changes that decision.

## Decision Matrix

| Candidate | Decision | Reason | Future Orders condition |
| --- | --- | --- | --- |
| Speak ASAP | Excluded for now. | SpeakASAP owns an education product/payment domain. Current route ownership maps `/api/v1/orders`, `/api/v1/invoices`, `/api/v1/subscriptions`, discounts, and payment webhooks to `speakasap/payment-service`, while external processing stays in `payments-microservice`. Course/product truth remains in SpeakASAP course services. | Only revisit if the owner approves a SpeakASAP commerce-contract goal that defines which education purchase records become canonical Orders and how SpeakASAP payment-service is retired or becomes an Orders client. |
| School Committee | Excluded. | School Committee contribution payments are school/family contribution intents, QR bank transfers, variable symbols, and reconciliation events owned by the committee platform and legal association context. They are not product shipments or channel orders. | Only revisit if the owner creates a donation/contribution accounting integration goal. It must not move QR/bank variable-symbol authority into Orders. |
| Rentabox | Excluded for MVP v1. | Rentabox owns a self-storage lifecycle: reservation hold, mock payment, rental activation, contract PDF, PIN access code, dashboard, and admin review. Its MVP explicitly excludes real payment providers and stores mock payments only. This is a rental/access domain, not an Orders sales-channel flow. | Only revisit if Rentabox needs a future commerce reporting bridge after MVP, with rental identity, contract, access-code, and payment-provider boundaries documented. |
| Marathon | Excluded. | Marathon owns participant registration, VIP payment-attempt ledger, gift redemption, assignment progress, and VIP state. Payment callbacks must match Marathon's ledger before VIP unlock, and participant progress/payment state is private. | Only revisit if the owner approves a Marathon purchase signal integration that preserves MarathonPaymentAttempt as the VIP/payment gate and sends only aggregate or bounded purchase events. |

## Evidence Reviewed

### Speak ASAP

- `speakasap/BUSINESS.md`: online education platform with course, assessment, certification, and payment scope; payment processing via `payments-microservice`.
- `speakasap/SYSTEM.md`: services include course, payment, financial, user, education, and frontend; `payments-microservice:3468` handles payment processing.
- `speakasap/docs/refactoring/GATEWAY_API_CONTRACT.md`: gateway must not own payment behavior; payment/order domain routes include `/api/v1/orders`, `/api/v1/subscriptions`, `/api/v1/invoices`, `/api/v1/discounts`, and `/api/v1/webhooks/payments`.
- `speakasap/docs/refactoring/GATEWAY_ROUTE_OWNERSHIP_MATRIX.md`: `/api/v1/orders` belongs to SpeakASAP `payment-service`; external processing remains in `payments-microservice`.
- `speakasap/docs/orchestrator/WORKFLOW_OWNERSHIP_MAP.md`: legacy orders, invoices, webpay, PayPal, and CS payments migrate with the payment boundary to SpeakASAP `payment-service`, not central Orders.

### School Committee

- `school-committee/BUSINESS.md`: parent-committee platform for financial contributions, volunteer tasks, and feedback; funds are owned by a Czech civil association.
- `school-committee/README.md`: parents generate/pay via QR bank transfer, committee confirms payments, and local school-domain authorization remains in School Committee.
- `school-committee/SYSTEM.md`: payment secrets include webhook secret, IBAN, account number, and bank code for committee payments.
- `school-committee/prisma/schema.prisma`: `ContributionPlan`, `PaymentIntent`, and `PaymentReconciliationEvent` model QR/bank contribution flows with variable symbols and reconciliation.
- `school-committee/types/payments.ts` and payment tests: QR generation returns `paymentIntentId`, `variableSymbol`, and SPD QR string.

### Rentabox

- `rent-a-box/docs/mvp-boundary.md`: MVP flow is registration, location selection, box selection, reservation, mock payment, rental activation, contract PDF, PIN access code, and dashboard.
- `rent-a-box/docs/goals/GOAL-04-reservation-payment-rental-lifecycle.md`: backend lifecycle owns reservation state machine, box availability, double-booking prevention, mock payment provider, rental creation after payment, and audit transitions.
- `rent-a-box/docs/goals/GOAL-05-contracts-pin-notifications.md`: post-rental services own contract PDF, PIN generation, access-code security, and notification attempts.
- `rent-a-box/docs/api.md`: customer APIs include reservations, mock payment create/confirm, rentals, contracts, and access codes; admin APIs include rentals, payments, contracts, and audit log.
- `rent-a-box/docs/database.md`: schema owns reservations, rentals, payments, contracts, access codes, notifications, and audit logs; mock payment records store no card, bank, PAN, CVV, expiry, IBAN, or account-number fields.

### Marathon

- `marathon/BUSINESS.md`: standalone learning-marathon product with course delivery, payments, and participant management; payments via `payments-microservice` only.
- `marathon/SYSTEM.md`: APIs include registration, VIP checkout, gift redemption, payment webhook, profile, submissions, winners, and analytics.
- `marathon/docs/intent/05_subsystems/SUB-002-vip-payments.md`: Marathon creates payment attempts, sends checkout requests with server-side prices, validates callbacks, and marks participant VIP state.
- `marathon/docs/intent/07_decisions/ADR-003-payment-attempt-ledger.md`: payment callbacks must match order, participant, product, amount, and currency before VIP unlock.
- `marathon/docs/intent/04_systems/SYS-001-marathon-platform.md`: Marathon stores participant, submission, gift, payment-attempt, winner, and review state and must not bulk-migrate progress without separate approval.

## Boundary Review

- Orders remains canonical for sales-channel order records, order items, order status, shipment records, and lifecycle events.
- SpeakASAP, School Committee, Rentabox, and Marathon are not marketplace or sales-channel adapters in this H8 review.
- Payments remains owner of payment identity, provider sessions, provider callbacks, variable symbols, QR/bank reconciliation, and refunds.
- Warehouse remains stock truth. None of the reviewed candidates has an approved Warehouse-reservation dependency for Orders.
- Auth remains identity/RBAC authority for each application.
- Notifications, Leads, and Marketing remain consumers or application-owned workflows; Orders does not take over their delivery or CRM ownership.

## Future Contract Gate

Any future attempt to connect one of these applications to Orders must start with a new owner-approved goal that names:

- application owner and current domain owner;
- canonical record type to create in Orders;
- idempotency key;
- mapping of application IDs to `channel`, `channelAccountId`, and `externalOrderId`;
- item/catalog product mapping;
- payment reference fields and forbidden payment/provider fields;
- warehouse/stock dependency or explicit no-warehouse decision;
- event contracts and consumers;
- sensitive-data exclusion rules;
- rollback and coexistence plan;
- verification commands.

## H8 Outcome

H8 creates no runtime integration goals because no reviewed candidate is approved to feed Orders in this pass.

The next eligible Orders Hub item is owner-selected deployment/migration work or future candidate-contract work only after explicit approval.
