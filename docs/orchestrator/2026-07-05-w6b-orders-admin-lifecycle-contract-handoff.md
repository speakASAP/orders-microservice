# W6-B Orders Admin Lifecycle Contract Handoff

status: source-validated-contract-exists
created_at: 2026-07-05
owner: W6-B admin status authority contract agent
repositories:
  - /home/ssf/Documents/Github/orders-microservice
  - /home/ssf/Documents/Github/flipflop
company_standard: /Users/Sergej.Stasok/Documents/Gitlab/intent-preservation-system

## Intent Preservation Chain

Vision -> Orders is the canonical lifecycle authority for central marketplace orders.

Goal Impact -> FlipFlop admin status/payment edits must not drift local lifecycle state away from central Orders.

System -> Orders owns lifecycle status, state-machine validation, lifecycle events, and Warehouse cancellation handoff. FlipFlop owns storefront/admin UI, local notes, and channel-local metadata only. Payments owns provider payment/refund truth. Warehouse owns stock/reservations/fulfillment.

Feature -> Admin lifecycle mutation for central Orders-owned records uses an Orders-owned action contract; FlipFlop fails closed until it has an approved action-admin actor/session and route-to-Orders implementation.

Task -> Determine whether central Orders already has an approved admin lifecycle mutation/correction contract that FlipFlop can use, and document exact evidence without inventing a new endpoint.

Execution Plan -> Inspect Orders and FlipFlop remote source/docs, run source-only verifier(s), repair stale verifier evidence assertion, and record a downstream agent-ready prompt.

Coding Prompt -> Remote-only workflow on `ssh alfares`; no runtime order mutation, deploy, DB migration, payment/provider/checkout mutation, secrets, token output, or raw customer/payment/provider data.

Code -> Source contract already exists in Orders. This pass changed only `scripts/verify-order-admin-lifecycle-action-contract.js` to match current FlipFlop evidence HEAD and added this docs handoff report.

Validation -> `npm run verify:order-admin-lifecycle-action-contract`; `git diff --check`.

## Verdict

Central Orders already has an approved source-validated admin lifecycle action contract that FlipFlop can use after the remaining action-admin/session and route-to-Orders implementation gates are satisfied.

Approved primary command surface:

- Endpoint: `POST /api/admin/operations/actions/order-status`
- Auth/RBAC: `global:superadmin` or `internal:orders-microservice:action-admin` through `ADMIN_ACTION_ROLES`
- Request body: `orderId`, `status`, optional `approval`
- Response shape: `{ success: true, action: { workflow, resourceType, resourceId, requestedStatus, resultingStatus, approvalRequired, actorMode }, order }`
- Implementation chain: `AdminController.applyOrderStatusAction -> AdminService.applyOrderStatusAction -> OrdersService.updateStatus`

Approved lower-level command surface:

- Endpoint: `PUT /api/orders/:id/status`
- Auth/RBAC: `global:superadmin` or `internal:orders-microservice:action-admin` through `ORDER_STATUS_UPDATE_ROLES`
- Request body: `status`, optional `approval`
- Implementation chain: `OrdersController.updateStatus -> OrdersService.updateStatus`

FlipFlop should prefer the admin action route rather than granting channel service roles generic status mutation privileges.

## Allowed Lifecycle Transitions

Source: `src/orders/status-transitions.ts` and `scripts/verify-status-transitions.js`.

- Normal forward path: `pending -> confirmed -> processing -> shipped -> delivered`.
- `processing -> shipped` requires every order item to be at least `shipped`.
- `shipped -> delivered` requires every order item to be `delivered`.
- `pending|confirmed|processing -> cancelled` is allowed only with human approval and required side-effect acknowledgements.

Rejected through this contract:

- unrecognized statuses;
- status jumps such as `pending -> processing`;
- terminal destructive corrections from `delivered` or `cancelled`;
- refund-like order statuses, which remain Payments-owned;
- channel service role mutation without action-admin authority.

## Cancellation Approval Packet

Required fields for `status=cancelled`:

- `approval.approved=true`
- `approval.approvalType=human`
- Auth actor identity or `approval.approvedBy`
- safe `approval.reasonCode`
- `approval.sideEffectsHandled.payment=true`
- `approval.sideEffectsHandled.warehouse=true`
- `approval.sideEffectsHandled.notification=true`
- `approval.sideEffectsHandled.crm=true`
- `approval.sideEffectsHandled.channel=true`
- optional safe `approval.idempotencyKey`

