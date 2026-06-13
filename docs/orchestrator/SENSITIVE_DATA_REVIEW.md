# Sensitive Data Review

```yaml
id: ORDERS-SENSITIVE-DATA-REVIEW
status: accepted
owner: Orders owner
created: 2026-06-13
last_updated: 2026-06-13
completeness_level: reviewed
upstream:
  - docs/orchestrator/GOALS.md
  - docs/orchestrator/PROJECT_INVARIANTS.md
  - docs/IMPLEMENTATION_STATE.md
  - BUSINESS.md
  - SYSTEM.md
downstream:
  - docs/orchestrator/STATUS.md
  - docs/IMPLEMENTATION_STATE.md
related_adrs: []
selected_goal: Goal 3 - Sensitive Customer Data And Audit Safety
selected_chunk: 3.1 - Review sensitive fields
```

## Purpose

This review maps customer, address, payment, token, shipment, pricing, event, and logger exposure points in `orders-microservice`. It is a documentation and risk-classification chunk only. It does not change runtime behavior.

## Source Files Reviewed

- `src/orders/order.entity.ts`
- `src/orders/orders.controller.ts`
- `src/orders/orders.service.ts`
- `src/orders/order-events.service.ts`
- `src/items/order-item.entity.ts`
- `src/items/items.controller.ts`
- `src/items/items.service.ts`
- `src/shipments/shipment.entity.ts`
- `src/shipments/shipments.controller.ts`
- `src/shipments/shipments.service.ts`
- `src/pricing/price-suggestion.entity.ts`
- `src/pricing/pricing.controller.ts`
- `src/pricing/pricing.service.ts`
- `src/logger/logger.service.ts`
- `src/auth/jwt-roles.guard.ts`
- `src/admin/admin.service.ts`
- `src/admin/admin.controller.ts`
- `src/main.ts`
- `src/app.module.ts`

## Data Classification

| Area | Fields or values | Classification | Notes |
| --- | --- | --- | --- |
| Orders customer | `customer.name`, `customer.email`, `customer.phone` | customer PII | Stored in `orders.customer`; returned by core order APIs and partially by admin detail. |
| Orders addresses | `shippingAddress.*`, `billingAddress.*`, billing `taxId` | sensitive customer/address data | Stored in JSONB columns; should not appear in logs, docs, tests, or events. |
| Orders notes | `customerNote`, `internalNote` | sensitive free text | Notes can contain arbitrary customer, operational, or private data. Current admin detail returns booleans only. |
| Orders payment | `paymentMethod`, `paymentStatus` | payment-related metadata | Not payment credentials, but still should not be logged as raw customer/payment detail. |
| Items | product IDs, SKU, title, quantity, prices, warehouse ID | operational/order line data | Not customer PII, but can expose order composition and pricing. |
| Shipments | carrier, tracking number, tracking URL, shipped/delivered timestamps | sensitive operational delivery data | Tracking values appear in shipment APIs and admin detail/timeline. |
| Pricing suggestions | product ID/name, current price, suggested price, rationale | product/pricing business data | No customer PII in entity; rationale is AI-generated business text and should remain bounded. |
| Auth | bearer token, JWT secret, JWT payload email/roles | secret or identity data | Guard does not log tokens; `JWT_SECRET` and `DB_PASSWORD` are environment variable names only. |
| Approval audit | approvedBy, actorId, actorEmail, reasonCode, side-effect booleans | bounded identity/audit metadata | Safe for event metadata only if actor values remain sanitized and no raw token/customer fields are accepted. |

## Current Surface Review

### Orders API

- `GET /api/orders`, `GET /api/orders/:id`, `POST /api/orders`, and `PUT /api/orders/:id/status` return full `Order` entities.
- Full `Order` includes customer, shipping address, billing address, customer note, internal note, payment method, and payment status fields.
- These endpoints are protected by the global `JwtRolesGuard`, but response redaction is not implemented.
- Services do not currently log raw order objects or request bodies.

### Items API

- Item endpoints return product, SKU, title, quantity, price, fulfillment status, and warehouse ID.
- No customer PII fields are stored directly in `OrderItem`.
- Services do not currently log raw item objects or request bodies.

