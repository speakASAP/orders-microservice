# Tracking Visibility Policy

Date: 2026-07-03

## Intent Chain

- Vision: buyers, support, admins, and marketplace cabinets must see reliable delivery progress without leaking raw courier/provider identifiers.
- Goal Impact: the remaining shipment visibility gate is closed for current product behavior by approving status-only display and forbidding raw tracking values in shared frontends, events, logs, and validation evidence.
- System: Orders owns canonical lifecycle and event contracts; Warehouse owns fulfillment status intake; Allegro/provider services own raw provider reads inside their boundary; channel frontends own buyer/admin rendering of bounded Orders read models.
- Feature: tracking visibility policy for customer/admin cabinets.
- Task: define what can be shown today and what remains blocked until a future audited reveal contract exists.
- Execution Plan: document product-approved status-only policy, enforce source markers with a verifier, and keep raw tracking number/URL out of Orders events and channel lifecycle surfaces.
- Coding Prompt: no runtime mutation, no provider read, no DB query, no raw tracking value, no raw provider payload, no customer PII, no deploy.
- Code: `docs/contracts/tracking-visibility-policy.md`, `scripts/verify-tracking-visibility-policy.js`, package script wiring.
- Validation: `npm run verify:tracking-visibility-policy`, existing event/lifecycle/shipment verifiers, and `git diff --check`.

## Product Decision

Current product-approved behavior is status-only shipment visibility.

Customer and admin cabinets may show:

- canonical `lifecycleStage`;
- canonical `deliveryStatus`;
- canonical `fulfillmentStatus`;
- `shipmentStatus` only as a bounded status name;
- `shipmentLookupRequired: true`;
- `trackingAvailable: true|false` when the value is derived without exposing a tracking number, waybill, direct courier URL, provider payload, customer address, or credential;
- aggregate delivery counts by bounded statuses.

Customer and admin cabinets must not show:

- raw tracking number;
- raw waybill;
- tracking URL or courier deep link;
- raw provider shipment id;
- raw provider response/payload;
- label/document/protocol URLs or binary references;
- customer name, email, phone, address, pickup point details, or free-text notes as part of tracking display;
- payment provider data or credentials;
- Warehouse reservation internals.

This policy applies to FlipFlop, Bazos/Basus, Heureka, Allegro, Aukro, and any later selling channel using the central Orders lifecycle read model.

## Role Matrix

| Reader | Approved current display | Full tracking value allowed now? | Notes |
| --- | --- | --- | --- |
| Buyer/customer | Lifecycle/delivery status and optional `trackingAvailable` boolean | No | Buyer ownership must use Auth subject/order ownership, not email-only matching. |
| Channel admin dashboard | Aggregate lifecycle/delivery counts and status labels | No | Admin aggregate pages must not expose raw courier identifiers. |
| Support/operator | Same status-only display as admin by default | No | Future reveal requires explicit audited API and product/security approval. |
| Warehouse service | Normalized status metadata only | No | Warehouse consumes provider-status snapshots and callbacks, not raw tracking display fields. |
| Notifications service | Bounded Orders lifecycle/shipped event fields only | No | Notifications must not receive tracking number/URL in Orders events. |
| Provider adapter owner | Raw values only inside provider boundary while processing | Yes, internal only | Raw values must not propagate to Orders events, logs, docs, validation artifacts, or broad DTOs. |

## Future Reveal Gate

Any future full tracking number or tracking URL display remains blocked until a new contract defines all of the following:

- exact reader roles allowed to reveal;
- Auth/RBAC scope and order ownership checks;
- explicit reveal action/audit record with actor id, order id, reason code, timestamp, and reveal count;
- masking rules before reveal;
- URL allowlist and redirect safety checks;
- retention/deletion rules for any value persisted outside provider owner;
- channel-specific UI wording;
- validation fixtures proving no accidental event/log/aggregate leakage.

Until that future contract lands, implementations must fail closed by rendering status-only shipment progress.

## Event And Validation Rules

Orders events may include `shipmentStatus` and `shipmentLookupRequired`, but not raw tracking values.

Validation reports may include booleans, counts, hashes, status names, and policy flags. They must not include raw tracking numbers, raw waybills, direct courier URLs, provider payloads, customer PII, credentials, raw DB rows, screenshots with sensitive details, or raw DOM dumps.

## Channel Adoption

Existing channel cabinet contracts already use bounded central Orders fields:

- FlipFlop: `lifecycleStage`, `paymentStatus`, `deliveryStatus`, `fulfillmentStatus`.
- Bazos/Basus: `lifecycleStage`, `paymentStatus`, `deliveryStatus`, `fulfillmentStatus`.
- Heureka: central lifecycle stats and delivery stats.
- Allegro: buyer/admin lifecycle fields from central Orders and sanitized shipment handoff evidence.
- Aukro: customer/admin lifecycle and delivery status aggregation.

Where a legacy channel stores a local `trackingNumber`, that local field is not approved for central customer/admin display by this policy.
