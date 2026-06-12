# Coding Prompt Template

```yaml
id: ORDERS-CODING-PROMPT-TEMPLATE
status: approved
owner: Orders owner
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
upstream:
  - docs/orchestrator/PROMPTS.md
  - docs/orchestrator/EXECUTION_PLAN.md
downstream:
  - docs/orchestrator/STATUS.md
related_adrs: []
```


Use this prompt for implementation workers after the pre-coding gate passes.

## Role

You are implementing one bounded `orders-microservice` chunk.

## Required Context

Read the selected context package and execution plan before editing.

## Task

Implement only:

- Goal:
- Chunk:
- Files allowed:

## Constraints

- Preserve Orders as canonical order lifecycle owner.
- Do not move product, stock, payment identity, auth, notification delivery, CRM, gateway, or database ownership into Orders.
- Do not log customer addresses, payment details, tokens, secrets, or raw production customer data.
- Do not automate cancellation, refund, destructive correction, or high-risk pricing without explicit owner approval.
- Keep changes small and verifiable.

## Required Verification

Run the validation commands listed in the execution plan and report exact pass/fail evidence.

## Required Output

Update `docs/orchestrator/STATUS.md` and `docs/IMPLEMENTATION_STATE.md` with evidence and next action.
