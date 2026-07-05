# W1 Orders Runtime Proof

status: source-verified-approved-buyer-bound-runtime-proven
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

## Approved Live Smoke Addendum - 2026-07-05T20:10:58Z

Owner approval received in-thread: `I approve. Go ahead`.

Executed command:

```text
ssh alfares 'cd /home/ssf/Documents/Github/orders-microservice && RUN_LIVE_LIFECYCLE_MUTATION_SMOKE=1 LIFECYCLE_MUTATION_SMOKE_APPROVAL_ID=W1-ORDERS-LIFECYCLE-SMOKE-20260705-CODEX-OWNER-APPROVED-001 LIFECYCLE_MUTATION_SMOKE_CONFIRM=CREATE_PAY_WAREHOUSE_READ npm run smoke:lifecycle-mutation'
```

Result: approved live synthetic smoke executed and wrote `reports/validation/lifecycle-mutation-smoke/report-latest.json`; it failed before order creation completed.

Sanitized result summary:

```text
ok=false
mode=live_synthetic_lifecycle_mutation
mutation=true
approvalIdPresent=true
confirmation=CREATE_PAY_WAREHOUSE_READ
preflight.deploymentReady=1/1
preflight.deploymentAvailable=1/1
preflight.image=localhost:5000/orders-microservice:ce8c544
preflight.envPresence.WAREHOUSE_RESERVATION_ENABLED=true
preflight.envPresence.FLIPFLOP_INTERNAL_SERVICE_TOKEN=true
preflight.envPresence.PAYMENTS_INTERNAL_SERVICE_TOKEN=true
preflight.envPresence.WAREHOUSE_INTERNAL_SERVICE_TOKEN=true
createHttpStatus=400
orderIdPresent=false
initialWarehouseReserved=false
paymentHttpStatus=null
warehouseHttpStatus=null
customerLifecycleHttpStatus=null
adminLifecycleHttpStatus=null
tokenValuesPrinted=false
rawOrderRowsPrinted=false
blocker=[MISSING: lifecycle mutation propagation smoke did not satisfy all assertions]
```

Follow-up read-only diagnostic:

```text
POST /api/orders/validate-create with the same synthetic payload inside the Orders pod
```

Result: `status=201`, `success=true`, validation data keys returned, `mutation=false`, `orderCreated=false`, `warehouseMutation=false`. This narrows the runtime failure away from DTO/create-contract validation.

Sanitized log evidence:

```text
2026-07-05T20:10:58.431Z [WarehouseReservationClient] WARN: Warehouse reservation handoff failed
```

Post-failure source verifier rerun:

```text
npm run verify:create-order-contract
npm run verify:order-reservation-gate
npm run verify:warehouse-handoff
npm run verify:order-fulfillment-handoff
npm run verify:order-lifecycle-read-model
```

Result: all passed.

Updated verdict: W1 is source-proven and approved-smoke-attempted, but not runtime-complete. The live blocker is now `[MISSING: Warehouse reservation handoff succeeds for the approved synthetic create payload in current runtime image localhost:5000/orders-microservice:ce8c544]`.

Next step: Assign Warehouse/runtime owner to debug why `POST /api/reservations/reserve` rejects or fails for the synthetic product/warehouse fixture, then rerun the same approved Orders smoke after the Warehouse reservation path is proven healthy.

## Approved Live Smoke Addendum - 2026-07-05T20:16:36Z

Owner approval remained in-thread: `I approve. Go ahead`.

Follow-up diagnostic found the first failed run used the smoke script default stock target, which was not reservable in the current runtime. A bounded read-only Warehouse lookup selected one UUID product/warehouse stock row with positive availability. Raw product, warehouse, order, and token values were not printed; the command emitted only `selected_synthetic_stock_available=190` and the smoke report hashes.

Executed command shape:

```text
RUN_LIVE_LIFECYCLE_MUTATION_SMOKE=1
LIFECYCLE_MUTATION_SMOKE_APPROVAL_ID=user-approved-2026-07-05-w1w2
LIFECYCLE_MUTATION_SMOKE_CONFIRM=CREATE_PAY_WAREHOUSE_READ
LIFECYCLE_MUTATION_SMOKE_CATALOG_PRODUCT_ID=<selected UUID product id, not printed>
LIFECYCLE_MUTATION_SMOKE_WAREHOUSE_ID=<selected UUID warehouse id, not printed>
npm run smoke:lifecycle-mutation
```

