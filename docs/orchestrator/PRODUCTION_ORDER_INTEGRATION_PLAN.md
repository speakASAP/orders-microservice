# Production Order Integration Plan

```yaml
id: ORDERS-PRODUCTION-ORDER-INTEGRATION-PLAN
status: active
owner: Orders owner
created: 2026-06-30
last_updated: 2026-07-01
completeness_level: channel-smokes-integrated
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

## 2026-07-01 Orders Runtime Credential Gate

Orders-side runtime credential aliases are now mapped and deployed for all supported channel service callers:

Only secret key names and ExternalSecret sync status were inspected; no token values were printed, decoded, created, or committed. Commit `342f003` deployed the 7.1 allowlist plus this Orders-side runtime mapping as `localhost:5000/orders-microservice:342f003`, and runtime env-name presence confirmed all five aliases.

Channel repositories still own caller header implementation, `warehouseId` forwarding, and sanitized create/idempotency/Warehouse reservation smokes.

## 2026-07-01 Channel Smoke Integration

Goal 7.2 channel caller header/`warehouseId` wiring and sanitized smoke evidence is integrated:

- FlipFlop: `reports/validation/orders-readiness-smoke/report-latest.json` passed with owner-approved live smoke, auth accepted, HTTP 201, `orders.create.v1`, central order ID present, and Warehouse reservation status present. Current repo is clean; later `bcd1eb6` is separate FlipFlop lifecycle work.
- Heureka: commit `ac26098` records final sanitized Orders/Warehouse smoke pass with create/replay/cleanup, reservation status present, and status `reserved`. The current Heureka dirty worktree contains separate dashboard/feed/admin changes and is not part of Orders Goal 7.2.
- Allegro: commit `ec6f97a` forwards the Warehouse-owned UUID, and `ac56dc4` records the successful Warehouse UUID smoke after the earlier non-UUID blocker.
- Aukro: `4e11cdb`, `df8d16e`, and `12f445e` record runtime token mapping, live Orders smoke, and cleanup.
- Bazos: `230c6b5` deployed runtime token fallback and `c028495` records owner-approved create/replay/cancel Warehouse reservation smoke. True live Bazos marketplace webhook support remains `[UNKNOWN: live Bazos marketplace webhook support]`.

All relevant Kubernetes deployments were observed ready `1/1`. No raw token values, decoded JWTs, customer payloads, production order rows, DB rows, or payment data were printed. No channel source was edited by this coordinator integration pass.

## Application Decisions

## Parallel Execution Plan

| Workstream | Status | Owner role | Scope | Allowed files | Forbidden files | Dependencies | Validation evidence | Handoff notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 7.1 Orders contract/RBAC | complete | coordinator | Orders create caller roles and IPS plan | `src/auth/jwt-roles.guard.ts`, `src/orders/orders.controller.ts`, `scripts/verify-create-order-contract.js`, Orders docs | Neighbor service files, secrets, DB data | None beyond remote access | `npm run build`, `npm run verify:create-order-contract`, `git diff --check`, `npm test` | Source allowlist completed in `d1c5a48`; runtime deploy completed through 7.2 gate `342f003`. |
| 7.2A FlipFlop + Heureka smoke prep | complete | channel integration agent | Verify/create caller auth headers and sanitized create/replay/reservation smoke | Channel repo verification scripts/docs only unless owner starts code lane | Orders shared docs, DB rows, secrets | Orders runtime credential gate deployed in `342f003`; Orders Warehouse token trim deployed in `43f9774` | FlipFlop report-latest pass; Heureka `ac26098` pass | Heureka has unrelated dirty dashboard/feed/admin work; leave it isolated. |
| 7.2B Allegro/Aukro/Bazos auth + `warehouseId` | complete with Bazos provider caveat | channel integration agent | Add auth headers and Warehouse route mapping in each channel, then smoke create/replay/cleanup | One channel repo per agent; shared order client in that repo only | Orders repo, other channel repos, shared public contract | Orders runtime credential gate deployed in `342f003`; Orders Warehouse token trim deployed in `43f9774` | Allegro `ac56dc4`, Aukro `12f445e`, Bazos `c028495` | Bazos provider-backed marketplace order support remains `[UNKNOWN: live Bazos marketplace webhook support]`; synthetic/internal smoke passed. |
| 7.4 Leads/Marketing/Notifications consumers | ready as design lane | event consumer agent | Add or plan `orders.events` consumers | One consumer repo per agent | Orders create flow, channel adapters, campaign execution without owner policy | Queue naming and replay/idempotency decision | Consumer contract tests, event fixture tests, no raw payloads | Start with docs/contract if runtime queue standards are unclear. |
| 7.5 Non-marketplace decisions | blocked for coding | domain integration owner | Marathon/SpeakASAP/School/Rentabox contract decisions | Per-app contract docs only | Runtime code, payment/provider data, participant/customer data | Owner approval per application | Decision doc with exact boundaries | Default is domain-local; no code until owner-approved contract. |
| 7.6 Integration and deploy | complete for 7.2 | coordinator | Combined channel readiness gate and deployment evidence | Orders docs/status plus deploy scripts only if deploy is approved | Secrets, destructive DB operations, channel runtime mutation without lane evidence | 7.2 evidence | Channel reports plus Orders health/deployment evidence | No Orders redeploy required for this docs-only integration pass. |

## Immediate Next Work

1. Start consumer design for Leads, Marketing, and Notifications `orders.events` handling.
2. Keep Bazos provider-backed marketplace order ingestion marked `[UNKNOWN: live Bazos marketplace webhook support]` until a real provider contract exists.
3. Keep Marathon/SpeakASAP/School Committee/Rentabox out of Orders until separate owner-approved contracts exist.
4. Treat the current Heureka dirty dashboard/feed/admin worktree as a separate lane, not an Orders Goal 7.2 blocker.
