# Channel Order Create Contract

```yaml
id: ORDERS-CHANNEL-ORDER-CREATE-CONTRACT
status: implemented
owner: Orders owner
created: 2026-06-13
last_updated: 2026-07-01
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
x-internal-service-token: <runtime-only channel service token>
x-service-name: <flipflop-service|allegro-service|cliplot>   # static-header lanes only
Content-Type: application/json
```

The endpoint is protected for admin/internal callers. The runtime DTO accepts the contract version `orders.create.v1`. A missing `contractVersion` is tolerated for backward compatibility during migration, but new FlipFlop and marketplace clients should send it.

No-mutation validation endpoint:

```http
POST /api/orders/validate-create
Authorization: Bearer <service-or-admin-jwt>
x-internal-service-token: <runtime-only channel service token>
x-service-name: <flipflop-service|allegro-service|cliplot>   # static-header lanes only
Content-Type: application/json
```

`POST /api/orders/validate-create` uses the same role allowlist and request
shape as live create. It normalizes `orders.create.v1` and checks idempotency
state, but it does not create an order, save item rows, reserve Warehouse stock,
or publish order events. It exists for guarded storefront readiness checks such
as Cliplot checkout validation before live order creation is approved.

Supported create callers:

| Service caller | Required role | Runtime token environment in Orders | Runtime secret source | Notes |
| --- | --- | --- | --- | --- |
| `flipflop-service` | `internal:flipflop-service:service` | `FLIPFLOP_INTERNAL_SERVICE_TOKEN` | `secret/prod/flipflop-service#ORDERS_SERVICE_TOKEN` | Orders-side alias for the dedicated FlipFlop-to-Orders token; channel-side header smoke still pending. |
| `allegro-service` | `internal:allegro-service:service` | `ALLEGRO_INTERNAL_SERVICE_TOKEN` | `secret/prod/allegro-service#JWT_TOKEN` | Orders-side alias for Allegro service token; channel-side auth and `warehouseId` wiring still pending. |
| `cliplot` | `internal:cliplot:service` | `CLIPLOT_ORDERS_SERVICE_TOKEN` with code fallback to `CLIPLOT_SERVICE_TOKEN` | `secret/prod/cliplot#ORDERS_SERVICE_TOKEN` | Primary Cliplot-to-Orders caller token after repository/runtime rename. |

Bearer create callers (per-pair RS256 principals, **not** in the static map):

| Service caller | Required role | Runtime token environment in caller | Runtime secret source |
| --- | --- | --- | --- |
| `aukro-service` | `internal:aukro-service:service` | `ORDERS_SERVICE_TOKEN` | `secret/prod/aukro-service#ORDERS_SERVICE_TOKEN` |
| `bazos-service` | `internal:bazos-service:service` | `ORDERS_SERVICE_TOKEN` | `secret/prod/bazos-service#ORDERS_SERVICE_TOKEN` |
| `heureka-service` | `internal:heureka-service:service` | `ORDERS_SERVICE_TOKEN` | `secret/prod/heureka-service#ORDERS_SERVICE_TOKEN` |

These three send `Authorization: Bearer <per-pair RS256 token>`, which Orders verifies
through `/auth/validate`. They are deliberately absent from the guard's static map: all
three previously held the same shared string, so presenting it with a different
`x-service-name` authenticated as a different service. `x-service-name` is still sent for
logging, but it no longer selects identity for these callers.

**The static-header path derives identity from `x-service-name` and only string-compares
the token, so every remaining entry must hold a credential unique to one caller.** The
guard denies any token configured for more than one name rather than choosing between
them, and `scripts/verify-create-order-contract.js` asserts both that property and that
the Bearer lanes stay out of the static map.

The `cliplot-service` alias has been removed: it resolved the same env vars as `cliplot`,
so the two shared a token and would now be denied as ambiguous. The live pod sends
`x-service-name: cliplot`.

Machine-auth requests use `x-internal-service-token` plus `x-service-name`; token values remain runtime-only and must not be logged, decoded, committed, or copied into docs. The role allowlist and Orders-side runtime aliases are present in source, but each caller still needs channel-side header wiring plus a sanitized create/idempotency/Warehouse reservation smoke before production rollout.

## Request Shape

