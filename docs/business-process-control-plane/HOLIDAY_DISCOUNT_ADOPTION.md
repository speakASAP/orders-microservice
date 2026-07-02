# BPCP Holiday Discount Adoption

Status: service-local adoption contract
Date: 2026-07-02
Service: `orders-microservice`
Central contract pack: `statex-ecosystem/docs/business-process-control-plane/`

## Role

Immutable order snapshot owner for applied discounts and order lifecycle events.

## Responsibilities

- Persist applied discount snapshots from authoritative checkout/pricing result.
- Emit lifecycle events carrying discount snapshot refs where contractually allowed.
- Never recalculate discount after order creation.

## Required interfaces

- `orders.applied-discounts.v1` snapshot.
- Existing order event contracts, rechecked before implementation.
- Idempotent order creation with discount snapshot.

## Boundaries

- This service must not become the global owner of BPCP process definitions.
- This service must fail closed on invalid or unknown BPCP process versions.
- This service must keep existing domain ownership and invariants.
- This service must expose or document dry-run behavior before live execution.
- This service must not overwrite existing service contracts without an
  explicit integration owner and validation owner.

## Holiday Discount pilot expectations

- Recognize `holiday-discount-2026` only through versioned BPCP contracts.
- Preserve `processId`, `processVersion`, and `policyId` in every relevant
  decision, event, snapshot, log, or rendered experience.
- Support rollback by respecting BPCP pause and retired states.
- Keep process display and process execution separate where applicable.

## Blockers and unknowns

- [MISSING: final discount snapshot field owner in current order model]
- [MISSING: current producer event contract recheck before consumer wiring]

## Validation evidence required before implementation is accepted

- Order fixture stores processId/version/policyId/amount.
- Invoice and notification consumers can read snapshot.
- Existing order event contract verifier passes.

## Parallel handoff

This adoption doc is safe for a focused service owner to implement in parallel
after the central BPCP schemas are accepted. The service owner must not edit
shared BPCP schemas directly; schema changes go through the BPCP integration
owner.
