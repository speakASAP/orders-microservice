# Orders Execution Plan

```yaml
id: ORDERS-EXECUTION-PLAN
status: active
owner: Orders owner
created: 2026-06-13
last_updated: 2026-06-13
selected_goal: Goal H3 - Channel Idempotency And Duplicate Protection / Goal 4 - Channel Order Ingestion Contract
selected_chunk: H3.1-H3.4 / 4.2-4.3
pre_coding_gate: pass-with-exception
```

## Preserved Intent

Orders remains the canonical order lifecycle service. Channel services may retry order creation against Orders, but Orders must not take ownership of identity, stock, product truth, payment identity/reconciliation, notifications, leads, marketing, or channel-specific workflows.

## Planned Changes

- Document the create-order idempotency key as `contractVersion + channel + channelAccountId + externalOrderId`.
- Add runtime lookup before create to return an existing order for exact idempotent replay.
- Reject same-key different-payload replay with HTTP 409 Conflict.
- Avoid duplicate `order.created` publishing for idempotent replay.
- Add contract verification for idempotency key extraction and replay matching.

## Invariant Review

- `ORD-INV-001` intent: preserved; channel services retry creation against Orders instead of creating duplicate truth.
- `ORD-INV-003` boundary: preserved; no payment, stock, catalog, auth, notification, lead, or marketing ownership moves into Orders.
- `ORD-INV-004` sensitive-data: preserved; replay checks compare normalized payloads without logging raw customer/address/payment values.
- `ORD-INV-005` contract: changed intentionally; create-order replay and conflict behavior are documented and verified.
- `ORD-INV-007` evidence: status and implementation state must be updated after checks.

## Sensitive Data Classification

Classification: `masked`.

The idempotency check compares normalized order snapshots and item rows. Audit logs record only bounded metadata and must not log raw customer, address, payment, token, or secret values.

## Contract Impact

- Order create contract: `POST /api/orders` now returns existing order on exact idempotent replay and returns HTTP 409 on conflicting same-key replay.
- Public route contract: no change.
- JWT/RBAC contract: no change.
- State machine: no change.
- Event contract: no runtime change; roadmap defines future event goals.
- Warehouse/payment/catalog/notifications/leads/marketing: no runtime change; roadmap defines future integration goals.

## Validation Plan

```bash
npm run build
npm test
rg '\[(MISSING|UNKNOWN):' docs/IMPLEMENTATION_STATE.md docs/IMPLEMENTATION_ORCHESTRATOR.md docs/orchestrator implementation-goals AGENTS.md TASKS.md
rg -n 'Authorization: Bearer [A-Za-z0-9_./+=:-]{12,}|(access[_-]?token|client[_-]?secret|password|private[_-]?key|jwt[_-]?secret|db[_-]?password)\s*[:=]\s*['"'"'\"]?[A-Za-z0-9_./+=:-]{12,}' docs AGENTS.md TASKS.md implementation-goals
curl -I -H 'Cache-Control: no-cache' https://orders.alfares.cz/
curl -I -H 'Cache-Control: no-cache' https://orders.alfares.cz/admin/orders
curl -i -H 'Cache-Control: no-cache' 'https://orders.alfares.cz/api/admin/orders/dashboard?limit=1'
curl -I -H 'Cache-Control: no-cache' https://orders.alfares.cz/health
```

## Pre-Coding Gate Decision

Decision: `pass-with-exception`.

Reason: DocsRAG live query was unavailable because no session `JWT_TOKEN` was present. Compensating evidence came from Orders source-of-truth docs and prior remote neighboring repository discovery. The selected chunk is bounded to Orders create-contract behavior, with no cross-service runtime integration.
