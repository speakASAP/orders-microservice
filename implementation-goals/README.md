# Orders Implementation Goals

```yaml
id: ORDERS-IMPLEMENTATION-GOALS-INDEX
status: approved
owner: Orders owner
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: validated
upstream:
  - docs/orchestrator/GOALS.md
  - docs/IMPLEMENTATION_STATE.md
downstream:
  - implementation-goals/templates/CONTEXT_PACKAGE.md
  - implementation-goals/templates/EXECUTION_PLAN.md
  - implementation-goals/templates/CODING_PROMPT.md
  - implementation-goals/templates/VALIDATION_REPORT.md
related_adrs: []
```


This directory is the executable goal index for `orders-microservice`.

## Continuation Rule

Future sessions should start from:

1. `docs/IMPLEMENTATION_STATE.md`
2. `docs/IMPLEMENTATION_ORCHESTRATOR.md`
3. `docs/orchestrator/GOALS.md`
4. this file

If an active checkpoint exists, continue it. Otherwise select the next owner-approved pending goal.

## Goal Index

| Goal | Status | Intent | Source |
| --- | --- | --- | --- |
| Goal 1 - Orders Intent Preservation Pack | done | Create the company-standard compact IPS pack for Orders. | `docs/orchestrator/GOALS.md` |
| Goal 2 - Order Contract And State Machine Hardening | active | Enforce safe order lifecycle transitions and owner-approved destructive paths. | `docs/orchestrator/GOALS.md` |
| Goal 3 - Sensitive Customer Data And Audit Safety | pending | Make Orders observable without leaking customer or payment data. | `docs/orchestrator/GOALS.md` |
| Goal 4 - Channel Order Ingestion Contract | pending | Keep channels as clients of the canonical Orders contract. | `docs/orchestrator/GOALS.md` |
| Goal 5 - Warehouse, Payment, And Event Boundary Alignment | pending | Coordinate surrounding services without taking over their domains. | `docs/orchestrator/GOALS.md` |
| Goal 6 - Pricing Suggestion Safety And Consolidation | pending | Keep AI pricing suggestions human-approved and separate from payment capture. | `docs/orchestrator/GOALS.md` |

## Templates

Use these templates when creating executable work packets:

- `implementation-goals/templates/CONTEXT_PACKAGE.md`
- `implementation-goals/templates/EXECUTION_PLAN.md`
- `implementation-goals/templates/CODING_PROMPT.md`
- `implementation-goals/templates/VALIDATION_REPORT.md`

## Current Recommendation

Next chunk: Goal 2, chunk 2.2 - add or verify runtime validation for order and item fulfillment transitions.
