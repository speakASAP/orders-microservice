# Orders Readiness Gates

```yaml
id: ORDERS-READINESS-GATES
status: approved
owner: Orders owner
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: validated
upstream:
  - docs/orchestrator/PRE_CODING_GATE.md
  - docs/orchestrator/PROJECT_INVARIANTS.md
downstream:
  - docs/orchestrator/STATUS.md
```

## Purpose

Readiness gates define the checks required after implementation and before merge, deployment, or closure.

## Integration-Readiness Gate

Run this before combining independently developed changes or before declaring a contract-affecting chunk complete.

Required evidence:

- Pre-coding gate decision.
- Files changed and scope confirmation.
- Invariant review result.
- Sensitive-data scan result.
- Contract validation result or `No Orders contract change`.
- Test/build command results.
- Known deviations or follow-ups.

## Deployment-Readiness Gate

Run this before deployment or closure when runtime behavior changed.

Required evidence:

- All integration-readiness evidence.
- Deployment command and result when deployment is requested.
- Health or reachability check.
- Orders contract smoke check when API, status-machine, event, pricing, JWT/RBAC, payment, warehouse, or shipment behavior changed.
- Confirmation that no secrets, tokens, payment details, customer addresses, or raw production customer data were captured.

## Documentation-Only Readiness

For documentation-only changes, deployment is not required. Evidence should include:

```bash
find docs/orchestrator implementation-goals -maxdepth 2 -type f -name '*.md' -print
rg '\[(MISSING|UNKNOWN):' docs/IMPLEMENTATION_STATE.md docs/IMPLEMENTATION_ORCHESTRATOR.md docs/orchestrator implementation-goals AGENTS.md TASKS.md
rg -n 'Authorization: Bearer [A-Za-z0-9_./+=:-]{12,}|(access[_-]?token|client[_-]?secret|password|private[_-]?key|jwt[_-]?secret|db[_-]?password)\s*[:=]\s*['"'"'\"]?[A-Za-z0-9_./+=:-]{12,}' docs AGENTS.md TASKS.md implementation-goals
```

## Decision

- `accept`: all required evidence is present.
- `accept-with-follow-up`: task is complete, but a non-blocking follow-up is named.
- `block`: validation failed, invariant conflict remains, sensitive-data risk remains, or contract impact is unverified.

## Evidence Recording

Append a dated entry to `docs/orchestrator/STATUS.md` with:

- selected goal and chunk;
- gate decision;
- commands run;
- pass/fail summary;
- deployment details when applicable;
- next unfinished chunk.
