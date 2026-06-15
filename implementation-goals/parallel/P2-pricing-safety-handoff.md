# P2 Pricing Suggestion Safety Handoff

```yaml
id: P2-PRICING-SAFETY-HANDOFF
status: review-complete
owner: parallel-agent-p2-pricing-safety
created: 2026-06-13
last_updated: 2026-06-13
completeness_level: review
upstream:
  - docs/orchestrator/INTENT.md
  - docs/orchestrator/GOALS.md
  - docs/orchestrator/PROJECT_INVARIANTS.md
  - implementation-goals/README.md
  - src/pricing/pricing.controller.ts
  - src/pricing/pricing.service.ts
  - src/pricing/price-suggestion.entity.ts
  - src/orders/order-events.service.ts
  - src/auth/jwt-roles.guard.ts
  - src/app.module.ts
downstream:
  - coordinator integration into docs/orchestrator/STATUS.md
related_adrs: []
```

## Lane

P2 Pricing suggestion safety review.

## Objective

Review Orders docs/source for Goal 6.1 and Goal 6.2 pricing suggestion safety. Confirm pricing suggestions remain human-approved, bounded, audit-safe, and separate from payment capture. Produce coordinator handoff only; no runtime pricing or payment behavior changes were made.

## IPS Trace

- Vision: Orders remains the canonical order lifecycle hub while preserving Catalog, Payments, Auth, Warehouse, Notifications, Leads, and Marketing ownership boundaries.
- Goal Impact: Goal 6 protects AI pricing suggestions from silent application and keeps product list-price updates separate from payment capture.
- System: `orders-microservice` owns the pricing suggestion workflow surface; Catalog remains product truth and Payments remains payment identity/capture/reconciliation owner.
- Feature: `/pricing/*` and `/admin/pricing/*` expose suggestion list, generate, approve, and reject flows.
- Task: Review Goal 6.1/6.2 behavior, approval boundary, 30 percent safety limit, audit evidence, event side effects, and payment separation.
- Execution Plan: Documentation-only remote review; inspect source/docs; write this handoff; run build if source inspection requires it; run sensitive literal scan on touched docs; run `git diff --check`.
- Coding Prompt: No runtime behavior changes. Allowed write set limited to `implementation-goals/parallel/P2-pricing-safety-handoff.md` unless a blocker requires a pricing safety note.
- Code: No runtime source changed.
- Validation: See Validation Evidence.

## Reviewed Sources

- `AGENTS.md`
- `docs/orchestrator/INTENT.md`
- `docs/orchestrator/GOALS.md`
- `docs/orchestrator/PROJECT_INVARIANTS.md`
- `docs/orchestrator/PLAN.md`
- `README.md`
- `SYSTEM.md`
- `BUSINESS.md`
- `TASKS.md`
- `src/pricing/pricing.controller.ts`
- `src/pricing/pricing.service.ts`
- `src/pricing/price-suggestion.entity.ts`
- `src/orders/order-events.service.ts`
- `src/auth/jwt-roles.guard.ts`
- `src/app.module.ts`
- `scripts/*verify*` index for existing coverage

DocsRAG query was attempted first as required by `AGENTS.md`, but no session token was available: `[MISSING: JWT_TOKEN unavailable; RAG query skipped]`.

## Findings

### Confirmed Safe Behaviors

- AI generation does not directly apply prices. `PricingService.generateSuggestions()` creates `PriceSuggestion` rows with `status: 'pending'` only.
- Approval is a separate endpoint. `approveSuggestion(id)` only proceeds when the row is still `pending`; already approved/rejected rows are rejected.
- The current hard safety bound is enforced at approval time. Absolute `changePercent` values above 30 are rejected with `BadRequestException` before any product update or pricing event publish.
- Invalid suggested prices are rejected. Non-finite or non-positive `suggestedPrice` values fail before the product update call.
- Rejection is non-mutating outside the suggestion row. `rejectSuggestion(id)` marks the suggestion `rejected` and does not update Catalog/product pricing or publish a price-changed event.
- Pricing work is separated from payment capture. The pricing code updates only product price via configured `PRODUCT_SERVICE_URL` or `CATALOG_SERVICE_URL`, publishes `pricing.price_changed`, and does not call Payments, create provider sessions, capture funds, mint variable symbols, reconcile transactions, or process refunds.
- Route authentication is present through the global `APP_GUARD`. Non-public routes require a bearer JWT and default roles of `global:superadmin` or `internal:${SERVICE_NAME}:admin`; pricing controller methods are not marked `@Public()`.
- Pricing audit entries are bounded operational metadata. Existing audit calls use operation/resource/status/outcome/duration fields and do not log raw AI responses, customer data, addresses, payment details, bearer tokens, or secrets.

### Risks And Gaps

