# Production Order Integration Plan

```yaml
id: ORDERS-PRODUCTION-ORDER-INTEGRATION-PLAN
status: active
owner: Orders owner
created: 2026-06-30
last_updated: 2026-06-30
completeness_level: planning-plus-first-slice
upstream:
  - docs/orchestrator/INTENT.md
  - docs/orchestrator/GOALS.md
  - docs/orchestrator/CHANNEL_ORDER_CREATE_CONTRACT.md
  - docs/orchestrator/ORDER_EVENT_CONTRACTS.md
  - docs/orchestrator/WAREHOUSE_HANDOFF_CONTRACT.md
  - docs/orchestrator/CANDIDATE_APPLICATION_INTEGRATION_DECISIONS.md
downstream:
  - docs/orchestrator/EXECUTION_PLAN.md
  - docs/orchestrator/STATUS.md
  - docs/IMPLEMENTATION_STATE.md
related_adrs: []
```

## Intent Chain

- Vision: Orders is the canonical order lifecycle and statistics backbone for supported sellable channels.
- Goal Impact: FlipFlop, Allegro, Aukro, Bazos, Heureka, Catalog, Warehouse, Leads, Marketing, Notifications, and future app integrations share one order reference without duplicating order truth.
- System: `orders-microservice` owns order records, order items, order status lifecycle, shipment records, and versioned order lifecycle events.
- Feature: production integration rollout for channel create callers and downstream event consumers.
- Task: document the rollout plan, open Goal 7, expand the Orders create service-role allowlist, and split remaining work into non-conflicting agent lanes.
- Execution Plan: coordinator-owned Orders contract/RBAC slice first; channel-service, event-consumer, and non-marketplace app lanes remain separate.
- Coding Prompt: preserve Catalog product truth, Warehouse stock authority, Payments payment identity, Auth identity/RBAC, and Leads/Marketing/Notifications consumer ownership.
- Code: `src/auth/jwt-roles.guard.ts`, `src/orders/orders.controller.ts`, `scripts/verify-create-order-contract.js`, and Orders IPS docs.
- Validation: build and targeted contract checks before any deploy; live smokes only after credential and channel wiring are done.

## Current Facts

Orders already has the core order backbone: `orders.create.v1`, deterministic idempotency by `contractVersion + channel + channelAccountId + externalOrderId`, versioned lifecycle events, payment-status boundary, protected product sales statistics for Catalog, admin operations diagnostics, and fail-closed Warehouse reservation for sellable channels.

DocsRAG was not queried because this session has no `JWT_TOKEN`; this is recorded as `[MISSING: DocsRAG session JWT]`. Repository source-of-truth docs and remote read-only audits were used as compensating evidence.

## Application Decisions

| Application or service | Current decision | Production requirement |
| --- | --- | --- |
| FlipFlop | Channel create path is source-ready, but repo has unrelated dirty files. | Keep as first production smoke once caller auth and dirty worktree are controlled. Must send `orders.create.v1`, stable `channelAccountId`, canonical Catalog product IDs, and `warehouseId`. |
| Heureka | Channel create path is source-ready and clean. | Keep as second production smoke. It already sends machine-auth headers and derives/validates `warehouseId`. |
| Allegro | Not ready for canonical Orders create. | Add accepted Orders auth headers/token wiring and include Warehouse `warehouseId` in forwarded items before enabling actual create. |
| Aukro | Not ready for canonical Orders create. | Add accepted Orders auth headers/token wiring and include Warehouse `warehouseId`; forwarding failure must not silently count as production success. |
| Bazos / Bazosh spelling | Only true sellable Bazos orders should feed Orders. | Resolve `[UNKNOWN: live Bazos marketplace webhook support]`; add auth headers and `warehouseId`; ad publishing/compliance remain Bazos-local. |
| Catalog | Consumer of protected product sales statistics. | Continue using Auth-owned `CATALOG_INTERNAL_SERVICE_TOKEN`; Catalog remains product truth and never stores order truth. |
| Warehouse | Stock and reservation authority. | Orders create must keep failing closed unless Warehouse reservation returns `reserved`. |
| Payments | Payment identity and reconciliation authority. | Use bounded `orders.payment-status.v1`; no provider sessions, variable symbols, refunds, or reconciliation in Orders. |
| Leads | No `orders.events` consumer found. | Add queue binding, event DTO, idempotent consumer, replay/backfill plan, and validation smoke before claiming CRM order lifecycle integration. |
| Marketing | HTTP polling/segmentation signal exists; no `orders.events` consumer found. | Decide whether REST polling remains enough or implement RabbitMQ lifecycle consumer; no campaign execution inside Orders. |
| Notifications | HTTP send API exists; no `orders.events` consumer found. | Add event-to-notification policy, recipient source, template approval, and mass-send guard before automatic lifecycle notifications. |
| Marathon | Stay domain-local now. | Future bounded VIP purchase signal only if owner approves; do not move participant/payment/progress lifecycle into Orders. |
| SpeakASAP | Stay domain-local. | Only revisit if owner converts or retires SpeakASAP payment-service order ownership. |
| School Committee | Stay domain-local. | Future contribution/accounting signal only, not product order. |
| Rentabox | Stay domain-local for MVP. | Future rental/payment signal only after real payment contract approval. |

