# Project Constitution: orders-microservice

> Protected document. Human approval is required. AI agents may draft only from
> approved source material and must not modify the approved baseline directly.

```yaml
id: CONSTITUTION-orders-microservice
status: approved
owner: project owner
created: 2026-08-30
last_updated: 2026-08-30
completeness_level: validated
upstream: []
downstream:
  - ../01_vision/VISION.md
  - ../17_governance/PROJECT_INVARIANTS.md
```

## purpose

This constitution protects the approved intent for orders-microservice as the single order-processing authority for the Alfares e-commerce backbone: one order state machine, one shipment/fulfillment record, and one lifecycle-event source of truth across every sales channel.

## constitutional principles

### intent preservation

Every implementation artifact must trace back to the approved order-processing intent in `BUSINESS.md`: central order ingestion, a single state machine, and safe handoff to payments, warehouse and invoicing.

### human-controlled change

Cancelling or refunding an order, and any change to the order status state machine or approval rules, requires explicit human approval. AI agents may not automate these decisions.

### scope boundaries

orders-microservice remains focused on order, item and shipment lifecycle. It does not become the source of truth for product catalog, stock or payment processing, and it does not generate invoices.

### data and security

- Sensitive customer data (address, payment) must never be logged.
- Secrets, tokens, credentials and private evidence must never be committed to Git or exposed in documentation.
- Service-to-service calls remain scoped to the roles defined in the auth/role guard.

### validation

No task is complete without evidence against its acceptance criteria and the approved order state machine and event contract.

## amendment process

1. Create an amendment proposal under `docs/17_governance/` or a reviewed equivalent path.
2. Explain the change, reason, affected artifacts and compatibility impact.
3. Obtain human approval.
4. Update dependent artifacts and rerun the relevant validation.

## approval

Status: approved
Approved by: project owner
Approval evidence: owner-confirmation: orders-microservice-onboarding-approved
