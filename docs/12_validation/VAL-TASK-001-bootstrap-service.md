# VAL-TASK-001-bootstrap-service: Validate orders-microservice bootstrap

```yaml
id: VAL-TASK-001-bootstrap-service
target: TASK-001-bootstrap-service
goal_impact:
  - ../22_goal_impact/GOAL-IMPACT-TASK-001.md
status: validated
validator: project owner
date: 2026-08-30
sensitive_data_classification: order, shipment and customer address/payment-status metadata (never logged)
parallel_workstream_context: final-integration
```

## Summary

The orders-microservice onboarding bootstrap is validated. The repository contains the required IPS adoption documents, a code-verified integration contract, governance records and state metadata for the runtime-service profile, and no unresolved placeholders remain in the required artifacts.

## Upstream goal

The task aligns with the approved goal in `../22_goal_impact/GOAL-IMPACT-TASK-001.md` and the protected product direction in `../../BUSINESS.md` and `../01_vision/VISION.md`: a single order-processing authority for every Alfares sales channel.

## Acceptance criteria evidence

| Criterion | Result | Evidence |
| --- | --- | --- |
| Project adoption profile valid for planning | Pass | `python3 ../intent-preservation-system/scripts/validate_adoption_profile.py --root . --phase planning` |
| Required sections present in every artifact | Pass | Document set includes business, system, vision, constitution, governance, integration contract, bootstrap task/goal-impact/execution-plan/validation |
| Integration decisions concrete and code-verified | Pass | `ips-adoption.json` and `docs/06_architecture/INTEGRATION_CONTRACT.md` cite real source files (`src/orders/order-events.service.ts`, `src/pricing/pricing.service.ts`, `src/warehouse/warehouse-reservation.client.ts`, `src/orders/orders.controller.ts`, `src/logger/logger.service.ts`) for every required decision |
| State schema complete | Pass | `STATE.json` includes `schemaVersion`, `project`, `lifecycle`, `health`, `activeTask`, `lastUpdated`, `deployment`, `blockers`, `followUps` while preserving the prior production/frozen history |

## Gate evidence

| Gate | Command | Result | Evidence |
| --- | --- | --- | --- |
| Adoption | `python3 ../intent-preservation-system/scripts/validate_adoption_profile.py --root . --phase planning` | Pass | Required sections and placeholders resolved; see command output recorded at task closure |
| Pre-coding | Not run | Not applicable | No application code was changed by this documentation-only bootstrap task |
| Application | `npm test` | Not run in this onboarding gate | Application validation remains a downstream implementation-lifecycle concern |
| Integration | `npm run build` | Not run in this onboarding gate | Integration validation remains a downstream implementation-lifecycle concern |
| Deployment dry run | `../shared/scripts/deploy.sh orders-microservice --dry-run` | Not run | Deployment remains subject to explicit owner approval; no deploy was requested for this task |

## Integration evidence

The required integrations are recorded in `ips-adoption.json` and the human-readable contract in `docs/06_architecture/INTEGRATION_CONTRACT.md`. Every `required` decision (auth, PostgreSQL, logging, AI, payments, catalog, warehouse, invoices, event-bus, docs-RAG, monitoring, backups) is backed by a concrete code or route reference. Every `not-applicable` decision (redis, notifications, orders, object storage) is backed by the absence of a corresponding client or route in `src/`.

## Invariant evidence

`docs/17_governance/PROJECT_INVARIANTS.md` preserves the anti-automated-cancellation rule, the order state-machine transition rule, the no-sensitive-data-in-logs rule, and role-gated internal-service writes. No source file implementing these rules (`src/orders/status-transitions.ts`, `src/auth/jwt-roles.guard.ts`) was modified by this task.

## Sensitive-data evidence

No secrets, tokens, Vault values, or real customer address/payment data appear in any document created or modified by this task. All evidence cites file paths, environment variable names, and role strings rather than runtime values.

## Replay and determinism evidence

The adoption baseline is deterministic: the same project intent, integration decisions and required sections are captured in a consistent set of repository documents, and re-running the adoption validator against an unchanged repository returns the same pass result.

## Issues and validation debt

No current-task issues remain. The pre-existing `docs/orchestrator/VALIDATION_DEBT.md` placeholder entry was replaced with a concrete, resolved entry recording that no validation debt is currently open for this repository.

## Deviations

None. The scope matched the task objective: documentation-only IPS adoption, no application, schema, or deployment change.

## Recommendation

Accept. The IPS adoption baseline is complete and requires no follow-up before the next implementation task begins.

## Traceability confirmation

The result remains aligned with the protected business intent in `../../BUSINESS.md` and the approved vision in `../01_vision/VISION.md`, and does not broaden the service's scope beyond the truthful order-processing-authority problem. See `TASK-001-bootstrap-service` for the originating task record.
