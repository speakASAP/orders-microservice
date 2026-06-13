# Orders Execution Plan

```yaml
id: ORDERS-EXECUTION-PLAN
status: active
owner: Orders owner
created: 2026-06-13
last_updated: 2026-06-13
selected_goal: Goal H1 - Public Landing And Admin Access Surface
selected_chunk: H1.1-H1.4
pre_coding_gate: pass-with-exception
```

## Preserved Intent

Orders remains the canonical order lifecycle service. Public UI may explain Orders Hub benefits, and admin UI may read protected Orders data, but Orders must not take ownership of identity, stock, product truth, payment identity/reconciliation, notifications, leads, marketing, or channel-specific workflows.

## Planned Changes

- Add public landing routes `/` and `/landing`.
- Add a dedicated landing module and HTML shell.
- Keep admin shell public but data-free.
- Keep admin JSON at `/api/admin/orders/dashboard` and `/api/admin/orders/:id`.
- Add explicit admin roles to admin JSON routes.
- Improve admin locked/authenticated UX and clear-token behavior.
- Add `docs/orchestrator/ORDERS_HUB_ROADMAP.md` for delegated future work.

## Invariant Review

- `ORD-INV-003` boundary: preserved; the roadmap names external owners and candidate integrations.
- `ORD-INV-004` sensitive-data: preserved; public/admin shells contain no raw order/customer/payment data.
- `ORD-INV-007` evidence: status and implementation state must be updated after checks.

## Sensitive Data Classification

Classification: `masked`.

The UI changes contain no production data. Admin data continues to come only from protected JSON endpoints. The roadmap must not include secrets, tokens, payment details, customer addresses, or raw production customer data.

## Contract Impact

- Public route contract: new HTML at `/` and `/landing`.
- JWT/RBAC contract: explicit roles added for admin JSON routes.
- Order create contract: no change.
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
```

## Pre-Coding Gate Decision

Decision: `pass-with-exception`.

Reason: DocsRAG live query was unavailable because no session `JWT_TOKEN` was present. Compensating evidence came from Orders source-of-truth docs and remote neighboring repository discovery. The selected chunk is bounded to Orders UI and documentation, with no cross-service runtime integration.
