# Orders Status Transition Contract

```yaml
id: ORDERS-STATUS-TRANSITION-CONTRACT
status: approved
owner: Orders owner
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: validated
upstream:
  - BUSINESS.md
  - SYSTEM.md
  - README.md
  - src/orders/order.entity.ts
  - src/items/order-item.entity.ts
  - docs/orchestrator/GOALS.md
downstream:
  - docs/orchestrator/EXECUTION_PLAN.md
  - docs/orchestrator/PRE_CODING_GATE.md
  - docs/orchestrator/STATUS.md
related_adrs: []
```

## Purpose

This document defines the allowed order and order-item fulfillment status transitions for `orders-microservice`. It is the source contract for Goal 2 runtime enforcement work.

## Scope

Included:

- Order lifecycle status stored in `orders.status` and exposed by `PUT /api/orders/:id/status`.
- Order item fulfillment status stored in `order_items.fulfillmentStatus` and exposed by `PUT /api/items/:id/fulfillment`.
- Approval rules for cancellation, refund-like, and destructive corrections.

Excluded:

- Shipment status transitions under `shipments.status`; those need a separate shipment contract.
- Payment provider state, payment identity, refunds, and reconciliation; those remain Payments-owned.
- Warehouse stock truth, reservations, release, decrement, and physical fulfillment state; those remain Warehouse-owned.

## Order Status Values

| Status | Meaning | Terminal | Notes |
| --- | --- | --- | --- |
| `pending` | Order ingested, not yet accepted for fulfillment. | No | Default value in `src/orders/order.entity.ts`. |
| `confirmed` | Order accepted by operations or an owning channel workflow. | No | Confirms the order can proceed toward fulfillment. |
| `processing` | Fulfillment work is underway. | No | Warehouse coordination may exist, but Warehouse remains stock owner. |
| `shipped` | The order has left fulfillment. | No | Should align with shipment/event evidence before enforcement. |
| `delivered` | The order was delivered to the customer. | Yes | Normal successful terminal state. |
| `cancelled` | The order was stopped by explicit owner-approved action. | Yes | Cancellation is destructive and must not be automated by AI. |

## Allowed Order Transitions

| From | Allowed To | Approval Required | Notes |
| --- | --- | --- | --- |
| none | `pending` | No | Creation default. Importers may create historical orders with a documented exception only. |
| `pending` | `confirmed` | No | Normal acceptance path. |
| `pending` | `cancelled` | Yes | Allowed only with explicit human owner approval and audit evidence. |
| `confirmed` | `processing` | No | Normal fulfillment start. |
| `confirmed` | `cancelled` | Yes | Allowed only with explicit human owner approval and audit evidence. |
| `processing` | `shipped` | No | Normal fulfillment completion before delivery. |
| `processing` | `cancelled` | Yes | Allowed only before shipment when owner approval and stock-release handling are documented. |
| `shipped` | `delivered` | No | Normal delivery completion. |

## Forbidden Order Transitions

These transitions must be rejected by runtime validation in Goal 2.2 unless a future owner-approved correction workflow explicitly documents a separate endpoint, reason, actor, and audit trail:

- Any forward state jump, for example `pending -> processing`, `pending -> shipped`, or `confirmed -> shipped`.
- Any reverse transition, for example `processing -> confirmed`, `shipped -> processing`, or `delivered -> shipped`.
- Any transition out of `delivered` or `cancelled` through the normal status endpoint.
- Any transition to `cancelled` without explicit human owner approval.
- Any refund-like transition or destructive correction represented only as a status string.
- Any unrecognized order status value.

## Order Item Fulfillment Values

| Status | Meaning | Terminal | Notes |
| --- | --- | --- | --- |
| `pending` | Item exists on an order but is not reserved. | No | Default value in `src/items/order-item.entity.ts`. |
| `reserved` | Warehouse reservation is expected or recorded. | No | Warehouse remains reservation owner. |
| `shipped` | Item has shipped. | No | Should align with shipment evidence. |
| `delivered` | Item was delivered. | Yes | Normal successful terminal item state. |

## Allowed Item Fulfillment Transitions

| From | Allowed To | Approval Required | Notes |
| --- | --- | --- | --- |
| none | `pending` | No | Creation default. |
| `pending` | `reserved` | No | Normal reservation path. |
| `reserved` | `shipped` | No | Normal dispatch path. |
| `shipped` | `delivered` | No | Normal delivery completion. |

## Forbidden Item Fulfillment Transitions

- Any forward state jump, for example `pending -> shipped` or `reserved -> delivered`.
- Any reverse transition, for example `reserved -> pending`, `shipped -> reserved`, or `delivered -> shipped`.
- Any transition out of `delivered` through the normal fulfillment endpoint.
- Any unrecognized fulfillment status value.
- Any synthetic `cancelled`, `refunded`, or `returned` item value until owner-approved schema and API changes define it.

## Order And Item Alignment Rules

- Order status must not advance to `shipped` until every active item is at least `shipped` or an owner-approved exception documents partial fulfillment behavior.
- Order status must not advance to `delivered` until every active item is `delivered` or an owner-approved exception documents partial delivery behavior.
- Cancelling an order must not invent item fulfillment states. Stock release or reservation cleanup belongs to Warehouse coordination and must be auditable.
- Item fulfillment updates must not silently move the parent order status unless a future implementation explicitly documents and tests that automation.

## Approval And Audit Requirements

Cancellation, refund-like transitions, terminal-state corrections, and destructive data corrections require all of the following before runtime support is added:

- Explicit human owner approval for the individual operation or approved workflow.
- Actor identity or service identity from Auth context where available.
- Reason code or free-text reason safe for logs and reports.
- Previous status, requested status, resulting status, and timestamp.
- Evidence that payment, warehouse, notification, CRM, and channel side effects are handled by the owning services.

## Current Implementation Status

Goal 2.2 added runtime transition validation for order status and item fulfillment updates.

Goal 2.3 added the explicit approval gate for documented order cancellation paths:

- `pending|confirmed|processing -> cancelled` requires `approval.approved=true`, `approval.approvalType=human`, actor identity, a safe `reasonCode`, and side-effect acknowledgements for payment, warehouse, notification, CRM, and channel handling.
- Refund-like order statuses remain rejected as Payments-owned and require a separate owner-approved workflow.
- Terminal-state destructive corrections remain rejected through the normal status endpoint until a separate owner-approved correction workflow exists.
- Synthetic item cancellation, refund, and return values remain rejected until owner-approved schema and API changes define them.

Goal 2.4 added committed direct verification for allowed, rejected, and owner-approved transitions through `npm test` and `scripts/verify-status-transitions.js`.
