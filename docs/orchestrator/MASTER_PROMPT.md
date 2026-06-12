# Orders Orchestrator Master Prompt

You are working on `orders-microservice`, the canonical order processing and lifecycle service for the Statex commerce ecosystem.

## Preserved Intent

Orders exists to provide one reliable place for order creation, order item capture, order status, shipment tracking, and order lifecycle events across FlipFlop and marketplace channels. It gives operations, invoicing, CRM, warehouse, payments, notifications, and channel integrations one canonical order reference without duplicating order truth in channel services.

## Non-Negotiable Boundaries

- Orders owns order records, order items, order status lifecycle, shipment records, and order events.
- Orders may own list-pricing suggestion workflow currently assigned to `/admin/pricing/*` and `/pricing/*`, but payments remains responsible for payment capture, variable symbols, provider sessions, and reconciliation.
- Catalog owns product identity, SKU/product content, categories, media, and channel product readiness.
- Warehouse owns stock quantities, reservations, movements, fulfillment inventory state, and warehouse locations.
- Auth owns login, JWT shape, RBAC, user identity, and service identity.
- Notifications owns message delivery; leads and marketing own CRM segmentation and campaigns based on order events.
- FlipFlop and marketplace services are order clients, not duplicate order sources of truth.
- AI agents must never cancel, refund, or force destructive order state changes without explicit human approval.
- Sensitive customer data, payment data, tokens, and secrets must not be logged, copied into docs, or printed in validation output.

## State-Driven Orchestrator Workflow

Orders follows the Goalkeeper-style compact IPS workflow. Continue from repository state:

- `docs/IMPLEMENTATION_STATE.md` is the current checkpoint and next-action source.
- `docs/IMPLEMENTATION_ORCHESTRATOR.md` is the master continuation prompt.
- `docs/orchestrator/*` contains the service-local IPS pack.
- `implementation-goals/README.md` and `implementation-goals/templates/*` hold executable goal and evidence templates.
- `docs/orchestrator/STATUS.md` is the dated evidence log.

## Required Workflow For Every Session

1. Read `AGENTS.md`, `BUSINESS.md`, `SYSTEM.md`, `README.md`, `TASKS.md`, `STATE.json`, `docs/IMPLEMENTATION_STATE.md`, `docs/IMPLEMENTATION_ORCHESTRATOR.md`, `implementation-goals/README.md`, and this orchestrator pack.
2. Query docs-rag-microservice before broad ecosystem or cross-service contract decisions when a token is available.
3. Identify the active goal from `docs/IMPLEMENTATION_STATE.md`; otherwise identify the earliest active or pending goal in `docs/orchestrator/GOALS.md`, unless the owner explicitly selects another goal.
4. Restate the preserved orders intent and ownership boundary affected by the selected goal.
5. Build or refresh the bounded context package in `docs/orchestrator/CONTEXT_PACKAGE.md`.
6. Confirm applicable invariants in `docs/orchestrator/PROJECT_INVARIANTS.md`.
7. For coding work, create or update `docs/orchestrator/EXECUTION_PLAN.md` before editing code.
8. Run the pre-coding gate in `docs/orchestrator/PRE_CODING_GATE.md`.
9. Implement the smallest complete chunk that satisfies the acceptance criteria.
10. Run the verification commands named by the goal and readiness gates.
11. Append dated evidence to `docs/orchestrator/STATUS.md`.
12. Update compressed continuation state in `docs/IMPLEMENTATION_STATE.md`.
13. Leave the next unfinished chunk clearly named.

## Intent Preservation System Mapping

| IPS layer | Orders source of truth |
| --- | --- |
| Constitution and immutable intent | `docs/orchestrator/INTENT.md`, `BUSINESS.md` |
| Business and task backlog | `TASKS.md`, `docs/orchestrator/GOALS.md`, `implementation-goals/README.md` |
| System and contract model | `SYSTEM.md`, `README.md`, `shared/ECOSYSTEM_MAP.md`, indexed shared commerce docs |
| Project invariants | `docs/orchestrator/PROJECT_INVARIANTS.md` |
| Execution plan | `docs/orchestrator/EXECUTION_PLAN.md`, `implementation-goals/templates/EXECUTION_PLAN.md` |
| Context package | `docs/orchestrator/CONTEXT_PACKAGE.md`, `implementation-goals/templates/CONTEXT_PACKAGE.md` |
| Coding prompts | `docs/orchestrator/PROMPTS.md`, `implementation-goals/templates/CODING_PROMPT.md` |
| Validation and readiness evidence | `docs/orchestrator/STATUS.md`, `docs/orchestrator/READINESS_GATES.md`, `implementation-goals/templates/VALIDATION_REPORT.md` |

Code generation from vague intent is not allowed. A task must have upstream traceability, invariant impact, sensitive-data classification, contract impact, validation plan, and gate decision before coding starts.

## Completion Standard

A goal is complete only when:

- Its acceptance criteria are met by code, docs, tests, API checks, or runtime evidence.
- Evidence is recorded in `docs/orchestrator/STATUS.md`.
- `npm run build` passes when backend TypeScript changes are made.
- Any changed protected order, shipment, pricing, auth, event, or sensitive-data behavior has a test or direct API verification note.
- The pre-coding and readiness checks have pass evidence or a documented owner-approved exception.
