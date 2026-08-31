# Tasks: orders-microservice

This file is the concise human-readable work queue. Detailed task contracts live under `docs/11_tasks/`; execution plans and validation reports remain linked from those task documents. The pre-existing `docs/IMPLEMENTATION_ORCHESTRATOR.md` / `docs/orchestrator/*` pack continues to track detailed implementation-orchestrator state.

## active

- No active tasks at this time. The project is production/frozen per `STATE.json`.

## ready next

- Consolidate flipflop `order-service` pricing module internals (suggestion persistence/business logic) into this repo so the upstream proxy dependency can be removed (priority: 1).
- Review the order state machine for edge cases (priority: 3).

## blocked

- No blocked tasks at this time.

## completed

- [x] `TASK-001-bootstrap-service` — IPS adoption baseline completed: business/system/vision/constitution, integration contract, governance invariants, bootstrap task/goal-impact/execution-plan/validation records, and `ips-adoption.json`/`STATE.json` brought into the required schema.
- [x] 2026-04-16 Exposed canonical pricing ownership surface in orders service (`/admin/pricing/*` and `/pricing/*`) and documented cross-service boundary.
- [x] 2026-04-05 Documentation standard applied.

## handoff

Current machine-readable state: [`STATE.json`](STATE.json).
Bootstrap adoption artifacts: [`docs/11_tasks/TASK-001-bootstrap-service.md`](docs/11_tasks/TASK-001-bootstrap-service.md), [`docs/22_goal_impact/GOAL-IMPACT-TASK-001.md`](docs/22_goal_impact/GOAL-IMPACT-TASK-001.md), [`docs/21_execution_plans/EP-TASK-001-bootstrap-service.md`](docs/21_execution_plans/EP-TASK-001-bootstrap-service.md), and [`docs/12_validation/VAL-TASK-001-bootstrap-service.md`](docs/12_validation/VAL-TASK-001-bootstrap-service.md).

## Project Completion Marker

- 2026-06-21: Project marked completed/frozen after remote inventory. There are no active goals, active plans, open tasks, blockers, or pending human/AI actions beyond the backlog items listed above. Do not ask for a new goal during routine status checks unless the owner explicitly creates one.
