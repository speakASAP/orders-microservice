# Goal 17 Product Sales Statistics Contract

```yaml
id: ORDERS-GOAL17-PRODUCT-SALES-STATISTICS
status: implemented
owner: Orders read-model owner
created: 2026-06-26
last_updated: 2026-07-02
completeness_level: implemented
intent_chain: Vision -> Goal Impact -> System -> Feature -> Task -> Execution Plan -> Coding Prompt -> Code -> Validation
upstream:
  - docs/orchestrator/CHANNEL_ORDER_CREATE_CONTRACT.md
  - src/orders/order.entity.ts
  - src/items/order-item.entity.ts
downstream:
  - src/orders/orders.controller.ts
  - src/orders/orders.service.ts
  - scripts/verify-product-sales-statistics.js
```

## Intent Preservation Chain

- Vision: Catalog can show product-level marketplace sales statistics without becoming order truth.
- Goal Impact: Catalog Goal 17 can consume central Orders aggregates for canonical Catalog product IDs.
- System: Orders remains lifecycle and order-item truth; Catalog remains product truth; channel services remain source-specific adapters; Payments remains payment truth; Warehouse remains stock truth; Auth remains identity/RBAC truth.
- Feature: Protected read-only product sales statistics grouped by currency, channel, order status, lifecycle stage, payment status, delivery status, and delivery exception state.
- Task: Add a safe Orders endpoint that aggregates `order_items.productId` with optional date/channel/status filters.
- Execution Plan: Use existing Orders repository data, default to non-cancelled sales lifecycle statuses, group mixed currencies, derive product-scoped lifecycle/delivery aggregates from canonical Orders lifecycle state, and return only aggregate/bounded order-item fields.
- Coding Prompt: Implement `GET /api/orders/statistics/products/:productId` and focused verification for auth, aggregate shape, default cancelled exclusion, filter validation, and no sensitive-field leakage.
- Code: `src/orders/orders.controller.ts`, `src/orders/orders.service.ts`, `scripts/verify-product-sales-statistics.js`.
- Validation: `git diff --check`, `npm run build`, `npm run verify:product-sales-statistics`, and `npm test`.

## Endpoint

```http
GET /api/orders/statistics/products/:productId?from=2026-06-01T00:00:00.000Z&to=2026-06-26T23:59:59.999Z&channel=allegro&status=delivered
```

`productId` is the canonical Catalog product ID stored in `order_items.productId`. Channel-local product, offer, ad, listing, or row IDs are outside this contract and must be resolved before order creation.

## Auth Boundary

Service callers follow the [canonical service identity standard](../../../auth-microservice/docs/SERVICE_IDENTITY_CONSUMER_STANDARD.md).

The endpoint is protected by the existing Orders global JWT role guard and explicit roles:

- `global:superadmin`
- `internal:orders-microservice:admin`
- `internal:orders-microservice:readonly`
- `internal:orders-microservice:operator`
- `internal:catalog-microservice:service`

## Filters

- `from`: optional ISO timestamp matched against `COALESCE(orders.orderedAt, orders.createdAt)`.
- `to`: optional ISO timestamp matched against `COALESCE(orders.orderedAt, orders.createdAt)`.
- `channel`: optional one of `flipflop`, `allegro`, `aukro`, `bazos`, `heureka`, `cliplot`.
- `status`: optional comma-separated order statuses. Default: `confirmed`, `processing`, `shipped`, `delivered`. `cancelled` is excluded by default and only included when explicitly requested.

## Response Shape

```json
{
  "success": true,
  "data": {
    "productId": "catalog-product-1",
    "generatedAt": "2026-06-26T10:00:00.000Z",
    "filters": {
      "from": null,
      "to": null,
      "channel": null,
      "statuses": ["confirmed", "processing", "shipped", "delivered"]
    },
    "summary": {
      "orderCount": 2,
      "itemLineCount": 2,
      "quantitySold": 3,
      "grossItemRevenue": null,
      "currency": null,
      "currencies": ["CZK", "EUR"],
      "mixedCurrency": true,
      "totalsByCurrency": [
        {
          "currency": "CZK",
          "orderCount": 1,
          "itemLineCount": 1,
          "quantitySold": 2,
          "grossItemRevenue": 200.5,
          "lastOrderAt": "2026-06-25T10:00:00.000Z"
        }
      ],
      "lastOrderAt": "2026-06-25T10:00:00.000Z"
    },
    "byChannel": [],
    "byStatus": [],
    "recentHistory": [],
    "lifecycleStatistics": {
      "source": "orders",
      "sourceStatus": "available",
      "orderCount": 2,
      "sampledOrderLimit": 1000,
      "byLifecycleStage": { "warehouse_fulfillment_requested": 1, "handed_to_delivery": 1 },
      "byPaymentStatus": { "paid": 2 },
      "byDeliveryStatus": { "not_started": 1, "handed_to_delivery": 1 },
      "exceptionCounts": { "paymentFailed": 0, "notReceived": 0, "returned": 0, "cancelled": 0, "delayed": 0, "unfulfilled": 1 },
      "channelLifecycle": []
    },
    "orderDeliveryStatistics": { "...": "same aggregate payload as lifecycleStatistics" }
  }
}
```

## Aggregation Rules

- `orderCount` counts distinct Orders rows containing the product.
- `itemLineCount` counts matching `order_items` rows.
- `quantitySold` sums matching `order_items.quantity`.
- `grossItemRevenue` sums matching `order_items.totalPrice`; this is gross item value, not paid, settled, reconciled, or refunded revenue.
- `lastOrderAt` and recent history dates use `MAX(COALESCE(orders.orderedAt, orders.createdAt))`.
- Currency conversion is not performed. Mixed currencies return per-currency aggregates in `totalsByCurrency` and leave top-level `summary.grossItemRevenue` and `summary.currency` as `null`.
- `lifecycleStatistics` and `orderDeliveryStatistics` are product-scoped aggregates derived only from Orders that contain the requested `order_items.productId` and match the active filters.
- `byLifecycleStage`, `byPaymentStatus`, and `byDeliveryStatus` are count maps. `channelLifecycle[]` repeats lifecycle and delivery-exception counts by channel.
- `exceptionCounts.delayed` remains `0` until an approved delivery-provider timestamp/ETA source exists. Orders does not infer delay from stock or marketplace listing state.
- `exceptionCounts.unfulfilled` counts paid/warehouse lifecycle stages that are not yet handed to delivery, received, cancelled, or returned.

## Privacy Boundary

No PII, raw customer data, addresses, external order IDs, channel account IDs, notes, payment provider fields, payment references, warehouse handoff details, stock authority data, bearer tokens, or secrets are returned. Lifecycle/payment/delivery fields are aggregate counts only.

Forbidden response fields include customer, email, phone, shippingAddress, billingAddress, externalOrderId, channelAccountId, paymentReferenceId, paymentApplicationId, paymentMethod, paymentStatus, customerNote, internalNote, warehouseHandoff, warehouseId, providerTransactionId, token, and secret.

## Explicit Deferrals

- FX conversion is not performed by Orders.
- Product existence validation remains Catalog-owned.
- Live Catalog consumer smoke remains deploy-gated until Orders is running in production with this source contract.
