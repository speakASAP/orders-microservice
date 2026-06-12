# Validation Report Template

```yaml
id: ORDERS-VALIDATION-REPORT-TEMPLATE
goal:
chunk:
decision: pending
created:
updated:
```

## Summary

State what changed.

## Commands Run

List commands and results.

## Contract Checks

State whether API, JWT/RBAC, state-machine, event, warehouse, payment, catalog, notification, CRM, or channel contracts changed and how they were checked.

## Sensitive Data Checks

State scans/reviews run and any findings.

## Runtime Evidence

Include health, API, smoke, deployment, or log evidence when applicable. Do not include secrets, tokens, payment details, customer addresses, or raw production customer data.

## Decision

Use one: `accept`, `accept-with-follow-up`, `block`.

## Next Action

Name exactly one next unfinished chunk.
