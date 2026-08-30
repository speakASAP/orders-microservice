# Business: orders-microservice
>
> ⚠️ IMMUTABLE BY AI. Protected business baseline. Human approval is required before changes to the approved product scope.

```yaml
id: BUSINESS-orders-microservice
status: approved
owner: project owner
created: 2026-06-13
last_updated: 2026-08-30
completeness_level: validated
upstream:
  - docs/01_vision/VISION.md
  - docs/00_constitution/CONSTITUTION.md
downstream:
  - SYSTEM.md
  - docs/22_goal_impact/GOAL-IMPACT-TASK-001.md
```

## problem

The Alfares ecosystem sells through multiple independent sales channels (the flipflop storefront and the Allegro, Aukro, Bazos and Heureka marketplaces). Without a single order-processing authority, order state, shipment tracking and payment/warehouse handoff would fragment across each channel integration, creating inconsistent order status, duplicated logic and unsafe automated cancellations or refunds.

## target users and stakeholders

- Store operators who need one place to see and manage every order regardless of sales channel
- Marketplace integration services (`allegro-service`, `aukro-service`, `bazos-service`, `heureka-service`) that forward channel orders into a single order authority
- `flipflop-service`, the primary storefront, whose checkout orders are processed here
- `warehouse-microservice`, which receives reservation handoff for fulfillable order items
- `payments-microservice`, which reports payment/terminal status back onto the order record
- `invoices-microservice`, which reads confirmed order detail to generate proforma and final invoices
- `marketing-microservice`, which reads order lifecycle events for campaign and affinity signals
- `catalog-microservice`, which supplies product truth for order item snapshots and receives approved pricing suggestions

## value proposition

orders-microservice gives the ecosystem one authoritative order record and state machine, so every sales channel, fulfillment, payment and invoicing integration operates against consistent, auditable order status instead of duplicating order logic per channel.

## goals

- Ingest orders from every sales channel into a single order and item data model
- Enforce a defined order status state machine with no invalid state jumps
- Track shipments and fulfillment status per order item
- Publish versioned order lifecycle events (`orders.order.created.v1`, `orders.order.updated.v1`, `orders.order.shipped.v1`) so downstream services stay consistent without polling
- Hand off reservation to `warehouse-microservice` and record payment status from `payments-microservice` without becoming the source of truth for stock or payment processing
- Own the pricing/AI-suggestion domain (`/admin/pricing/*`, `/pricing/*`) as distinct from `payments-microservice`

## non-goals

- Processing payments or holding card/payment-method data (owned by `payments-microservice`)
- Owning product catalog or stock truth (owned by `catalog-microservice` and `warehouse-microservice`)
- Generating invoices or tax documents (owned by `invoices-microservice`)
- Autonomously cancelling or refunding orders without explicit human approval

## success metrics

- Every ingested channel order is represented exactly once with a valid current status
- Order status transitions always follow the defined state machine (`pending → confirmed → processing → shipped → delivered | cancelled`), with zero recorded invalid jumps
- Order lifecycle events are published for every status-changing transition and are consumable by downstream services
- No sensitive customer data (address, payment) appears in service logs

## business constraints

- AI must never cancel or refund orders without explicit human approval
- Order status transitions must follow the defined state machine; no state jumps
- Sensitive customer data (address, payment) must never be logged
- Secrets, tokens and private data must never be committed to Git or exposed in documentation
- Production deployment follows the shared ecosystem deployment queue and approval model

## approval

Status: approved
Approved by: project owner
Approval evidence: owner-confirmation: orders-microservice-onboarding-approved
