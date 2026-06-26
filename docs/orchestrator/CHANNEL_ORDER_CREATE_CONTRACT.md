# Channel Order Create Contract

```yaml
id: ORDERS-CHANNEL-ORDER-CREATE-CONTRACT
status: implemented
owner: Orders owner
created: 2026-06-13
last_updated: 2026-06-13
completeness_level: implemented
upstream:
  - BUSINESS.md
  - SYSTEM.md
  - README.md
  - docs/orchestrator/INTENT.md
  - docs/orchestrator/GOALS.md
  - docs/orchestrator/PRODUCTION_READINESS_ROADMAP.md
downstream:
  - src/orders/create-order.dto.ts
  - src/orders/orders.controller.ts
  - src/orders/orders.service.ts
  - scripts/verify-create-order-contract.js
related_adrs: []
```

## Purpose

`POST /api/orders` is the canonical order-ingestion endpoint for FlipFlop and marketplace channels. Channel services create or forward orders to Orders and then keep only their channel-local checkout/session/reference data. They must not maintain a competing canonical order lifecycle.

## Endpoint

```http
POST /api/orders
Authorization: Bearer <service-or-admin-jwt>
Content-Type: application/json
```

The runtime DTO accepts the contract version `orders.create.v1`. A missing `contractVersion` is tolerated for backward compatibility during migration, but new FlipFlop and marketplace clients should send it.

## Request Shape

```json
{
  "contractVersion": "orders.create.v1",
  "channel": "flipflop",
  "externalOrderId": "checkout-1001",
  "channelAccountId": "flipflop-storefront",
  "orderedAt": "2026-06-13T08:00:00.000Z",
  "customer": {
    "name": "Example Customer",
    "email": "customer@example.invalid",
    "phone": "+420000000000"
  },
  "shippingAddress": {
    "name": "Example Customer",
    "street": "Example Street 1",
    "city": "Prague",
    "postalCode": "11000",
    "country": "CZ"
  },
  "billingAddress": {
    "name": "Example Customer",
    "street": "Example Street 1",
    "city": "Prague",
    "postalCode": "11000",
    "country": "CZ",
    "companyName": "Example Company",
    "taxId": "CZ00000000"
  },
  "items": [
    {
      "productId": "catalog-product-1",
      "sku": "SKU-1",
      "title": "Catalog product",
      "quantity": 2,
      "unitPrice": 100,
      "totalPrice": 200,
      "warehouseId": "warehouse-1"
    }
  ],
  "totals": {
    "subtotal": 200,
    "shippingCost": 0,
    "taxAmount": 0,
    "total": 200,
    "currency": "CZK"
  },
  "payment": {
    "method": "card",
    "status": "pending"
  },
  "shipping": {
    "method": "carrier"
  },
  "notes": {
    "customerNote": "Optional customer-provided note"
  }
}
```

## Accepted Values

- `channel`: `flipflop`, `allegro`, `aukro`, `bazos`, or `heureka`.
- `externalOrderId`: required channel order/checkout identifier.
- `channelAccountId`: required by the idempotency contract for new clients; clients without a natural account partition should send a stable sentinel such as `default`.
- `status`: optional and limited to `pending` or `confirmed` at create time; default is `pending`.
- `items`: required non-empty array. Each line requires `productId`, `title`, positive integer `quantity`, and non-negative `unitPrice`. Missing `totalPrice` is calculated as `quantity * unitPrice`.
- `items[].productId`: canonical `catalog-microservice` product ID. Channel-local product, offer, ad, listing, or row IDs must not be sent as `productId`; channel services must resolve them before forwarding or fail closed with a mapping error.
- `totals.currency`: required ISO-4217-style three-letter code.
- Unknown top-level fields are rejected.

## Persistence Mapping