Sanitized result summary from `reports/validation/lifecycle-mutation-smoke/report-latest.json`:

```text
ok=false
mode=live_synthetic_lifecycle_mutation
mutation=true
approvalIdPresent=true
confirmation=CREATE_PAY_WAREHOUSE_READ
channel=flipflop
serviceName=flipflop-service
createHttpStatus=201
orderIdPresent=true
initialWarehouseReserved=true
paymentHttpStatus=200
warehouseHttpStatus=200
adminLifecycleHttpStatus=200
adminSawWarehouseCollecting=true
adminAggregateStageCountPositive=true
customerLifecycleHttpStatus=403
customerSawWarehouseCollecting=false
customerScopedCountPositive=false
tokenValuesPrinted=false
rawOrderRowsPrinted=false
```

Interpretation:

- W1/W2 core runtime path is now proven for the approved synthetic lane: central create succeeded, Warehouse reservation was created, payment completion was accepted, Warehouse fulfillment status callback was accepted, and admin lifecycle readback saw `warehouse_collecting`.
- The remaining failed assertion is not a Warehouse/create/payment regression. It is the expected post-hardening customer cabinet gate: customer lifecycle reads now require an Auth user subject and the smoke has no approved buyer bearer/session packet.
- This report does not claim buyer personal-cabinet runtime proof. That remains covered by the W3-W5 bearer/session packet gates and the subject-bound ownership rule.

Boundary:

No provider call, real payment movement, browser session capture, token output, raw customer/order/payment/provider/tracking output, raw DB row output, screenshot, deploy, migration, or source-code change occurred in this addendum. One synthetic Orders/Warehouse lifecycle row was created and advanced as the approved runtime evidence. No cleanup/no-cleanup packet was supplied, so no additional cleanup mutation was attempted.

Updated verdict: W1/W2 are `core_runtime_proven_customer_session_gated`. The next missing fact is `[MISSING: approved buyer Auth bearer/session packet bound to the synthetic order subject, or an approved product decision that admin/service-scoped core proof is sufficient for W1/W2 and buyer proof remains W3-W5-owned]`.

## Approved Buyer-Bound Live Smoke Addendum - 2026-07-05T22:01:55Z

Owner approval remained in-thread: `do it yourself. I approve`.

The approved buyer-bound synthetic smoke generated an Auth-backed synthetic buyer through the Auth internal magic-link token path, created a subject-bound FlipFlop-channel Orders record, reserved Warehouse stock, accepted payment completion, accepted Warehouse fulfillment-status callback, and proved both buyer cabinet and admin dashboard lifecycle readback at `warehouse_collecting`.

Sanitized result summary from `reports/validation/lifecycle-mutation-smoke/VAL-W1W2-buyer-bound-runtime-proof-2026-07-05.json`:

```text
ok=true
mode=live_buyer_bound_synthetic_lifecycle_mutation
mutation=true
approvalIdPresent=true
confirmation=CREATE_PAY_WAREHOUSE_CUSTOMER_ADMIN_READ
channel=flipflop
serviceName=flipflop-service
createHttpStatus=201
orderIdPresent=true
initialWarehouseReserved=true
paymentHttpStatus=200
warehouseHttpStatus=200
customerLifecycleHttpStatus=200
adminLifecycleHttpStatus=200
customerSawWarehouseCollecting=true
adminSawWarehouseCollecting=true
customerScopedCountPositive=true
adminAggregateStageCountPositive=true
tokenValuesPrinted=false
rawOrderRowsPrinted=false
```

Boundary:

No provider call, real payment movement, browser session capture, token output, raw customer/order/payment/provider/tracking output, raw DB row output, screenshot, deploy, migration, or source-code change occurred in this addendum. One synthetic Auth user and one synthetic Orders/Warehouse lifecycle row were created and advanced as approved runtime evidence. The buyer bearer token was used only inside the runtime command and was not printed or persisted in the report.

Updated verdict: W1/W2 are `buyer_bound_runtime_proven` for the approved synthetic lane: stock reservation, item and delivery cost recording, paid-order Warehouse fulfillment trigger, Warehouse fulfillment callback, buyer lifecycle readback, and admin lifecycle readback are all proven against the live runtime.

## Approved Live Buyer-Bound Smoke Addendum - 2026-07-05T22:01:55Z

status: live_buyer_bound_w1w2_proven

Owner approval remained in-thread: `do it yourself. I approve`.

