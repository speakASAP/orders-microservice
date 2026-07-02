# Marketplace And Notifications Worker Handoff

Date: 2026-07-02

## Intent Chain

- Vision: every selling channel shows the canonical Orders lifecycle in customer cabinets and exposes aggregate admin delivery/order visibility without duplicating order truth.
- Goal Impact: marketplace workers produced validated branches; Bazos, Heureka, Allegro, and Aukro were fast-forward merged to `main`; FlipFlop was repackaged as a clean PR branch without unrelated local `main` commits; Notifications lifecycle routing remains on a separate integration branch.
- System: Orders remains order lifecycle source of truth; marketplace services remain channel/customer/admin UI owners; Notifications remains notification routing owner and still lacks approved live broker consumer runtime.
- Feature: branch-level customer-cabinet lifecycle validation plus admin aggregate order/delivery statistics across the initial marketplace set.
- Task: collect worker branches, validation evidence, merge blockers, and safe merge order without deploying or mutating production data.
- Execution Plan: fast-forward merge source-only marketplace branches where `main` is clean against `origin/main`, keep branches isolated when local `main` contains unrelated unpublished work, then run live smoke only after Orders/Warehouse/Notifications runtime gates are approved.
- Coding Prompt: do not deploy, do not run migrations, do not read secrets, do not query production customer/order rows, and preserve `[MISSING: ...]` blockers.
- Code: coordinator documentation only in Orders for this integration pass.
- Validation: source branches are pushed and validation-backed; Bazos, Heureka, Allegro, and Aukro were merged with `--ff-only`; FlipFlop clean branch validation passed; this report is documentation-only.

## Branch Handoff Matrix

| Lane | Repo branch | Commit | Result | Validation evidence | Remaining blockers |
| --- | --- | --- | --- | --- | --- |
| Notifications | `notifications-microservice:codex/notifications-orders-lifecycle-integration` | `a73df0b` | Integrated lifecycle branch with current invoice docs on a separate pushed branch; `main` left untouched because local `main` is ahead of `origin/main` with invoice commits. | focused router spec 6 tests, `npm run build`, full `npm test -- --runInBand` 7 suites / 32 tests, `git diff --check`. | `[MISSING: Notifications-owned RabbitMQ consumer module or approved transport dependency]`, `[MISSING: Notifications runtime RABBITMQ_URL or broker secret source]`, `[MISSING: Orders-events queue name, binding ownership, dead-letter/retry policy, and deployment owner]`, `[MISSING: Production value for ORDERS_EVENTS_NOTIFICATION_RECIPIENT or approved channel-registry route]`. |
| FlipFlop | `flipflop:codex/orders-lifecycle-cabinet-flipflop-clean` | `216264b` | Cherry-picked the worker fix onto `origin/main` without the four unrelated local wallet commits; fixed admin dashboard recent-orders widget to use admin Orders API; customer/admin order pages already existed. | pre-coding gate, strict doc audit 100/100, `npm run verify:orders-hub-integration`, frontend build, `git diff --check`. | Worker-reported `[MISSING: Orders lifecycle read endpoint]`; live checkout/cabinet smoke still pending after runtime deploy/health gate. |
| Heureka | `heureka:main` | `976a1a8` | Fast-forward merged to `main`; added aggregate central Orders lifecycle/delivery/reservation admin stats; customer lifecycle list already present. | dashboard/public self-tests, shared build, service build, order-ingestion verifier, runtime-readiness verifier, pre-coding gate, `git diff --check`. | Non-blocking validation debt `VD-002`: legacy validation docs path repair. |
| Allegro | `allegro:main` | `6c64a30` | Fast-forward merged to `main`; added read-only order statistics API and protected dashboard cards; customer cabinet already renders central lifecycle status. | shared order-client spec, service spec, shared build, service build, frontend build, `git diff --check`. | `[MISSING: shipment-management implementation]`; `[UNKNOWN: deployed Orders lifecycle field naming]` handled fail-soft in source. |
| Aukro | `aukro:main` | `ba61422` | Fast-forward merged to `main`; added admin-only aggregate lifecycle/payment/fulfillment/delivery stats; customer dashboard hydration already present. | UI focused spec, service tests, service build, strict doc audit 100/100, pre-coding gate, deployment readiness gate, `git diff --check`. | `[MISSING: ORDER_SYNTHETIC_SMOKE_TOKEN]`, `[MISSING: Orders lifecycle read contract authorized for aukro-service role]`, `[UNKNOWN: real Aukro webhook payload shape]`. |
| Bazos | `bazos:main` | `cdcd739` | Fast-forward merged to `main`; added delivery-state summary counts to client order view and admin stats; existing central Orders read model and guards verified. | shared order-client spec, service order spec, shared build, service build, `git diff --check`. | `[UNKNOWN: live Bazos marketplace webhook support]`, `[MISSING: Bazos order item ingestion contract]`, `[MISSING: Warehouse-owned warehouseId for Bazos order item]`, `[MISSING: provider-backed customer/admin order UI requirements beyond bounded synthetic/internal read model]`. |

## Merge Order

1. Completed: Bazos, Heureka, Allegro, and Aukro fast-forward merged to `main` and pushed.
2. Pending source merge: review/merge `flipflop:codex/orders-lifecycle-cabinet-flipflop-clean` after deciding how to handle the separate local FlipFlop wallet commits that remain only on local `main`.
3. Pending source merge: review/merge Notifications integration after deciding whether invoice commits on Notifications `main` should be pushed first or included in the same PR.
4. Deploy order: Orders outbox migration/deploy and Warehouse WH-G16 deploy first; then marketplace frontend/service deploys; Notifications live consumer last after queue/recipient/runtime contract approval.
5. Validation owner reruns live create/payment/fulfillment/cabinet/admin-stat smoke after runtime gates; no branch here is production-deployed yet.

## Runtime Gate

Bazos, Heureka, Allegro, and Aukro are source-merged but not production-deployed. FlipFlop clean branch and Notifications integration branch remain PR-ready. No deploy, migration, secret read, production customer/order row query, or live notification send was run by the coordinator in this pass.
