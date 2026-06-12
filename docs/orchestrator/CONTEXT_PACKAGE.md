# Orders Context Package

```yaml
id: ORDERS-CONTEXT-PACKAGE
status: approved
owner: Orders owner
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: validated
upstream:
  - docs/orchestrator/GOALS.md
  - docs/orchestrator/INTENT.md
downstream:
  - docs/orchestrator/EXECUTION_PLAN.md
  - docs/orchestrator/PROMPTS.md
```

## Target Task

Default target: the active goal in `docs/IMPLEMENTATION_STATE.md`, then the earliest `active` or `pending` goal in `docs/orchestrator/GOALS.md`, then the first ready owner-selected goal in `implementation-goals/README.md`.

When the owner selects another task, record the selected goal, chunk, and reason in `docs/orchestrator/STATUS.md` before implementation.

## Upstream Traceability

Every task must trace to:

- Original Orders intent: `docs/orchestrator/INTENT.md`
- Current state: `docs/IMPLEMENTATION_STATE.md`
- Current goal or backlog item: `docs/orchestrator/GOALS.md`, `implementation-goals/README.md`, and `TASKS.md`
- Orders service contract surface: `README.md`, `SYSTEM.md`, and relevant source modules
- Ecosystem boundary context: `shared/ECOSYSTEM_MAP.md` and indexed shared commerce docs when available through DocsRAG
- Verification standard: `docs/orchestrator/READINESS_GATES.md`

## Included Documents

Read these before coding:

- `AGENTS.md`
- `BUSINESS.md`
- `SYSTEM.md`
- `README.md`
- `TASKS.md`
- `STATE.json`
- `docs/IMPLEMENTATION_STATE.md`
- `docs/IMPLEMENTATION_ORCHESTRATOR.md`
- `docs/orchestrator/MASTER_PROMPT.md`
- `docs/orchestrator/INTENT.md`
- `docs/orchestrator/GOALS.md`
- `docs/orchestrator/PLAN.md`
- `docs/orchestrator/PROJECT_INVARIANTS.md`
- `docs/orchestrator/PRE_CODING_GATE.md`
- `docs/orchestrator/EXECUTION_PLAN.md`
- `docs/orchestrator/READINESS_GATES.md`
- `docs/orchestrator/STATUS.md`
- `docs/orchestrator/PROMPTS.md`
- selected `implementation-goals/GOAL-XX-*.md`

Inspect source files only after the plan names expected files. Prefer narrow reads over broad source-tree reading.

## Excluded Documents

Do not use these as primary authority unless the owner explicitly selects historical research:

- Raw production logs containing customer data, addresses, tokens, or payment details.
- Decoded secrets from Vault, K8s Secrets, or `.env`.
- Consuming-service source trees unless the selected goal is cross-service contract validation.
- Generated `dist/` output unless validating deploy/build output.

## Orders Constraints

- Keep Orders as the order lifecycle source of truth.
- Do not move product, stock, payment identity, auth, notification delivery, CRM, gateway, or database ownership into Orders.
- Do not log, document, expose, or embed secrets, tokens, payment details, or raw customer data.
- Do not make API, state-machine, event, JWT/RBAC, warehouse, payment, catalog, notification, or CRM breaking changes without an explicit migration and validation plan.
- Do not directly write production order tables as an agent shortcut.
- Record evidence in `docs/orchestrator/STATUS.md` and compressed continuation state in `docs/IMPLEMENTATION_STATE.md`.

## Allowed Changes

Allowed files must be named by the selected execution plan before coding. Documentation workflow changes should stay under `docs/orchestrator/`, `docs/IMPLEMENTATION_STATE.md`, `docs/IMPLEMENTATION_ORCHESTRATOR.md`, `TASKS.md`, `AGENTS.md`, or `implementation-goals/`.

## Forbidden Changes

Unless owner-approved for the selected task, do not modify secrets, decoded runtime configuration, unrelated service domains, payment-provider logic, warehouse stock truth, catalog product truth, or channel-service canonical data.

## Agent Prompt

Use `docs/orchestrator/PROMPTS.md` as the canonical prompt source. Pair the universal prompt with the selected goal prompt or an owner-provided task prompt.

## Validation Instructions

Before coding, run the checks in `docs/orchestrator/PRE_CODING_GATE.md`. After coding, run the relevant checks in `docs/orchestrator/READINESS_GATES.md` and record evidence in `docs/orchestrator/STATUS.md`.