- Pricing approval is role-gated only through the guard's default-role fallback, not explicit pricing method decorators. This is currently protected, but future changes to guard defaults could silently change who may generate, approve, or reject suggestions.
- Human approval is inferred from authenticated admin access, but the pricing approval audit does not capture a safe actor identity, `approvedBy`, or approval timestamp in the suggestion row. This is weaker than the order cancellation approval audit model.
- `PriceSuggestion` has no explicit `approvedAt`, `approvedBy`, `rejectedAt`, or `rejectedBy` fields. Audit logs record operation outcome, but durable row-level approval provenance is limited to status and timestamps.
- The Catalog/product update contract is implicit. `updateProductPrice()` tries `PATCH /admin/products/:productId` then `PUT /products/:productId` with `{ price }`; the target API, auth requirements, idempotency, and rollback behavior are not documented in a Goal 6 contract.
- `pricing.price_changed` is published as a plain object on `pricing.events`, not a documented versioned envelope. It includes product/pricing business data only, but consumer compatibility and allowed/forbidden fields are not yet captured in Goal 6 docs.
- AI rationale is prompted as one sentence but not length-capped by parser or entity. The AI input is product-level data only, so customer/payment leakage risk is low, but bounded rationale length/content should be part of the next hardening packet.
- No pricing-specific verifier exists in `package.json`. Existing `npm test` covers transitions, sensitive logging, create-order contract, idempotency, event contracts, warehouse handoff, payment boundary, and admin operations, but not the pricing 30 percent limit or approval provenance.

## Goal 6.1/6.2 Assessment

| Check | Result | Evidence |
| --- | --- | --- |
| Suggestions remain pending after AI generation | Pass | `generateSuggestions()` saves rows with `status: 'pending'`. |
| Approval/reject flow is separate from generation | Pass | Controller exposes separate `POST generate`, `PATCH approve`, and `PATCH reject` endpoints. |
| 30 percent approval safety limit exists | Pass | `approveSuggestion()` rejects `Math.abs(changePercent) > 30`. |
| Invalid prices are blocked | Pass | `approveSuggestion()` rejects non-finite or non-positive `suggestedPrice`. |
| Suggestions are not payment capture | Pass | Pricing code has no Payments calls or provider/payment capture logic. |
| Human approval is explicit and audit-safe | Partial | Endpoint is JWT role-protected by global guard, but no explicit `@Roles` or durable actor approval metadata is stored for pricing. |
| Pricing event contract is bounded and versioned | Partial | Event contains product/pricing business fields only, but lacks a documented versioned pricing event contract. |

## Proposed Next Coding Packet

Do not start without owner/coordinator approval because this changes protected pricing behavior/contracts.

Objective: Harden Goal 6 pricing approval safety without changing payment capture boundaries.

Scope:
- Add explicit `@Roles('global:superadmin', 'internal:orders-microservice:admin')` or a narrower action-capable pricing role to pricing generation/approval/rejection endpoints.
- Pass safe actor identity from `@Req()` into pricing approval/rejection service methods.
- Persist or otherwise durably record safe approval/rejection provenance, such as `approvedAt`, `approvedBy`, `rejectedAt`, and `rejectedBy`, without storing tokens or raw request bodies.
- Add a pricing safety verifier covering pending generation, approve under 30 percent, reject over 30 percent, invalid price rejection, duplicate approval rejection, reject path non-publication, and no payment-owned fields.
- Document the Catalog update contract and `pricing.price_changed.v1` payload, including allowed and forbidden fields.
- Add an AI rationale length/content cap if owner approves the schema/API impact.

Allowed files for the proposed packet should be assigned by the coordinator. Expected runtime files are likely `src/pricing/*`, `src/orders/order-events.service.ts` or a new pricing event contract file, `scripts/verify-pricing-safety.js`, `package.json`, and a Goal 6 docs note. Shared IPS state docs should remain coordinator-owned.

Forbidden outcomes:
- No payment provider sessions, capture, refunds, variable symbols, reconciliation, or provider webhook handling in Orders.
- No raw customer data, payment data, bearer tokens, JWTs, secrets, or raw AI/provider response bodies in logs/docs/events.
- No bypass of the 30 percent safety limit unless owner creates a separately approved high-impact pricing workflow.

## Parallel Execution Notes

- Workstream A, ready after owner approval: pricing endpoint/auth/audit hardening. Owns `src/pricing/*` and pricing verifier. Avoids shared IPS docs.
- Workstream B, ready after owner approval: pricing event and Catalog update contract documentation. Owns one new `docs/orchestrator/*PRICING*SAFETY*.md` or pricing contract doc. Does not edit runtime source.
- Workstream C, dependency-gated: event contract implementation changes, if Workstream B defines a new versioned `pricing.price_changed.v1` envelope and consumers accept it.
- Final integration: coordinator updates `docs/orchestrator/STATUS.md`, `docs/IMPLEMENTATION_STATE.md`, and `implementation-goals/README.md` after lane evidence is reviewed.
- Merge order: B contract docs, then A auth/audit/verifier, then C event implementation if still needed, then coordinator status integration.

## Validation Evidence

- DocsRAG query: skipped with [MISSING: JWT_TOKEN unavailable; RAG query skipped] because no session token was available.
- npm run build: pass.
- Sensitive literal scan on implementation-goals/parallel/P2-pricing-safety-handoff.md: pass; no matches.
- git diff --check: pass.

## Files Changed

- `implementation-goals/parallel/P2-pricing-safety-handoff.md`

No runtime source, manifests, package files, shared IPS state docs, or payment/capture behavior were changed by this lane.
