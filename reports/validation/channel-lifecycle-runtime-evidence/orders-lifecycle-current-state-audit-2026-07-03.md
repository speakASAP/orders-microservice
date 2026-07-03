# Orders Lifecycle Current-State Audit

Date: 2026-07-03
Repository of record: `orders-microservice`
Scope: read-only continuation audit after the non-risky Allegro central-forwarded shipment evidence landed.

## Summary

The Orders lifecycle goal remains active, but the next work must not duplicate the Allegro central-forwarded shipment proof already recorded in commit `5aa9f3a`.

Current verified boundary:

- Orders `main` and `origin/main` are aligned on `5aa9f3a docs: record allegro central forwarded shipment readback`.
- Runtime deployments are ready for `allegro-service`, `orders-microservice`, `warehouse-microservice`, and `catalog-microservice`.
- Channel deployments are ready for FlipFlop, Allegro, Aukro, Bazos, and Heureka under their actual deployment names: `flipflop-frontend`/`flipflop-service`, `allegro-frontend`/`allegro-service`, `aukro-service`, `bazos-service`, `heureka-service`, and `heureka-api-gateway`.
- Public route smoke returned HTTP `200` for `flipflop.alfares.cz`, `heureka.alfares.cz`, `bazos.alfares.cz`, `aukro.alfares.cz`, and `allegro.alfares.cz`.
- Focused route smoke returned HTTP `200` for FlipFlop `/orders` and `/admin/orders`, Heureka `/api/health` and `/dashboard/orders`, Aukro `/dashboard`, Allegro `/api/health`, `/cabinet/orders`, and `/dashboard/orders`.
- Protected unauthenticated routes still fail closed where expected: Heureka `/heureka/dashboard/orders-list` returned HTTP `401`, Bazos `/orders` returned HTTP `401`, and Aukro `/aukro/ui/dashboard` returned HTTP `403`.
- Orders core verifiers passed: `verify:create-order-contract`, `verify:order-fulfillment-handoff`, `verify:order-lifecycle-read-model`, `verify:channel-lifecycle-runtime-evidence`, and `verify:completion-audit`.

No provider write, Warehouse mutation, Orders mutation, database row dump, token print, raw DOM dump, raw order id, raw tracking value, raw provider payload, or customer PII output was used for this audit.

## Requirement Mapping

| Requirement | Current evidence | Remaining proof boundary |
| --- | --- | --- |
| Inventory check/reservation on order creation | `verify:create-order-contract`, `verify:order-reservation-gate`, and runtime channel evidence remain the authoritative proof set. | Optional natural provider/channel proofs remain product-gated where bounded fixtures are insufficient. |
| Paid status triggers Warehouse fulfillment | `verify:order-fulfillment-handoff` passed and prior runtime evidence proves paid-to-Warehouse handoff. | Real carrier movement is still optional/product-gated until provider returns non-UNKNOWN movement. |
| Lifecycle read model feeds customer/admin views | `verify:order-lifecycle-read-model` and `verify:channel-lifecycle-runtime-evidence` passed; current route smoke confirms deployed surfaces are reachable or fail closed behind auth. | Direct human/browser proof is optional/product-gated where bounded/service-scoped proof is already accepted. |
| Allegro shipment status source | Commit `5aa9f3a` records one central-forwarded shipment candidate with source read available and hashed waybill present. | Provider status remains `UNKNOWN`; do not force Warehouse/Orders movement from this sample. |
| Cross-repo IPS and subagent orchestration | STATUS, IMPLEMENTATION_STATE, and validation artifacts record the child-lane outputs and current gates. | Keep this report and future status entries current as optional product-gated evidence closes. |

## Decision

Do not create or force-forward another central Orders record for the same Allegro proof lane. The safe next work is either a distinct product-approved natural proof, a bounded verifier/doc reconciliation, or a new non-overlapping runtime smoke with explicit owner approval.

Status: incomplete goal gates preserved.
