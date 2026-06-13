# Orders Implementation Plan

```yaml
id: ORDERS-IMPLEMENTATION-PLAN
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
  - docs/orchestrator/PRE_CODING_GATE.md
related_adrs: []
```


## Execution Rule

Work one goal chunk at a time. Prefer a complete, verifiable chunk over starting multiple tracks.

No implementation begins until the Orders IPS pre-coding gate passes for the selected chunk or the owner explicitly approves a documented exception.

## Planning Stages

Orders follows the Goalkeeper/Project OS lifecycle:

1. `queued` - owner or coordinator has captured a goal.
2. `planning` - coordinator gathers DocsRAG context, source facts, risks, and acceptance criteria.
3. `approved` - owner or session lead accepts the plan or explicitly selects the next chunk.
4. `active` - implementation agent edits the smallest complete chunk.
5. `validation` - build, syntax, API, deployment, or documentation checks run.
6. `done` - evidence is recorded and the next chunk is named.
7. `blocked` - the same blocker prevents progress and owner input is required.

## IPS Stage Checks

For each coding chunk, perform these checks in order:

1. Intent check: selected work preserves `docs/orchestrator/INTENT.md`.
2. Traceability check: selected work links to `docs/IMPLEMENTATION_STATE.md`, `docs/orchestrator/GOALS.md`, `implementation-goals/README.md`, or `TASKS.md`.
3. Context check: `docs/orchestrator/CONTEXT_PACKAGE.md` names included and excluded documents.
4. Invariant check: `docs/orchestrator/PROJECT_INVARIANTS.md` lists rules affected by the work.
5. Sensitive-data check: the plan states whether secrets, tokens, credentials, production customer data, addresses, payment data, or logs are involved.
6. Contract check: the plan states whether API, JWT/RBAC, state machine, RabbitMQ event, warehouse, payment, catalog, notification, or CRM contracts change.
7. Validation check: the plan names exact commands or runtime checks.
8. Gate check: `docs/orchestrator/PRE_CODING_GATE.md` has a pass decision or documented exception.

## Coordinator Duties

The coordinator agent must:

- Read the required documents named in `docs/IMPLEMENTATION_ORCHESTRATOR.md`.
- Query docs-rag-microservice before broad architecture decisions when credentials are available.
- Select the active checkpoint from `docs/IMPLEMENTATION_STATE.md`; otherwise select the earliest active or pending goal unless the owner overrides it.
- Tell the user the current goal, current chunk, verification plan, and next task.
- Keep `docs/IMPLEMENTATION_STATE.md` and `docs/orchestrator/STATUS.md` updated with concrete evidence.
- Create or update an execution plan before coding.
- Use context packages, coding prompts, and validation reports when work is delegated or high risk.
- Avoid cross-service ownership drift.

## Active Work

No active runtime coding goal.

Current chunk:

- Goal 1 - Orders Intent Preservation Pack: done.
- Goal 2 - Order Contract And State Machine Hardening: active.
- Goal 2 chunk 2.1 - Document allowed order and item fulfillment status transitions: done.
- Next ready chunk: Goal 2 chunk 2.4 - Add tests or direct API verification for allowed, rejected, and owner-approved transitions.

## Verification Commands

Use the narrowest relevant checks:

```bash
npm run build
node --check dist/main.js
curl -I -H 'Cache-Control: no-cache' https://orders.alfares.cz/health
```

Documentation-only IPS changes should be checked with:

```bash
find docs/orchestrator implementation-goals -maxdepth 2 -type f -name '*.md' -print
rg '\[(MISSING|UNKNOWN):' docs/IMPLEMENTATION_STATE.md docs/IMPLEMENTATION_ORCHESTRATOR.md docs/orchestrator implementation-goals AGENTS.md TASKS.md
rg -n 'Authorization: Bearer [A-Za-z0-9_./+=:-]{12,}|(access[_-]?token|client[_-]?secret|password|private[_-]?key|jwt[_-]?secret|db[_-]?password)\s*[:=]\s*['"'"'\"]?[A-Za-z0-9_./+=:-]{12,}' docs AGENTS.md TASKS.md implementation-goals
```

For DocsRAG context, query:

```bash
POST /retrieval/agent-context
{"query":"orders-microservice <topic>","maxTokens":3000}
```

## Next Goal Selection

Select the active checkpoint from `docs/IMPLEMENTATION_STATE.md`. If none exists, select the next owner-approved backlog item.
