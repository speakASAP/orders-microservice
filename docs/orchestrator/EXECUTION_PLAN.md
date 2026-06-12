# Orders Execution Plan

```yaml
id: ORDERS-EXECUTION-PLAN
status: active
owner: Orders owner
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: implementation-ready
upstream:
  - AGENTS.md
  - BUSINESS.md
  - SYSTEM.md
  - README.md
  - TASKS.md
  - docs/orchestrator/INTENT.md
  - docs/orchestrator/PROJECT_INVARIANTS.md
  - docs/IMPLEMENTATION_STATE.md
downstream:
  - src/admin/admin.module.ts
  - src/admin/admin.controller.ts
  - src/admin/admin.service.ts
  - src/admin/admin-ui.ts
  - src/app.module.ts
  - src/main.ts
  - docs/orchestrator/STATUS.md
  - docs/IMPLEMENTATION_STATE.md
related_adrs: []
selected_goal: Owner-selected admin frontend
selected_chunk: Admin orders dashboard, filters, details, and safe lifecycle logs
gate_decision: pass-with-exception
```

## Metadata

This plan covers the owner-selected task to add a frontend/admin panel for `orders-microservice`.

The chunk is intentionally read-only from an order lifecycle perspective. It adds operator visibility into existing orders, source channel/application/service derivation, order details, and safe lifecycle logs. It does not alter order status, cancellation, refund, warehouse, payment, catalog, notification, CRM, or pricing behavior.

## Upstream Traceability

- Owner request: add a frontend/admin panel for all orders, source application/service tracking, order details, logs, and dashboard filters.
- Intent source: `docs/orchestrator/INTENT.md` says Orders must answer which channel an order came from, which items it contains, status, shipment records, and lifecycle events.
- Business source: `BUSINESS.md` requires central order processing from all sales channels and sensitive customer/payment data safety.
- System source: `SYSTEM.md` identifies NestJS/PostgreSQL/RabbitMQ on port 3203 and the order state machine.
- Runtime source: existing `Order`, `OrderItem`, and `Shipment` entities.

## Goal Impact

The admin frontend gives operators a single Orders-owned operational view across source applications/services without creating a competing source of truth in channel services.

## Project Invariants

- `ORD-INV-001`: Preserved; admin UI reads from Orders as canonical order source.
- `ORD-INV-002`: Preserved; no status transition or destructive order behavior changes.
- `ORD-INV-003`: Preserved; source application/service labels are derived metadata, not ownership changes.
- `ORD-INV-004`: Preserved; UI/API responses mask or omit sensitive address/payment/token details and do not use production data dumps.
- `ORD-INV-005`: Preserved; new admin read endpoints are additive and protected by existing JWT role guard.
- `ORD-INV-006`: Not applicable; pricing behavior is unchanged.
- `ORD-INV-007`: Preserved by status and implementation-state updates.
- `ORD-INV-008`: Pass with exception; no session `JWT_TOKEN` is available for DocsRAG. Repository source-of-truth docs and local source files are sufficient for this bounded Orders-local admin surface.

## Sensitive-Data Handling

Classification: `masked`.

The implementation may read existing order fields through TypeORM at runtime, but admin summaries avoid exposing raw shipping/billing addresses, payment details, bearer tokens, secrets, or decoded credentials. Customer display is limited to safe operational identifiers already present in the order contract. Logs are derived lifecycle/audit entries from order metadata, items, and shipments; raw production log streams are not queried or exposed.

## Contract Validation Plan

Additive API impact:

- `GET /api/admin/orders/dashboard`
- `GET /api/admin/orders/:id`

Frontend route impact:

- `GET /admin`
- `GET /admin/orders`

Existing public order, item, shipment, pricing, health, JWT/RBAC, event, warehouse, payment, catalog, notification, and CRM contracts remain unchanged.

## Scope

- Add a NestJS `AdminModule`.
- Serve a responsive, code-native admin dashboard frontend.
- Add protected dashboard JSON API with filters for application, service, state/status, channel, search, and date range.
- Add protected order detail JSON API with summary, source metadata, items, shipments, timeline, and safe lifecycle logs.
- Derive application/service labels from existing `channel` values without a database migration.
- Update app module and global-prefix exclusions for admin frontend routes.
- Update IPS evidence docs.

## Non-Goals

- No database migration.
- No persisted audit-log table.
- No raw production log ingestion.
- No status transition validation; Goal 2 chunk 2.2 remains next.
- No auth login flow; existing JWT role guard protects admin JSON APIs.
- No deployment unless explicitly requested after build passes.

## Files To Inspect

- `src/main.ts`
- `src/app.module.ts`
- `src/auth/jwt-roles.guard.ts`
- `src/auth/roles.decorator.ts`
- `src/orders/order.entity.ts`
- `src/orders/orders.service.ts`
- `src/orders/orders.controller.ts`
- `src/items/order-item.entity.ts`
- `src/items/items.service.ts`
- `src/shipments/shipment.entity.ts`
- `src/shipments/shipments.service.ts`

## Files To Create

- `src/admin/admin.module.ts`
- `src/admin/admin.controller.ts`
- `src/admin/admin.service.ts`
- `src/admin/admin-ui.ts`

## Files To Modify

- `src/app.module.ts`
- `src/main.ts`
- `docs/orchestrator/CONTEXT_PACKAGE.md`
- `docs/orchestrator/EXECUTION_PLAN.md`
- `docs/orchestrator/STATUS.md`
- `docs/IMPLEMENTATION_STATE.md`

## Implementation Steps

1. Build the admin module and service with read-only queries against `Order` and `Shipment` repositories.
2. Add safe serializers for summaries, details, source metadata, timeline, and lifecycle logs.
3. Serve a self-contained admin UI at `/admin/orders` with filters, order table, detail panel, and token-based API access.
4. Register the module and frontend route exclusions.
5. Run TypeScript build and sensitive-data scans.
6. Record evidence and commit the remote changes.

## Test Plan

- `npm run build`
- IPS missing-marker scan over docs, implementation goals, `AGENTS.md`, and `TASKS.md`
- Sensitive-pattern scan over docs plus `src/admin`, `src/app.module.ts`, and `src/main.ts`

Optional runtime checks after deployment or with a valid admin token:

- `curl -I -H 'Cache-Control: no-cache' https://orders.alfares.cz/health`
- `curl -I -H 'Cache-Control: no-cache' https://orders.alfares.cz/admin/orders`
- `curl -s -H 'Authorization: Bearer <admin-token>' 'https://orders.alfares.cz/api/admin/orders/dashboard?limit=10'`

Do not paste real token values into docs or chat.

## Gate Decision

`pass-with-exception`: DocsRAG was not queried because no session service JWT is available. This is acceptable for the bounded Orders-local admin read surface because the owner request maps directly to existing Orders source-of-truth docs and entities.

## Rollback Plan

If build or scans fail, revert only the new `src/admin/*` files and the scoped `src/app.module.ts` / `src/main.ts` registrations, then restore the previous IPS docs for this chunk. Do not revert unrelated dirty worktree changes.

## Completion Checklist

- [x] Admin module added.
- [x] Dashboard filters and table implemented.
- [x] Order details and safe lifecycle logs implemented.
- [x] Existing auth guard protects admin data APIs.
- [x] Build passes.
- [x] Sensitive-data scan completed with only existing environment-variable false positive.
- [x] IPS status and implementation state updated.
- [ ] Remote commit created.
