# Orders Project Invariants

```yaml
id: ORDERS-PROJECT-INVARIANTS
status: approved
owner: Orders owner
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: validated
upstream:
  - docs/orchestrator/INTENT.md
  - BUSINESS.md
  - SYSTEM.md
downstream:
  - docs/orchestrator/PRE_CODING_GATE.md
  - docs/orchestrator/EXECUTION_PLAN.md
  - docs/orchestrator/READINESS_GATES.md
```

## Purpose

These invariants translate Orders preserved intent into checks that must run before coding and before deployment. They are the Orders-local equivalent of the company IPS `PROJECT_INVARIANTS.md`.

## Applicability

All Orders implementation, documentation, deployment, contract, data, event, pricing, and operations changes must evaluate these invariants. Documentation-only changes may mark runtime checks as not applicable, but may not skip intent, traceability, contract, or sensitive-data checks.

## Invariants

| ID | Level | Source | Rule | Forbidden outcome | Validation method | Gate |
| --- | --- | --- | --- | --- | --- | --- |
| ORD-INV-001 | intent | `docs/orchestrator/INTENT.md` | Orders remains the canonical source for order records, order items, order status lifecycle, shipment records, and order lifecycle events. | Channel services or downstream systems become competing order truth. | Intent review in execution plan and status evidence. | pre-coding, readiness |
| ORD-INV-002 | state-machine | `BUSINESS.md`, `SYSTEM.md` | Order status transitions must follow the defined state machine and preserve explicit handling for cancellation/refund/destructive changes. | Silent state jumps, automated cancellation/refund, or destructive correction without owner approval. | Transition review, tests, or API verification. | pre-coding, readiness |
| ORD-INV-003 | boundary | `docs/orchestrator/INTENT.md` | Catalog owns product truth; Warehouse owns stock and reservations; Payments owns payment identity/reconciliation; Auth owns identity/RBAC; Notifications owns sending; Leads/Marketing own CRM/campaigns. | Moving non-Orders domain ownership into Orders or bypassing owning service contracts. | Scope and non-goals review in execution plan. | pre-coding |
| ORD-INV-004 | sensitive-data | `BUSINESS.md` | Customer address, payment details, tokens, secrets, raw production customer data, and decoded credentials must not appear in docs, prompts, logs, frontend bundles, tests, or reports. | Customer-data, token, or secret leakage. | Sensitive-data scan and logging review. | pre-coding, readiness |
| ORD-INV-005 | contract | `README.md`, `SYSTEM.md`, shared commerce docs | Orders API, JWT/RBAC, and RabbitMQ event contracts remain compatible unless the plan names migration and validation steps. | Silent breaking change to create-order, status, shipment, pricing, auth, or event payload behavior. | Contract impact section and targeted verification commands. | pre-coding, readiness |
| ORD-INV-006 | pricing-safety | `TASKS.md`, `src/pricing/*` | Pricing suggestions require human approval and safety limits; payment capture remains outside Orders. | AI silently applies high-impact pricing, or Orders takes over payment-provider responsibilities. | Pricing flow review and API/build verification. | pre-coding, readiness |
| ORD-INV-007 | evidence | `docs/orchestrator/STATUS.md` | Every completed chunk records dated evidence, commands/checks run, deployment status when relevant, and the next unfinished task. | Closing work without reproducible verification evidence. | Status update review. | readiness |
| ORD-INV-008 | docsrag | `AGENTS.md`, `CLAUDE.md` | Ecosystem architecture or broad contract work queries docs-rag-microservice before broad source-tree reading when a service token is available. | Architecture changes made from local assumptions only. | Retrieved source headings recorded in status or blocker noted when token is unavailable. | pre-coding |

## Exceptions

No standing exceptions are approved. If a gate cannot run because credentials, network access, or runtime environment is unavailable, record the blocker and compensating local check in `docs/orchestrator/STATUS.md`.

## Review Cadence

Review these invariants whenever order ownership, state transitions, customer-data handling, payment/stock/catalog boundaries, pricing automation, events, auth behavior, or documentation workflow changes.
