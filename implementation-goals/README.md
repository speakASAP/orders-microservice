# Orders Implementation Goals

```yaml
id: ORDERS-IMPLEMENTATION-GOALS-INDEX
status: approved
owner: Orders owner
created: 2026-06-12
last_updated: 2026-06-13
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

If an active checkpoint exists, continue it. Otherwise select the next owner-approved pending goal. Before implementation assignment, produce a parallelization matrix that names startable lanes, blockers, dependencies, write ownership, validation commands, and integration order.

## Goal Index

| Goal | Status | Intent | Source |
| --- | --- | --- | --- |
| Goal 1 - Orders Intent Preservation Pack | done | Create the company-standard compact IPS pack for Orders. | `docs/orchestrator/GOALS.md` |
| Goal 2 - Order Contract And State Machine Hardening | complete | Enforce safe order lifecycle transitions and owner-approved destructive paths. | `docs/orchestrator/GOALS.md` |
| Goal 3 - Sensitive Customer Data And Audit Safety | active | Make Orders observable without leaking customer or payment data. | `docs/orchestrator/GOALS.md` |
| Goal 4 - Channel Order Ingestion Contract | pending | Keep channels as clients of the canonical Orders contract. | `docs/orchestrator/GOALS.md` |
| Goal 5 - Warehouse, Payment, And Event Boundary Alignment | pending | Coordinate surrounding services without taking over their domains. | `docs/orchestrator/GOALS.md` |
| Goal 6 - Pricing Suggestion Safety And Consolidation | pending | Keep AI pricing suggestions human-approved and separate from payment capture. | `docs/orchestrator/GOALS.md` |

## Parallel Goal Packet Rules

Use one packet per agent/session. A packet must include:

- goal and chunk;
- lane owner/session label;
- files the agent may modify;
- files the agent must not modify;
- dependencies and blockers;
- contract and sensitive-data scope;
- exact validation commands;
- handoff evidence expected by the coordinator.

Parallel agents should avoid editing `docs/IMPLEMENTATION_STATE.md`, `docs/orchestrator/STATUS.md`, and shared execution-plan files directly unless those files are explicitly assigned to their lane. The coordinator consolidates shared state after lane evidence is returned.

## Templates

Use these templates when creating executable work packets:

- `implementation-goals/templates/CONTEXT_PACKAGE.md`
- `implementation-goals/templates/EXECUTION_PLAN.md`
- `implementation-goals/templates/CODING_PROMPT.md`
- `implementation-goals/templates/VALIDATION_REPORT.md`

## Current Recommendation

Coordinator next action: continue normal Orders traffic monitoring and assign parallel packets using separate `implementation-goals/parallel/*-handoff.md` lane files so agents do not race on shared IPS docs.

Startable parallel packets:

- P1: Goal H2.1/H2.2 Auth-owned admin login contract and role policy documentation.
- P2: Goal 6.1/6.2 pricing suggestion safety review.
- P4: normal-traffic monitoring evidence collection.

Blocked packet:

- P3: candidate application contract work, blocked until owner approves a concrete application integration.
