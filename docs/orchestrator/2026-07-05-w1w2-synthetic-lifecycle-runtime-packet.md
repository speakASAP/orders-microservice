# W1/W2 Synthetic Lifecycle Runtime Packet

status: prepared-owner-approved-packet-not-executed
packetId: W1W2-SYNTHETIC-LIFECYCLE-PACKET-2026-07-05
prepared_at: 2026-07-05
owner: orders-lifecycle-orchestrator
approval_reference: user approval in Orders Lifecycle thread on 2026-07-05, scoped to prepare the packet ourselves
runtime_execution_status: not_executed
mutation: false
provider_call: false
deploy: false
raw_sensitive_output: forbidden

## Intent Preservation Chain

Vision -> Every sellable order is error-free, backed by Warehouse stock reservation, and visible through canonical Orders lifecycle.

Goal Impact -> The first live runtime lane can be run as one bounded synthetic create-reserve-pay-fulfillment-readback proof after explicit smoke env gates are supplied.

System -> Orders owns order creation, payment-status lifecycle, and customer/admin read models. Warehouse owns stock reservation and fulfillment state. Payments service identity owns the paid transition. FlipFlop service identity is the bounded marketplace subject for this synthetic packet.

Feature -> W1/W2 synthetic order lifecycle runtime packet.

Task -> Prepare a complete packet for the existing `smoke:lifecycle-mutation` script without running live mutation.

Execution Plan -> Use the deployed Orders pod only after all explicit smoke gates are present; create exactly one synthetic FlipFlop-scoped order, verify Warehouse reservation, mark it paid through the internal payments boundary, move Warehouse fulfillment to collecting, and read back customer/admin lifecycle projection.

Coding Prompt -> Do not print or persist bearer tokens, raw order ids, raw customer/payment/provider/tracking payloads, raw DB rows, or screenshots. Use hashes, route names, booleans, HTTP status codes, and canonical lifecycle labels only.

Code -> `scripts/smoke-lifecycle-mutation-propagation.js`, `scripts/verify-w1w2-runtime-packet.js`, this packet, and `package.json` script `verify:w1w2-runtime-packet`.

Validation -> `npm run verify:w1w2-runtime-packet`; `npm run verify:w1w2-cleanup-policy`; `npm run verify:runtime-gate-packets`; `npm run verify:completion-audit`; `git diff --check`.

## Runtime Gate Values

This packet is prepared, but the live smoke must still be explicitly gated at execution time:

- `RUN_LIVE_LIFECYCLE_MUTATION_SMOKE=1`
- `LIFECYCLE_MUTATION_SMOKE_APPROVAL_ID=W1W2-SYNTHETIC-LIFECYCLE-PACKET-2026-07-05`
- `LIFECYCLE_MUTATION_SMOKE_CONFIRM=CREATE_PAY_WAREHOUSE_READ`

The existing smoke script exits source-only with blockers unless all three gates are present. This packet does not change that behavior.

## Scope

- Repository: `/home/ssf/Documents/Github/orders-microservice`.
- Runtime namespace: `statex-apps`.
- Runtime deployment: `orders-microservice`.
- Channel: `flipflop`.
- Service subject: `flipflop-service`.
- Synthetic order only; no real customer, no real marketplace provider, no external payment provider.
- Quantity limit: one item with quantity `1`.

## Actor

- Orders pod executes the bounded smoke through `kubectl exec`.
- Channel actor: `flipflop-service`, using runtime internal service token presence only.
- Payment actor: `payments-microservice`, using runtime internal payments token presence only.
- Warehouse actor: `warehouse-microservice`, using runtime Warehouse token presence only.
- Token values must not be printed, decoded, copied, or persisted.

## Target

- `catalogProductId`: default fixture `c0de0000-0000-4000-8000-000000000011`, hashed in evidence.
- `warehouseId`: default fixture `c0de0000-0000-4000-8000-000000000013`, hashed in evidence.
- `externalOrderId`: generated as `codex-lifecycle-mutation-<timestamp>`, hashed in evidence.
- Customer subject: `flipflop-service@internal.invalid` synthetic internal address only.
- Delivery address: synthetic `Codex Lifecycle Smoke`, `Prague`, `CZ` address from the smoke script.

## Idempotency

- Create idempotency key pattern: `orders.create.v1:flipflop:lifecycle-mutation:<runRef>`.
- Replay expectation: a same-request replay must be safe and must not create duplicate reservations for the same idempotency key.
- This prepared packet does not run replay. Live execution evidence must include the order create result and idempotency hash only.

