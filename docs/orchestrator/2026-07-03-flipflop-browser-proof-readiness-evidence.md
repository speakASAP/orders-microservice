# FlipFlop Browser Proof Readiness Evidence

Date: 2026-07-03
Repository of record: `orders-microservice`
Channel checked: `flipflop`
Mode: non-mutating route/source readiness only

## Result

Status: `ready_for_approved_browser_proof`

This packet does not prove rendered lifecycle propagation. It proves that the first
FlipFlop browser lane has current route/source readiness and can proceed once a
safe proof mode is approved.

## Current State Checked

Orders evidence worktree:

- Path: `/tmp/orders-worktrees/orders-integrate-warehouse-checkout-mapping`
- Branch: `codex/orders-integrate-warehouse-checkout-mapping`
- Commit at inspection time: `22eeae7 docs: record flipflop browser proof readiness`
- Remote parity at inspection time: `HEAD == origin/main` at `22eeae7`

FlipFlop source checkout:

- Path: `/home/ssf/Documents/Github/flipflop`
- Branch: `main`
- Commit: `3110c6a feat: improve orders lifecycle UI reliability`

## Live Route Readiness

Command shape: `curl -k -s -o /dev/null -w "%{http_code} content-type=%{content_type} redirect=%{redirect_url}\n" <url>`

Observed:

- `https://flipflop.alfares.cz/orders` returned `200`, `content-type=text/html; charset=utf-8`, no redirect.
- `https://flipflop.alfares.cz/admin/orders` returned `200`, `content-type=text/html; charset=utf-8`, no redirect.

These route checks used no browser session, no token output, no DB read, no provider call, and no order mutation.

## Source Readiness Markers

Customer cabinet route: `services/frontend/app/orders/page.tsx`

- Calls `ordersApi.getOrders()`.
- Renders `getOrderDisplayData(order)` values.
- Renders lifecycle/status text through `getOrderLifecycleLabel`.
- Provides manual refresh button labeled `Aktualizovat`.
- Uses `useVisiblePolling(() => loadOrders({ background: true }), 30000, isAuthenticated)`.

Admin cabinet route: `services/frontend/app/admin/orders/page.tsx`

- Calls `ordersApi.getAdminOrders({ page, limit: 20, ...filters })`.
- Renders a `Lifecycle` column from `display.lifecycleStage`.
- Renders payment and delivery/fulfillment/exception status labels.
- Provides manual refresh button labeled `Aktualizovat`.
- Uses `useVisiblePolling(() => loadOrders({ background: true }), 30000, true)`.

Frontend lifecycle adapter: `services/frontend/lib/api/orders.ts`

- Defines the full central lifecycle stage label set, including `ordered_unpaid`, `paid_not_delivered`, `warehouse_fulfillment_requested`, `warehouse_collecting`, `warehouse_forming`, `warehouse_formed`, `handed_to_delivery`, `in_delivery`, `received`, `not_received`, and `returned`.
- `getOrderDisplayData(order)` prefers `order.centralOrder` when the central read status is available and falls back to local order values only when central lifecycle is unavailable.
- Customer reads call `/orders`; admin reads call `/admin/orders`.

Server Orders client: `shared/clients/order-client.service.ts`

- Reads central lifecycle through `/api/orders/:id/lifecycle` and `/api/orders/:id` before falling back to lookup by external order id.
- Normalizes central fields into central read status `available`, `lifecycleStage`, `paymentStatus`, `deliveryStatus`, `fulfillmentStatus`, `exceptionStatus`, totals, line items, and delivery address.
- Emits a stale placeholder with `[MISSING: Orders lifecycle read endpoint]` only when central lifecycle cannot be read.

Refresh mechanism for the first proof lane: manual refresh plus visible polling every 30 seconds.

## Remaining Gate

`[MISSING: approved safe buyer/admin session source or explicit service-scoped browser proxy proof for FlipFlop validation-only lane.]`

The first proof lane still must show a rendered customer/admin UI lifecycle stage after an approved Orders lifecycle mutation or approved existing mutation artifact. This packet must not be treated as browser-render proof.

## Next Action

Approve one proof mode for FlipFlop only:

- `safe_human_session`: browser access is scoped to a safe buyer/admin account and a sanitized synthetic order.
- `service_scoped_proxy`: browser/API proof is explicitly allowed through a service-scoped proxy without exposing tokens, cookies, raw rows, addresses, email, phone, payment references, tracking values, or provider payloads.
