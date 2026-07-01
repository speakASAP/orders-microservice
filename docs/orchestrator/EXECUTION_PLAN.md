# Orders Execution Plan

```yaml
id: ORDERS-EXECUTION-PLAN
status: active
owner: Orders owner
created: 2026-06-13
last_updated: 2026-07-01
selected_goal: Goal 7 - Production Order Integration Rollout
selected_chunk: 7.2 Orders-side runtime credential and deploy gate
pre_coding_gate: pass-with-exception
```

## Preserved Intent

Orders remains the canonical order lifecycle service for supported sellable channels. Catalog remains product truth, Warehouse remains stock and reservation authority, Payments remains payment identity/reconciliation authority, Auth remains identity/RBAC authority, and Leads/Marketing/Notifications consume order signals without becoming order truth.

## Planned Changes

- Verify that commit `d1c5a48` is present in source and whether its Orders create service-role allowlist is deployed.
- Map missing Orders runtime token aliases for FlipFlop, Allegro, Aukro, and Bazos through `k8s/external-secret.yaml`, reusing existing synchronized channel secret properties without creating or printing Vault values.
- Preserve the existing Heureka runtime alias and guard role mapping.
- Strengthen the create-order verifier and contract doc so the Orders machine-auth allowlist and ExternalSecret mappings stay explicit and discoverable.
- Deploy only after source validation and Kubernetes manifest dry-run pass, because channel smoke lanes require the 7.1 allowlist plus 7.2 runtime aliases to be live.

## Invariant Review

- `ORD-INV-001` intent: preserved; this strengthens central Orders create ownership.
- `ORD-INV-002` state-machine: unchanged; no status transition behavior changes.
- `ORD-INV-003` boundary: preserved; no product, stock, payment, identity, notification, leads, or marketing ownership moves into Orders.
- `ORD-INV-004` sensitive-data: preserved; no token values, decoded JWTs, DB rows, customer data, addresses, or payment details are read or recorded.
- `ORD-INV-005` contract: changed intentionally at RBAC/machine-auth runtime wiring level; create payload shape and lifecycle behavior do not change.
- `ORD-INV-007` evidence: status/state docs must record validation, deployment status, and next work.
- `ORD-INV-008` DocsRAG: pass-with-exception because `[MISSING: DocsRAG session JWT]`; source docs plus read-only remote/Kubernetes structural evidence are compensating evidence.

## Sensitive Data Classification

Classification: `restricted metadata only`.

This chunk references service names, role names, and environment variable names. It does not read, print, copy, decode, or persist runtime token values or customer/payment/address data.

## Contract Impact

- API payload: no change.
- JWT/RBAC: create-order accepted roles now include `internal:flipflop-service:service`, `internal:allegro-service:service`, `internal:aukro-service:service`, `internal:bazos-service:service`, and `internal:heureka-service:service`.
- Machine auth: Orders can map configured `FLIPFLOP_INTERNAL_SERVICE_TOKEN`, `ALLEGRO_INTERNAL_SERVICE_TOKEN`, `AUKRO_INTERNAL_SERVICE_TOKEN`, `BAZOS_INTERNAL_SERVICE_TOKEN`, and `HEUREKA_INTERNAL_SERVICE_TOKEN` to service actors when callers use `x-internal-service-token` plus `x-service-name`.
- Runtime secret wiring: changed only in Orders ExternalSecret mappings. The aliases point at existing synchronized channel secret properties: FlipFlop `ORDERS_SERVICE_TOKEN`; Allegro, Aukro, Bazos, and Heureka `JWT_TOKEN`. Token values remain runtime-only.
- Warehouse/payment/catalog/events: no behavior change.

## Validation Plan

```bash
git diff --check
npm run build
npm run verify:create-order-contract
npm test
kubectl apply --dry-run=server -f k8s/external-secret.yaml -n statex-apps
rg '\[(MISSING|UNKNOWN):' docs/IMPLEMENTATION_STATE.md docs/IMPLEMENTATION_ORCHESTRATOR.md docs/orchestrator implementation-goals AGENTS.md TASKS.md
rg -n 'Authorization: Bearer [A-Za-z0-9_./+=:-]{12,}|(access[_-]?token|client[_-]?secret|password|private[_-]?key|jwt[_-]?secret|db[_-]?password)\s*[:=]\s*["'"']?[A-Za-z0-9_./+=:-]{12,}' docs AGENTS.md TASKS.md implementation-goals
./scripts/deploy.sh
kubectl rollout status deployment/orders-microservice -n statex-apps --timeout=300s
curl -fsS https://orders.alfares.cz/health
```

## Parallelization

This coordinator chunk owns Orders files and shared IPS docs. Channel adapter edits, event-consumer work, and non-marketplace application decisions are separate Goal 7 lanes and must not edit these Orders files concurrently.

## Pre-Coding Gate Decision

Decision: `pass-with-exception`.

Exception: DocsRAG live query was unavailable because no session `JWT_TOKEN` was present. The plan uses repository source-of-truth docs plus read-only remote subagent audits as compensating evidence.
