# Orders Implementation Plan

```yaml
id: ORDERS-IMPLEMENTATION-PLAN
status: approved
owner: Orders owner
created: 2026-06-12
last_updated: 2026-06-13
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

Plan for safe parallel execution first. The coordinator must split owner-approved work into independent goal lanes whenever chunks have separate file ownership, independent contracts, and independently verifiable outcomes. Prefer multiple complete, verifiable parallel chunks over a single serialized track when integration risk is low.

No implementation begins until the Orders IPS pre-coding gate passes for the selected chunk or the owner explicitly approves a documented exception. Parallel implementation begins only after each lane has a named owner/session, write set, blockers, dependencies, validation commands, and integration order.

## Planning Stages

Orders follows the Goalkeeper/Project OS lifecycle:

1. `queued` - owner or coordinator has captured a goal.
2. `planning` - coordinator gathers DocsRAG context, source facts, risks, acceptance criteria, blockers, and dependency edges.
3. `parallel-ready` - the chunk has non-overlapping file ownership, independent validation, and a bounded handoff prompt for a separate session.
4. `approved` - owner or session lead accepts the plan or explicitly selects the next chunk.
5. `active` - implementation agent edits the smallest complete chunk assigned to its lane.
6. `integration` - coordinator combines completed lanes, resolves conflicts, and runs shared readiness gates.
7. `validation` - build, syntax, API, deployment, or documentation checks run for each lane and for the integrated result.
8. `done` - evidence is recorded and the next chunk or parallel task list is named.
9. `blocked` - the same blocker prevents progress and owner input or another lane's output is required.

## IPS Stage Checks

For each coding chunk, perform these checks in order:

1. Intent check: selected work preserves `docs/orchestrator/INTENT.md`.
2. Traceability check: selected work links to `docs/IMPLEMENTATION_STATE.md`, `docs/orchestrator/GOALS.md`, `implementation-goals/README.md`, or `TASKS.md`.
3. Context check: `docs/orchestrator/CONTEXT_PACKAGE.md` names included and excluded documents.
4. Invariant check: `docs/orchestrator/PROJECT_INVARIANTS.md` lists rules affected by the work.
5. Sensitive-data check: the plan states whether secrets, tokens, credentials, production customer data, addresses, payment data, or logs are involved.
6. Contract check: the plan states whether API, JWT/RBAC, state machine, RabbitMQ event, warehouse, payment, catalog, notification, or CRM contracts change.
7. Validation check: the plan names exact commands or runtime checks.
8. Parallelization check: the plan states whether the chunk can run in parallel, what blocks it, which files it owns, and which other chunks it conflicts with.
9. Gate check: `docs/orchestrator/PRE_CODING_GATE.md` has a pass decision or documented exception.

## Coordinator Duties

The coordinator agent must:

- Read the required documents named in `docs/IMPLEMENTATION_ORCHESTRATOR.md`.
- Query docs-rag-microservice before broad architecture decisions when credentials are available.
- Select the active checkpoint from `docs/IMPLEMENTATION_STATE.md`; otherwise select the earliest active or pending goal unless the owner overrides it.
- Build a parallelization matrix before assigning work: goal, chunk, session owner, files, dependencies, blockers, validation, and conflicts.
- Tell the user the current coordinator goal, active lanes, blockers, verification plan, and all tasks that can be given to parallel agents.
- Keep `docs/IMPLEMENTATION_STATE.md` and `docs/orchestrator/STATUS.md` updated with concrete evidence.
- Create or update an execution plan before coding.
- Use context packages, coding prompts, and validation reports when work is delegated or high risk.
- Keep shared status/state docs coordinator-owned while parallel agents record lane evidence in their validation reports or handoff notes.
- Avoid cross-service ownership drift.

## Active Work

Current coordinator goal: maintain post-deploy monitoring and prepare future owner-approved integration work for parallel execution.

Completed baseline:

- Goal 1 - Orders Intent Preservation Pack: done.
- Goal 2 - Order Contract And State Machine Hardening: complete.
- Goal 3 - Sensitive Customer Data And Audit Safety: complete.
- Goal H3 - Channel Idempotency And Duplicate Protection: complete.
- Goal H4 - Event Contract Versioning: complete.
- Goal H5 - Warehouse Reservation Choreography: complete in runtime and managed credential deployment.
- Goal H6 - Payments Callback And Status Boundary: complete.
- Goal H7 - Admin Operations Console: complete.
- Goal H8 - Candidate Application Integration Decisions: complete.

Current sequential-only lane:

- Production monitoring of managed Warehouse reservation handoff. This is coordinator-owned because it observes the integrated runtime and should not race with deployment changes.

## Parallel-Ready Work Packets

These packets may be handed to separate agents after the coordinator confirms the remote worktree is clean and assigns non-overlapping files. Each agent must update only its assigned files, run lane validation, and return evidence for coordinator integration.

| Packet | Goal | Parallel status | Primary files | Blockers | Validation |
| --- | --- | --- | --- | --- | --- |
| P1 | Goal H2.1/H2.2 - Auth-owned admin login contract and role policy | parallel-ready documentation lane | `implementation-goals/parallel/P1-auth-admin-contract-handoff.md`, optional new Auth contract note under `docs/orchestrator/` | Needs Auth source/docs access; cannot implement UI until Auth session/JWT contract is confirmed | docs missing-marker scan; sensitive literal scan |
| P2 | Goal 6.1/6.2 - Pricing suggestion safety review | parallel-ready review lane | `implementation-goals/parallel/P2-pricing-safety-handoff.md`, optional pricing safety note under `docs/orchestrator/` | Must not change runtime pricing behavior without owner approval; payment capture remains Payments-owned | `npm run build` if code inspected only; docs scans |
| P3 | Future candidate application contract packet | blocked until owner approval | per-application contract doc under `docs/orchestrator/` | Owner must approve a concrete application and target lifecycle boundary | contract review, docs scans, no runtime changes until approved |
| P4 | Normal-traffic monitoring packet | parallel-ready observation lane | `implementation-goals/parallel/P4-monitoring-evidence-handoff.md` evidence only; coordinator integrates into `docs/orchestrator/STATUS.md` | Needs access to Kubernetes/logs; must not print secrets or raw customer data | health check, safe log sampling, no sensitive data captured |

Conflicts and sequencing:

- P1, P2, and P4 can run in parallel because each lane writes a separate `implementation-goals/parallel/*-handoff.md` file; the coordinator alone updates shared state files after handoff review.
- P4 can run in parallel with documentation lanes but should pause if a deployment or runtime config change starts.
- P3 is not startable until owner approval removes the blocker.

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

Select the active checkpoint from `docs/IMPLEMENTATION_STATE.md`. If none exists, select the next owner-approved backlog item. Before assigning a single next task, list every startable parallel packet and every blocked packet with the exact blocker.
