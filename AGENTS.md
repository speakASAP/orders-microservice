# Repository Agent Instructions

Shared rules live here:

- Codex profile: `/home/ssf/.codex/AGENTS.md`
- Cross-agent standard: `/home/ssf/.ai-agent-standards/CROSS_AGENT_AUTOMATION_STANDARD.md`
- Repository operations: `AGENT_OPERATIONS.md`

Read those first, then follow the repository-specific notes below and the current planning/status files.

## Repository-Specific Notes

# Agents: orders-microservice

## required reading

Before implementation, read:

- `README.md`
- `BUSINESS.md`
- `SYSTEM.md`
- `AGENTS.md`
- `AGENT_OPERATIONS.md`
- `TASKS.md`
- `STATE.json`
- `docs/06_architecture/INTEGRATION_CONTRACT.md`
- `docs/17_governance/PROJECT_INVARIANTS.md`
- `docs/IMPLEMENTATION_ORCHESTRATOR.md` and `docs/orchestrator/*` (pre-existing implementation orchestration pack)

## authority

The project owner approves order-processing business scope. Agents must not redefine business intent, weaken the order state machine, or authorize automated cancellation/refund. `BUSINESS.md`, `docs/00_constitution/CONSTITUTION.md` and `docs/01_vision/VISION.md` are protected and require human approval for changes.

## intent preservation system

Preserve the chain of intent across:

`Vision -> Goal Impact -> System -> Feature -> Task -> Execution Plan -> Coding Prompt -> Code -> Validation`

Use the company compact IPS pack for implementation work, alongside the canonical IPS artifact set:

- `docs/IMPLEMENTATION_ORCHESTRATOR.md`
- `docs/IMPLEMENTATION_STATE.md`
- `docs/orchestrator/MASTER_PROMPT.md`
- `docs/orchestrator/INTENT.md`
- `docs/orchestrator/GOALS.md`
- `docs/orchestrator/PLAN.md`
- `docs/orchestrator/PROJECT_INVARIANTS.md`
- `docs/orchestrator/CONTEXT_PACKAGE.md`
- `docs/orchestrator/EXECUTION_PLAN.md`
- `docs/orchestrator/PRE_CODING_GATE.md`
- `docs/orchestrator/READINESS_GATES.md`
- `docs/orchestrator/PROMPTS.md`
- `docs/orchestrator/STATUS.md`
- `implementation-goals/README.md`

Future coding must not begin until the selected task has upstream traceability, invariant review, sensitive-data classification, contract impact review, validation plan, and a pre-coding gate decision. After work, update `docs/orchestrator/STATUS.md` and `docs/IMPLEMENTATION_STATE.md` with evidence and the next action.

## safety and operations

- Never commit secrets, credentials, or raw production/customer data
- Never log customer address or payment information
- Keep the system grounded in proven repository facts
- Use `[MISSING: ...]` or `[UNKNOWN: ...]` instead of inventing facts
- Keep validation debt separate from current-task failures
- Prefer the narrowest valid validation command before broad test suites
- Use `docs-rag-microservice` for bounded discovery when it is healthy, then verify deployment, security, database, integration and public-contract facts against the cited Git source. Git remains authoritative. Authority and fallback rules: `/home/ssf/Documents/Github/shared/docs/DOCUMENTATION_AUTHORITY.md`. Do not generate tokens in documentation or assume an unconfident/failed RAG response means source documentation does not exist.

## project-specific rules

- AI must never cancel or refund orders without explicit human approval
- Order status transitions must follow the defined state machine (`pending → confirmed → processing → shipped → delivered | cancelled`) — no jumps
- All marketplace services (allegro, aukro, bazos, heureka, cliplot) forward orders here; do not add a competing order-ingestion path
- The local goalkeeper application acts as implementation orchestrator around this project; orders-microservice remains a data service
- Plan implementation work for maximum safe parallel agent execution: split owner-approved work into independent lanes, name blockers and dependencies, assign non-overlapping file ownership
- Every assistant response in this project context must end with a final line beginning `Next step:`

## required final report

The final task report must include:

- files changed
- documents created or revised
- validation commands and results
- validation debt used or created
- active blockers as `[MISSING: ...]` or `[UNKNOWN: ...]`
- deviations from scope
- next concrete action

## Active Agents
<!-- Coordinator-maintained -->
None.
