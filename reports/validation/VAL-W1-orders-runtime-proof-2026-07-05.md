# W1 Orders Runtime Proof

status: source-verified-runtime-mutation-gated
created_at: 2026-07-05
workstream: W1 Orders runtime proof
repository: /home/ssf/Documents/Github/orders-microservice
master_plan: /home/ssf/Documents/Github/orders-microservice/docs/orchestrator/2026-07-05-error-free-orders-lifecycle-master-plan.md

## Intent Preservation Chain

Vision -> Every sellable order is error-free: order lines are available and reserved before order creation completes, paid orders are handed to Warehouse, and customer/admin lifecycle reads reflect canonical Orders state.

Goal Impact -> Prove central Orders create/reserve/pay/fulfillment/status callback behavior without unapproved production mutation.

System -> Orders owns lifecycle and event publishing; Warehouse owns stock/reservation/fulfillment state.

Feature -> Source-verified create contract, reservation gate, payment boundary, fulfillment handoff, lifecycle read model, warehouse callback contract, event contracts, and status idempotency.

Task -> Run focused source verifiers and a non-mutating runtime preflight; do not run live create/pay/callback mutation without explicit smoke gates.

Execution Plan -> Use existing Orders verifier scripts and `smoke:lifecycle-mutation` in approval-gated source-only mode.

Coding Prompt -> Remote-only workflow under `/home/ssf/Documents/Github/orders-microservice`; no deploy, no DB mutation, no token or raw customer/payment/tracking output.

Code -> No production source code changed in this pass. This report records verification evidence.

Validation -> Focused verifiers passed; runtime deployment/env preflight passed; live mutation remained gated.

## Commands And Results

```bash
npm run verify:create-order-contract
npm run verify:order-reservation-gate
npm run verify:payment-boundary
npm run verify:order-fulfillment-handoff
npm run verify:order-lifecycle-read-model
npm run verify:warehouse-handoff
npm run verify:event-contracts
npm run verify:status-update-idempotency
```

Result: all focused verifiers passed with `ok` output for create contract, reservation gate, payment boundary, fulfillment handoff, lifecycle read model, warehouse handoff contract, event contract, and status update idempotency.

```bash
kubectl -n statex-apps get deploy orders-microservice warehouse-microservice -o wide
kubectl -n statex-apps get pods -l app=orders-microservice
```

Result: Orders and Warehouse deployments ready `1/1`; Orders pod running; observed images `orders-microservice:adddafb` and `warehouse-microservice:3868df3`.

```bash
WRITE_LIFECYCLE_MUTATION_SMOKE_REPORT=0 npm run smoke:lifecycle-mutation
```

Result: exited with approval-gate status as expected, `mutation=false`, `tokenValuesPrinted=false`, `rawOrderRowsPrinted=false`. Preflight reported Orders deployment ready `1/1`, available `1/1`, image `localhost:5000/orders-microservice:adddafb`, and env presence true for `WAREHOUSE_RESERVATION_ENABLED`, `FLIPFLOP_INTERNAL_SERVICE_TOKEN`, Payments internal token, and Warehouse internal token.

## Runtime Gate

The live synthetic mutation path would exercise:

- `POST /api/orders`
- `PUT /api/orders/:id/payment-status`
- `PUT /api/orders/:id/warehouse-fulfillment-status`
- `GET /api/orders/customer/lifecycle`
- `GET /api/orders/admin/lifecycle`

It was not run because the required approval gates were absent:

- `[MISSING: RUN_LIVE_LIFECYCLE_MUTATION_SMOKE=1]`
- `[MISSING: LIFECYCLE_MUTATION_SMOKE_APPROVAL_ID]`
- `[MISSING: LIFECYCLE_MUTATION_SMOKE_CONFIRM=CREATE_PAY_WAREHOUSE_READ]`

## Verdict

Orders is source-verified for the required create/reserve/pay/fulfillment/lifecycle/callback contracts, and the live deployment has the required readiness and internal-token env presence. The remaining W1 gap is not source implementation; it is approval-gated live synthetic mutation evidence.

## Handoff

W7 may consume this as W1 source-verified runtime-preflight evidence. Do not mark live mutation proof complete unless an owner-approved synthetic run supplies the three required smoke gates above and produces a redacted report.
