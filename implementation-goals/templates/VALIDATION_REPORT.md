# Validation Report Template

```yaml
id: ORDERS-VALIDATION-REPORT-TEMPLATE
goal:
chunk:
status: draft
owner: Orders owner
created: YYYY-MM-DD
last_updated: YYYY-MM-DD
completeness_level: skeletal
upstream:
  - docs/orchestrator/EXECUTION_PLAN.md
  - docs/orchestrator/READINESS_GATES.md
downstream:
  - docs/orchestrator/STATUS.md
related_adrs: []
decision: pending
```

## Artifact Validated

Name the code, documentation, deployment, API, event, or contract artifact validated.

## Validation Scope

State what was and was not validated.

## Evidence

List files changed, commands run, and inspected source facts.

## Gate Evidence

Record pre-coding, integration-readiness, deployment-readiness, or documentation-only gate results.

## Invariant Evidence

State how each applicable `ORD-INV-*` invariant was preserved or why it is not applicable.

## Sensitive-Data Scan Evidence

State scans/reviews run and findings. Do not include secrets, tokens, payment details, customer addresses, or raw production customer data.

## Replay And Determinism Evidence

State how another agent can reproduce the validation path.

## Passed Criteria

List accepted criteria.

## Failed Criteria

List failed criteria, or `None`.

## Deviations

List exceptions, unavailable checks, or owner-approved deviations.

## Recommendation

Use one: `accept`, `accept-with-follow-up`, or `block`, and name exactly one next unfinished chunk.