- `customer`, `shippingAddress`, `billingAddress`, totals, `payment.method`, `payment.status`, `shipping.method`, and `notes.customerNote` map to existing `orders` columns.
- `items[]` maps to `order_items` rows in the same database transaction as the order row. `order_items.productId` stores the canonical Catalog product ID snapshot used for product-level marketplace sales statistics.
- New item rows start with `fulfillmentStatus=pending`.
- Orders stores canonical Catalog product IDs, SKUs, titles, quantities, prices, and optional warehouse IDs for the order snapshot. Catalog remains product truth and Warehouse remains stock truth.
- Orders stores payment method/status metadata only. Payments remains owner of provider sessions, payment identity, variable symbols, refunds, and reconciliation.

## Response Shape

Successful creation returns the existing envelope with the saved order and saved item rows:

```json
{
  "success": true,
  "data": {
    "id": "orders-uuid",
    "channel": "flipflop",
    "externalOrderId": "checkout-1001",
    "status": "pending",
    "items": [
      {
        "id": "order-item-uuid",
        "orderId": "orders-uuid",
        "productId": "catalog-product-1",
        "quantity": 2,
        "fulfillmentStatus": "pending"
      }
    ]
  }
}
```

## Idempotency

Orders treats `contractVersion + channel + channelAccountId + externalOrderId` as the create-order idempotency key for `orders.create.v1`.
The detailed policy is tracked in `docs/orchestrator/ORDER_IDEMPOTENCY_CONTRACT.md`.

Runtime behavior:

- If no order exists for the key, Orders creates a new canonical order and item rows.
- If an order exists for the same key and the normalized payload matches the stored order snapshot and item rows, Orders returns the existing order with the existing item rows.
- Idempotent replay does not publish a second `order.created` event and does not trigger duplicate side effects.
- If an order exists for the same key but the normalized payload differs, Orders rejects the request with HTTP 409 Conflict.
- If `channelAccountId` is absent, runtime matching is limited to records where `channelAccountId` is absent or empty. New clients should send a stable value.

Client expectations:

- Channel services must use a stable external order ID from the source system.
- Marketplace services should send the marketplace account/store as `channelAccountId` when the same marketplace order ID can appear under different accounts.
- Clients may safely retry the exact same create request after network failure and should treat an existing-order replay as success.
- Clients must not mutate order contents by resending the same idempotency key with a different payload; use explicit lifecycle/update contracts instead.

Current limitation:

- Runtime duplicate lookup is implemented before insert. A database uniqueness guard for concurrent duplicate requests remains a follow-up hardening task.

## Current Runtime Guarantees

- Request normalization and validation are implemented in `src/orders/create-order.dto.ts`.
- `POST /api/orders` persists the order row and order item rows together.
- Idempotent replay by `contractVersion + channel + channelAccountId + externalOrderId` returns the existing order when the normalized payload matches.
- Conflicting replay with the same idempotency key and different payload is rejected with HTTP 409.
- The endpoint publishes the existing `order.created` event after persistence.
- Audit logging records bounded operation metadata only and does not log customer/address/payment raw values.
- The endpoint rejects unsupported channels, unsupported contract versions, unknown fields, empty item arrays, invalid totals, invalid currency, invalid timestamps, and create-time statuses outside `pending|confirmed`.

## Explicit Deferrals

- Database uniqueness for concurrent idempotency races remains deferred to a follow-up migration chunk.
- Catalog product existence/SKU validation is deferred until the catalog boundary is added; Orders does not become product truth.
- Warehouse reservation side effects are still placeholder behavior and remain Warehouse-owned.
- Payment provider identity, capture, refunds, variable symbols, and reconciliation remain Payments-owned.
- Event payload versioning is deferred to Goal 5.

## Client Expectations

- FlipFlop should call this endpoint after checkout has enough customer, item, total, shipping, and payment-status metadata to create the canonical order.
- Marketplace services should forward marketplace orders using their marketplace order ID as `externalOrderId` and their marketplace account/store as `channelAccountId`. They must resolve offer/ad/listing IDs to canonical Catalog product IDs before calling Orders.
- Channel services should store the returned Orders `id` as their canonical order reference and use Orders for lifecycle updates instead of duplicating status truth.
