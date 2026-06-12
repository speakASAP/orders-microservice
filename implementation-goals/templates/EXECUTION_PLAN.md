# Execution Plan Template

```yaml
id: ORDERS-EXECUTION-PLAN-TEMPLATE
goal:
chunk:
status: draft
gate_decision: pending
created:
updated:
```

## Selected Work

Describe the smallest complete chunk.

## Upstream Traceability

Link to `docs/orchestrator/INTENT.md`, `docs/orchestrator/GOALS.md`, `TASKS.md`, owner request, or another approved source.

## Scope

List deliverables.

## Non-Goals

List explicitly excluded work.

## Invariant Review

Evaluate applicable `ORD-INV-*` rules.

## Sensitive Data Classification

State data class and handling rules.

## Contract Impact

State API, JWT/RBAC, state-machine, event, warehouse, payment, catalog, notification, CRM, and channel-service impact.

## Validation Plan

List exact commands and runtime checks.

## Rollback Plan

State how to back out if validation fails.

## Gate Decision

Use one: `pass`, `pass-with-exception`, `fail`.
