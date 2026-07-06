# Runtime Gate Packet Contracts

status: source-contract-runtime-gated
created_at: 2026-07-05
owner: orders-lifecycle-orchestrator
scope: W1/W2 live buyer-bound synthetic proof, W3-W5 row-level cabinet smoke, W6B FlipFlop action smoke, W8 Bazos provider proof

## Intent Preservation Chain

Vision -> Every sellable order is error-free and every buyer/admin surface reflects canonical Orders lifecycle.

Goal Impact -> W1/W2 live buyer-bound proof is resolved, and remaining runtime gates stay explicit, reviewable, and machine-checkable before any further Warehouse, provider, action-admin, or marketplace row-level proof is attempted.

System -> Orders owns canonical lifecycle and runtime proof gates. Warehouse owns stock, reservation, fulfillment, and delivery status transitions. Marketplaces own channel UI/readback only. Auth owns session and role evidence. Providers own external marketplace/shipment facts.

Feature -> Runtime packet contract for gated order lifecycle proof lanes.

Task -> Record the resolved W1/W2 packet and keep open [MISSING: ...] blockers as exact packet shapes without supplying tokens, customer rows, provider payloads, or unapproved mutation authority.

Execution Plan -> Keep this document source-only, require non-secret redacted inputs, forbid raw sensitive values, and validate that every live lane has a packet boundary before execution.

Coding Prompt -> Do not run live mutation from this document. Do not print or persist bearer tokens, raw customer/order/payment/provider/tracking payloads, raw IDs, raw DB rows, or screenshots. Use hashes, route names, booleans, status codes, and redacted IDs only.

Code -> scripts/verify-runtime-gate-packets.js, scripts/verify-w1w2-live-buyer-bound-proof.js, scripts/verify-w1w2-synthetic-cleanup-policy.js, package scripts verify:runtime-gate-packets, verify:w1w2-live-buyer-bound-proof, verify:w1w2-cleanup-policy, and this contract.

Validation -> npm run verify:w1w2-live-buyer-bound-proof; npm run verify:w1w2-cleanup-policy; npm run verify:runtime-gate-packets; git diff --check.

## Global Packet Rules

All runtime packets must include:

- packetId: stable non-secret label for the approved run.
- ownerApproval: human approval reference or explicit product decision.
- scope: exact lane and repositories affected.
- actor: non-secret actor hash or role evidence; never raw bearer token.
- target: redacted order/provider/channel target criteria; never raw customer/payment payload.
- idempotency: key policy and replay expectation.
- sideEffects: expected side effects and cleanup/no-cleanup decision.
- readback: exact post-action evidence boundary.
- redaction: statement that raw tokens, raw IDs, raw customer/payment/provider/tracking payloads, raw DB rows, screenshots, and secret values are forbidden.
- abortConditions: hard stops before execution.

A packet is not sufficient if it only says approved without target, actor, idempotency, side-effect, readback, and redaction rules.

## W1/W2 Live Synthetic Create Pay Warehouse Read Packet

Status: [RESOLVED: W1/W2 live buyer-bound synthetic lifecycle packet executed and verified].

Evidence:

- `reports/validation/VAL-W7-W1W2-live-buyer-bound-proof-2026-07-05.md`
- `reports/validation/lifecycle-mutation-smoke/VAL-W1W2-buyer-bound-runtime-proof-2026-07-05.json`
- `reports/validation/lifecycle-mutation-smoke/report-subject-bound-latest.json`
- `npm run verify:w1w2-live-buyer-bound-proof`

Resolved non-secret fields:

- Owner approval was supplied in-thread for the bounded synthetic run.
- Confirmation used buyer-bound create/pay/Warehouse/customer/admin readback semantics.
- Synthetic channel was `flipflop`; buyer subject, order id, product id, warehouse id, and actor are recorded only as hashes.
- Warehouse-owned stock row was selected with positive availability; max quantity was one item.
- Payment transition was internal Orders/Payments status only; no real provider money movement occurred.
- Warehouse fulfillment transition to collecting returned HTTP 200.
- Customer and admin lifecycle readback returned HTTP 200 and both saw `warehouse_collecting`.
- Token values, decoded JWT, raw order rows, raw customer output, provider payloads, screenshots, and raw IDs were not printed.
- Cleanup route/policy is source-defined in `docs/orchestrator/2026-07-06-w1w2-synthetic-cleanup-policy-packet.md`: [RESOLVED/NARROWED: cleanup route/policy for W1/W2 synthetic lifecycle rows is defined as fail-closed Orders-owned cleanup decision packet; live retention or cancellation remains blocked until current redacted readback and owner side-effect acknowledgements exist].

