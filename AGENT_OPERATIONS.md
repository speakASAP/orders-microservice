# Agent Operations

This repository follows the company Cross-Agent Automation Standard from the Intent Preservation System.

## roles

- Readiness scanner: classifies work as ready now, dependency-gated, blocked, active elsewhere, complete, or needs owner input. It does not implement.
- Worker agent: implements one bounded goal or workstream with explicit scope.
- Worker monitor: checks active worker status and conflict risks.
- Integration validator: validates worker batches and separates current-task failures from known validation debt.

## before work

Read repository-local instructions and planning sources first, including `AGENTS.md`, `TASKS.md`, `STATE.json`, `docs/orchestrator/*`, `docs/06_architecture/INTEGRATION_CONTRACT.md`, and `docs/17_governance/PROJECT_INVARIANTS.md`.

Before coding, confirm:

- an active task and upstream traceability exist;
- an execution plan defines scope, allowed files, and forbidden files;
- integration and invariant impacts are explicit;
- sensitive-data and contract/schema impacts are classified;
- validation commands and evidence paths are named;
- parallel workstreams, blockers, shared files, integration owner, and merge order are defined.

## parallel work

Do not start parallel edits to the same file, schema, migration, public contract, deployment file, generated index, or status document unless one integration owner and conflict-resolution order are documented.

Every parallel workstream must declare:

- objective;
- owner role;
- allowed files;
- forbidden files;
- dependencies and blockers;
- validation evidence;
- expected output;
- handoff notes.

## validation debt

Use `docs/orchestrator/VALIDATION_DEBT.md` to record known out-of-scope validation failures. Validation debt does not excuse current-task failures. If a failure touches current-task files or acceptance criteria, treat it as blocking.

## handoff

Update `TASKS.md` and `STATE.json` before ending an incomplete session. Record deferred deployment explicitly. Every handoff must include the active task, current blockers, validation results, and the next concrete action.

## project-specific operations

- Keep the order status state machine and human-approval-for-cancel/refund invariants intact across any workflow change.
- Never log customer address or payment information; keep evidence sanitized.
- Do not copy remote repository contents into local user directories.
- Deploy only under pre-existing human-approved project or ecosystem policy; agents cannot self-authorize by editing policy.
- Do not print secrets, tokens, raw production data, customer identifiers, or private evidence.
- Use `[MISSING: ...]` or `[UNKNOWN: ...]` instead of inventing facts.
- Report files changed, documents created, validation evidence, validation debt used or added, blockers, deviations, and the next concrete action.

Next step: Follow the repository-specific `AGENTS.md` and planning files for the current task.
