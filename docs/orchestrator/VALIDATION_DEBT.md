# Validation Debt Ledger

## Purpose

Record known validation failures that are not caused by the current task, so agents can separate existing repo debt from real regressions.

## Rules

- This ledger does not excuse current-task failures.
- Every entry needs an owner, scope, and unblock condition.
- Do not include secrets, tokens, raw production data, customer identifiers, or private evidence.
- If a failure starts affecting the current task, promote it from debt to blocker.

## Entries

| ID | Date | Command | Failure Summary | Scope | Owner | Blocks Current Task? | Unblock Condition | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VD-001 | 2026-08-30 | `python3 ../intent-preservation-system/scripts/validate_adoption_profile.py --root . --phase planning` | No open validation debt recorded for the orders-microservice IPS adoption bootstrap. | repo-wide | project owner | no | maintain clean adoption evidence | `docs/12_validation/VAL-TASK-001-bootstrap-service.md` |

## Current-Task Decision Checklist

- Does the failing command touch files changed by this task?
- Does the failure mention this task ID, goal ID, or changed module?
- Is the failure already listed above with `Blocks Current Task? = no`?
- Did the failure exist before this task started?
- Is the validation command required by the current task acceptance criteria?

## Update Format

Record each validation debt check using the fields below before closing a task or handoff.

```text
Validation debt check:
- Command:
- Result:
- Matched ledger entry:
- Current-task impact:
- Next action:
```

## Agent Reporting Format

Use the Update Format block above when reporting a validation debt check at task handoff.

Next step: Keep entries current whenever validation failures are classified as out of scope.
