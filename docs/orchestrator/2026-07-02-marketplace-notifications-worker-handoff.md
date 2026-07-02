# Marketplace And Notifications Worker Handoff

Date: 2026-07-02

## Intent Chain

- Vision: every selling channel shows the canonical Orders lifecycle in customer cabinets and exposes aggregate admin delivery/order visibility without duplicating order truth.
- Goal Impact: marketplace workers produced validated branches; Bazos, Heureka, Allegro, Aukro, FlipFlop, the bounded Notifications lifecycle router, and the disabled-by-default Notifications RabbitMQ consumer were fast-forward merged to their remote `main` branches; the safe non-migration runtime wave then deployed Bazos, FlipFlop, and Notifications while confirming Heureka, Allegro, and Aukro already run their lifecycle commit-tag images.
- System: Orders remains order lifecycle source of truth; marketplace services remain channel/customer/admin UI owners; Notifications remains notification routing owner; its broker consumer is deployed but disabled until recipient and enablement are approved.
- Feature: branch-level customer-cabinet lifecycle validation, admin aggregate order/delivery statistics across the initial marketplace set, and source-level Orders events consumer wiring in Notifications.
- Task: collect worker branches, validation evidence, merge blockers, safe merge order, and then deploy only the non-migration runtime-safe services without mutating Orders/Warehouse production data.
- Execution Plan: fast-forward merge source-only branches where `origin/main` is an ancestor, push clean branches directly to remote `main` when local `main` contains unrelated unpublished work, then run live smoke only after Orders/Warehouse/Notifications runtime gates are approved.
- Coding Prompt: do not deploy, do not run migrations, do not read secrets, do not query production customer/order rows, and preserve `[MISSING: ...]` blockers.
- Code: coordinator documentation only in Orders for this integration pass.
- Validation: source branches are pushed and validation-backed; Bazos, Heureka, Allegro, Aukro, FlipFlop clean branch, Notifications lifecycle branch, and Notifications RabbitMQ consumer branch are now on remote `main`; safe runtime deployment evidence is recorded below.

## Branch Handoff Matrix

| Lane | Repo branch | Commit | Result | Validation evidence | Remaining blockers |
| --- | --- | --- | --- | --- | --- |
| Notifications | `notifications-microservice:main` | `583da28` | Fast-forwarded lifecycle router, disabled-by-default RabbitMQ consumer, non-secret RabbitMQ queue/DLQ config, and immutable-tag deploy hardening to remote `main` without unrelated local invoice commits; deployed with consumer disabled. | focused router+consumer specs 10 tests, `npm run build`, full `npm test -- --runInBand` 7 suites / 30 tests, `kubectl apply --dry-run=server -f k8s/configmap.yaml`, `git diff --check`. | `[MISSING: owner-approved production flip of ORDERS_EVENTS_CONSUMER_ENABLED from false to true after recipient config is present]`, `[MISSING: Production value for ORDERS_EVENTS_NOTIFICATION_RECIPIENT or approved channel-registry route]`. |
| FlipFlop | `flipflop:main` | `216264b` | Fast-forwarded the clean branch to remote `main` without the four unrelated local wallet commits; fixed admin dashboard recent-orders widget to use admin Orders API; customer/admin order pages already existed. | pre-coding gate, strict doc audit 100/100, `npm run verify:orders-hub-integration`, frontend build, `git diff --check`. | Worker-reported `[MISSING: Orders lifecycle read endpoint]`; live checkout/cabinet smoke still pending after Orders/Warehouse migration-gated runtime wave. |
| Heureka | `heureka:main` | `976a1a8` | Fast-forward merged to `main`; added aggregate central Orders lifecycle/delivery/reservation admin stats; customer lifecycle list already present. | dashboard/public self-tests, shared build, service build, order-ingestion verifier, runtime-readiness verifier, pre-coding gate, `git diff --check`. | Non-blocking validation debt `VD-002`: legacy validation docs path repair. |
| Allegro | `allegro:main` | `6c64a30` | Fast-forward merged to `main`; added read-only order statistics API and protected dashboard cards; customer cabinet already renders central lifecycle status. | shared order-client spec, service spec, shared build, service build, frontend build, `git diff --check`. | `[MISSING: shipment-management implementation]`; `[UNKNOWN: deployed Orders lifecycle field naming]` handled fail-soft in source. |
| Aukro | `aukro:main` | `ba61422` | Fast-forward merged to `main`; added admin-only aggregate lifecycle/payment/fulfillment/delivery stats; customer dashboard hydration already present. | UI focused spec, service tests, service build, strict doc audit 100/100, pre-coding gate, deployment readiness gate, `git diff --check`. | `[MISSING: ORDER_SYNTHETIC_SMOKE_TOKEN]`, `[MISSING: Orders lifecycle read contract authorized for aukro-service role]`, `[UNKNOWN: real Aukro webhook payload shape]`. |
| Bazos | `bazos:main` | `cdcd739` | Fast-forward merged to `main`; added delivery-state summary counts to client order view and admin stats; existing central Orders read model and guards verified. | shared order-client spec, service order spec, shared build, service build, `git diff --check`. | `[UNKNOWN: live Bazos marketplace webhook support]`, `[MISSING: Bazos order item ingestion contract]`, `[MISSING: Warehouse-owned warehouseId for Bazos order item]`, `[MISSING: provider-backed customer/admin order UI requirements beyond bounded synthetic/internal read model]`. |

