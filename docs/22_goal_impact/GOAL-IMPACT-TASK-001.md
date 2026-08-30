# GOAL-IMPACT-TASK-001: Bootstrap orders-microservice

```yaml
id: GOAL-IMPACT-TASK-001
artifact_type: task
artifact_id: TASK-001-bootstrap-service
artifact_path: ../11_tasks/TASK-001-bootstrap-service.md
primary_goal: "Give the Alfares ecosystem one trustworthy order-processing authority so every sales channel, fulfillment and payment integration operates against a single, auditable order record."
secondary_goals:
  - "Bring orders-microservice into full IPS adoption compliance, matching cv-tuning, runlayer and wisdom-quotes."
impact_level: "high"
status: validated
```

## Goal

This task advances the approved vision in `../01_vision/VISION.md` and the business intent in `../../BUSINESS.md` by giving orders-microservice a complete, validator-passing IPS documentation baseline that truthfully describes its production role as the central order-processing hub.

## Contribution

The bootstrap task restructures the service's existing, real business and system facts into the canonical IPS artifact set, adds the required governance, integration-contract and bootstrap-task/plan/validation records, and reconciles `ips-adoption.json` and `STATE.json` with the required schema — all without inventing new business scope or fabricating integrations that are not present in the codebase.

## Success metric

The project completes the IPS adoption validator (`--phase planning`) without unresolved placeholders, includes every required governance and bootstrap artifact, and records a concrete, code-verified integration decision for all 16 ecosystem capabilities.

## Invariant compatibility

This task preserves every invariant in `../17_governance/PROJECT_INVARIANTS.md` (`ORD-INV-001`–`ORD-INV-004`): the human-approval requirement for cancel/refund, the order state-machine transition rule, the no-sensitive-data-in-logs rule, and role-gated internal-service writes remain exactly as implemented. No invariant was relaxed to make the validator pass.

## Upstream and downstream links

- Upstream: `../../BUSINESS.md` (Goal, Constraints, Consumers, SLA) and `../01_vision/VISION.md` (one-sentence vision, success criteria).
- Task: `../11_tasks/TASK-001-bootstrap-service.md`
- Plan: `../21_execution_plans/EP-TASK-001-bootstrap-service.md`
- Validation: `../12_validation/VAL-TASK-001-bootstrap-service.md`

## Validation method

The objective is validated by running `validate_adoption_profile.py --root . --phase planning` and confirming it exits 0 with no `ERROR:` lines, and by manually confirming every capability decision in `ips-adoption.json` is backed by a real code or configuration reference cited in `../06_architecture/INTEGRATION_CONTRACT.md`.