### Shipments API

- Shipment endpoints return carrier, tracking number, tracking URL, and shipment timestamps.
- Tracking values are sensitive operational delivery data and should be treated as non-loggable by default.
- Services do not currently log raw shipment objects or request bodies.

### Pricing API And Service

- Pricing suggestions are product/pricing business data, not customer PII.
- Logs include product IDs, suggestion IDs, durations, generated/skipped counts, and error messages.
- Logs do not currently include order customer fields, addresses, tokens, or payment details.
- `updateProductPrice` may include product IDs and upstream error text in an exception. This is acceptable for product-level diagnostics but should be redacted if upstream error payloads ever include secrets.

### Events

- `order.created` publishes order ID, channel, and timestamp only.
- `order.updated` publishes order ID, status, optional previous status, and optional approval audit metadata.
- `order.shipped` publishes order ID, tracking number, and timestamp. Tracking number is sensitive operational data and should be reviewed before external consumers rely on it.
- `pricing.price_changed` publishes product/pricing business data only.
- Event publish failures log only error messages, not event payloads.

### Logger

- `LoggerService` writes raw caller-provided message strings to console.
- Current call sites are mostly product/pricing diagnostics and do not pass raw order/customer/address/payment payloads.
- The logger has no centralized redaction or structured allowlist, so future call sites could accidentally leak sensitive fields.

### Admin Surface

- Public admin HTML is served without data and stores the entered bearer token in browser `sessionStorage`.
- Admin JSON endpoints are protected by the global JWT guard.
- Dashboard summaries expose customer label, which can be customer name or email.
- Detail responses expose customer name/email, payment method/status, shipment tracking number/URL, and timeline context containing tracking numbers.
- Admin synthetic logs avoid raw notes and use booleans for note presence, but timeline context still includes tracking numbers.

## Findings

| ID | Severity | Finding | Evidence | Follow-up |
| --- | --- | --- | --- | --- |
| G3-1 | High | Core order API responses return full persisted order entities with customer, address, note, and payment metadata. | `src/orders/orders.controller.ts`, `src/orders/order.entity.ts` | Chunk 3.3 should add response DTOs or redaction rules for list/detail/write responses. |
| G3-2 | Medium | Logger accepts arbitrary raw strings and has no redaction boundary. | `src/logger/logger.service.ts` | Chunk 3.2/3.3 should add structured audit helpers and no-log/redaction guarantees. |
| G3-3 | Medium | Admin detail surfaces customer email and shipment tracking values to authenticated admins, and admin timeline/log context includes tracking numbers. | `src/admin/admin.service.ts` | Chunk 3.3 should decide whether admin detail is allowed to show full values, masked values, or role-scoped values. |
| G3-4 | Medium | `order.shipped` event includes tracking number. | `src/orders/order-events.service.ts` | Goal 5 or chunk 3.3 should document event consumers and whether tracking number is allowed, masked, or moved behind a shipment-owned lookup. |
| G3-5 | Low | Pricing logs are currently product-level and safe, but upstream error text is copied into thrown errors. | `src/pricing/pricing.service.ts` | Add error-message redaction if upstream services may return secrets or customer data in errors. |

## Safe Existing Behavior

- No reviewed source path logs raw order entities, customer JSON, address JSON, bearer tokens, JWT secrets, DB passwords, or production rows.
- Auth guard rejects missing/invalid tokens with generic messages and does not log bearer token values.
- Order lifecycle events avoid customer and address fields.
- Approval audit metadata is constrained and sanitized by the status transition helper.
- Admin notes are represented as `hasCustomerNote` and `hasInternalNote`, not raw note text.

## Required Follow-up

- Chunk 3.2: add safe structured audit metadata for writes and status changes using only operation, resource IDs, actor/source IDs, outcome, duration, and bounded status fields.
- Chunk 3.3: add response/log/event redaction or no-log guarantees for customer fields, addresses, notes, payment metadata, tokens, secrets, tracking data, and arbitrary upstream error strings.
- Chunk 3.4: add regression checks or static scans that fail when sensitive keys are logged or copied into docs/tests.

## Gate Decision

Documentation review readiness: accept.

No runtime code changed. Deployment is not required.
