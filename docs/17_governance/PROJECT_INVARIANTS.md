# Project Invariants: orders-microservice

```yaml
id: PROJECT-INVARIANTS-orders-microservice
status: approved
owner: project owner
created: 2026-08-30
last_updated: 2026-08-30
completeness_level: validated
upstream:
  - ../../BUSINESS.md
  - ../../SYSTEM.md
  - ../01_vision/VISION.md
downstream:
  - ../01_vision/VISION.md
  - ../12_validation/VAL-TASK-001-bootstrap-service.md
```

## purpose

These invariants protect the order-processing authority intent for orders-microservice and keep implementation grounded in the approved state machine, human-approval and data-handling rules in `BUSINESS.md`.

## applicability

These invariants apply to order ingestion, status transitions, shipment/fulfillment updates, payment-status handoff, warehouse reservation handoff, pricing suggestion generation, and any workflow change that affects order state or cross-service trust.

## invariants

| ID | Level | Source | Rule | Forbidden outcome | Validation method | Gate |
|---|---|---|---|---|---|---|
| ORD-INV-001 | constitutional | `../00_constitution/CONSTITUTION.md` | AI must never cancel or refund an order without explicit human approval. | An automated cancel/refund transition with no recorded human approval. | Code review of the status-transition approval path plus manual verification. | pre-coding/deployment |
| ORD-INV-002 | business | `../../BUSINESS.md` | Order status transitions must follow the defined state machine (`pending → confirmed → processing → shipped → delivered \| cancelled`) with no state jumps. | A persisted transition that skips a required state. | State-machine validation tests on the transition service. | pre-coding/deployment |
| ORD-INV-003 | business | `../../BUSINESS.md` | Sensitive customer data (address, payment) must never be written to logs. | A log line containing a customer address or payment detail. | Log-output review and structured logging field allow-list. | pre-coding/deployment |
| ORD-INV-004 | business | `../../BUSINESS.md` | Internal-service write routes (payment-status, warehouse-fulfillment-status, status transitions) remain role-gated to the correct calling service. | An unauthenticated or wrongly-scoped internal-service write succeeding. | Role guard tests on `src/auth/jwt-roles.guard.ts` and controller role decorators. | pre-coding/deployment |

## exceptions

No exception is granted for automated cancellation/refund or for logging sensitive customer data. Any future exception requires explicit owner approval documented in a governance amendment under `docs/17_governance/`.

## review cadence

Review these invariants whenever the order state machine, approval model, or a cross-service authorization boundary changes, and before any deployment that touches order-status or payment/warehouse handoff logic.