## Parallel Execution Plan

| Workstream | Status | Owner role | Scope | Allowed files | Forbidden files | Dependencies | Validation evidence | Handoff notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 7.1 Orders contract/RBAC | in progress | coordinator | Orders create caller roles and IPS plan | `src/auth/jwt-roles.guard.ts`, `src/orders/orders.controller.ts`, `scripts/verify-create-order-contract.js`, Orders docs | Neighbor service files, secrets, DB data, deployment manifests unless credential lane starts | None beyond remote access | `npm run build`, `npm run verify:create-order-contract`, `git diff --check`, `npm test` if time permits | This slice only allows configured service actors; it does not create token secrets. |
| 7.2A FlipFlop + Heureka smoke prep | ready now | channel integration agent | Verify existing caller auth, clean dirty risk, design sanitized create smoke | Channel repo verification scripts/docs only unless owner starts code lane | Orders shared docs, DB rows, secrets | 7.1 merged/deployed for role allowlist if using machine-auth roles | Existing verifier plus sanitized no-secret smoke plan | FlipFlop dirty worktree must be resolved or isolated before deploy. |
| 7.2B Allegro/Aukro/Bazos auth + `warehouseId` | ready after lane assignment | channel integration agent | Add auth headers and Warehouse route mapping in each channel | One channel repo per agent; shared order client in that repo only | Orders repo, other channel repos, shared public contract | Channel repo dirty worktree review | Focused mapper/client specs and build | Split into three agents to avoid cross-repo conflicts. |
| 7.4 Leads/Marketing/Notifications consumers | ready as design lane | event consumer agent | Add or plan `orders.events` consumers | One consumer repo per agent | Orders create flow, channel adapters, campaign execution without owner policy | Queue naming and replay/idempotency decision | Consumer contract tests, event fixture tests, no raw payloads | Start with docs/contract if runtime queue standards are unclear. |
| 7.5 Non-marketplace decisions | blocked for coding | domain integration owner | Marathon/SpeakASAP/School/Rentabox contract decisions | Per-app contract docs only | Runtime code, payment/provider data, participant/customer data | Owner approval per application | Decision doc with exact boundaries | Default is domain-local; no code until owner-approved contract. |
| 7.6 Integration and deploy | final integration | coordinator | Combined readiness gate and deployment | Orders docs/status plus deploy scripts only if deploy is approved | Secrets, destructive DB operations, channel runtime mutation without lane evidence | 7.2 and 7.4 evidence | Build/test/smoke/deploy evidence | Deploy only after clean integrated evidence. |

## Immediate Next Work

1. Finish validating 7.1 in Orders.
2. Start channel-specific workers for Allegro, Aukro, and Bazos `warehouseId` plus auth wiring after their dirty worktrees are classified.
3. Start consumer design for Leads, Marketing, and Notifications `orders.events` handling.
4. Keep Marathon/SpeakASAP/School Committee/Rentabox out of Orders until separate owner-approved contracts exist.