The resolved W1/W2 proof does not authorize replay, cleanup, provider calls, real payment movement, or future live mutation. Abort any future replay, cleanup, or retention decision unless a new packet names target hashes, actor, idempotency, side effects, current Orders/Warehouse readback, and redacted post-action boundary without raw sensitive output.

## W3-W5 Marketplace Row-Level Cabinet Packet

Status: [MISSING: approved buyer/admin bearer/session packets].

Required non-secret fields:

- Channel: allegro, bazos, aukro, heureka, or flipflop.
- Buyer/admin proof mode: API, browser, or service-scoped proxy.
- Approved bearer/session source path or handoff method with explicit no-print/no-decode/no-persist handling.
- Subject-bound ownership policy; email fallback is forbidden for buyer ownership proof.
- Target row criteria: central Orders id hash or external order hash, lifecycle stage expected, freshness threshold, and stale-row policy.
- Admin stats readback boundary when admin cabinet statistics are part of the claim.
- Evidence format: route/status booleans, rendered canonical lifecycle label or API lifecycle fields, hashes only.

Abort if no approved session exists, if only anonymous/public shell routes are available, if the row is stale and stale proof is not the objective, or if proof would expose raw customer/order data.

## W6B FlipFlop Route-To-Orders Admin Action Packet

Status: [MISSING: approved live action-admin session packet].

Required non-secret fields:

- Approved Auth-backed actor/session carrying global:superadmin or internal:orders-microservice:action-admin for Orders.
- Auth actor/role mapping from FlipFlop admin session to Orders action actor.
- Exact central Orders target id hash and local FlipFlop order correlation hash.
- Requested lifecycle status and whether it is a forward status or cancellation.
- Orders idempotency key and replay policy for channel action attempts.
- For cancellation: approval.approved=true, approval.approvalType=human, safe reasonCode, and sideEffectsHandled.payment|warehouse|notification|crm|channel=true acknowledgements.
- Response/readback contract for FlipFlop admin UI after central correction command.
- Fail-closed expectation when action-admin authority is absent.

Abort if the actor lacks action-admin authority, if payment/refund/provider correction is attempted through the status action, if cancellation side-effect acknowledgements are incomplete, or if FlipFlop would fall back to local Prisma lifecycle/payment writes.

## W8 Bazos Provider-Backed Proof Packet

Status: [MISSING: approved provider-backed non-secret fixture or live provider smoke packet] and [UNKNOWN: live Bazos marketplace webhook support].

Required non-secret fields:

- Product decision: Bazos provider-backed marketplace webhook/status support exists, does not exist, or is intentionally out of scope.
- Provider order item/status ingestion contract or explicit product decision that no such provider exists.
- Provider status transition sample with raw provider payload redacted.
- Item identity mapping from provider item to Catalog/Orders/Warehouse product identifiers.
- Warehouse-owned warehouseId for every provider-backed item.
- Approved non-secret fixture or live provider smoke packet.
- Orders lifecycle and buyer/admin readback boundary.

Abort if live provider support is unknown and no product decision exists, if item identity or Warehouse ownership is missing, or if the proof requires raw provider payload output.

## Warehouse Callback Runtime Packet

Status: [MISSING: approved Warehouse fulfillment runtime packet].

Required non-secret fields:

- Exact fulfillment target hash, current fulfillment status, and requested next status.
- Actor and reason code.
- Reference/idempotency policy.
- Rollback/no-rollback expectation.
- Orders lifecycle readback boundary and expected lifecycle/delivery fields.
- Stock/reservation side-effect expectation.

Abort if the target status is unknown, if the transition is destructive without owner approval, if cleanup expectations are missing, or if raw tracking/customer/provider values would be exposed.

## Current Decision

These packet contracts make the remaining work executable once approved facts exist. They do not authorize any live mutation, provider call, deploy, DB write, browser session capture, token output, raw customer/order/payment/provider/tracking output, or screenshot capture.
