# Payment Status Boundary

```yaml
id: ORDERS-PAYMENT-STATUS-BOUNDARY
status: implemented
owner: Orders owner
created: 2026-06-13
last_updated: 2026-06-13
completeness_level: implemented
upstream:
  - docs/orchestrator/INTENT.md
  - docs/orchestrator/ORDERS_HUB_ROADMAP.md
  - /home/ssf/Documents/Github/payments-microservice/README.md
  - /home/ssf/Documents/Github/payments-microservice/src/payments/entities/payment.entity.ts
downstream:
  - src/payments/payment-status.dto.ts
  - src/orders/orders.controller.ts
  - src/orders/orders.service.ts
  - scripts/verify-payment-boundary.js
related_adrs: []
```

## Boundary

Payments owns provider sessions, checkout redirects, webhooks, reconciliation, provider transaction identifiers, variable symbols, payment transactions, refunds, and provider-specific payloads.

Orders owns order lifecycle state and may store bounded payment status references needed to show order progress. Orders must not create provider sessions, generate variable symbols, reconcile provider callbacks, call refund APIs, or store provider response bodies.

## Direction

Payments or an authorized service actor reports bounded payment status to Orders after Payments has already reconciled provider state.

Orders does not receive raw provider webhooks. Provider webhooks continue to terminate in `payments-microservice`.

## Orders Endpoint

`PUT /api/orders/:id/payment-status`

Request contract version: `orders.payment-status.v1`

Allowed body fields:

- `contractVersion`
- `paymentId`
- `status`
- `applicationId`
- `paymentMethod`
- `occurredAt`

Forbidden body fields include provider transaction IDs, variable symbols, provider response payloads, metadata, refund fields, amount, currency, customer data, card data, tokens, and secrets.

## Status Mapping

| Payments status | Orders paymentStatus | Order lifecycle effect |
| --- | --- | --- |
| `pending` | `pending` | No order status change. |
| `processing` | `processing` | No order status change. |
| `completed` | `paid` | If order is `pending`, move to `confirmed` and emit `orders.order.updated.v1`; emit `orders.order.paid.v1`. |
| `failed` | `failed` | No order status change. No automatic order cancellation or refund behavior. Warehouse release remains a follow-up trigger after owner rollout approval. |
| `cancelled` | `cancelled` | No order status change. |
| `refunded` | rejected | Refunds remain Payments-owned and require separate owner-approved workflow. |

Orders rejects `completed` for already cancelled orders. Once an order is marked `paid`, replaying the same `paymentId` is idempotent and does not emit a second paid event. Replacing a paid `paymentReferenceId` or downgrading a paid order to failed/cancelled/pending is rejected because refunds and corrections require a separate owner-approved workflow.

## Stored Fields

Orders may store:

- `paymentReferenceId`: Payments-owned payment ID.
- `paymentApplicationId`: bounded source application ID.
- `paymentMethod`: bounded method label.
- `paymentStatus`: normalized order-facing status.
- `paymentUpdatedAt`: timestamp of the Payments-owned status event.

Orders must not store provider transaction IDs, variable symbols, provider response bodies, refund identifiers, payment transaction rows, raw metadata, customer payment payloads, or card/token/secret data.

## Paid Provider Rollback Gate

For Goal 24 `catalog.bundle.v1` paid/provider checkout, Orders can only consume bounded payment state from Payments through `orders.payment-status.v1`:

- `completed` is the only provider-success input; Orders maps it to `paymentStatus=paid`, confirms a pending order, and triggers Warehouse `fulfill`.
- `failed` or `cancelled` are the only pre-paid provider failure/cancel inputs; Orders records the bounded payment state and triggers Warehouse `release`.
- `refunded`, `refund`, and `partially_refunded` remain rejected because refund execution and provider evidence are Payments-owned.
- Once an order is `paid`, Orders rejects downgrades to `pending`, `failed`, or `cancelled`; a completed-payment rollback requires a separate owner-approved provider refund/cancel/reversal packet and Orders cancellation cleanup workflow.

Manual payment-state bypass, direct DB correction, or synthetic payment downgrade is not an approved rollback mechanism.


Fiobanka Goal 24 cleanup refinement:

- Fiobanka completion/refund/correction evidence stays Payments-owned. Orders must not treat `PaymentStatus.REFUNDED`, a local Payments refund row, or a provider correction note as an `orders.payment-status.v1` input.
- The only automatic Orders/Warehouse handoffs from payment status are `completed -> paid -> Warehouse fulfill` and pre-paid `failed|cancelled -> Warehouse release`.
- Any completed-transfer cleanup requires a separate Orders status cancellation packet with a named human cancellation actor/approvedBy, safe reason code `GOAL24_PAID_PROVIDER_ROLLBACK`, an approved cleanup idempotency key, and side-effect acknowledgements for payment, warehouse, notification, CRM, and channel.
