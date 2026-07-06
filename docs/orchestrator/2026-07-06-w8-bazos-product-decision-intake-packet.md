# W8 Bazos Product Decision Intake Packet

status: product_decision_intake_defined_waiting_owner_decision
created_at: 2026-07-06
repository: /home/ssf/Documents/Github/orders-microservice
bazos_repository: /home/ssf/Documents/Github/bazos
mutation: false
provider_call: false
deploy: false
raw_sensitive_output: forbidden

## Intent Preservation Chain

Vision -> Bazos order lifecycle claims must be reliable without inventing provider semantics.

Goal Impact -> W7 has an owner-signable W8 intake packet that can close the provider/product scope decision without live provider calls or source-contract invention.

System -> Orders owns W7 aggregation and central lifecycle acceptance. Bazos owns channel-local ingestion and UI projection. Product/provider owners own the decision whether Bazos has provider-backed marketplace lifecycle support and the non-secret evidence packet for it.

Feature -> W8 Bazos provider/product decision intake.

Task -> Define the exact allowed decision options, required non-secret evidence, abort conditions, and validation boundary for closing W8 beyond the current source/UI proof.

Execution Plan -> Add Orders docs/report/verifier only; do not edit Bazos source, call providers, mutate live orders, read databases, deploy, or expose raw identifiers.

Coding Prompt -> Preserve `[UNKNOWN: ...]` and `[MISSING: ...]`; do not claim provider-backed proof from bounded synthetic/internal evidence; do not output tokens, raw IDs, customer/payment/provider/tracking values, raw DOM, screenshots, or DB rows.

Code -> `docs/orchestrator/2026-07-06-w8-bazos-product-decision-intake-packet.md`, `reports/validation/VAL-W8-bazos-product-decision-intake-2026-07-06.md`, `scripts/verify-w8-bazos-product-decision-packet.js`, and package verifier wiring.

Validation -> `npm run verify:w8-bazos-product-decision-packet`; `npm run verify:w8-bazos-provider-current-gate`; `npm run verify:runtime-gate-packets`; `npm run verify:completion-audit`; `npm test`; `git diff --check`.

## Current Decision State

`[RESOLVED/NARROWED: W8 Bazos product decision intake packet is source-defined; real provider-backed Bazos lifecycle remains blocked until an owner selects one allowed decision option and supplies the required non-secret evidence]`.

This packet does not approve or perform live provider smoke. It does not decide whether provider-backed Bazos support exists. It only defines the owner-approved inputs needed to close the W8 product/provider scope.

## Allowed Decision Options

Exactly one option must be selected by the product/provider owner in a future packet:

1. `provider_backed_supported`: Bazos has provider-backed marketplace order lifecycle support and the owner supplies a non-secret provider/status evidence packet.
2. `provider_backed_not_supported`: Bazos has no provider-backed marketplace order lifecycle source; accepted scope is central Orders plus bounded synthetic/internal Bazos ingestion and UI projection.
3. `provider_backed_out_of_scope`: Provider-backed Bazos lifecycle is intentionally out of scope for the Unified Order Lifecycle Platform until a later product requirement changes it.
4. `bounded_synthetic_accepted_for_now`: Product accepts current bounded synthetic/internal Bazos proof for the current release, while provider-backed proof remains optional/product-gated.

Any other option is invalid.

## Required Common Fields

Every future decision packet must include:

- Decision option: one of the allowed values above.
- Decision owner: named product/provider owner or owner role.
- Decision date.
- Scope statement: whether buyer cabinet, admin statistics, Warehouse reservation, paid lifecycle, fulfillment handoff, and delivery lifecycle are in scope for Bazos.
- Evidence mode: `none_scope_decision`, `non_secret_fixture`, or `approved_live_smoke`.
- Redaction policy: no raw provider payload, token, cookie, customer, address, payment, tracking, order id, or DB row output.
- Rollback/no-cleanup expectation: no runtime mutation for scope-only decisions; explicit cleanup policy for any future approved live smoke.
- Orders readback boundary: how central lifecycle proof will be verified without raw sensitive output.

## Required Fields For `provider_backed_supported`

- Provider source name and integration type: webhook, poll, export, manual callback, or approved simulator.
- Auth boundary for provider events without raw token/cookie output.
- Provider order item/status ingestion contract.
- Provider status transition sample with raw provider payload redacted.
- Item identity mapping sample from provider listing/item/ad id to Catalog `productId` and Orders item snapshot.
- Warehouse-owned `warehouseId` source for every provider-backed item.
- Payment status mapping and whether paid state is provider-originated or Orders/Payments-originated.
- Fulfillment/delivery status mapping and whether Warehouse callback remains canonical.
- Approved non-secret fixture path or approved live provider smoke packet id.
- Buyer/admin readback assertion for Bazos surfaces through central Orders lifecycle fields.

## Required Fields For Scope-Only Decisions

For `provider_backed_not_supported`, `provider_backed_out_of_scope`, or `bounded_synthetic_accepted_for_now`, the packet must include:

- Explicit statement that no provider-backed Bazos lifecycle proof is claimed.
- Product acceptance that bounded synthetic/internal Bazos ingestion plus central Orders UI projection is sufficient for the stated scope.
- Remaining future gate, if any, for natural provider-backed Bazos evidence.
- Confirmation that no source code should invent provider adapters, webhook payloads, item mappings, or Warehouse `warehouseId` values.

## Current Missing Inputs

- `[UNKNOWN: live Bazos marketplace webhook support]`.
- `[MISSING: provider-backed Bazos order item/status ingestion contract]`.
- `[MISSING: provider-backed Bazos order status transition sample]`.
- `[MISSING: provider-backed Bazos order item identity mapping sample]`.
- `[MISSING: Warehouse-owned warehouseId for provider-backed Bazos order items]`.
- `[MISSING: approved provider-backed non-secret fixture or live provider smoke packet]`.
- `[MISSING: explicit product decision accepting bounded synthetic/internal Bazos scope or declaring provider-backed Bazos out of scope]`.

## Abort Conditions

Abort W8 closure if:

- The decision option is missing or not one of the allowed values.
- Provider-backed proof is claimed from synthetic/internal Bazos envelopes, source-only UI coverage, health checks, or central Orders read models over already stored rows.
- Item identity mapping or Warehouse-owned `warehouseId` is missing for a provider-backed-supported claim.
- A packet requires raw provider payload output, token/cookie output, raw order/customer/payment/tracking output, screenshots, DB rows, provider calls, live order mutation, Warehouse mutation, payment/refund action, deploy, or migration without a separate approved runtime packet.
- The packet weakens Auth subject binding, uses customer email as ownership proof, or bypasses central Orders lifecycle readback.

## Boundary

No Bazos source edit, provider call, deploy, DB read/write, live order mutation, Warehouse mutation, payment/refund action, browser session, token output, raw ID output, raw DOM, screenshot, or raw customer/payment/provider/tracking output occurred while creating this packet.

## Bazos Local Intake Evidence

[RESOLVED/NARROWED: Bazos local W8 product decision intake is pushed in bazos 1a41e73 and verified by Orders; provider-backed proof still requires exactly one owner-selected decision option]. Bazos local verifier: `npm run verify:bazos-product-decision-intake`; pushed commit: `1a41e73 docs: align W8 intake with orders gate`. Remaining blocker: `[MISSING: Bazos owner must select exactly one allowed product decision option]`.
