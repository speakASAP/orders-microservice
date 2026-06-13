# Orders Execution Plan

```yaml
id: ORDERS-EXECUTION-PLAN
status: active
owner: Orders owner
created: 2026-06-13
last_updated: 2026-06-13
selected_goal: Goal H6 - Payments Callback And Status Boundary
selected_chunk: H6.1-H6.5
pre_coding_gate: pass-with-exception
```

## Preserved Intent

Orders remains the canonical order lifecycle service. Payments remains the authority for provider sessions, webhooks, provider transaction identity, reconciliation, refunds, and payment transaction history. Orders may store only bounded payment status references needed for order progress.

## Planned Changes

- Add a protected `PUT /api/orders/:id/payment-status` contract for Payments-owned status callbacks.
- Store only `paymentReferenceId`, `paymentApplicationId`, `paymentMethod`, `paymentStatus`, and `paymentUpdatedAt`.
- Map Payments `completed` to Orders `paid` and, only from `pending`, advance the order to `confirmed`.
- Reject raw provider identity fields, metadata, amount/currency, card/token/secret data, refunds, paid-reference replacement, and paid-status downgrade.
- Publish `orders.order.paid.v1` once when a non-paid order becomes paid.

## Invariant Review

- `ORD-INV-001` intent: preserved; Orders coordinates order progress only.
- `ORD-INV-003` boundary: preserved; payment identity, reconciliation, provider webhooks, transactions, and refunds remain in Payments.
- `ORD-INV-004` sensitive-data: preserved; provider payloads, customer payment data, card data, tokens, and secrets are rejected and not logged.
- `ORD-INV-005` contract: changed intentionally; new payment-status callback contract is documented and verified.
- `ORD-INV-007` evidence: status and implementation state must be updated after checks.

## Sensitive Data Classification

Classification: `restricted`.

The callback may be triggered by payment state changes, but Orders accepts only bounded IDs/status labels. It rejects provider response bodies, provider transaction identifiers, metadata, amount/currency, customer data, card data, tokens, secrets, and refund fields.

## Contract Impact

- API: new protected `PUT /api/orders/:id/payment-status` endpoint for admin or Payments service roles.
- JWT/RBAC: explicit roles `global:superadmin`, `internal:orders-microservice:admin`, and `internal:payments-microservice:service`.
- State machine: `completed -> paid` may move `pending -> confirmed`; cancellation, refunds, paid-reference replacement, and paid downgrades are rejected.
- Events: `orders.order.paid.v1` is emitted once on first paid transition.
- Warehouse: release/fulfill runtime triggers remain a separate rollout decision.

## Validation Plan

```bash
npm run build
npm run verify:payment-boundary
npm test
rg '\[(MISSING|UNKNOWN):' docs/IMPLEMENTATION_STATE.md docs/IMPLEMENTATION_ORCHESTRATOR.md docs/orchestrator implementation-goals AGENTS.md TASKS.md
git diff --check
```

## Pre-Coding Gate Decision

Decision: `pass-with-exception`.

Reason: DocsRAG live query was unavailable because no session `JWT_TOKEN` was present. Compensating evidence came from Orders source-of-truth docs and `payments-microservice` source/docs (`PaymentStatus`, callback payload, webhook ownership, and refund ownership). The selected chunk is bounded to an Orders-local protected callback boundary.
