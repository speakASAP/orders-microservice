# VAL-W7C Orders Admin Lifecycle Action Contract

Date: 2026-07-05
Status: source-validated-contract-hardened
Owner: Orders lifecycle orchestrator

## Vision

Unified Order Lifecycle Platform: Orders is the canonical lifecycle authority for all marketplace purchases.

## Goal Impact

The previously open W6-B blocker `[MISSING: central Orders admin lifecycle mutation/correction contract]` is narrowed. Orders now has a documented and verified admin lifecycle action contract, and the low-level status route is explicitly action-role gated. Marketplace services still must not mutate local lifecycle state or call this path without an approved action-admin actor.

## System

- Orders admin action route: `POST /api/admin/operations/actions/order-status`
- Low-level status route: `PUT /api/orders/:id/status`
- Action roles: `global:superadmin`, `internal:orders-microservice:action-admin`
- State machine: `src/orders/status-transitions.ts`
- Lifecycle side effects: `OrdersService.updateStatus` publishes lifecycle updates and calls Warehouse cancellation handoff only after validation.

## Feature

Orders-owned admin lifecycle actions are formalized as a source-validated command surface. Read-only admin roles and channel service roles are not action roles. Cancellation still requires human approval plus side-effect acknowledgements for payment, warehouse, notification, CRM, and channel.

## Task

Close the source-contract part of the FlipFlop W6-B admin authority blocker without inventing channel-local status semantics or payment/refund/provider workflows.

## Execution Plan

1. Add `ORDER_STATUS_UPDATE_ROLES` to `src/orders/orders.controller.ts`.
2. Add `@Roles(...ORDER_STATUS_UPDATE_ROLES)` to `PUT /orders/:id/status`.
3. Document the approved Orders-owned command surface in `docs/orchestrator/ORDER_ADMIN_LIFECYCLE_ACTION_CONTRACT.md`.
4. Add `scripts/verify-order-admin-lifecycle-action-contract.js`.
5. Run source, build, status-transition, admin-console, and idempotency validation.

## Coding Prompt

Keep marketplace lifecycle authority centralized in Orders. Do not add payment/refund/provider correction behavior. Do not grant channel service roles lifecycle mutation privileges. Preserve fail-closed behavior until a live action-admin packet exists.

## Code

- `src/orders/orders.controller.ts`
- `docs/orchestrator/ORDER_ADMIN_LIFECYCLE_ACTION_CONTRACT.md`
- `scripts/verify-order-admin-lifecycle-action-contract.js`
- `package.json`

## Validation

- `npm run build` - PASS
- `npm run verify:order-admin-lifecycle-action-contract` - PASS
- `npm run verify:admin-operations-console` - PASS
- `npm run verify:transitions` - PASS
- `npm run verify:status-update-idempotency` - PASS
- `git diff --check` - PASS

## Remaining Blockers

- `[MISSING: approved live action-admin session packet]` No live mutation/browser smoke was run.
- `[MISSING: FlipFlop route-to-Orders admin action implementation]` FlipFlop currently fails closed for central-owned local status/payment edits and does not call this Orders action route.
- `[MISSING: payment/refund/provider correction workflow]` Paid downgrades, refunds, provider corrections, and payment reference replacement remain Payments-owned and outside this status contract.