Validation/audit behavior:

- rejected status transitions emit `order.status.update` audit with `outcome=rejected`;
- idempotency-key replay emits `order.status.update.idempotency_key_replay` and returns the existing order;
- same-status replay emits `order.status.update.idempotent_replay` and returns the existing order;
- successful transition saves status, persists approval audit when present, calls Warehouse cancellation handoff for `cancelled`, publishes lifecycle change if needed, emits `orders.order.updated.v1`, and audits success without raw sensitive output.

## Source Evidence

Commands run:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/orders-microservice && sed -n "1,220p" src/admin/admin.controller.ts && sed -n "1,260p" src/admin/admin.service.ts'
```

Result: `src/admin/admin.controller.ts` defines `POST admin/operations/actions/order-status` with `@Roles(...ADMIN_ACTION_ROLES)`. `src/admin/admin.service.ts` defines `ADMIN_ACTION_ROLES = [global:superadmin, internal:orders-microservice:action-admin]`, rejects actors without action mode, requires `orderId` and `status`, and delegates to `ordersService.updateStatus(orderId, status, { approval, actor })`.

```bash
ssh alfares 'cd /home/ssf/Documents/Github/orders-microservice && sed -n "1,230p" src/orders/orders.controller.ts'
```

Result: `src/orders/orders.controller.ts` defines `ORDER_STATUS_UPDATE_ROLES = [global:superadmin, internal:orders-microservice:action-admin]`, `PUT :id/status`, and passes `{ approval: body.approval, actor: request.user }` into `OrdersService.updateStatus`.

```bash
ssh alfares 'cd /home/ssf/Documents/Github/orders-microservice && sed -n "490,635p" src/orders/orders.service.ts && sed -n "1,330p" src/orders/status-transitions.ts'
```

Result: `OrdersService.updateStatus()` validates through `validateOrderStatusTransitionWithAudit`, audits rejected/success/replay paths, persists `statusTransitionAudit`, cancels Warehouse reservations on `cancelled`, publishes lifecycle changed and order updated events, and rejects invalid transitions through `BadRequestException`. `status-transitions.ts` contains the allowed state machine, cancellation approval requirements, side-effect acknowledgement requirements, idempotency key sanitizer, and refund-like/terminal correction rejection.

```bash
ssh alfares 'cd /home/ssf/Documents/Github/orders-microservice && sed -n "1,260p" docs/orchestrator/ORDER_ADMIN_LIFECYCLE_ACTION_CONTRACT.md'
```

Result: contract status is `approved-source-contract`, completeness `source_validated`, and it explicitly lists the primary `POST /api/admin/operations/actions/order-status` route, lower-level `PUT /api/orders/:id/status` route, action roles, allowed payloads, forbidden semantics, and FlipFlop integration rule.

```bash
ssh alfares 'cd /home/ssf/Documents/Github/flipflop && sed -n "930,1005p" services/order-service/src/orders/orders.service.ts && sed -n "105,135p" services/frontend/app/admin/orders/[id]/page.tsx'
```

Historical result before W7E: FlipFlop source no longer blindly mutates central-owned local status/payment and failed closed while route-to-Orders wiring was missing. Superseded by W7E evidence: FlipFlop 281e2f4 routes central-owned status actions to Orders while payment/provider correction remains fail-closed; the admin detail form avoids local central payment/status drift.

## Validation Results

Initial relevant verifier result:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/orders-microservice && npm run verify:order-admin-lifecycle-action-contract'
```

Result: failed only because the verifier expected stale FlipFlop evidence marker `1d89927` while `VAL-W7B-flipflop-admin-status-authority-closed-2026-07-05.md` records current evidence HEAD `6cb7c63`.

Fix applied: update `scripts/verify-order-admin-lifecycle-action-contract.js` assertion from `1d89927` to `6cb7c63`; no runtime behavior changed.

