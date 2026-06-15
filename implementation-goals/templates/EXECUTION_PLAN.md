# Execution Plan Template

```yaml
id: ORDERS-EXECUTION-PLAN-TEMPLATE
goal:
chunk:
status: draft
owner: Orders owner
created: YYYY-MM-DD
last_updated: YYYY-MM-DD
parallel_status: pending
lane_owner: TBD
completeness_level: skeletal
upstream:
  - docs/orchestrator/INTENT.md
  - docs/orchestrator/GOALS.md
downstream:
  - docs/orchestrator/STATUS.md
related_adrs: []
gate_decision: pending
```

## Metadata

Name the selected goal, chunk, owner, status, date, and gate decision.

## Upstream Traceability

Link to `docs/orchestrator/INTENT.md`, `docs/orchestrator/GOALS.md`, `TASKS.md`, owner request, or another approved source.

## Goal Impact

State how the work advances the selected Orders goal and preserves original intent.

## Project Invariants

Evaluate applicable `ORD-INV-*` rules.

## Sensitive-Data Handling

Use one classification: `none`, `synthetic`, `masked`, or `sensitive`. State handling rules.

## Contract Validation Plan

State API, JWT/RBAC, state-machine, RabbitMQ event, warehouse, payment, catalog, notification, CRM, and channel-service impact.

## Replay/Determinism Plan

State what evidence must be recorded so another agent can replay the decision and validation path.

## Parallelization Plan

State whether this chunk is `parallel-ready`, `sequential-only`, or `blocked`. Name lane owner/session, dependencies, blockers, files owned by this lane, files that conflict with other lanes, expected handoff evidence, and coordinator integration order.

## Scope

List deliverables.

## Non-Goals

List explicitly excluded work.

## Files To Inspect

List exact files or directories to read before editing.

## Files To Create

List exact new files, or `None`.

## Files To Modify

List exact files expected to change. Update the plan before editing any file outside this list.

## Files That Must Not Be Modified

List protected files, unrelated domains, secrets, and generated artifacts.

## Implementation Steps

List ordered implementation steps.

## Test Plan

List exact commands and expected validation categories.

## Validation Plan

List acceptance checks and evidence requirements.

## Gate Commands

List exact pre-coding, build, test, scan, smoke, or deployment commands.

## Documentation Updates

List docs that must be updated after implementation.

## Rollback Plan

State how to back out if validation fails.

## Agent Handoff Prompt

Provide the bounded prompt for the implementation agent. Include the lane name, allowed files, forbidden files, blockers, validation commands, and exact evidence to return to the coordinator.

## Completion Checklist

- [ ] Traceability complete.
- [ ] Invariants evaluated.
- [ ] Sensitive-data handling defined.
- [ ] Contract impact defined.
- [ ] Parallelization status, blockers, dependencies, and file ownership defined.
- [ ] Validation plan defined.
- [ ] Gate decision recorded.
