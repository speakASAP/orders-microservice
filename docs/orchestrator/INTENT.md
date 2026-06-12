# Orders Intent Preservation

```yaml
id: ORDERS-INTENT
status: approved
owner: Orders owner
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: validated
upstream:
  - BUSINESS.md
  - SYSTEM.md
  - README.md
downstream:
  - docs/orchestrator/GOALS.md
  - docs/orchestrator/PROJECT_INVARIANTS.md
  - docs/orchestrator/MASTER_PROMPT.md
related_adrs: []
```


## Original Intent

`orders-microservice` is the central order processing hub. It must answer: what order was created, from which channel, which items and catalog product IDs it contains, who the customer is, what status the order is in, which shipment records exist, and which lifecycle events downstream systems should consume.

## Intent Preservation Rules

1. All channel orders flow through Orders. FlipFlop, Allegro, Aukro, Bazos, Heureka, and future channels must create or forward orders here instead of keeping a competing order source of truth.
2. Order status follows a defined state machine. State jumps, cancellations, refunds, and destructive corrections require explicit owner approval and audit evidence.
3. Orders stores order snapshots needed for fulfillment and operations, but product truth remains Catalog-owned and stock truth remains Warehouse-owned.
4. Payment capture, provider sessions, QR payment data, variable symbols, and reconciliation remain Payments-owned. Orders may store payment references and statuses, but must not mint payment identity.
5. Leads and Marketing consume order events for CRM and follow-up. They do not become the order source of truth.
6. Notifications sends customer messages. Orders may trigger or request notifications, but must not own delivery infrastructure.
7. Auth remains the identity and RBAC authority. Orders validates JWT/service roles and does not mint identity.
8. Sensitive customer data, shipping/billing addresses, payment details, tokens, and secrets must not be logged, copied into docs, or exposed in prompts.
9. Pricing suggestion workflow in this repo must remain human-approved and bounded by safety rules; AI must not silently apply high-impact price changes.
10. Every implementation goal must preserve ownership boundaries and record evidence.

## Drift Checks

Before any change, ask:

- Does this strengthen Orders as the canonical order lifecycle service?
- Does this accidentally move product truth, stock authority, payment identity, identity authority, notification delivery, or CRM campaign ownership into Orders?
- Does this preserve the order state machine and require human approval for cancellation, refund, destructive edits, and high-risk pricing?
- Does this avoid logging or documenting customer addresses, payment data, tokens, secrets, or raw production customer data?
- Does this keep channel services as clients of Orders rather than duplicate order systems?
- Is the change observable and verifiable without direct production database edits?

## Immutable Intent Boundary

AI agents may clarify, summarize, or link this intent, but must not weaken it. Human owner approval is required before changing:

- Orders ownership of order records, order items, status lifecycle, shipment records, and order lifecycle events.
- Orders non-ownership of product truth, stock authority, payment identity/reconciliation, login/RBAC authority, notification delivery, CRM campaign execution, database infrastructure, and gateway routing.
- The rule that cancellations, refunds, destructive order corrections, high-risk pricing changes, secrets, tokens, payment details, and raw customer data require explicit handling controls.

If implementation pressure conflicts with this section, stop coding and record the conflict in `docs/orchestrator/STATUS.md`.