Post-fix validation:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/orders-microservice && npm run verify:order-admin-lifecycle-action-contract'
```

Result: pass. Output reported `ok=true`, verifier `orders-admin-lifecycle-action-contract.v1`, admin action route `/api/admin/operations/actions/order-status`, `lowLevelStatusRouteRoleGated=true`, action roles `global:superadmin` and `internal:orders-microservice:action-admin`, `readOnlyAdminCanMutate=false`, `channelServiceCanMutate=false`, `runtimeMutation=false`, and `sensitiveOutput=redacted-source-only`.

```bash
ssh alfares 'cd /home/ssf/Documents/Github/orders-microservice && npm run verify:transitions'
```

Result: pass, `status transition verification ok`.

```bash
ssh alfares 'cd /home/ssf/Documents/Github/orders-microservice && npm run verify:status-update-idempotency'
```

Result: pass, `status update idempotency verification ok`.

```bash
ssh alfares 'cd /home/ssf/Documents/Github/orders-microservice && git diff --check'
```

Result: pass.

## Current Blockers

- `[MISSING: approved live action-admin session packet]` No authenticated live action-admin browser/API mutation proof was available or run.
- `[RESOLVED: FlipFlop route-to-Orders admin action implementation]` Superseded by FlipFlop `281e2f4`; central-owned status actions route to Orders action route while payment/provider correction remains fail-closed.
- `[MISSING: payment/refund/provider correction workflow]` Payment/provider correction semantics remain outside this status action contract.

## Agent-Ready Downstream Prompt

Objective: implement FlipFlop route-to-Orders admin lifecycle action wiring without reintroducing local lifecycle drift.

Scope:

- Repository: `/home/ssf/Documents/Github/flipflop` over `ssh alfares` only.
- Allowed files: FlipFlop admin order-service route/client DTOs, frontend admin order detail action form, source verifier(s), docs/reports.
- Forbidden files: payment/provider/checkout mutations, DB migrations, deploy scripts, secrets, live order mutation, raw customer/payment/token/provider output, broad Orders contract edits.

Dependency gates:

- Requires an approved Auth-backed actor/session that carries `global:superadmin` or `internal:orders-microservice:action-admin` for Orders.
- Preserve fail-closed behavior when action-admin authority is unavailable.
- Do not grant `internal:flipflop-service:service` generic Orders status mutation authority.

Implementation requirements:

- For central-owned orders, route status actions to Orders `POST /api/admin/operations/actions/order-status` with `orderId`, `status`, and optional `approval`.
- For cancellation, require the full approval packet listed above before calling Orders.
- Keep local FlipFlop `status`/`paymentStatus` writes disabled for central-owned orders.
- Continue to allow channel-local notes updates without central status mutation.
- Surface Orders action validation failures to the admin UI without falling back to local Prisma status/payment writes.

Validation:

- Add/update a source verifier proving central-owned local status/payment writes remain blocked and Orders action route is the only central lifecycle mutation path.
- Run `npm run verify:admin-status-central-authority`, `npm run verify:orders-lifecycle-ui`, `npm run verify:orders-hub-integration`, the new verifier, service build/frontend lint as applicable, and `git diff --check`.
- No deploy and no live mutation unless a separate owner-approved runtime packet exists.

## Parallel-Ready Next Lanes

| Workstream | Status | Owner role | Objective | Allowed files | Forbidden files | Dependencies/blockers | Validation evidence | Merge order |
|---|---|---|---|---|---|---|---|---|
| W6-B1 FlipFlop action wiring | complete | FlipFlop integration owner | Route central-owned admin status actions to Orders admin action route | FlipFlop order-service/admin UI/client/verifiers/docs | payment/provider/checkout, migrations, deploy scripts | none for central status authority; browser session remains separate | source verifier, UI/service build/lint, guarded create/read/cancel smoke | complete in FlipFlop `281e2f4` |
| W6-B2 Orders live action smoke | complete for guarded synthetic central status cleanup | Orders validation owner | Prove action route with redacted approved live packet | Orders/FlipFlop smoke/report only | DB/manual mutation without packet, secrets/raw data | none for approved synthetic W6-B cleanup; browser session remains separate | redacted API smoke and audit/event evidence | complete via W7E consumed evidence |
| W6-B3 Payment/provider correction contract | blocked | Payments/Orders owner | Define non-status payment/refund/provider correction workflow | contract docs/verifiers only | provider call, refund, money movement | `[MISSING: payment/refund/provider correction workflow]` | source-only contract verifier | independent, before any payment correction UI |
| W7 Integration | final integration | Orchestrator | Merge W6-B verdict into lifecycle master status | docs/orchestrator reports | runtime code/schema | W6-B1 or explicit defer decision | final handoff report | last |

Shared contracts: Orders admin lifecycle action contract, Orders transition validator, Auth action-admin role, FlipFlop central ownership marker, side-effect acknowledgement packet.

Integration owner: original orders-lifecycle orchestrator.

Validation owner: Orders validation owner for contract verifier; FlipFlop integration owner for downstream source wiring.

## Deployment

Not run. No deploy gate was requested or reached.