## Merge Order

1. Completed: Bazos, Heureka, Allegro, Aukro, FlipFlop clean branch, Notifications lifecycle-event branch, Notifications RabbitMQ consumer branch, and Notifications non-secret RabbitMQ URL config fast-forwarded to remote `main` and pushed.
2. Deferred unrelated local work: FlipFlop local `main` still has four wallet commits not pushed to `origin/main`; Notifications local `main` still has two invoice commits not pushed to `origin/main`.
3. Runtime update: Bazos, FlipFlop, and Notifications were deployed in the safe non-migration wave; Heureka, Allegro, and Aukro were already on lifecycle commit-tag images. Orders outbox migration/deploy and Warehouse WH-G16 deploy remain first in the next migration-gated wave; Notifications live consumer enablement remains last after recipient/runtime approval.
4. Validation owner reruns live create/payment/fulfillment/cabinet/admin-stat smoke after Orders outbox and Warehouse WH-G16 runtime gates; safe marketplace/Notifications deployments are complete.

## Runtime Deployment Update

Safe deployment wave on 2026-07-02:

- Bazos deployed from `main` commit `cdcd739`; deployment ready `1/1` on `localhost:5000/bazos-service:cdcd739`; public root returned HTTP 200.
- FlipFlop deployed from a detached clean `origin/main` worktree at `216264b`, avoiding unrelated local wallet commits; service, frontend, product, cart, order, and user deployments are ready `1/1`; public root and `/api/products?limit=1` returned HTTP 200.
- Notifications deployed from `main` commit `583da28`; deployment ready `1/1` on `localhost:5000/notifications-microservice:583da28`; `/health/orders-events` returned HTTP 200 with consumer `enabled=false`, not connected, not consuming, DLX/DLQ configured, and zero counters.
- Heureka, Allegro, and Aukro were already ready `1/1` on lifecycle commit-tag images `976a1a8`, `6c64a30`, and `ba61422`; public root checks returned HTTP 200.

Remaining runtime gates:

- `[MISSING: owner approval for Orders event outbox migration/deploy and live /health/order-events readiness smoke.]`
- `[MISSING: owner approval for Warehouse WH-G16 deployment with database migration job.]`
- `[MISSING: live end-to-end paid order smoke after Orders outbox and Warehouse WH-G16 deployments.]`
- `[MISSING: Notifications production recipient route or ORDERS_EVENTS_NOTIFICATION_RECIPIENT plus owner-approved ORDERS_EVENTS_CONSUMER_ENABLED=true flip.]`

No Orders or Warehouse deployment/migration, secret value read, production customer/order row query, raw Warehouse response dump, or live notification send was run by the coordinator in this pass.
