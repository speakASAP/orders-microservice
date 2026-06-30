# Orders Execution Plan

```yaml
id: ORDERS-EXECUTION-PLAN
status: active
owner: Orders owner
created: 2026-06-13
last_updated: 2026-06-30
selected_goal: Goal 7 - Production Order Integration Rollout
selected_chunk: 7.1 Orders create caller allowlist and production integration plan
pre_coding_gate: pass-with-exception
```

## Preserved Intent

Orders remains the canonical order lifecycle service for supported sellable channels. Catalog remains product truth, Warehouse remains stock and reservation authority, Payments remains payment identity/reconciliation authority, Auth remains identity/RBAC authority, and Leads/Marketing/Notifications consume order signals without becoming order truth.

## Planned Changes

- Add Goal 7 and a production integration plan for order rollout across channel services and downstream consumers.
- Expand `CHANNEL_ORDER_CREATE_ROLES` to include FlipFlop, Allegro, Aukro, Bazos, and Heureka service roles.
- Expand Orders machine-auth header allowlist to map configured runtime token env vars to those service roles.
- Strengthen the create-order verifier and contract doc so the allowlist stays explicit and discoverable.

## Invariant Review

- `ORD-INV-001` intent: preserved; this strengthens central Orders create ownership.
- `ORD-INV-002` state-machine: unchanged; no status transition behavior changes.
- `ORD-INV-003` boundary: preserved; no product, stock, payment, identity, notification, leads, or marketing ownership moves into Orders.
- `ORD-INV-004` sensitive-data: preserved; no token values, decoded JWTs, DB rows, customer data, addresses, or payment details are read or recorded.
- `ORD-INV-005` contract: changed intentionally at RBAC/machine-auth allowlist level; create payload shape and lifecycle behavior do not change.
- `ORD-INV-007` evidence: status/state docs must record validation and next work.
- `ORD-INV-008` DocsRAG: pass-with-exception because `[MISSING: DocsRAG session JWT]`; source docs and read-only remote audits are compensating evidence.

## Sensitive Data Classification

Classification: `restricted metadata only`.

This chunk references service names, role names, and environment variable names. It does not read, print, copy, decode, or persist runtime token values or customer/payment/address data.

## Contract Impact

- API payload: no change.
- JWT/RBAC: create-order accepted roles now include `internal:flipflop-service:service`, `internal:allegro-service:service`, `internal:aukro-service:service`, `internal:bazos-service:service`, and `internal:heureka-service:service`.
- Machine auth: Orders can map configured `FLIPFLOP_INTERNAL_SERVICE_TOKEN`, `ALLEGRO_INTERNAL_SERVICE_TOKEN`, `AUKRO_INTERNAL_SERVICE_TOKEN`, `BAZOS_INTERNAL_SERVICE_TOKEN`, and `HEUREKA_INTERNAL_SERVICE_TOKEN` to service actors when callers use `x-internal-service-token` plus `x-service-name`.
- Runtime secret wiring: not changed in this chunk; missing caller tokens mean those service actors are not accepted until a follow-up credential lane maps runtime secrets.
- Warehouse/payment/catalog/events: no behavior change.

## Validation Plan

```bash
git diff --check
npm run build
npm run verify:create-order-contract
npm test
rg '\[(MISSING|UNKNOWN):' docs/IMPLEMENTATION_STATE.md docs/IMPLEMENTATION_ORCHESTRATOR.md docs/orchestrator implementation-goals AGENTS.md TASKS.md
rg -n 'Authorization: Bearer [A-Za-z0-9_./+=:-]{12,}|(access[_-]?token|client[_-]?secret|password|private[_-]?key|jwt[_-]?secret|db[_-]?password)\s*[:=]\s*["'"']?[A-Za-z0-9_./+=:-]{12,}' docs AGENTS.md TASKS.md implementation-goals
```

## Parallelization

This coordinator chunk owns Orders files and shared IPS docs. Channel adapter edits, event-consumer work, and non-marketplace application decisions are separate Goal 7 lanes and must not edit these Orders files concurrently.

## Pre-Coding Gate Decision

Decision: `pass-with-exception`.

Exception: DocsRAG live query was unavailable because no session `JWT_TOKEN` was present. The plan uses repository source-of-truth docs plus read-only remote subagent audits as compensating evidence.
