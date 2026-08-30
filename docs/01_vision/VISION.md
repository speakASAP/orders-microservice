# Vision: orders-microservice

> Protected intent baseline. Human approval is required before changes to the approved project direction.

```yaml
id: VISION-orders-microservice
status: approved
owner: project owner
created: 2026-08-30
last_updated: 2026-08-30
completeness_level: validated
upstream:
  - ../00_constitution/CONSTITUTION.md
downstream:
  - ../../BUSINESS.md
  - ../17_governance/PROJECT_INVARIANTS.md
  - ../22_goal_impact/GOAL-IMPACT-TASK-001.md
```

## one-sentence vision

Give the Alfares ecosystem one trustworthy order-processing authority so every sales channel, fulfillment and payment integration operates against a single, auditable order record.

## problem statement

Orders arrive from multiple independent channels (flipflop storefront, Allegro, Aukro, Bazos, Heureka, Cliplot). Without a single order authority, order status, shipment tracking and payment/warehouse handoff would drift out of sync per channel, risking duplicated or contradictory order state and unsafe automated cancellations or refunds.

## target users

- Store operators managing orders across every channel
- Marketplace and storefront integration services that submit channel orders
- `warehouse-microservice`, `payments-microservice` and `invoices-microservice`, which depend on consistent order state
- `marketing-microservice`, which consumes order lifecycle events for affinity signals

## core user need

Operators and downstream services need one authoritative, consistently-ordered view of order state that cannot silently skip states or hide a cancellation/refund decision from a human.

## key outcomes

- A single order and item data model across every sales channel
- A defined, enforced order status state machine with no invalid transitions
- Reliable shipment and fulfillment tracking per order item
- Versioned order lifecycle events consumable by every downstream service

## non-goals

- Becoming the source of truth for product catalog, stock or payment processing
- Generating invoices or tax documents
- Autonomously cancelling or refunding orders without explicit human approval

## success criteria

- Every channel order is represented exactly once with a valid current status
- Zero recorded invalid state-machine transitions
- Order lifecycle events are published for every status-changing transition
- No sensitive customer data appears in logs

## approval

Status: approved
Approved by: project owner
Approval evidence: owner-confirmation: orders-microservice-onboarding-approved
