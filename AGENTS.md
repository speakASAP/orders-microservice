# Repository Agent Instructions

Shared rules live here:

- Codex profile: `/home/ssf/.codex/AGENTS.md`
- Cross-agent standard: `/home/ssf/.ai-agent-standards/CROSS_AGENT_AUTOMATION_STANDARD.md`
- Repository operations: `AGENT_OPERATIONS.md`

Read those first, then follow the repository-specific notes below and the current planning/status files.


## Repository-Specific Notes

# Agents: orders-microservice

## Knowledge Retrieval (query before reading files)
Query the RAG service first to reuse indexed ecosystem context before reading raw files:

```bash
curl -s -X POST http://docs-rag-microservice.statex-apps.svc.cluster.local:3397/retrieval/agent-context \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "YOUR QUESTION HERE", "maxTokens": 3000}'
```

- Internal URL: `http://docs-rag-microservice.statex-apps.svc.cluster.local:3397`
- Public URL: `https://docs-rag.alfares.cz`
- Full guide: `docs-rag-microservice/docs/RAG_USAGE.md`

Data service — no AI agent coordination.

## Goalkeeper Orchestrator Workflow

The local goalkeeper application acts as the implementation orchestrator around this project, while `orders-microservice` remains a data service.

- The goalkeeper tracks active goals, sets or updates implementation goals, maintains plans, and records progress across runs.
- When the user communicates through command line or chat, the orchestrator response should state what was completed during the last run and what concrete next step is needed.
- Keep this project documentation synchronized when the orchestrator rules or operating approach changes.
- Plan implementation work for maximum safe parallel agent execution: split owner-approved work into independent lanes, name blockers and dependencies, assign non-overlapping file ownership, and list all startable parallel tasks for separate Codex sessions.
- Keep shared status/state docs coordinator-owned when multiple agents work in parallel; consolidate evidence after lane completion.
- Every assistant response in this project context must end with a final line beginning `Next step:`. Use a specific next action when work remains, or `Next step: No action needed.` when the task is complete.

## Intent Preservation System

Use the company compact IPS pack for all future implementation work:

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
- `implementation-goals/templates/*`

Future coding must not begin until the selected task has upstream traceability, invariant review, sensitive-data classification, contract impact review, validation plan, and a pre-coding gate decision. After work, update `docs/orchestrator/STATUS.md` and `docs/IMPLEMENTATION_STATE.md` with evidence and the next action.

## Active Agents
<!-- Coordinator-maintained -->
None.
