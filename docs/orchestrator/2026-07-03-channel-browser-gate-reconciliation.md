# Channel Browser Gate Reconciliation

Date: 2026-07-03
Repository of record: `orders-microservice`
Mode: read-only Browser-B gate reconciliation; no repo edits, deploys, DB reads, provider calls, credentials, browser sessions, lifecycle mutations, or screenshots.

## Intent Chain

- Vision: browser-render lifecycle proof should proceed from current route/runtime facts, not stale worker metadata.
- Goal Impact: per-channel browser gates now distinguish live route availability from exact deployed-source proof and authenticated rendered lifecycle proof.
- System: Orders remains lifecycle evidence owner; channel repositories remain out of edit scope.
- Feature: channel browser-smoke gate reconciliation.
- Task: consume Browser-B read-only findings and preserve exact blockers before more channel workers run.
- Execution Plan: record current source/deployed commit evidence, route status, and proof classification per channel.
- Coding Prompt: do not treat route availability as rendered lifecycle proof and do not edit channel repos.
- Code: documentation and completion-audit verifier marker only.
- Validation: Browser-B reported successful read-only checks plus `npm run verify:channel-lifecycle-surfaces`, `npm run verify:channel-lifecycle-runtime-evidence`, and structural `npm run verify:browser-render-proof-readiness`.

## Channel Findings

| Channel | Current source/deploy evidence | Routes checked | Browser proof classification |
| --- | --- | --- | --- |
| FlipFlop | Source `d940bef`; deployed images use mutable `latest`, so deployed source commit is `[UNKNOWN: mutable latest tag]`. Browser-A separately observed FlipFlop HEAD `8e2810b` during its preflight. | `/` 200, `/orders` 200, `/admin/orders` 200, `/health` 404, `/api/health` 404. | Dependency-gated on approved session/proxy; anonymous APIs return 401 and no lifecycle labels render. |
| Heureka | Source/deployed `358fba9`. | `/` 200, `/dashboard/orders` 200, `/api/health` 200, `/health` 200, `/api/heureka/dashboard/orders` 401. | Dependency-gated on approved dashboard/auth session. |
| Aukro | Source/deployed `08ad5ce`. | `/` 200, `/dashboard` 200, `/health` 200; guessed `/cabinet/orders`, `/admin/orders`, `/api/health`, `/ui/orders` returned 404. | Dependency-gated on approved cabinet/dashboard proof route. |
| Bazos | Source `1ccb93d`; deployed `9059605`, so deployed image is behind source. | `/` 200, `/admin` 200, `/client` 200, `/health` 200, `/ui/orders` 401, `/ui/orders?scope=admin` 401. | Blocked on provider-backed source plus authenticated smoke. |
| Allegro | Source `ae9d381`; deployed `4ff3987`, so deployed image is behind current source branch. | `/` 200, `/cabinet/orders` 200, `/dashboard/orders` 200, `/api/health` 200, `/health` 200, `/api/allegro/buyer/orders` 401, `/api/allegro/orders` 401. | Blocked on real buyer bearer plus subject-bound order row. |

## Remaining Blockers

- `[MISSING: merge-order review approval for FlipFlop browser validation lane.]`
- `[MISSING: approved safe human buyer/admin session source or explicitly approved service-scoped browser proxy proof.]`
- `[MISSING: rendered UI evidence after lifecycle mutation.]`
- `[MISSING: real subject-bound Allegro order row and buyer bearer.]`
- `[MISSING: provider-backed Bazos marketplace webhook/order source remains unknown.]`
- `[UNKNOWN: FlipFlop deployed commit because production uses mutable latest tags.]`

## Decision

The channel UI route layer is reachable where expected, but rendered lifecycle proof is still incomplete. Do not start channel source-edit work until proof-mode ownership is resolved and a validation-only browser proof fails for an implementation reason.
