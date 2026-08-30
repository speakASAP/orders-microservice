# TASK-001-bootstrap-service: Bootstrap orders-microservice

```yaml
id: TASK-001-bootstrap-service
status: completed
owner: project owner
created: 2026-08-30
last_updated: 2026-08-30
completeness_level: complete
upstream:
  - ../../BUSINESS.md
  - ../../SYSTEM.md
  - ../01_vision/VISION.md
goal_impact:
  - ../22_goal_impact/GOAL-IMPACT-TASK-001.md
execution_plan:
  - ../21_execution_plans/EP-TASK-001-bootstrap-service.md
project_invariant_impact: preserves
sensitive_data_classification: order, shipment and customer address/payment-status metadata (never logged)
contract_schema_impact: creates
replay_determinism_impact: affected
parallel_workstream_context: final-integration
required_gates:
  - adoption
  - pre-coding
```

## Objective

Complete the IPS documentation-adoption baseline for orders-microservice, an already-running production order-processing service, and review its real ecosystem integrations so the repository matches the standard applied to `cv-tuning`, `runlayer` and `wisdom-quotes`.

## Upstream links

- `../../BUSINESS.md` — approved order-processing intent, constraints and consumers.
- `../../SYSTEM.md` — service responsibilities, state machine and dependency boundaries.
- `../01_vision/VISION.md` — protected vision and success criteria for a single order authority.

## Goal impact

See `../22_goal_impact/GOAL-IMPACT-TASK-001.md`. This task lets the service pass the IPS adoption gate as a truthful record of an already-running production order-processing hub, not a new feature.

## Project invariant impact

The task preserves `ORD-INV-001`–`ORD-INV-004` in `../17_governance/PROJECT_INVARIANTS.md`: no automated cancel/refund, no invalid state-machine jumps, no sensitive data in logs, and role-gated internal-service writes remain unchanged. No invariant was weakened.

## Sensitive-data classification

The service handles customer order, address and payment-status metadata. Documentation and validation evidence produced by this task contain no real customer data, secrets or tokens — only sanitized architecture descriptions and code references.

## Contract and schema impact

This task creates the repository adoption contract (`ips-adoption.json`), the human-readable integration contract, and the required governance/task/validation metadata. It does not change any runtime API, event schema or database schema.

## Replay and determinism impact

The task is documentation-only and deterministic: re-running the adoption validator against the same repository state returns the same pass result. It does not affect the runtime order-processing determinism already covered by `ORD-INV-002`.

## Scope

- Complete the required root IPS adoption artifacts (`README.md`, `BUSINESS.md`, `SYSTEM.md`, `AGENTS.md`, `AGENT_OPERATIONS.md`, `CLAUDE.md`, `TASKS.md`, `STATE.json`).
- Complete protected governance content (`docs/00_constitution/CONSTITUTION.md`, `docs/01_vision/VISION.md`, `docs/17_governance/PROJECT_INVARIANTS.md`) with human-approved status and evidence.
- Complete the integration contract and `ips-adoption.json` with real, code-verified capability decisions.
- Complete this bootstrap task, its goal impact, execution plan and validation record.
- Reconcile `docs/orchestrator/VALIDATION_DEBT.md` placeholders with a concrete, resolved ledger entry.

## Non-goals

- Implementing new order-processing features or API endpoints.
- Removing or replacing the pre-existing `docs/IMPLEMENTATION_ORCHESTRATOR.md` / `docs/orchestrator/*` documentation pack, which coexists with the canonical IPS artifact set.
- Deploying, rolling out, or running any `kubectl`/`docker`/`deploy.sh` command.

## Acceptance criteria

- [x] The project adoption profile is valid for the planning gate (`validate_adoption_profile.py --phase planning` exits 0).
- [x] Every required root and `docs/` artifact exists with all required section headings and meaningful content.
- [x] `ips-adoption.json` records a concrete `required`/`not-applicable` decision, with contract/configuration/failure-mode/validation for every required capability, based on verified source code.
- [x] `STATE.json` matches the IPS schema while preserving the real production/frozen history it previously encoded.
- [x] Protected artifacts (`BUSINESS.md`, `docs/00_constitution/CONSTITUTION.md`, `docs/01_vision/VISION.md`) carry an `## Approval` section with concrete owner and evidence.

## Required context

- `../../BUSINESS.md`
- `../../SYSTEM.md`
- `../06_architecture/INTEGRATION_CONTRACT.md`
- `../17_governance/PROJECT_INVARIANTS.md`
- `../21_execution_plans/EP-TASK-001-bootstrap-service.md`
- `/home/ssf/Documents/Github/shared/docs/CREATE_SERVICE.md`
- `/home/ssf/Documents/Github/intent-preservation-system/docs/24_onboarding/PROJECT_ADOPTION_STANDARD.md`

## Validation task

Validation report: `../12_validation/VAL-TASK-001-bootstrap-service.md`.

## Required gates

| Gate | Command or evidence | Blocks on |
| --- | --- | --- |
| Adoption | `python3 ../intent-preservation-system/scripts/validate_adoption_profile.py --root . --phase planning` | Missing/incomplete project documents or integration decisions |
| Pre-coding | Not run for this documentation-only bootstrap task; no code change is proposed | Traceability, invariants, scope or sensitive-data violations |
| Application | Not applicable — no application code changed by this task | Implementation regression |
| Integration | Not applicable — no runtime integration changed by this task | Broken required integration |

## Parallel workstream context

- Ready now: all documentation and governance artifacts in this task (completed in this session).
- Dependency-gated: none. This bootstrap task has no further dependency before closure.
- Blocked: none.
- Final integration: this task itself is the final integration for the IPS adoption baseline; no further workstream is required to close it.
