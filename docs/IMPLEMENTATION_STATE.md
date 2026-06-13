# Orders Implementation State

```yaml
id: ORDERS-IMPLEMENTATION-STATE
status: ready
owner: Orders owner
created: 2026-06-12
last_updated: 2026-06-13
completeness_level: implemented
upstream:
  - AGENTS.md
  - BUSINESS.md
  - SYSTEM.md
  - README.md
  - TASKS.md
  - docs/orchestrator/INTENT.md
  - docs/orchestrator/GOALS.md
  - docs/orchestrator/PROJECT_INVARIANTS.md
  - docs/orchestrator/PRODUCTION_READINESS_ROADMAP.md
  - docs/orchestrator/CHANNEL_ORDER_CREATE_CONTRACT.md
  - docs/orchestrator/ORDER_IDEMPOTENCY_CONTRACT.md
  - docs/orchestrator/ORDERS_HUB_ROADMAP.md
downstream:
  - docs/orchestrator/STATUS.md
  - docs/orchestrator/EXECUTION_PLAN.md
related_adrs: []
current_goal: none
current_chunk: none
next_recommended_goal: Goal H3 chunk H3.5 verify FlipFlop and marketplace adapters can retry safely; then add database-level uniqueness hardening; follow-up hardening: database uniqueness for concurrent duplicate creates
last_completed_goal: Goal 4 chunk 4.3 / Goal H3 chunks H3.2-H3.4 runtime idempotency protection
blockers: []
```

## Current Checkpoint

Goal 4 chunk 4.3 / Goal H3 chunks H3.2-H3.4 are complete in runtime. Orders now looks up existing orders by `contractVersion + channel + channelAccountId + externalOrderId`, returns the existing order for exact replay, and rejects same-key different-payload creates with HTTP 409.

The documented idempotency key is `contractVersion + channel + channelAccountId + externalOrderId`. New clients must send `contractVersion=orders.create.v1`, a supported channel, a stable channel account/store/integration identity, and the upstream order or checkout ID. Safe retries must return the existing canonical order without inserting duplicate `orders` or `order_items` rows, without re-emitting `order.created`, and without rerunning warehouse/payment/notification/CRM side effects. Mismatched duplicates must become bounded `409 ORDER_IDEMPOTENCY_CONFLICT` responses without raw customer/address/payment payloads.

Goal 4 chunks 4.1 and 4.2 remain complete. `POST /api/orders` has a documented channel-ingestion contract, runtime normalizer for `orders.create.v1`, item-row persistence in the same transaction, and documented idempotency expectations. Database-level uniqueness for simultaneous duplicate creates remains a hardening follow-up.

Goal H1 chunks H1.1-H1.6 remain complete and deployed. The public Orders Hub landing page, admin shell, explicit admin JSON roles, roadmap, deployment, and live route checks are recorded in `docs/orchestrator/STATUS.md` and `docs/orchestrator/ORDERS_HUB_ROADMAP.md`.

Goal 3 remains complete. Sensitive logging regression checks are wired into `npm test` and continue to pass. Goal 2 remains complete; owner-approved cancellation gates and state-transition validation remain in force.

## Preserved Intent Summary

`orders-microservice` is the canonical order processing and lifecycle service. It stores orders, order items, shipment records, order status, and order events for all sales channels. FlipFlop and marketplace services are clients of Orders, not duplicate order sources of truth. Catalog remains product truth, Warehouse remains stock truth, Payments remains payment identity/reconciliation truth, and Auth remains identity/RBAC truth.

## Current Evidence

- Added the order idempotency contract document and wired the create-order contract to the full key: contractVersion + channel + channelAccountId + externalOrderId.
- Added runtime deterministic duplicate lookup before create-order insertion.
- Exact same-key replay now returns the existing canonical order and does not insert duplicate order or item rows.
- Same-key different-payload replay now rejects with HTTP 409 before inserts, event publishing, or side effects.
- Added scripts/verify-idempotency-contract.js and scripts/verify-duplicate-order-protection.js.
- Updated package.json so npm test runs the duplicate-order protection verification after the existing build, transition, sensitive logging, create-order, and idempotency checks.
- Updated docs/orchestrator/GOALS.md and docs/orchestrator/ORDERS_HUB_ROADMAP.md to mark Goal 4.3 and H3.2-H3.4 complete.
- Database-level uniqueness for simultaneous duplicate creates remains a hardening follow-up because this repository does not currently have a production migration path.
- DocsRAG live query was not run because no session JWT_TOKEN was available; repository source-of-truth docs and the current create-order/idempotency contracts were sufficient for this bounded Orders-local runtime chunk.

## Next Action

Continue Goal H3 chunk H3.5: verify FlipFlop and marketplace adapters can retry safely; then add database-level uniqueness hardening.

## Verification State

Goal 4 chunk 4.3 / Goal H3 chunks H3.2-H3.4 verification completed.

Commands run: npm run verify:duplicate-order-protection; npm test; git diff --check; missing-marker scan.

Verification results:

- npm run verify:duplicate-order-protection: pass; duplicate order protection verification ok.
- npm test: pass; build completed, status transition verification ok, sensitive logging verification ok, create order contract verification ok, idempotency contract verification ok, and duplicate order protection verification ok.
- git diff --check: pass.
- Missing-marker scan: pass; no missing or unknown markers found in IPS documentation scope.

Deployment was not run because the owner requested the implementation chunk only; deploy remains available after review.