```json
{
  "contractVersion": "orders.create.v1",
  "channel": "flipflop",
  "externalOrderId": "checkout-1001",
  "channelAccountId": "flipflop-storefront",
  "leadAttribution": {
    "leadId": "lead-1001",
    "source": "lead-form",
    "campaignId": "campaign-1001"
  },
  "bundleEvidence": [
    {
      "contractVersion": "catalog.bundle.v1",
      "bundleId": "55555555-5555-4555-8555-555555555555",
      "productIds": ["catalog-product-1", "catalog-product-2"],
      "discountPolicyRef": "bundle:starter:discount:v1",
      "freeShippingPolicyRef": "shipping:free-over-threshold:v1",
      "serverTotalSource": "orders.create.v1"
    }
  ],
  "orderedAt": "2026-06-13T08:00:00.000Z",
  "customer": {
    "authSubject": "11111111-1111-4111-8111-111111111111",
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
    "companyId": "12345678",
    "taxId": "TAX-12345678",
    "vatId": "CZ12345678",
    "email": "invoice@example.invalid"
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

- `channel`: `flipflop`, `allegro`, `aukro`, `bazos`, `heureka`, or `cliplot`.
- `externalOrderId`: required channel order/checkout identifier.
- `channelAccountId`: required by the idempotency contract for new clients; clients without a natural account partition should send a stable sentinel such as `default`.
- `leadAttribution`: optional explicit attribution metadata with allowed fields `leadId`, `source`, and `campaignId`. Orders publishes it only on `orders.order.created.v1` when supplied; callers must not derive it from customer/contact/address/payment data.
- `bundleEvidence`: optional bounded Catalog bundle metadata evidence. It is accepted only as additive audit metadata for future `catalog.bundle.v1` checkout contracts and must not replace normal `items[]` rows, become product/pricing/eligibility truth, or authorize checkout totals.
- `bundleEvidence[].contractVersion` must equal `catalog.bundle.v1`.
- `bundleEvidence[].bundleId` must be the durable Catalog bundle aggregate UUID; Catalog read-only `candidateId` values are not accepted as bundle identity.
- `bundleEvidence[].productIds` must contain 2 to 10 unique product IDs and must match the submitted normal item `productId` set after normalization. Orders still persists every product as a normal order item line.
- `bundleEvidence[].discountPolicyRef`, `bundleEvidence[].freeShippingPolicyRef`, and `bundleEvidence[].serverTotalSource` are the only optional policy/source fields. `serverTotalSource` is limited to `orders.create.v1` or `checkout_authoritative`.
- Orders rejects raw Catalog candidate payloads, monetary totals, applied savings, customer/address/payment/provider data, tokens, and secrets in `bundleEvidence`. Browser-submitted bundle evidence never causes Orders to calculate or change subtotal, shipping, tax, total, currency, reservation, or payment behavior.
- `customer.authSubject`: optional stable Auth user UUID for authenticated checkouts. Orders also accepts alias fields `customer.authUserId`, `customer.subject`, and `customer.sub`, but all supplied aliases must match. The normalized persisted snapshot stores `customer.authUserId` and `customer.subject`; Orders never infers this value from email.
- `status`: optional and limited to `pending` or `confirmed` at create time; default is `pending`.
- `items`: required non-empty array. Each line requires `productId`, `title`, positive integer `quantity`, and non-negative `unitPrice`. Missing `totalPrice` is calculated as `quantity * unitPrice`.
- `items[].productId`: canonical `catalog-microservice` product ID. Channel-local product, offer, ad, listing, or row IDs must not be sent as `productId`; channel services must resolve them before forwarding or fail closed with a mapping error.
- `totals.currency`: required ISO-4217-style three-letter code.
- `billingAddress` may include invoice snapshot fields `companyName`,
  `companyId`, `taxId`, `vatId`, and invoice recipient `email`. These are
  immutable order snapshots only; reusable invoice profile truth remains owned
  by `auth-microservice`.
- Unknown top-level fields are rejected.

## Persistence Mapping

- `customer`, including normalized `authUserId`/`subject` when supplied, `shippingAddress`, `billingAddress`, totals, `payment.method`, `payment.status`, `shipping.method`, and `notes.customerNote` map to existing `orders` columns.
- `bundleEvidence[]` maps to the nullable `orders.bundleEvidence` JSONB metadata column. It is not copied onto `order_items`, Warehouse reservations, payment amounts, or order-created event payloads in this contract slice.
- `items[]` maps to `order_items` rows in the same database transaction as the order row. `order_items.productId` stores the canonical Catalog product ID snapshot used for product-level marketplace sales statistics.
- New item rows start with `fulfillmentStatus=pending`.
- Orders stores canonical Catalog product IDs, SKUs, titles, quantities, prices, and optional warehouse IDs for the order snapshot. Catalog remains product truth and Warehouse remains stock truth.
- Orders stores payment method/status metadata only. Payments remains owner of provider sessions, payment identity, variable symbols, refunds, and reconciliation.
- `leadAttribution` is event-only metadata for downstream Leads attribution. It is not persisted as order truth in this chunk and is not part of the idempotency key.

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
- If an order exists for the same key but the normalized payload differs, including different normalized `bundleEvidence`, Orders rejects the request with HTTP 409 Conflict.
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
- The endpoint publishes `orders.order.created.v1` after persistence and includes optional `leadAttribution` only when supplied by the create request.
- Audit logging records bounded operation metadata only and does not log customer/address/payment raw values.
- The endpoint rejects unsupported channels, unsupported create contract versions, unknown top-level fields, empty item arrays, invalid totals, invalid currency, invalid timestamps, create-time statuses outside `pending|confirmed`, unsupported `bundleEvidence` contract versions, product-set mismatches, raw Catalog candidate payload fields, pricing/eligibility claims, and customer/address/payment/provider/token metadata inside `bundleEvidence`.

## Explicit Deferrals

- Database uniqueness for concurrent idempotency races remains deferred to a follow-up migration chunk.
- Catalog product existence/SKU validation remains caller-owned unless an explicit Catalog validation boundary is added; Orders does not become product truth.
- Channel service runtime token wiring and sanitized create smokes remain follow-up work for FlipFlop, Allegro, Aukro, Bazos, and Cliplot.
- Payment provider identity, capture, refunds, variable symbols, and reconciliation remain Payments-owned.
- `[MISSING: channel lead attribution source mapping]`: supported channel services still need an approved explicit source for `leadAttribution.leadId`, `leadAttribution.source`, and/or `leadAttribution.campaignId`. Orders will not infer attribution from PII, customer contact fields, addresses, notes, payment data, or channel payloads.

## Client Expectations

- FlipFlop and Cliplot should call this endpoint after checkout has enough customer, item, total, shipping, and payment-status metadata to create the canonical order.
- Marketplace services should forward marketplace orders using their marketplace order ID as `externalOrderId` and their marketplace account/store as `channelAccountId`. They must resolve offer/ad/listing IDs to canonical Catalog product IDs before calling Orders.
- Channel services should store the returned Orders `id` as their canonical order reference and use Orders for lifecycle updates instead of duplicating status truth.
