# Orders Execution Plan

```yaml
id: ORDERS-EXECUTION-PLAN
status: active
owner: Orders owner
created: 2026-06-13
last_updated: 2026-07-01
selected_goal: Goal 7 - Production Order Integration Rollout
selected_chunk: 7.4A Orders lead-attribution event contract for Leads
pre_coding_gate: pass-with-exception
```

## Preserved Intent

Orders remains the canonical order lifecycle and event producer for supported sellable channels. Leads may consume bounded lifecycle signals and explicit attribution metadata, but Leads does not become order truth. Catalog remains product truth, Warehouse remains stock/reservation authority, Payments remains payment identity/reconciliation authority, Auth remains identity/RBAC authority, and Notifications/Marketing keep their own downstream responsibilities.

## Planned Changes

- Add an explicit optional `leadAttribution` object to the created-event payload contract with bounded optional fields: `leadId`, `source`, and `campaignId`.
- Accept the same optional `leadAttribution` object in `orders.create.v1` requests, reject unsupported nested attribution fields, and publish it only when at least one allowed value is supplied.
- Preserve backwards compatibility: create requests without attribution keep the existing event payload core shape and do not invent attribution from customer/contact/address/payment/channel payload data.
- Update the created-event fixture, event contract verifier, create-order contract verifier, and contract docs.
- Record `[MISSING: channel lead attribution source mapping]` because current Orders source has no approved channel mapping that can populate attribution automatically.
- Do not deploy automatically; hand off the source commit for coordinator review after validation.

## Invariant Review

- `ORD-INV-001` intent: preserved; Orders remains the event producer and order lifecycle source of truth.
- `ORD-INV-002` state-machine: unchanged; no status transition behavior changes.
- `ORD-INV-003` boundary: preserved; Orders exposes explicit attribution metadata only when supplied and does not implement Leads/CRM campaign processing.
- `ORD-INV-004` sensitive-data: preserved; the new field excludes customer/contact/address/payment data and no secrets, tokens, DB rows, decoded JWTs, or raw production data are read or recorded.
- `ORD-INV-005` contract: changed intentionally and backwards-compatibly for `orders.create.v1` input and `orders.order.created.v1` payload; existing consumers can ignore the optional field and events without attribution remain valid.
- `ORD-INV-007` evidence: status/state docs must record validation, deployment status, and next work.
- `ORD-INV-008` DocsRAG: pass-with-exception because `[MISSING: DocsRAG session JWT]`; repository source docs and owner delegation are compensating evidence for this bounded Orders-local producer contract.

## Sensitive Data Classification

Classification: `bounded attribution metadata only`.

The new optional field may carry only `leadId`, `source`, and `campaignId` supplied explicitly by an approved caller. Orders must not derive it from names, emails, phones, addresses, payment data, notes, tokens, JWTs, or production database rows.

## Contract Impact

- API payload: `POST /api/orders` accepts optional `leadAttribution` with `leadId`, `source`, and `campaignId`; unknown top-level fields and unknown nested attribution fields remain rejected.
- RabbitMQ event: `orders.order.created.v1` may include `payload.leadAttribution` with the same allowed fields when supplied.
- Backwards compatibility: existing create requests and created events without attribution remain valid; no event version bump is needed for the optional additive field.
- JWT/RBAC, state machine, Warehouse, Payments, Catalog, Notifications, and live consumer behavior: no change.
- CRM/Leads: unblocked to consume a stable optional field but still allowed to reject or skip events where the optional field is absent.

## Validation Plan

```bash
git diff --check
npm run build
npm run verify:create-order-contract
npm run verify:event-contracts
npm test
rg '\[(MISSING|UNKNOWN):' docs/IMPLEMENTATION_STATE.md docs/IMPLEMENTATION_ORCHESTRATOR.md docs/orchestrator implementation-goals AGENTS.md TASKS.md
rg -n 'Authorization: Bearer [A-Za-z0-9_./+=:-]{12,}|(access[_-]?token|client[_-]?secret|password|private[_-]?key|jwt[_-]?secret|db[_-]?password)\s*[:=]\s*["'"']?[A-Za-z0-9_./+=:-]{12,}' docs AGENTS.md TASKS.md implementation-goals
```

## Parallelization

This implementation thread is the single owner for Orders source edits in Goal 7.4A. Leads, Marketing, Notifications, channel mapping, and runtime consumer work remain separate lanes. No parallel Orders source writer should edit `src/orders/create-order.dto.ts`, `src/orders/order-event-contracts.ts`, `src/orders/order-events.service.ts`, `src/orders/orders.service.ts`, event fixtures, verifiers, or shared IPS docs until this lane hands off.

## Pre-Coding Gate Decision

Decision: `pass-with-exception`.

Exception: DocsRAG live query was unavailable because no session `JWT_TOKEN` was present. The plan uses repository source-of-truth docs, verified current producer source, and the explicit owner delegation as compensating evidence.