## Side Effects

Expected if the live smoke is explicitly executed later:

- One synthetic central order is created through `POST /api/orders`.
- Warehouse stock is checked and reserved during order creation.
- Payment status moves to `completed` through `PUT /api/orders/:id/payment-status` with the payments service identity.
- Warehouse fulfillment status moves to `collecting` through `PUT /api/orders/:id/warehouse-fulfillment-status` with the Warehouse service identity.
- Customer and admin lifecycle read models are queried for `lifecycleStage=warehouse_collecting`.

No external provider money movement, marketplace provider write, notification send, CRM mutation, manual DB write, deploy, migration, or browser session capture is authorized by this packet.

Cleanup policy packet: `docs/orchestrator/2026-07-06-w1w2-synthetic-cleanup-policy-packet.md`. `[RESOLVED/NARROWED: cleanup route/policy for W1/W2 synthetic lifecycle rows is defined as fail-closed Orders-owned cleanup decision packet; live retention or cancellation remains blocked until current redacted readback and owner side-effect acknowledgements exist]`. The synthetic order remains redacted runtime evidence unless a future owner-approved cleanup or retention packet supplies target hashes, actor, Orders/Warehouse readback, side-effect acknowledgements, idempotency/replay policy, and redacted post-action evidence.

## Readback

The live smoke can pass only if all assertions are true:

- create HTTP status is `201`.
- `orderIdPresent=true`, with raw order id not printed in final evidence.
- `initialWarehouseReserved=true`.
- payment update HTTP status is `200`.
- Warehouse fulfillment update HTTP status is `200`.
- customer lifecycle read HTTP status is `200`.
- admin lifecycle read HTTP status is `200`.
- customer read model sees the synthetic order at `warehouse_collecting`.
- admin read model sees the synthetic order at `warehouse_collecting`.
- customer scoped count is positive.
- admin aggregate `warehouse_collecting` count is positive.

## Redaction

Forbidden in command output, reports, commits, and handoffs:

- raw bearer tokens or secret values.
- raw customer/order/payment/provider/tracking payloads.
- raw DB rows.
- raw real customer data.
- raw external provider responses.
- screenshots or raw DOM from authenticated sessions.

Allowed evidence:

- packet id, command name, env gate names, route names, HTTP status codes, booleans, canonical lifecycle labels, and SHA-256 hashes of synthetic ids.

## Abort Conditions

Abort before live execution if any condition is true:

- `[MISSING: RUN_LIVE_LIFECYCLE_MUTATION_SMOKE=1]`.
- `[MISSING: LIFECYCLE_MUTATION_SMOKE_APPROVAL_ID]`.
- `[MISSING: LIFECYCLE_MUTATION_SMOKE_CONFIRM=CREATE_PAY_WAREHOUSE_READ]`.
- Orders deployment is not ready.
- `WAREHOUSE_RESERVATION_ENABLED` is not `true` in the Orders runtime.
- `FLIPFLOP_INTERNAL_SERVICE_TOKEN`, payments internal token, or Warehouse internal token is missing from runtime env presence checks.
- Synthetic catalog product or Warehouse id is rejected, unavailable, or no longer Warehouse-owned.
- The run would require real provider payment, customer notification, marketplace provider write, manual DB write, deploy, migration, browser session capture, token output, raw row output, or raw customer/payment/provider/tracking output.


## Remaining Gates

- `[MISSING: final operator decision to run the live W1/W2 smoke with all three env gates]`.
- `[RESOLVED/NARROWED: cleanup route/policy for W1/W2 synthetic lifecycle rows is defined as fail-closed Orders-owned cleanup decision packet; live retention or cancellation remains blocked until current redacted readback and owner side-effect acknowledgements exist]`.
- `[UNKNOWN: current runtime stock state for the default synthetic product until execution-time preflight]`.

## Execution Command Template

Do not run until the operator intentionally supplies the three env gates above:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/orders-microservice && RUN_LIVE_LIFECYCLE_MUTATION_SMOKE=1 LIFECYCLE_MUTATION_SMOKE_APPROVAL_ID=W1W2-SYNTHETIC-LIFECYCLE-PACKET-2026-07-05 LIFECYCLE_MUTATION_SMOKE_CONFIRM=CREATE_PAY_WAREHOUSE_READ npm run smoke:lifecycle-mutation'
```

## Current Decision

The packet is prepared and verifiable. It does not authorize live execution by itself and did not run any live mutation, provider call, deploy, DB write, browser session, token readout, raw ID output, raw DB row output, or raw customer/payment/provider/tracking output.
