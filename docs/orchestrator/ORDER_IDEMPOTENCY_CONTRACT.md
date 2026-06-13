# Order Idempotency Contract

```yaml
id: ORDERS-IDEMPOTENCY-CONTRACT
status: documented
owner: Orders owner
created: 2026-06-13
last_updated: 2026-06-13
completeness_level: documented
upstream:
  - BUSINESS.md
  - SYSTEM.md
  - docs/orchestrator/INTENT.md
  - docs/orchestrator/GOALS.md
  - docs/orchestrator/CHANNEL_ORDER_CREATE_CONTRACT.md
  - docs/orchestrator/ORDERS_HUB_ROADMAP.md
downstream:
  - docs/orchestrator/STATUS.md
  - docs/IMPLEMENTATION_STATE.md
  - scripts/verify-idempotency-contract.js
related_adrs: []
```

## Purpose

Channel order creation must be retryable without creating duplicate canonical orders. FlipFlop and marketplace services may retry after network timeouts, deploy restarts, 5xx responses, or lost responses. Orders must define one deterministic idempotency key before adding database duplicate protection in the next implementation chunk.

## Idempotency Key

The canonical idempotency key for `POST /api/orders` is:

```text
contractVersion + channel + channelAccountId + externalOrderId
```

Rules:

- `contractVersion` is the create contract version, currently `orders.create.v1`.
- `channel` is normalized to lowercase and must be one of `flipflop`, `allegro`, `aukro`, `bazos`, or `heureka`.
- `channelAccountId` identifies the storefront, marketplace account, shop, tenant, or integration account that produced the order.
- `externalOrderId` is the upstream checkout/order identifier assigned by the channel.
- For channels with no meaningful account partition, clients must send a stable account sentinel such as `default` rather than omitting `channelAccountId`.
- The normalized key should be compared case-sensitively for `externalOrderId` and `channelAccountId` after trimming surrounding whitespace. Orders must not lowercase external IDs because marketplace IDs can be case-sensitive.

## Channel Account Scope

`channelAccountId` is part of the idempotency key because the same marketplace can expose identical external order IDs across accounts. Examples:

| Channel | `channelAccountId` meaning | `externalOrderId` meaning |
|---|---|---|
| `flipflop` | Storefront or checkout tenant, usually `flipflop-storefront` | Checkout/order ID from FlipFlop |
| `allegro` | Allegro seller account ID or integration account | Allegro order ID |
| `aukro` | Aukro seller account ID or integration account | Aukro order ID |
| `bazos` | Bazos integration account or source mailbox/feed | Bazos lead/order reference promoted to order |
| `heureka` | Heureka shop/account ID | Heureka order ID |

## Safe Retry Behavior

A retry is safe when an incoming create request has the same idempotency key and the same normalized order fingerprint as the existing canonical order.

Safe retry response expectation for Goal 4 chunk 4.3:

- Return HTTP `200 OK` or `201 Created` with the existing canonical order in the existing `{ success: true, data }` envelope.
- Do not insert another `orders` row.
- Do not insert duplicate `order_items` rows.
- Do not emit another `order.created` event unless event outbox/replay semantics are explicitly added later.
- Do not re-run warehouse reservation, payment side effects, notification side effects, or CRM side effects.
- Audit the retry as a bounded idempotency hit without raw customer/address/payment data.

## Mismatched Duplicate Behavior

A duplicate is unsafe when the idempotency key matches but any normalized business payload differs. Examples include different item product IDs, quantities, totals, currency, customer identity summary, shipping country/postal code, payment status, or shipping method.

Mismatch response expectation for Goal 4 chunk 4.4:

- Return HTTP `409 Conflict`.
- Return a bounded error code such as `ORDER_IDEMPOTENCY_CONFLICT`.
- Include the existing canonical order ID and the idempotency key fields.
- Do not include raw customer address, payment detail, notes, or full request bodies in the error response or logs.
- Do not mutate the existing order.
- Do not emit lifecycle events or trigger cross-service side effects.

## Normalized Fingerprint Inputs

The future duplicate check should compare a canonical fingerprint derived from these fields:

- `contractVersion`
- `channel`
- `channelAccountId`
- `externalOrderId`
- `status` at create time
- `currency`
- `subtotal`, `shippingCost`, `taxAmount`, `total`
- item `productId`, `sku`, `title`, `quantity`, `unitPrice`, `totalPrice`, and `warehouseId`
- bounded customer identity fields needed for conflict detection, such as normalized email or phone presence
- bounded shipping/billing destination fields needed for conflict detection, such as country and postal code
- `payment.status` and `payment.method` metadata only
- `shipping.method`

Do not include generated database IDs, timestamps created by Orders, audit metadata, raw notes, bearer tokens, secrets, or full address/payment payloads in the fingerprint.

## Current Runtime Status

`POST /api/orders` validates the create-order shape, persists order items, and now enforces deterministic idempotent replay for normal retry cases:

- Goal 4 chunk 4.3 / H3.2: deterministic duplicate lookup is implemented; database uniqueness remains a hardening follow-up.
- Goal H3.3: exact replay returns the existing order response.
- Goal H3.4: same-key different-payload replay returns conflict behavior.

Remaining hardening:

- Add database-level uniqueness or another concurrency-safe guard for simultaneous duplicate creates.

## Client Requirements

- Clients must send `contractVersion`, `channel`, `channelAccountId`, and `externalOrderId` on every create request.
- Clients must retry with the exact same idempotency key after transient failures.
- Clients must store the returned Orders `id` as the canonical order reference.
- Clients must not create their own canonical order lifecycle record when Orders already accepted the order.
- Clients must treat `409 ORDER_IDEMPOTENCY_CONFLICT` as an operator-visible integration error, not as a reason to create a second order.
