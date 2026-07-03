# Channel Browser Gate Reconciliation

Date: 2026-07-03
Repository of record: `orders-microservice`
Mode: read-only channel deployment/browser-smoke reconciliation; no channel source edits, deploys, restarts, DB reads/writes, provider calls, credentials, browser sessions, lifecycle mutations, or raw DOM/screenshots.

## Intent Chain

- Vision: browser-render lifecycle proof should proceed from current route/runtime facts, not stale worker metadata.
- Goal Impact: per-channel browser gates now distinguish integrated source equivalence, deployed runtime status, route/API blockers, and authenticated rendered lifecycle proof blockers.
- System: Orders remains lifecycle evidence owner; channel repositories remain out of edit scope.
- Feature: channel browser-smoke gate reconciliation.
- Task: consume Runtime-Smoke-A and Merge-Gate-B read-only handoffs and preserve exact blockers before more channel workers run.
- Execution Plan: record current source/deployed commit evidence, route status, patch-equivalent commits, and proof classification per channel.
- Coding Prompt: do not treat route availability as rendered lifecycle proof and do not edit channel repos.
- Code: `reports/validation/channel-lifecycle-runtime-evidence/channel-deploy-browser-smoke-decision-current.json`, this document, completion-audit verifier markers, and status/state docs.
- Validation: Runtime-Smoke-A and Merge-Gate-B reported read-only checks; Orders validation reruns `verify:channel-lifecycle-surfaces`, `verify:channel-lifecycle-runtime-evidence`, `verify:browser-render-proof-readiness`, and `verify:completion-audit`.

## Channel Findings

| Channel | Current source/deploy evidence | Routes or proof checked | Browser proof classification |
| --- | --- | --- | --- |
| FlipFlop | `main` contains worker commit `3110c6a`; current source `327169a`; deployed images use mutable `latest`, so exact runtime commit remains `[UNKNOWN: mutable latest tag]`. | `/orders` 200, `/admin/orders` 200; proven service-scoped report `proven-flipflop-dd3765a.json`; anonymous direct proof artifact remains blocked by customer data-source 401. | Service-scoped proxy browser proof is proven for customer/admin `warehouse_collecting`; direct safe-human browser proof remains blocked by auth/session/profile gate and image provenance uncertainty. |
| Heureka | Source and runtime images are `358fba9`; `heureka-service` and `heureka-api-gateway` are ready 1/1. | Runtime health 200; public `/heureka/dashboard/orders` returns 404; prior redacted service-scoped artifact records `/heureka/dashboard/orders` and `/api/heureka/dashboard/orders` as 404 while admin stats/me APIs are 200. | Rendered orders proof remains blocked by unavailable dashboard orders route/API or missing approved alternative proof path. |
| Bazos | `main` contains worker commit `26af3ae`; current source `1ccb93d`; deployed `bazos-service:9059605` contains `26af3ae` as ancestor. | Source UI verifier passes; unauthenticated `/orders` and `/orders/webhook` return 401; provider-source artifact remains fail-closed with count 0/events 0. | Source UI is integrated, but provider-backed browser smoke is blocked until Bazos owns a real paid order ingestion and persisted item snapshot source. |
| Allegro | Worker commit `529a71d` is not on current `main`, but patch-equivalent commit `4ff3987` with patch-id `b7d9c16da34556d2efb30cff450259faaca6640b` is on main lineage; deployed Allegro images are `ae9d381`, ahead of the UI integration tag. | Buyer/admin routes and source verifier coverage exist; current runtime evidence classifies buyer route isolation as proven but real order central lifecycle as blocked. | Do not merge stale `529a71d`; browser/API smoke is blocked on real buyer Auth bearer plus approved subject-bound order row. |
| Aukro | Worker commit `f6502bb` is not on current branches, but patch-equivalent commit `08ad5ce` with patch-id `2907522d96786ebc8abcab86845cc78296702847` is on main lineage; deployed `aukro-service:68784d7` includes `08ad5ce`. | Source verifier coverage exists; protected cabinet/admin APIs are live, but current rows lack non-stale canonical lifecycle data. | Do not merge stale `f6502bb`; rendered proof is blocked until an approved live Aukro row links to a current canonical Orders lifecycle stage. |

## Remaining Blockers

- `[UNKNOWN: FlipFlop exact deployed commit because production uses mutable latest tags.]`
- `[MISSING: approved safe-human FlipFlop browser session if direct proof is required; service-scoped proof is already proven.]`
- `[MISSING: Heureka dashboard orders route/API fix or approved alternative proof path.]`
- `[MISSING: provider-backed Bazos paid order source and persisted item replay source.]`
- `[MISSING: real subject-bound Allegro order row and buyer bearer.]`
- `[MISSING: approved Aukro live order row linked to non-stale canonical Orders lifecycle stage.]`
- `[MISSING: shipment-status enablement/config/safe-smoke/readback/mutation approvals.]`

## Decision

Do not start new channel source-edit workers. Do not merge Allegro `529a71d` or Aukro `f6502bb` directly; use their patch-equivalent integrated commits. Next work should be proof/data/route unblocking, not another source edit loop.
