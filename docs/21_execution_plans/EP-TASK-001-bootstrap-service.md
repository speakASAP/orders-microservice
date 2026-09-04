# EP-TASK-001-bootstrap-service: Bootstrap orders-microservice

```yaml
id: EP-TASK-001-bootstrap-service
status: validated
source_task: ../11_tasks/TASK-001-bootstrap-service.md
goal_impact:
  - ../22_goal_impact/GOAL-IMPACT-TASK-001.md
validation:
  - ../12_validation/VAL-TASK-001-bootstrap-service.md
owner: project owner
created: 2026-08-30
last_updated: 2026-08-30
completeness_level: complete
parallelization_strategy: single_agent
required_gates:
  - adoption
  - pre-coding
```

## Upstream traceability

- `../../BUSINESS.md` — order-processing intent, constraints and consumers.
- `../../SYSTEM.md` — service responsibilities, state machine and dependencies.
- `../01_vision/VISION.md` — target outcome and success criteria.
- `../11_tasks/TASK-001-bootstrap-service.md` — bootstrap task record.
- `../22_goal_impact/GOAL-IMPACT-TASK-001.md` — mapped impact and measurable outcome.

## Scope

Complete the IPS onboarding baseline for orders-microservice: project intent, governance, integration decisions, state metadata and validation records, restructuring real pre-existing repository facts rather than inventing new business scope.

## Non-goals

- Public API, schema or runtime behavior changes.
- Rewriting the approved product intent in `BUSINESS.md` beyond restructuring it into the required sections.
- Deploying, rolling out, or running any `kubectl`/`docker`/`deploy.sh` command as part of this task.

## Project invariants

- `ORD-INV-001`: no automated cancel/refund — preserved by not touching the status-transition approval code.
- `ORD-INV-002`: order state-machine transitions — preserved by not touching `src/orders/status-transitions.ts`.
- `ORD-INV-003`: no sensitive data in logs — preserved; documentation contains no real customer data.
- `ORD-INV-004`: role-gated internal-service writes — preserved by not touching `src/auth/jwt-roles.guard.ts` or controller role decorators.

## Sensitive-data handling

- Keep customer address and payment-status data out of every document and validation record produced by this task.
- Use only sanitized architecture descriptions and code file references (paths, env var names) as evidence.
- Do not print secrets, tokens or Vault values.

## Contract validation plan

- Validate that `ips-adoption.json` records a concrete decision, and for `required` capabilities a contract/configuration/failure-mode/validation string, for all 16 capabilities.
- Confirm the human-readable table in `docs/06_architecture/INTEGRATION_CONTRACT.md` matches `ips-adoption.json` decisions.
- Confirm every `required` decision is backed by a real code reference (env var usage, route/role guard, client file) rather than an assumption from an env var name alone.

## Replay and determinism plan

- Keep the adoption and validation documents deterministic and reviewable; re-running the adoption validator against an unchanged repository returns the same pass result.
- No runtime behavior, migration or event schema was changed, so no replay/determinism risk is introduced to the order-processing pipeline itself.

## Files to inspect

- `BUSINESS.md`, `SYSTEM.md`, `AGENTS.md`, `AGENT_OPERATIONS.md`, `CLAUDE.md`, `TASKS.md`, `STATE.json`, `README.md`, `.env.example`
- `src/orders/orders.controller.ts`, `src/orders/order-events.service.ts`, `src/pricing/pricing.service.ts`, `src/warehouse/warehouse-reservation.client.ts`, `src/orders/order-fulfillment-handoff.client.ts`, `src/admin/admin.service.ts`, `src/logger/logger.service.ts`, `src/health/health.controller.ts`
- `docs/orchestrator/VALIDATION_DEBT.md`, `docs/IMPLEMENTATION_ORCHESTRATOR.md`

## Files to create

- `docs/00_constitution/CONSTITUTION.md`
- `docs/01_vision/VISION.md`
- `docs/06_architecture/INTEGRATION_CONTRACT.md`
- `docs/17_governance/PROJECT_INVARIANTS.md`
- `docs/11_tasks/TASK-001-bootstrap-service.md`
- `docs/22_goal_impact/GOAL-IMPACT-TASK-001.md`
- `docs/21_execution_plans/EP-TASK-001-bootstrap-service.md`
- `docs/12_validation/VAL-TASK-001-bootstrap-service.md`
- `ips-adoption.json`

## Files to modify

- `BUSINESS.md`, `SYSTEM.md`, `AGENTS.md`, `AGENT_OPERATIONS.md`, `TASKS.md`, `STATE.json`, `README.md`
- `docs/orchestrator/VALIDATION_DEBT.md`

## Files that must not be modified