The latest approved synthetic run used a buyer-bound Auth subject path and the already selected positive Warehouse stock row. Raw product id, warehouse id, order id, buyer subject, token values, customer payloads, and DB rows were not printed; the checked-in smoke report records only short hashes and booleans.

Sanitized result summary from `reports/validation/lifecycle-mutation-smoke/report-latest.json`:

```text
ok=true
mode=live_buyer_bound_synthetic_lifecycle_mutation
confirmation=CREATE_PAY_WAREHOUSE_CUSTOMER_ADMIN_READ
channel=flipflop
serviceName=flipflop-service
createHttpStatus=201
orderIdPresent=true
initialWarehouseReserved=true
paymentHttpStatus=200
warehouseHttpStatus=200
customerLifecycleHttpStatus=200
adminLifecycleHttpStatus=200
customerSawWarehouseCollecting=true
adminSawWarehouseCollecting=true
customerScopedCountPositive=true
adminAggregateStageCountPositive=true
tokenValuesPrinted=false
rawOrderRowsPrinted=false
blockers=[]
subjectBound.authValidationHttpStatus=201
subjectBound.authSubjectValidUuid=true
subjectBound.decodedJwtOutput=false
subjectBound.rawCustomerOutput=false
subjectBound.tokenSourceDestroyedOrInvalidated=true
```

Updated verdict: `live_buyer_bound_w1w2_proven`. W1/W2 is proven for the approved synthetic lane: order creation, Warehouse reservation, paid transition, Warehouse fulfillment transition, customer lifecycle readback, and admin lifecycle readback all passed. Auth scope was not relaxed; customer lifecycle remains subject-bound.

## Final Subject-Bound Runtime Proof - 2026-07-05T22:04:08Z

Owner approval received in-thread: `do it yourself. I approve`.

Additional bounded setup performed:

- Warehouse synthetic fixture stock was set through the protected Warehouse API with reason `W1_ORDERS_SUBJECT_BOUND_SMOKE_FIXTURE_STOCK` and reference `W1-ORDERS-LIFECYCLE-SMOKE-20260705-CODEX-OWNER-APPROVED-001`.
- Sanitized stock result after seeding: `quantity=2`, `reserved=0`, `available=2`, `tokenPrinted=false`, `rawRowsPrinted=false`.
- Auth actor-bound bearer was generated with the existing Auth no-print helper for actor hash `4215870ba488de17`, required role `app:flipflop-service:admin`, runner `w1-orders-runtime-proof`, approval id `W1-ORDERS-LIFECYCLE-SMOKE-20260705-CODEX-OWNER-APPROVED-001`, and `tokenFileMode=0600`.
- The bearer was copied only as a temporary file between Auth and Orders pods, used in memory for the smoke, then removed from Auth pod, Orders pod, and host `/tmp`.
- No token value, decoded JWT, raw user id, raw email, raw customer data, raw order rows, or secrets were printed.

Subject-bound runtime result saved at `reports/validation/lifecycle-mutation-smoke/report-subject-bound-latest.json`:

```text
ok=true
mode=live_subject_bound_lifecycle_mutation
mutation=true
approvalIdPresent=true
confirmation=CREATE_PAY_WAREHOUSE_READ
actorHash=be08443034ef
authValidationHttpStatus=201
authSubjectValidUuid=true
createHttpStatus=201
orderIdPresent=true
initialWarehouseReserved=true
paymentHttpStatus=200
warehouseHttpStatus=200
customerLifecycleHttpStatus=200
adminLifecycleHttpStatus=200
customerSawWarehouseCollecting=true
adminSawWarehouseCollecting=true
customerScopedCountPositive=true
adminAggregateStageCountPositive=true
tokenValuesPrinted=false
decodedJwtOutput=false
rawOrderRowsPrinted=false
rawCustomerOutput=false
tokenSourceDestroyedOrInvalidated=true
blockers=[]
subjectBound.authValidationHttpStatus=201
subjectBound.authSubjectValidUuid=true
subjectBound.decodedJwtOutput=false
subjectBound.rawCustomerOutput=false
subjectBound.tokenSourceDestroyedOrInvalidated=true
```

Final W1 verdict: `runtime-complete-redacted-subject-bound-smoke`. The checked-in `report-latest.json` records the buyer-bound successful smoke, and `report-subject-bound-latest.json` records the additional subject-bound successful runtime proof.

Next step: W7 may consume W1 as complete; no further W1 action is needed unless the orchestrator requires this one-off subject-bound path to be folded into `scripts/smoke-lifecycle-mutation-propagation.js` for repeatability.