- `docs/IMPLEMENTATION_ORCHESTRATOR.md`, `docs/IMPLEMENTATION_STATE.md`, `docs/orchestrator/MASTER_PROMPT.md`, `docs/orchestrator/INTENT.md`, `docs/orchestrator/GOALS.md`, `docs/orchestrator/PLAN.md`, `docs/orchestrator/PROJECT_INVARIANTS.md`, `docs/orchestrator/CONTEXT_PACKAGE.md`, `docs/orchestrator/EXECUTION_PLAN.md`, `docs/orchestrator/PRE_CODING_GATE.md`, `docs/orchestrator/READINESS_GATES.md`, `docs/orchestrator/PROMPTS.md`, `docs/orchestrator/STATUS.md` — the pre-existing parallel documentation pack, which coexists with the canonical IPS tree.
- Any application source under `src/`, `migrations/`, `k8s/`, `Dockerfile`, `deploy.config.sh`.

## Implementation steps

1. Read the existing `BUSINESS.md`, `SYSTEM.md`, `AGENTS.md`, `AGENT_OPERATIONS.md`, `TASKS.md`, `STATE.json`, `README.md`, `.env.example` and relevant `src/` files to establish verified facts.
2. Run the non-destructive scaffolder to create missing IPS artifact skeletons.
3. Restructure `BUSINESS.md`, `SYSTEM.md` into the required sections, preserving all real facts, and add the protected-artifact frontmatter and `## Approval` section.
4. Fill `docs/00_constitution/CONSTITUTION.md`, `docs/01_vision/VISION.md`, `docs/17_governance/PROJECT_INVARIANTS.md`, `docs/06_architecture/INTEGRATION_CONTRACT.md` with project-specific, code-verified content.
5. Fill `ips-adoption.json` with a concrete decision for every capability, verified against `src/` and `.env.example` rather than assumed.
6. Fill the four bootstrap docs (this plan, the task, the goal impact and the validation report) with cross-referencing traceability.
7. Update `AGENTS.md`, `AGENT_OPERATIONS.md`, `TASKS.md`, `STATE.json`, `README.md` to add the missing required sections without removing the pre-existing orchestrator/goalkeeper instructions.
8. Reconcile `docs/orchestrator/VALIDATION_DEBT.md`'s literal placeholder entry with a concrete, resolved ledger entry and add the missing `## update format` section.
9. Run the IPS planning validator and fix any remaining findings.

## Parallel execution

| Workstream | Status | Owner role | Allowed files | Dependencies | Validation | Merge order |
| --- | --- | --- | --- | --- | --- | --- |
| Documentation and contracts | complete | project owner | all files listed under Files to create/modify above | approved product concept in the pre-existing `BUSINESS.md`/`SYSTEM.md` | IPS adoption validator | first |
| Application implementation | not started (no code change scoped) | integration owner | repository runtime code | not applicable to this task | `npm test` / `npm run build` (future task) | not applicable |
| Deployment and integration | deferred | integration owner | deployment config and runtime manifests | validated documentation | deployment preflight (deferred to owner) | last |

## Blockers

None. All work in this task's scope was completed with information available in the repository.

## Test plan

- Validate the adoption profile structure and confirm no unresolved placeholders remain.
- Confirm every required section and status field is present in every artifact.
- Confirm the bootstrap task, goal impact, execution plan and validation records are mutually traceable.

## Validation plan

- Run the IPS adoption validation (`--phase planning`).
- Record the exact command output in `../12_validation/VAL-TASK-001-bootstrap-service.md`.
- Record any residual validation debt in `docs/orchestrator/VALIDATION_DEBT.md`.

## Gate commands

Run from the adopting repository:

```bash
python3 ../intent-preservation-system/scripts/validate_adoption_profile.py --root . --phase planning
```

## Documentation updates

- `README.md`, `BUSINESS.md`, `SYSTEM.md`, `AGENTS.md`, `AGENT_OPERATIONS.md`, `TASKS.md`, `STATE.json`
- `docs/00_constitution/CONSTITUTION.md`, `docs/01_vision/VISION.md`
- `docs/06_architecture/INTEGRATION_CONTRACT.md`, `docs/17_governance/PROJECT_INVARIANTS.md`
- `docs/11_tasks/TASK-001-bootstrap-service.md`, `docs/12_validation/VAL-TASK-001-bootstrap-service.md`, `docs/22_goal_impact/GOAL-IMPACT-TASK-001.md`
- `docs/orchestrator/VALIDATION_DEBT.md`, `ips-adoption.json`

## Rollback plan

If a documentation change is found to misstate the approved business intent, revert the affected file to its pre-task version with `git checkout` and re-run the planning validator before continuing. No runtime or schema rollback is needed because no application code was changed.

## Handoff

The completed documents, the validator output, and the "no active blockers" status are handed off to the project owner. No further worker action is required to close this bootstrap task; a future task should scope the flipflop `order-service` pricing-module consolidation already tracked in `TASKS.md`.

## Completion checklist

- [x] Protected intent approved
- [x] Adoption profile valid
- [x] Integration decisions complete
- [x] Documentation implementation complete
- [x] Required integrations reviewed against source code
- [ ] Deployment dry run passes (not applicable — documentation-only task, no deploy requested)
- [x] Validation report complete
