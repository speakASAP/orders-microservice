# Orders Orchestrator Status

## 2026-07-03 - Browser Proof Expected Stage Consistency Required

Intent chain:

- Vision: customer and admin lifecycle proof must show the same canonical Orders lifecycle stage after a mutation.
- Goal Impact: a future browser report can no longer pass with divergent customer/admin stages or a stage unrelated to the mutation evidence.
- System: Orders owns the proof contract and verifier; channel repos remain untouched.
- Feature: expected lifecycle stage consistency for browser reports.
- Task: require `mutationEvidence.expectedLifecycleStage` and enforce route stage equality for proven reports.
- Execution Plan: update verifier, contract, fixtures, and IPS docs; validate without runtime mutation.
- Coding Prompt: do not use credentials, browser sessions, provider calls, DB reads, lifecycle mutation, deploys, or channel repo edits.
- Code: `scripts/verify-browser-render-proof-report.js`, browser proof contract, fixtures, completion audit/status/state docs.
- Validation: `node --check scripts/verify-browser-render-proof-report.js`, `node scripts/verify-browser-render-proof-report.js`, `node --check scripts/verify-completion-audit.js`, `node scripts/verify-completion-audit.js`, `git diff --check`, and full `npm test` passed. No credentials, sessions, browser automation, DB reads, provider calls, lifecycle mutation, deploys, or channel repo edits were used.

Remaining gate:

- `[MISSING: approved safe human buyer/admin session or explicitly approved service-scoped browser proxy proof.]`
- `[MISSING: real sanitized orders.browser_render_proof.v1 report whose customer/admin rendered stages match mutationEvidence.expectedLifecycleStage.]`

## 2026-07-03 - Browser Proof Customer Admin Coverage Required

Intent chain:

- Vision: lifecycle status propagation is only complete when both customer-facing and administrator-facing surfaces render the Orders state.
- Goal Impact: a future `orders.browser_render_proof.v1` report can no longer pass `status=proven` with only one side of the UI.
- System: Orders owns the proof contract and verifier; channel repos remain untouched.
- Feature: customer plus admin browser proof coverage.
- Task: require customer and admin surfaces in browser proof reports and fixtures.
- Execution Plan: extend the report verifier, update the contract/fixture, record IPS status, and validate without runtime mutation.
- Coding Prompt: do not use credentials, browser sessions, provider calls, DB reads, lifecycle mutation, deploys, or channel repo edits.
- Code: `scripts/verify-browser-render-proof-report.js`, browser proof contract, valid fixture, completion audit/status/state docs.
- Validation: `node --check scripts/verify-browser-render-proof-report.js`, `node scripts/verify-browser-render-proof-report.js`, `node --check scripts/verify-completion-audit.js`, `node scripts/verify-completion-audit.js`, `git diff --check`, and full `npm test` passed. No credentials, sessions, browser automation, DB reads, provider calls, lifecycle mutation, deploys, or channel repo edits were used.

Remaining gate:

- `[MISSING: approved safe human buyer/admin session or explicitly approved service-scoped browser proxy proof.]`
- `[MISSING: real sanitized orders.browser_render_proof.v1 report covering customer and admin surfaces after lifecycle mutation.]`

+## 2026-07-03 - Browser Proof Public Shell Guard Added
+
+Intent chain:
+
+- Vision: rendered lifecycle proof must show authorized lifecycle data, not just public HTML shell availability.
+- Goal Impact: future browser reports cannot close the goal using anonymous routes or backing API `401`/`403` evidence.
+- System: Orders owns the proof report contract and verifier; channel repos remain untouched.
+- Feature: browser proof public-shell rejection guard.
+- Task: add a negative fixture and verifier checks for anonymous/public-shell evidence.
+- Execution Plan: extend `verify:browser-render-proof-report`, update the contract, record IPS status, and validate through targeted plus full Orders tests.
+- Coding Prompt: do not use credentials, sessions, browser automation, DB reads, provider calls, lifecycle mutation, deploys, or channel repo edits.
+- Code: `scripts/verify-browser-render-proof-report.js`, browser proof contract, negative fixture, completion audit/status/state docs.
+- Validation: `node --check scripts/verify-browser-render-proof-report.js`, `node scripts/verify-browser-render-proof-report.js`, `node --check scripts/verify-completion-audit.js`, `node scripts/verify-completion-audit.js`, `git diff --check`, and full `npm test` passed. No credentials, sessions, browser automation, DB reads, provider calls, lifecycle mutation, deploys, or channel repo edits were used.
+
+Remaining gate:
+
+- `[MISSING: approved safe human buyer/admin session or explicitly approved service-scoped browser proxy proof.]`
+- `[MISSING: real sanitized orders.browser_render_proof.v1 report after lifecycle mutation.]`
+
## 2026-07-03 - Channel Browser Gate Reconciliation Recorded

Intent chain:

- Vision: channel browser proof should use live route/deploy evidence instead of stale worker summaries.
- Goal Impact: current per-channel route status and deploy/source drift are now recorded before any new channel source-edit worker starts.
- System: Orders owns orchestration evidence; channel repos remained read-only.
- Feature: channel browser gate reconciliation.
- Task: consume Browser-B read-only findings for FlipFlop, Heureka, Aukro, Bazos, and Allegro.
- Execution Plan: record source/deployed commit evidence, route checks, and proof classification; preserve blockers.
- Coding Prompt: do not treat route availability as rendered lifecycle proof; do not deploy or edit channel repos.
- Code: `docs/orchestrator/2026-07-03-channel-browser-gate-reconciliation.md`, `docs/IMPLEMENTATION_STATE.md`, `docs/orchestrator/STATUS.md`, `docs/orchestrator/2026-07-03-orders-lifecycle-completion-audit.md`, and `scripts/verify-completion-audit.js`.
- Validation: Browser-B read-only checks completed; `npm run verify:channel-lifecycle-surfaces`, `npm run verify:channel-lifecycle-runtime-evidence`, and structural `npm run verify:browser-render-proof-readiness` passed.

Key findings:

- FlipFlop routes `/`, `/orders`, and `/admin/orders` returned HTTP `200`, but deployed source commit is `[UNKNOWN: mutable latest tag]`.
- Heureka source/deployed `358fba9` with `/dashboard/orders`, `/api/health`, and `/health` returning HTTP `200`.
- Aukro source/deployed `08ad5ce` with `/`, `/dashboard`, and `/health` returning HTTP `200`.
- Bazos source `1ccb93d` is ahead of deployed `9059605`; protected order UI/API routes returned HTTP `401`.
- Allegro source `ae9d381` is ahead of deployed `4ff3987`; buyer/order APIs returned HTTP `401`.

Remaining gate:

- `[MISSING: approved safe human buyer/admin session source or explicitly approved service-scoped browser proxy proof.]`
- `[MISSING: real subject-bound Allegro order row and buyer bearer.]`
- `[MISSING: provider-backed Bazos marketplace webhook/order source remains unknown.]`
- `[UNKNOWN: FlipFlop deployed commit because production uses mutable latest tags.]`

+## 2026-07-03 - Anonymous FlipFlop Browser Preflight Blocked
+
+Intent chain:
+
+- Vision: browser-render proof must reflect an authorized lifecycle view, not a public shell route.
+- Goal Impact: the first FlipFlop lane now has concrete evidence that anonymous rendering cannot prove customer/admin lifecycle propagation.
+- System: Orders owns the proof evidence and completion gate; FlipFlop remained read-only.
+- Feature: anonymous browser preflight blocker.
+- Task: consume Browser-A validation-only preflight without treating route availability as rendered lifecycle proof.
+- Execution Plan: record sanitized artifact hash, API authorization boundary, and empty-profile Chromium result.
+- Coding Prompt: keep the gate open until a safe human session or explicit service-scoped proxy proof mode exists.
+- Code: `docs/IMPLEMENTATION_STATE.md`, `docs/orchestrator/STATUS.md`, `docs/orchestrator/2026-07-03-orders-lifecycle-completion-audit.md`, and `scripts/verify-completion-audit.js`.
+- Validation: Browser-A produced sanitized artifact `/tmp/flipflop-browser-render-preflight-2026-07-03T09-34-31-524Z.json` with SHA-256 `450f71e08497c99f545176d97ce047ace28496f66e0b263b182570c781fc22eb`; anonymous `/api/orders` and `/api/admin/orders` returned HTTP `401`; empty-profile headless Chromium found no rendered lifecycle labels/stages. No repo edits, credentials, cookies, token output, screenshots, DB reads, provider calls, or lifecycle mutation were used by that preflight.
+
+Remaining gate:
+
+- `[MISSING: approved safe human buyer/admin session or explicitly approved service-scoped browser proxy proof.]`
+- `[MISSING: rendered customer/admin lifecycle proof submitted as sanitized orders.browser_render_proof.v1.]`
+
+## 2026-07-03 - FlipFlop Route Smoke Refreshed For Browser Gate
+
+Intent chain:
+
+- Vision: the first browser-render proof lane should start from fresh live route readiness, not stale route metadata.
+- Goal Impact: FlipFlop remains the first validation-only browser lane, with current `/orders` and `/admin/orders` availability confirmed.
+- System: Orders owns the evidence verifier and IPS state; FlipFlop remains read-only in this slice.
+- Feature: browser proof route readiness refresh.
+- Task: rerun the gated non-mutating route-smoke mode in `verify:browser-render-proof-readiness`.
+- Execution Plan: use explicit route-smoke environment gates, avoid sessions/mutations/provider/DB access, and record the current boundary.
+- Coding Prompt: do not claim rendered lifecycle proof from route availability; do not edit channel repos.
+- Code: `docs/IMPLEMENTATION_STATE.md`, `docs/orchestrator/STATUS.md`, `docs/orchestrator/2026-07-03-orders-lifecycle-completion-audit.md`, and `scripts/verify-completion-audit.js`.
+- Validation: `RUN_BROWSER_RENDER_PROOF_ROUTE_SMOKE=1 BROWSER_RENDER_PROOF_ROUTE_SMOKE_APPROVED=1 BROWSER_RENDER_PROOF_ROUTE_SMOKE_CONFIRM=ROUTE_STATUS_ONLY_NO_SESSION_NO_MUTATION node scripts/verify-browser-render-proof-readiness.js` returned HTTP `200` for `https://flipflop.alfares.cz/orders` and `https://flipflop.alfares.cz/admin/orders`; no browser session, lifecycle mutation, provider call, DB read, or token output was used.
+
+Remaining gate:
+
+- `[MISSING: rendered customer/admin UI lifecycle stage after approved mutation or approved existing mutation artifact.]`
+- `[MISSING: approved safe human buyer/admin session or explicitly approved service-scoped browser proxy proof.]`
+
## 2026-07-03 - FlipFlop Route Smoke Refreshed For Browser Gate

Intent chain:

- Vision: the first browser-render proof lane should start from fresh live route readiness, not stale route metadata.
- Goal Impact: FlipFlop remains the first validation-only browser lane, with current `/orders` and `/admin/orders` availability confirmed.
- System: Orders owns the evidence verifier and IPS state; FlipFlop remains read-only in this slice.
- Feature: browser proof route readiness refresh.
- Task: rerun the gated non-mutating route-smoke mode in `verify:browser-render-proof-readiness`.
- Execution Plan: use explicit route-smoke environment gates, avoid sessions/mutations/provider/DB access, and record the current boundary.
- Coding Prompt: do not claim rendered lifecycle proof from route availability; do not edit channel repos.
- Code: `docs/IMPLEMENTATION_STATE.md`, `docs/orchestrator/STATUS.md`, `docs/orchestrator/2026-07-03-orders-lifecycle-completion-audit.md`, and `scripts/verify-completion-audit.js`.
- Validation: `RUN_BROWSER_RENDER_PROOF_ROUTE_SMOKE=1 BROWSER_RENDER_PROOF_ROUTE_SMOKE_APPROVED=1 BROWSER_RENDER_PROOF_ROUTE_SMOKE_CONFIRM=ROUTE_STATUS_ONLY_NO_SESSION_NO_MUTATION node scripts/verify-browser-render-proof-readiness.js` returned HTTP `200` for `https://flipflop.alfares.cz/orders` and `https://flipflop.alfares.cz/admin/orders`; no browser session, lifecycle mutation, provider call, DB read, or token output was used.

Remaining gate:

- `[MISSING: rendered customer/admin UI lifecycle stage after approved mutation or approved existing mutation artifact.]`
- `[MISSING: approved safe human buyer/admin session or explicitly approved service-scoped browser proxy proof.]`

## 2026-07-03 - Channel Reservation Evidence Boundary Tightened

Intent chain:

- Vision: completion evidence should distinguish bounded live/synthetic channel reservation proof from still-missing real-provider proof.
- Goal Impact: the completion audit now records exact channel reservation classifications instead of the vague `uneven` boundary.
- System: Orders owns the completion audit and evidence verifier; channel repos remain read-only in this slice.
- Feature: channel reservation evidence boundary.
- Task: align the completion audit with `verify:channel-lifecycle-runtime-evidence` output for FlipFlop, Heureka, Aukro, Bazos, and Allegro.
- Execution Plan: update audit wording, add marker coverage to `verify:completion-audit`, and validate without runtime mutation.
- Coding Prompt: Orders-only docs/verifier change; do not claim real provider-backed Bazos or Allegro buyer completion.
- Code: `docs/orchestrator/2026-07-03-orders-lifecycle-completion-audit.md` and `scripts/verify-completion-audit.js`.
- Validation: `node --check scripts/verify-completion-audit.js`, `node scripts/verify-channel-lifecycle-runtime-evidence.js`, `node scripts/verify-completion-audit.js`, `git diff --check`, and full `npm test` passed. No runtime mutation, provider call, DB read, browser session, or token read was run.

Remaining gate:

- `[UNKNOWN: real provider-backed Bazos marketplace webhook/order source.]`
- `[MISSING: real subject-bound Allegro buyer/order proof before provider-backed create/reservation completion.]`

## 2026-07-03 - Completion Audit Browser Report Contract Linked

Intent chain:

- Vision: completion criteria should point at the same structured report contract that future rendered browser proof must satisfy.
- Goal Impact: the completion audit now names `orders.browser_render_proof.v1` and `verify:browser-render-proof-report` as the required acceptance path for customer/admin rendered lifecycle proof.
- System: Orders owns the completion audit and proof verifier; channel repos remain out of edit scope until approved validation finds a channel issue.
- Feature: completion audit browser proof acceptance contract.
- Task: link rendered browser proof completion gates to the checked browser report contract and fixtures.
- Execution Plan: update the completion audit, extend `verify:completion-audit`, and validate through targeted plus full tests.
- Coding Prompt: Orders-only docs/verifier change; keep fixtures classified as contract tests, not rendered proof.
- Code: `docs/orchestrator/2026-07-03-orders-lifecycle-completion-audit.md` and `scripts/verify-completion-audit.js`.
- Validation: `node --check scripts/verify-completion-audit.js`, `node scripts/verify-completion-audit.js`, `node scripts/verify-browser-render-proof-report.js`, `node scripts/verify-browser-render-proof-readiness.js`, `git diff --check`, and full `npm test` passed. Browser/session/provider proof remains gated and was not run.

Remaining gate:

- `[MISSING: real rendered customer/admin UI lifecycle stage after approved mutation or approved existing mutation artifact.]`
- `[MISSING: sanitized approved browser report supplied via BROWSER_RENDER_PROOF_REPORT_PATH.]`

## 2026-07-03 - Browser Render Proof Report Fixture Coverage Added

Intent chain:

- Vision: the browser proof report verifier should prove both its accept path and sensitive-data rejection path before a real report is supplied.
- Goal Impact: the report contract is now backed by sanitized positive and negative fixtures in the standard verifier.
- System: Orders owns the proof contract and fixture validation; no channel repo, browser session, provider call, DB read, token read, screenshot capture, or runtime mutation was used.
- Feature: browser render proof report fixture coverage.
- Task: add sanitized valid/invalid report fixtures and make `verify:browser-render-proof-report` validate both by default.
- Execution Plan: add fixture JSON files, extend the verifier with `validateFixtures()`, and run targeted plus full validation.
- Coding Prompt: keep fixtures synthetic and sanitized; do not treat fixtures as rendered lifecycle proof.
- Code: `docs/orchestrator/browser-render-proof-report-fixtures/*` and `scripts/verify-browser-render-proof-report.js`.
- Validation: `node --check scripts/verify-browser-render-proof-report.js`, default `node scripts/verify-browser-render-proof-report.js`, checked-in fixture path validation, `node scripts/verify-browser-render-proof-readiness.js`, `node scripts/verify-completion-audit.js`, `git diff --check`, and full `npm test` passed. Browser/session/provider proof remains gated and was not run.

Remaining gate:

- `[MISSING: approved safe buyer/admin session source or explicit service-scoped browser proxy proof for FlipFlop validation-only lane.]`
- `[MISSING: rendered customer/admin UI lifecycle stage after approved mutation or approved existing mutation artifact.]`

## 2026-07-03 - Browser Render Proof Report Contract Added

Intent chain:

- Vision: rendered lifecycle proof should be validated as sanitized structured evidence, not an ad hoc screenshot note.
- Goal Impact: the final browser-render gate now has a machine-checkable report contract that can validate an approved FlipFlop proof run.
- System: Orders owns the proof contract and verifier; channel repos remain out of edit scope until merge-order review.
- Feature: browser render proof report contract.
- Task: define the JSON report shape and add a default non-mutating verifier for future browser proof evidence.
- Execution Plan: add a contract document, add `verify:browser-render-proof-report`, and include it in `npm test` after readiness verification.
- Coding Prompt: Orders-only docs/verifier change; no browser session, provider call, DB read, token read, screenshot capture, or runtime mutation.
- Code: `docs/orchestrator/2026-07-03-browser-render-proof-report-contract.md`, `scripts/verify-browser-render-proof-report.js`, and `package.json`.
- Validation: `node --check scripts/verify-browser-render-proof-report.js`, default `node scripts/verify-browser-render-proof-report.js`, sanitized sample `BROWSER_RENDER_PROOF_REPORT_PATH=/tmp/orders-browser-proof-sample.json node scripts/verify-browser-render-proof-report.js`, `git diff --check`, and full `npm test` passed. Browser/session/provider proof remains gated and was not run.

Remaining gate:

- `[MISSING: approved safe buyer/admin session source or explicit service-scoped browser proxy proof for FlipFlop validation-only lane.]`
- `[MISSING: rendered customer/admin UI lifecycle stage after approved mutation or approved existing mutation artifact.]`

## 2026-07-03 - Completion Audit Baseline Hardened

Intent chain:

- Vision: completion status should stay tied to current repository state instead of a stale evidence commit literal.
- Goal Impact: `verify:completion-audit` now checks the FlipFlop first-lane readiness evidence and the audit uses repository `HEAD` as the authoritative current commit.
- System: Orders remains the evidence owner; no channel repo, runtime deployment, browser session, provider call, DB read, or order mutation was used.
- Feature: completion audit verifier coverage.
- Task: remove stale commit drift from the completion audit and add marker coverage for the FlipFlop readiness packet in the completion verifier.
- Execution Plan: update audit baseline wording, extend `scripts/verify-completion-audit.js`, and validate through targeted verifier plus full `npm test`.
- Coding Prompt: Orders-only docs/verifier change; do not weaken the incomplete-goal decision or close browser/provider gates without evidence.
- Code: `scripts/verify-completion-audit.js` and `docs/orchestrator/2026-07-03-orders-lifecycle-completion-audit.md`.
- Validation: `node --check scripts/verify-completion-audit.js`, `node scripts/verify-completion-audit.js`, `node scripts/verify-browser-render-proof-readiness.js`, `git diff --check`, and full `npm test` passed. Browser/session/provider route smoke remains gated and was not run.

Remaining gate:

- `[MISSING: rendered customer/admin UI lifecycle stage after approved mutation or approved existing mutation artifact.]`
- `[MISSING: Warehouse/Allegro shipment-status runtime enablement approvals.]`

## 2026-07-03 - FlipFlop Readiness Verifier Coverage Added

Intent chain:

- Vision: Orders evidence packets should be automatically checked so readiness claims do not drift as work continues.
- Goal Impact: the FlipFlop first-lane readiness packet is now part of the browser proof readiness verifier and full Orders test chain.
- System: Orders remains the evidence owner; no channel repository, runtime deployment, browser session, provider call, DB read, or order mutation was used.
- Feature: browser proof readiness verifier coverage.
- Task: extend `verify:browser-render-proof-readiness` to assert the FlipFlop readiness evidence packet and update stale audit commit references.
- Execution Plan: add marker checks for `docs/orchestrator/2026-07-03-flipflop-browser-proof-readiness-evidence.md`, refresh the completion audit evidence commit, and validate through targeted verifier plus full `npm test`.
- Coding Prompt: Orders-only docs/verifier change; keep rendered browser proof and proof-mode gates open.
- Code: `scripts/verify-browser-render-proof-readiness.js`, `docs/orchestrator/2026-07-03-orders-lifecycle-completion-audit.md`, and `docs/orchestrator/2026-07-03-flipflop-browser-proof-readiness-evidence.md`.
- Validation: `node --check scripts/verify-browser-render-proof-readiness.js`, `node scripts/verify-browser-render-proof-readiness.js`, `node scripts/verify-completion-audit.js`, `git diff --check`, and full `npm test` passed. Browser/session/provider route smoke remains gated and was not run.

Remaining gate:

- `[MISSING: approved safe buyer/admin session source or explicit service-scoped browser proxy proof for FlipFlop validation-only lane.]`
- `[MISSING: rendered customer/admin UI lifecycle stage after approved mutation or approved existing mutation artifact.]`

## 2026-07-03 - FlipFlop Browser Proof Readiness Evidence Recorded

Intent chain:

- Vision: the first rendered lifecycle proof should start only after route/source readiness is current and the proof mode is explicit.
- Goal Impact: FlipFlop is now confirmed ready for the first validation-only browser proof once a safe session or service-scoped proxy is approved.
- System: Orders remains the evidence owner; FlipFlop was inspected read-only and was not edited.
- Feature: FlipFlop browser proof readiness evidence.
- Task: gather non-mutating route/source evidence for the first browser lane without rerunning completed workers.
- Execution Plan: verify current Orders and FlipFlop commits, check live FlipFlop route HTTP status, inspect customer/admin pages and central lifecycle adapter source, record the remaining proof-mode gate.
- Coding Prompt: no channel repo edits, no browser session, no token output, no DB read, no provider call, no order mutation.
- Code: `docs/orchestrator/2026-07-03-flipflop-browser-proof-readiness-evidence.md`.
- Validation: live `curl` route checks for `/orders` and `/admin/orders` returned HTTP `200`; source inspection confirmed manual refresh plus 30-second visible polling and central Orders lifecycle mapping. Browser-render proof remains missing.

Readiness evidence:

- FlipFlop `main` is at `3110c6a feat: improve orders lifecycle UI reliability`.
- `https://flipflop.alfares.cz/orders` returned `200`, `content-type=text/html; charset=utf-8`, no redirect.
- `https://flipflop.alfares.cz/admin/orders` returned `200`, `content-type=text/html; charset=utf-8`, no redirect.
- Customer route reads `ordersApi.getOrders()`, renders central lifecycle display data, and refreshes via manual button plus `useVisiblePolling(..., 30000, isAuthenticated)`.
- Admin route reads `ordersApi.getAdminOrders(...)`, renders `Lifecycle`, payment, and delivery/fulfillment/exception status columns, and refreshes via manual button plus `useVisiblePolling(..., 30000, true)`.
- The frontend adapter prefers `centralOrder` when the central read status is available; the server client reads central Orders lifecycle through `/api/orders/:id/lifecycle` and `/api/orders/:id`.

Remaining gate:

- `[MISSING: approved safe buyer/admin session source or explicit service-scoped browser proxy proof for FlipFlop validation-only lane.]`
- `[MISSING: rendered customer/admin UI lifecycle stage after approved mutation or approved existing mutation artifact.]`

## 2026-07-03 - Channel Browser Smoke Order Recorded

Intent chain:

- Vision: customer/admin rendered lifecycle proof should proceed in a deliberate order that protects current deployments and avoids unrelated worker churn.
- Goal Impact: the next browser proof lane now has an explicit execution order and stop conditions.
- System: Orders remains the orchestration/evidence owner; channel repos remain edit-gated until validation proves a fix is needed and merge-order review approves it.
- Feature: channel browser-smoke execution order.
- Task: decide deploy/browser-smoke order for already integrated channel UI commits before any new worker thread.
- Execution Plan: FlipFlop validation-only first; Heureka and Aukro next; Bazos after provider-source decision; Allegro after real buyer proof; provider shipment-status after Warehouse/Allegro runtime approvals.
- Coding Prompt: no new source edit over the five channel UI repos; no provider runtime work; no raw token/customer/order/tracking/provider output.
- Code: `docs/orchestrator/2026-07-03-channel-browser-smoke-order.md`.
- Validation: `node --check scripts/verify-browser-render-proof-readiness.js`, `node scripts/verify-browser-render-proof-readiness.js`, `node scripts/verify-completion-audit.js`, `git diff --check`, and full `npm test` passed. Browser/session/provider route smoke remains gated and was not run in this docs-only reconciliation.

Decision:

- First lane: FlipFlop validation-only browser proof.
- Required approval: safe buyer/admin session source or explicit service-scoped browser proxy proof.
- Stop condition: if a fix would touch FlipFlop or shared contracts, stop and produce a channel-specific implementation prompt before editing.

Remaining gates:

- `[MISSING: proof-mode approval for FlipFlop browser validation lane.]`
- `[MISSING: rendered customer/admin UI evidence after Orders lifecycle mutation.]`
- `[MISSING: Bazos provider-source decision before provider-backed browser proof.]`
- `[MISSING: Allegro real subject-bound buyer row and bearer before buyer cabinet proof.]`
- `[MISSING: Warehouse/Allegro shipment-status runtime approvals before provider proof.]`

## 2026-07-03 - Child Lane Cleanup Reconciled

Intent chain:

- Vision: Orders orchestration state should consume child-lane cleanup output without rerunning completed workers or overwriting newer runtime evidence.
- Goal Impact: Frontend-A/B and provider/courier child results are now reconciled against current Orders evidence and remaining gates.
- System: Orders remains the IPS/evidence coordinator; channel and provider repos remain out of edit scope until merge-order review.
- Feature: child lane cleanup reconciliation.
- Task: integrate the cleanup update into Orders status before any new worker activity.
- Execution Plan: docs-only reconciliation; preserve child commit references; mark superseded lane-local deployment state; keep browser/provider runtime gates explicit.
- Coding Prompt: do not rerun completed worker loops, do not edit five channel UI repos, and do not start provider runtime integration until source capability and Warehouse ledger/correlation approvals are resolved.
- Code: `docs/orchestrator/2026-07-03-child-lane-cleanup-reconciliation.md`.
- Validation: `git diff --check`, `node scripts/verify-completion-audit.js`, and full `npm test` passed in the follow-up Orders verifier coverage runs. Browser/session/provider gates remain open.

Reconciled child results:

- Frontend-A: FlipFlop `3110c6a`, Heureka `358fba9`; source validation/builds passed; child handoff recorded no deploy and browser-smoke gate.
- Frontend-B: Allegro `529a71d`, Bazos `26af3ae`, Aukro `f6502bb`; source validation/builds passed; child handoff recorded no deploy/runtime browser-smoke gate.
- Current orchestrator evidence supersedes child `no deploy` notes for production state: FlipFlop `3110c6a`, Heureka `358fba9`, Bazos `26af3ae`, Aukro main `08ad5ce`, and Allegro main `4ff3987` are recorded as deployed/route-smoked.
- Provider/courier P3 Orders `5efa4c9` and Warehouse Worker F `f104202` are recorded as docs/source-only; raw tracking display and runtime provider integration remain blocked.

Remaining gates:

- `[MISSING: rendered customer/admin browser evidence after Orders lifecycle mutation.]`
- `[MISSING: safe buyer/admin session or explicit service-scoped browser proxy proof approval.]`
- `[MISSING: product-approved tracking visibility matrix before raw tracking display.]`
- `[MISSING: Allegro OAuth/scope/account permission, sanitized fixtures, Warehouse ledger/correlation, deploy/runtime smoke approval for provider runtime.]`

## 2026-07-03 - Completion Audit Recorded

Intent chain:

- Vision: goal completion must be decided from requirement-by-requirement evidence, not from partial progress.
- Goal Impact: the Orders lifecycle objective now has a current completion audit that separates proven backend/runtime evidence from missing browser/provider gates.
- System: Orders remains the evidence repository for orchestration state; channel/provider work remains gated by merge-order and owner approvals.
- Feature: Orders lifecycle completion audit.
- Task: document each explicit business requirement, current status, authoritative evidence, and missing completion evidence.
- Execution Plan: docs-only audit in Orders; no channel repo edits, deploys, browser sessions, provider calls, DB reads, or runtime mutations.
- Coding Prompt: preserve original scope and do not mark the goal complete while browser-render/provider gates are missing.
- Code: `docs/orchestrator/2026-07-03-orders-lifecycle-completion-audit.md`.
- Validation: `git diff --check`, `node scripts/verify-completion-audit.js`, and full `npm test` passed in the follow-up Orders verifier coverage runs. Active goal remains incomplete by design.

Audit result:

- `[PROVEN: bounded Orders/FlipFlop synthetic create -> Warehouse reservation -> paid -> Warehouse collecting -> customer/admin lifecycle read-model propagation.]`
- `[PROVEN: cross-channel source/deploy route readiness for lifecycle UI labels and refresh affordances.]`
- `[MISSING: rendered customer/admin UI evidence after lifecycle mutation.]`
- `[MISSING: real subject-bound Allegro buyer proof.]`
- `[UNKNOWN: provider-backed Bazos marketplace webhook/order source decision.]`
- `[MISSING: Warehouse/Allegro shipment-status runtime deployment/enablement/safe smoke approvals.]`

Decision: active goal remains incomplete.

## 2026-07-03 - Runtime Evidence Gates Reconciled

Intent chain:

- Vision: Orders lifecycle evidence reports should not keep stale deployment blockers after runtime proof exists.
- Goal Impact: the cross-channel runtime evidence verifier now separates proven Orders read-role/list endpoint deployment from still-missing rendered cabinet proof.
- System: Orders owns lifecycle read authorization and evidence reporting; channel frontends remain responsible for rendered browser/API cabinet proof after merge-order review.
- Feature: channel lifecycle runtime evidence gate reconciliation.
- Task: update `verify-channel-lifecycle-runtime-evidence` so it no longer reports Orders read-role deploy/restart as missing after the successful lifecycle list runtime probe.
- Execution Plan: adjust Orders verifier/report wording only; do not edit channel repos or shared contracts.
- Coding Prompt: preserve missing browser/provider gates and avoid claiming rendered UI proof.
- Code: `scripts/verify-channel-lifecycle-runtime-evidence.js`.
- Validation: `npm run verify:channel-lifecycle-runtime-evidence`, `npm run verify:browser-render-proof-readiness`, `npm test`, and `git diff --check` passed in the follow-up Orders verifier coverage runs. Rendered browser/provider gates remain open.

Current evidence boundary:

- `[PROVEN: Orders customer/admin lifecycle list endpoints return HTTP 200 for FlipFlop, Allegro, Aukro, Bazos, and Heureka service identities.]`
- `[MISSING: Aukro rendered central lifecycle cabinet hydration proof remains merge-order/browser-or-API-smoke gated.]`
- `[MISSING: approved authenticated customer/admin browser or API smoke per channel for real lifecycle refresh after status changes.]`
- `[MISSING: Warehouse/Allegro shipment-status deploy, migration, env enablement, and safe live smoke approvals.]`

## 2026-07-03 - Browser Render Proof Readiness Verifier Added

Intent chain:

- Vision: browser-render lifecycle proof should be repeatable and gated, not dependent on ad hoc cross-repo edits or unsafe session handling.
- Goal Impact: the remaining browser-render gate is now protected by an Orders regression verifier that preserves merge-order boundaries.
- System: Orders documents and verifies proof readiness; channel frontends remain out of scope until merge-order review approves a lane.
- Feature: browser-render proof readiness verifier.
- Task: add a default non-mutating verifier for the browser proof handoff, STATUS gates, lifecycle mutation smoke entrypoint, and FlipFlop-first lane recommendation.
- Execution Plan: keep the verifier static by default; require explicit env gates for optional route status smoke; add it to `npm test`.
- Coding Prompt: no browser session, token, DB, provider, or channel repo mutation in default verification.
- Code: `scripts/verify-browser-render-proof-readiness.js`, npm script `verify:browser-render-proof-readiness`, `npm test` chain update.
- Validation: `node scripts/verify-browser-render-proof-readiness.js` passed in default mode and reported route-smoke blockers instead of making network/browser/session assumptions.

Runtime/safety evidence:

- Default verifier output: `status=browser_render_proof_merge_order_gated`, `mutation=false`, `browserSessionUsed=false`, `providerCall=false`, `databaseRead=false`, `tokenValuesReadOrPrinted=false`.
- Verified handoff markers: 6; STATUS markers: 4; lifecycle mutation smoke script entrypoint present; recommended first lane: FlipFlop.
- Optional route status check remains gated by `RUN_BROWSER_RENDER_PROOF_ROUTE_SMOKE=1`, `BROWSER_RENDER_PROOF_ROUTE_SMOKE_APPROVED=1`, and `BROWSER_RENDER_PROOF_ROUTE_SMOKE_CONFIRM=ROUTE_STATUS_ONLY_NO_SESSION_NO_MUTATION`.

Remaining gates:

- `[MISSING: merge-order review approval for FlipFlop browser validation lane.]`
- `[MISSING: approved safe human buyer/admin session or explicitly approved service-scoped browser proxy proof.]`
- `[MISSING: rendered UI evidence after lifecycle mutation.]`
- `[MISSING: separate review before touching non-Orders repositories.]`

## 2026-07-03 - Browser Render Proof Handoff Recorded

Intent chain:

- Vision: customer and admin cabinets visibly reflect canonical Orders lifecycle mutations.
- Goal Impact: the next cross-repo/browser proof lane is now bounded by merge-order review instead of ad hoc channel edits.
- System: Orders remains lifecycle/read-model owner; channel frontends own rendering and refresh behavior.
- Feature: browser-render lifecycle proof handoff.
- Task: produce a validation-only handoff for proving browser-rendered lifecycle refresh after Orders mutation.
- Execution Plan: recommend FlipFlop first because the Orders runtime mutation proof already uses FlipFlop service scope and deployed FlipFlop customer/admin routes return HTTP `200`; do not edit non-Orders repos before review.
- Coding Prompt: keep Auth/Cliplot/Marketing/provider lanes out of this thread and do not print tokens, cookies, PII, raw order rows, DB rows, tracking values, or provider payloads.
- Code: `docs/orchestrator/2026-07-03-browser-render-proof-handoff.md`.
- Validation: documentation-only handoff, `git diff --check` pending commit.

Review request:

- Approve or adjust the proposed FlipFlop validation-only browser lane.
- Confirm allowed safe buyer/admin session source or approve service-scoped browser proxy proof if no human session is available.
- Keep Heureka, Aukro, Bazos, and Allegro browser lanes dependency-gated until FlipFlop proof and merge-order review are complete.
- Keep Allegro real-buyer and provider shipment-status runtime lanes separate unless explicitly combined by review.

Remaining gates:

- `[MISSING: merge-order review approval for FlipFlop browser validation lane.]`
- `[MISSING: approved safe human buyer/admin browser session or explicitly approved service-scoped browser proxy proof.]`
- `[MISSING: rendered UI evidence after lifecycle mutation.]`

## 2026-07-03 - Orders Lifecycle Mutation Propagation Smoke Passed

Intent chain:

- Vision: every lifecycle mutation in Orders should be visible through the same canonical customer/admin lifecycle read model used by channel cabinets.
- Goal Impact: Orders now has a repeatable, approval-gated live smoke proving create -> reservation -> paid -> Warehouse collecting -> customer/admin lifecycle read propagation for a sellable channel order.
- System: Orders remains lifecycle/read-model owner; Payments and Warehouse boundaries are exercised only through their existing internal service roles; channel scope is represented by the FlipFlop service identity.
- Feature: bounded lifecycle mutation propagation smoke.
- Task: add a non-default live smoke script, run one approved synthetic mutation, and record sanitized evidence.
- Execution Plan: keep default mode non-mutating; require explicit env gates for live mutation; create one synthetic FlipFlop order with Warehouse-owned product/warehouse IDs; mark it paid; apply Warehouse `collecting`; read customer/admin lifecycle; print only statuses, booleans, and short hashes.
- Coding Prompt: do not print tokens, raw order rows, customer payloads, DB rows, provider payloads, or tracking values.
- Code: `scripts/smoke-lifecycle-mutation-propagation.js`, npm script `smoke:lifecycle-mutation`.
- Validation: source-only gate preflight and one live synthetic mutation run passed.

Runtime evidence:

- Source-only command: `node scripts/smoke-lifecycle-mutation-propagation.js` returned approval blockers only, while confirming Orders deployment `1/1`, image `localhost:5000/orders-microservice:a12b40e`, `WAREHOUSE_RESERVATION_ENABLED=true`, and required internal token env presence without printing values.
- Live command: `RUN_LIVE_LIFECYCLE_MUTATION_SMOKE=1 LIFECYCLE_MUTATION_SMOKE_APPROVAL_ID=user-go-ahead-2026-07-03 LIFECYCLE_MUTATION_SMOKE_CONFIRM=CREATE_PAY_WAREHOUSE_READ node scripts/smoke-lifecycle-mutation-propagation.js` returned `ok=true`.
- Live assertions: create HTTP `201`, initial Warehouse reservation true, payment update HTTP `200`, Warehouse fulfillment status update HTTP `200`, customer lifecycle HTTP `200`, admin lifecycle HTTP `200`, customer saw `warehouse_collecting`, admin saw `warehouse_collecting`, customer scoped count positive, admin aggregate stage count positive.
- Sanitization: output included only HTTP statuses, booleans, and short hashes; no token values, customer payloads, raw order rows, DB rows, tracking values, or provider payloads were printed.

Remaining gates:

- `[PROVEN: Orders runtime mutation-to-read-model propagation for one synthetic FlipFlop-channel sellable order using existing internal Payments/Warehouse/channel boundaries.]`
- `[MISSING: browser-render proof with a real safe human buyer/admin session showing cabinet UI refresh after lifecycle mutation.]`
- `[MISSING: repeat this style of mutation proof for other channels only after orchestrator merge-order review, because non-Orders repo edits are currently out of scope for this master thread.]`
- `[MISSING: Warehouse/Allegro shipment-status runtime enablement approvals before provider-driven late lifecycle stages can be proven end to end.]`

## 2026-07-03 - Channel Lifecycle UI Refresh Deployed

Intent chain:

- Vision: customer and admin cabinets across the selling channels should display central Orders lifecycle consistently and refresh visibly after lifecycle changes.
- Goal Impact: FlipFlop, Heureka, Bazos, Aukro, and Allegro have source-verified full lifecycle label coverage plus deployed customer/admin order surfaces or dashboards.
- System: Orders remains lifecycle/read-model owner; channel services own local customer/admin UI refresh and presentation.
- Feature: channel lifecycle UI reliability refresh.
- Task: add or verify all 13 central lifecycle labels and visible refresh affordances across the five commerce channels, then deploy and smoke route availability.
- Execution Plan: use disjoint frontend workers for FlipFlop/Heureka and Allegro/Bazos/Aukro; validate source/builds; fast-forward only safe main integrations; deploy each channel; smoke public/protected routes without printing token values or order rows.
- Coding Prompt: keep raw provider/customer/order-row data out of validation output and do not move lifecycle ownership into channel services.
- Code: FlipFlop `3110c6a`, Heureka `358fba9`, Bazos `26af3ae`, Aukro main integration `08ad5ce`, Allegro main integration `4ff3987`.
- Validation: per-repo lifecycle UI verifiers/builds, deploy rollouts, Kubernetes image/readiness checks, and HTTP route smokes.

Runtime evidence:

- FlipFlop: `npm run verify:orders-lifecycle-ui` passed with 13 stages across customer/admin list/detail surfaces; `services/frontend` build passed; deploy completed for `flipflop-frontend`, `flipflop-service`, `flipflop-order-service`, product/cart/user services; route smokes returned HTTP `200` for `/orders` and `/admin/orders`.
- Heureka: public dashboard route self-test, `verify:heureka-orders-runtime-readiness`, and service build passed; deploy completed on images `localhost:5000/heureka-service:358fba9` and `localhost:5000/heureka-api-gateway:358fba9`; route smokes returned HTTP `200` for `/api/health` and `/dashboard/orders`.
- Bazos: `scripts/verify-orders-lifecycle-ui.js` and service build passed; deploy completed on image `localhost:5000/bazos-service:26af3ae`; route smokes returned HTTP `200` for `/` and HTTP `401` for protected `/orders`.
- Aukro: `scripts/verify-orders-lifecycle-ui.js`, focused UI controller spec with Node compiler options, and service build passed; main integration `08ad5ce` was pushed and deployed on image `localhost:5000/aukro-service:08ad5ce`; route smokes returned HTTP `200` for `/` and `/dashboard`.
- Allegro: UI commit `529a71d` was cherry-picked safely onto current `origin/main` as `4ff3987` to avoid reverting shipment-correlation work; lifecycle verifier and frontend build passed; deploy completed for service/api-gateway/frontend/settings/imports on image tag `4ff3987`; route smokes returned HTTP `200` for `/api/health`, `/cabinet/orders`, and `/dashboard/orders`.
- Final Kubernetes readiness check showed all listed channel deployments at ready/updated/available `1/1`; no token values, customer payloads, DB rows, order rows, tracking values, or provider payloads were printed.

Remaining gates:

- `[PROVEN: source and deployed route coverage for lifecycle labels/visible refresh across FlipFlop, Heureka, Bazos, Aukro, and Allegro.]`
- `[MISSING: authenticated buyer/admin browser smoke with real safe users proving rendered order rows refresh after an actual lifecycle mutation.]`
- `[MISSING: real subject-bound Allegro buyer order row and buyer bearer before Allegro buyer cabinet lifecycle can be called live-complete.]`
- `[MISSING: Warehouse/Allegro shipment-status runtime enablement approvals before provider-driven late lifecycle stages can be proven end to end.]`
- `[UNKNOWN: provider-backed Bazos marketplace webhook/order source.]`

## 2026-07-03 - Lifecycle List Runtime Query Stabilized

Intent chain:

- Vision: every selling channel can reliably hydrate central Orders lifecycle lists for customer/admin cabinets without query-shape runtime failures.
- Goal Impact: the deployed Orders lifecycle list endpoints now return successful bounded read models for FlipFlop, Allegro, Aukro, Bazos, and Heureka service identities.
- System: Orders owns lifecycle read models and authorization; channel services own display and subject scoping.
- Feature: runtime-safe lifecycle list query ordering.
- Task: fix the TypeORM/Postgres ordering alias used by `GET /api/orders/customer/lifecycle` and `GET /api/orders/admin/lifecycle`.
- Execution Plan: patch the Orders query builder in the isolated remote worktree, extend verifier source assertions, run the full standard test chain, deploy the committed image, and run a pod-local redacted service-identity probe.
- Coding Prompt: keep lifecycle filtering and ordering by `COALESCE(orders.orderedAt, orders.createdAt)` while using a SQL-safe selected alias for `ORDER BY`.
- Code: `src/orders/orders.service.ts` uses `order_sort_at`; `scripts/verify-order-lifecycle-read-model.js` asserts the SQL-safe alias contract.
- Validation: `npm test`, `git diff --check`, commit `a12b40e`, `./scripts/deploy.sh a12b40e`, rollout health check, and pod-local redacted lifecycle list probe.

Runtime evidence:

- k3s node `alfares` was `Ready`; Orders, Warehouse, Allegro, Notifications, FlipFlop, Bazos, Heureka, and Aukro deployments were all `1/1` ready before runtime probing.
- Deployed image: `localhost:5000/orders-microservice:a12b40e`; `/health` returned `status=healthy` from the new pod.
- The first post-`12b61a4` admin list probe failed with `QueryFailedError: column "ordersortat" does not exist`, proving the remaining defect was SQL alias casing, not authorization.
- The final pod-local probe used `x-service-name` plus `x-internal-service-token`; it did not print token values, order rows, customer fields, DB rows, provider payloads, or Warehouse data.
- `GET /api/orders/customer/lifecycle?limit=1` returned HTTP `200`, `success=true`, `count=0`, and `ordersLength=0` for `flipflop-service`, `allegro-service`, `aukro-service`, `bazos-service`, and `heureka-service`.
- `GET /api/orders/admin/lifecycle?limit=1` returned HTTP `200`, `success=true`, `count=1`, `ordersLength=1`, and aggregate keys `byChannel`, `byDeliveryStatus`, `byLifecycleStage`, `byPaymentStatus`, `exceptionCounts`, `totalOrders`, and `totalsByCurrency` for all five service identities.

Remaining gates:

- `[PROVEN: Orders deployed image localhost:5000/orders-microservice:a12b40e serves customer/admin lifecycle list endpoints with HTTP 200 for FlipFlop, Allegro, Aukro, Bazos, and Heureka service identities.]`
- `[MISSING: approved authenticated customer/admin browser smoke per channel proving visible lifecycle refresh in each cabinet UI.]`
- `[MISSING: real subject-bound Allegro order row and buyer bearer before Allegro buyer lifecycle can be called live-complete.]`
- `[MISSING: Warehouse/Allegro shipment-status deploy, migration, env enablement, and safe live smoke approvals before provider-driven late lifecycle stages can be proven end to end.]`
- `[UNKNOWN: provider-backed Bazos marketplace webhook/order source.]`

## 2026-07-03 - Channel Lifecycle Read Role Alignment

Intent chain:

- Vision: every selling channel can hydrate customer/admin order surfaces from central Orders lifecycle without becoming lifecycle owner.
- Goal Impact: FlipFlop, Bazos, Heureka, Allegro, and Aukro service identities now share the same bounded Orders lifecycle/detail read role set.
- System: Orders owns lifecycle read authorization; channel services own customer/admin display and subject scoping.
- Feature: channel service lifecycle read role alignment.
- Task: align `GET /api/orders/:id`, `GET /api/orders/customer/lifecycle`, and `GET /api/orders/admin/lifecycle` role sets for the selling-channel service clients.
- Execution Plan: source/test/docs first, then deploy the committed Orders image and run a pod-local non-data auth-boundary probe; no token values, DB rows, provider calls, Warehouse calls, order callbacks, customer data, or order rows are printed.
- Coding Prompt: authorize service-to-service lifecycle hydration for known selling channels while keeping human customer auth separate.
- Code: `ORDER_CHANNEL_LIFECYCLE_READ_ROLES` in `src/orders/orders.controller.ts`.
- Validation: `npm test`, `git diff --check`, deploy `./scripts/deploy.sh abf4773`, rollout health check, and pod-local channel lifecycle read-role probe.


Runtime evidence:

- Deployed from clean Orders worktree commit `abf4773` with `./scripts/deploy.sh abf4773`.
- Kubernetes rollout completed and `/health` returned `{"status":"healthy","service":"orders-microservice"}` from the new pod.
- Live image after rollout: `localhost:5000/orders-microservice:abf4773` with `1/1` ready replicas.
- Pod-local non-data role probe used synthetic missing UUID `00000000-0000-4000-8000-000000000000` and did not print token values or order rows.
- Probe results: `flipflop-service`, `allegro-service`, `aukro-service`, `bazos-service`, and `heureka-service` all had their configured token env present and returned HTTP `404` from `GET /api/orders/:id`, proving the request passed auth/role enforcement and failed only at the expected missing-order boundary.

Remaining gates:

- `[PROVEN: Orders deployed image localhost:5000/orders-microservice:abf4773 and live role-boundary probe returned HTTP 404, not 401/403, for FlipFlop, Allegro, Aukro, Bazos, and Heureka service identities against a synthetic missing UUID.]`
- `[MISSING: approved authenticated customer/admin browser or API smoke per channel proving lifecycle refresh.]`
- `[MISSING: real subject-bound Allegro order row and buyer bearer.]`
- `[UNKNOWN: provider-backed Bazos marketplace webhook/order source.]`

## 2026-07-03 - Cross-Channel Runtime Lifecycle Evidence Preflight

Intent chain:

- Vision: every commerce customer/admin surface should show central Orders lifecycle from real runtime evidence, not only source markers.
- Goal Impact: Orders orchestration now has machine-readable evidence levels for FlipFlop, Bazos, Heureka, Allegro, and Aukro runtime lifecycle/create/cabinet proof.
- System: Orders owns the cross-channel evidence preflight; channel services own their local smoke artifacts and live customer/admin surfaces.
- Feature: channel lifecycle runtime evidence verifier.
- Task: verify existing sanitized runtime artifacts and preserve exact remaining live buyer/provider/browser gates.
- Execution Plan: read validation artifacts only; no browser automation, secret read, DB read, provider call, Warehouse call, Orders callback, deploy, or runtime mutation.
- Coding Prompt: distinguish live synthetic create/reservation proof from real buyer/provider lifecycle proof; do not collapse partial evidence into complete status.
- Code: `scripts/verify-channel-lifecycle-runtime-evidence.js` plus `verify:channel-lifecycle-runtime-evidence`.
- Validation: `npm run verify:channel-lifecycle-runtime-evidence`; the standard `npm test` chain now enforces this verifier.

Evidence classes:

- FlipFlop: live approved create/reservation smoke evidence is present.
- Bazos: approved synthetic create/reservation smoke and customer/admin source-cabinet report are present; provider-backed webhook remains unknown.
- Heureka: final live create/replay/readback/reservation/cleanup smoke evidence is present.
- Allegro: live route/API isolation evidence is present; real subject-bound buyer order lifecycle smoke remains missing.
- Aukro: approved synthetic live create/reservation/cleanup proof is present; Orders read-role deploy/list endpoints are now proven, while rendered cabinet hydration proof remains merge-order/browser-or-API-smoke gated.

Remaining gates:

- `[MISSING: approved authenticated customer/admin browser or API smoke per channel for real lifecycle refresh after status changes.]`
- `[MISSING: real subject-bound Allegro order row and buyer bearer before Allegro cabinet lifecycle can be called live-complete.]`
- `[PROVEN: Orders read-role deployment/list endpoint runtime acceptance for Aukro service identity is covered by the lifecycle list probe.]`
- `[MISSING: Aukro rendered central lifecycle cabinet hydration proof remains merge-order/browser-or-API-smoke gated.]`
- `[MISSING: Warehouse/Allegro shipment-status deploy, migration, env enablement, and safe live smoke approvals.]`
- `[UNKNOWN: provider-backed Bazos marketplace webhook/order source.]`

## 2026-07-03 - Cross-Channel Lifecycle Surface Verifier

Intent chain:

- Vision: every commerce customer/admin surface should display the central Orders lifecycle instead of silently falling back to local-only order status.
- Goal Impact: Orders orchestration now has executable source evidence for FlipFlop, Bazos, Heureka, Allegro, and Aukro lifecycle propagation surfaces.
- System: Orders owns the cross-channel verification gate; each channel owns its local customer/admin UI and central Orders hydration client.
- Feature: channel lifecycle surface source verifier.
- Task: verify customer/admin lifecycle markers, payment/fulfillment/delivery fields, central lifecycle hydration, and stale/missing central-order states across the initial commerce channels.
- Execution Plan: source verifier and IPS docs only; no browser automation, deploy, DB read/write, provider call, Warehouse call, Orders callback, or runtime status mutation.
- Coding Prompt: fail fast if a channel drops central lifecycle surface markers; keep live smoke gates explicit.
- Code: `scripts/verify-channel-lifecycle-surfaces.js` plus `verify:channel-lifecycle-surfaces`.
- Validation: `npm run verify:channel-lifecycle-surfaces`, `npm run verify:shipment-runtime-readiness`, and `git diff --check`; `npm test` now includes `verify:channel-lifecycle-surfaces`.

Remaining gates:

- `[LANDED: source verifier for customer/admin lifecycle surfaces across FlipFlop, Bazos, Heureka, Allegro, and Aukro.]`
- `[MISSING: approved live customer/admin browser or API smoke per channel.]`
- `[MISSING: real buyer bearer plus subject-bound Allegro order row for live buyer cabinet lifecycle smoke.]`
- `[MISSING: Warehouse/Allegro runtime shipment-status enablement approvals before provider status changes can drive late lifecycle stages.]`
- `[UNKNOWN: provider-backed Bazos marketplace webhook support.]`

## 2026-07-03 - Shipment Runtime Readiness In Standard Test Chain

Intent chain:

- Vision: Orders lifecycle reliability must not regress when future code changes touch order, Warehouse, or channel shipment integration contracts.
- Goal Impact: the cross-repo shipment runtime readiness preflight is now part of the standard Orders `npm test` chain instead of being an optional standalone check.
- System: Orders owns the validation chain; Warehouse and Allegro source contracts remain verified read-only by the preflight.
- Feature: standard validation chain enforcement for shipment runtime readiness.
- Task: add `verify:shipment-runtime-readiness` to the main `test` script and record IPS evidence.
- Execution Plan: package/docs only; no deploy, migration, DB read/write, provider call, Warehouse call, Orders callback, or runtime status mutation.
- Coding Prompt: keep the gate read-only and preserve explicit runtime approval gates.
- Code: `package.json` test chain and IPS docs.
- Validation: `npm run verify:shipment-runtime-readiness`, `npm run verify:order-lifecycle-read-model`, and `git diff --check`.

Remaining gates:

- `[LANDED: shipment runtime readiness preflight is enforced by the standard Orders test chain.]`
- `[MISSING: Warehouse deploy/migration approval for fulfillment_provider_shipment_correlations.]`
- `[MISSING: Allegro deploy approval before runtime pod receives ALLEGRO_SHIPMENT_DEAD_LETTER_DIR/PVC.]`
- `[MISSING: owner approval to enable ALLEGRO_WAREHOUSE_SHIPMENT_CORRELATION_ENABLED=true.]`
- `[MISSING: owner-approved live runtime smoke with safe order selection and real token source.]`
- `[MISSING: owner approval before runtime fulfillment status mutation or production fulfillment-row mutation.]`

## 2026-07-03 - Cross-Repo Shipment Runtime Readiness Verifier

Intent chain:

- Vision: provider shipment observations should reach customer/admin lifecycle views only after the Orders, Warehouse, and Allegro source contracts are simultaneously ready and the remaining runtime gates are explicit.
- Goal Impact: deploy/live-smoke preparation now has one executable preflight that proves source readiness before any migration, deploy, provider read, Warehouse write, or fulfillment-status mutation.
- System: Orders owns central lifecycle and the orchestration verifier; Warehouse owns correlation storage and fulfillment transitions; Allegro owns sanitized shipment snapshot production, Warehouse correlation posting, and dead-letter artifacts.
- Feature: cross-repo shipment runtime readiness verifier.
- Task: add a read-only verifier covering Orders lifecycle stages, Warehouse correlation endpoint/migration, Allegro disabled producer, dead-letter storage source, and raw-field exclusions.
- Execution Plan: source verifier and IPS docs only; no deploy, no DB read/write, no provider call, no Warehouse call, no Orders callback, and no runtime status mutation.
- Coding Prompt: fail fast when a required source contract is missing, while reporting the runtime gates that still require explicit approval.
- Code: `scripts/verify-shipment-runtime-readiness.js` plus `verify:shipment-runtime-readiness`.
- Validation: `npm run verify:shipment-runtime-readiness`, `npm run verify:order-lifecycle-read-model`, and `git diff --check`.

Remaining gates:

- `[LANDED: executable cross-repo source readiness preflight for the shipment-correlation runtime lane.]`
- `[MISSING: Warehouse deploy/migration approval for fulfillment_provider_shipment_correlations.]`
- `[MISSING: Allegro deploy approval before runtime pod receives ALLEGRO_SHIPMENT_DEAD_LETTER_DIR/PVC.]`
- `[MISSING: owner approval to enable ALLEGRO_WAREHOUSE_SHIPMENT_CORRELATION_ENABLED=true.]`
- `[MISSING: owner-approved live runtime smoke with safe order selection and real token source.]`
- `[MISSING: owner approval before runtime fulfillment status mutation or production fulfillment-row mutation.]`

## 2026-07-03 - Orders Lifecycle Stage Coverage Verifier

Intent chain:

- Vision: customer and admin order surfaces must trust one central Orders lifecycle taxonomy for the full fulfillment and delivery path.
- Goal Impact: source verification now explicitly proves the Warehouse-derived forming, formed, in-delivery, and not-received stages that were previously only indirectly covered by the stage list.
- System: Orders owns lifecycle derivation, aggregate delivery statistics, and event/read-model shape; Warehouse remains the fulfillment-status source after handoff.
- Feature: full lifecycle taxonomy verification for customer/admin propagation.
- Task: strengthen `verify-order-lifecycle-read-model` coverage for late Warehouse and delivery stages.
- Execution Plan: verifier/docs only; no runtime code, deploy, DB read/write, Warehouse call, provider call, or status mutation.
- Coding Prompt: prove existing code maps Warehouse `fulfillmentOrderHandoff.warehouseStatus` values into bounded Orders lifecycle/delivery statuses without adding raw provider/customer/tracking data.
- Code: `scripts/verify-order-lifecycle-read-model.js` assertions for `warehouse_forming`, `warehouse_formed`, `in_delivery`, `not_received`, and delivery aggregate counts.
- Validation: `npm run build`, `npm run verify:order-lifecycle-read-model`, and `git diff --check`.

Remaining gates:

- `[LANDED: source verifier coverage for all requested late fulfillment/delivery lifecycle stages.]`
- `[MISSING: Warehouse correlation deploy/migration approval before provider shipment events can populate runtime fulfillment transitions.]`
- `[MISSING: approved end-to-end live smoke proving customer/admin frontends refresh from central Orders lifecycle after Warehouse/provider status changes.]`

## 2026-07-03 - Allegro Dead-Letter Runtime Path Manifest Integrated

Intent chain:

- Vision: failed Allegro-to-Warehouse shipment correlation attempts must have durable operational review storage without raw provider payloads.
- Goal Impact: the runtime volume/permission source gate moved from missing to source-declared PVC-backed readiness, leaving deploy and live-smoke gates explicit.
- System: Allegro owns dead-letter artifact storage; Warehouse owns correlation, provider-status ledger, and fulfillment transitions; Orders owns lifecycle read models from Warehouse callbacks.
- Feature: dead-letter runtime path manifest readiness.
- Task: integrate Allegro commit `79797f1` into Orders orchestration state.
- Execution Plan: accept source-only manifest and Dockerfile evidence; keep deploy, `kubectl apply`, live provider reads, live Warehouse calls, Warehouse migration run, Orders callbacks, and fulfillment status mutation blocked until approved.
- Coding Prompt: no Orders runtime code, no raw Allegro id/waybill/tracking/customer fields, no direct provider payload ingestion by Orders, no deploy, and no production fulfillment mutation.
- Code: Allegro `79797f1 chore: declare shipment dead-letter runtime path`; Orders docs checkpoint in this commit.
- Validation: Allegro JSON configmap parse, Kubernetes deployment YAML parse, `npm run verify:shipment-status-replay`, `npm run verify:shipment-status-snapshot`, `npm run build`, `git diff --check`, pre-commit checks, push to `main`, and Orders `git diff --check`.

Evidence:

- Allegro `k8s/deployment.yaml` now declares PVC `allegro-shipment-dead-letter-data` with `storageClassName: local-path` and mounts it at `/var/lib/allegro-service/shipment-correlation-dead-letter`.
- Allegro `k8s/configmap.yaml`, `.env.example`, and service deployment now use writer-compatible `ALLEGRO_SHIPMENT_DEAD_LETTER_DIR`.
- Allegro `services/allegro-service/Dockerfile` creates the directory for non-Kubernetes/local runs.
- No deploy, `kubectl apply`, DB write, migration, provider call, Warehouse call, Orders call, secret read, production data read, raw provider payload, tracking value, customer field, or fulfillment status mutation was performed.

Remaining gates:

- `[LANDED: source-declared PVC-backed runtime path in Allegro commit 79797f1.]`
- `[MISSING: deploy approval before the runtime Allegro pod receives the PVC mount/env.]`
- `[MISSING: owner-approved live runtime smoke with a safe order selection file and real token source.]`
- `[MISSING: Warehouse deploy/migration approval for fulfillment_provider_shipment_correlations.]`
- `[MISSING: owner approval to enable ALLEGRO_WAREHOUSE_SHIPMENT_CORRELATION_ENABLED=true.]`
- `[MISSING: owner approval before runtime fulfillment status mutation or production fulfillment-row mutation.]`

Next action:

- Approve and run the Warehouse correlation deploy/migration plus Allegro deploy/live smoke sequence before enabling the Warehouse correlation producer or fulfillment status mutation.

## 2026-07-03 - Allegro Shipment Dead-Letter Retention Location Integrated

Intent chain:

- Vision: failed Allegro-to-Warehouse shipment correlation attempts must have a durable operational review location without raw provider payloads or direct Orders ingestion.
- Goal Impact: the operational retention-location gate moved from missing to source-supported default plus explicit override paths, leaving runtime volume/permission confirmation and live smoke gates explicit.
- System: Allegro owns retry artifact creation and retention path selection; Warehouse owns correlation, provider-status ledger, and fulfillment transitions; Orders owns lifecycle read models from Warehouse callbacks.
- Feature: bounded shipment dead-letter retention location.
- Task: integrate Allegro commit `40872d5` into Orders orchestration state.
- Execution Plan: accept source-only path resolver and replay evidence; keep live provider reads, live Warehouse calls, deployment, migration run, Orders callbacks, and fulfillment status mutation blocked until approved.
- Coding Prompt: no Orders runtime code, no raw Allegro id/waybill/tracking/customer fields in report output, no direct provider payload ingestion by Orders, no deploy, and no production fulfillment mutation.
- Code: Allegro `40872d5 feat: add shipment dead-letter retention path`; Orders docs checkpoint in this commit.
- Validation: Allegro `npm run verify:shipment-status-replay`, `npm run verify:shipment-status-snapshot-export`, `npm run verify:shipment-status-handoff`, `npm run verify:warehouse-shipment-correlation`, `npm run verify:shipment-status-snapshot`, `npm run build`, `git diff --check`, pre-commit checks, push to `main`, and Orders `git diff --check`.

Evidence:

- `replay-shipment-status-handoff.ts` now supports `--dead-letter-file`, `--dead-letter-dir`, `ALLEGRO_SHIPMENT_DEAD_LETTER_DIR`, and default directory `/var/lib/allegro-service/shipment-correlation-dead-letter`.
- Apply-mode replay writes a bounded `allegro.shipment_status_dead_letter.v1` report only when handoff results include blocked, failed, or terminal skipped items.
- The resolver prefers explicit file, then explicit directory, then environment directory, then the default service retention directory.
- Report output remains bounded to retry/idempotency metadata and does not include raw provider, customer, waybill, or tracking values.

Remaining gates:

- `[LANDED: source-only shipment dead-letter retention location in allegro commit 40872d5.]`
- `[LANDED: source-declared PVC-backed runtime path in Allegro commit 79797f1.]`
- `[MISSING: deploy approval before the runtime Allegro pod receives the PVC mount/env.]`
- `[MISSING: owner-approved live runtime smoke with a safe order selection file and real token source.]`
- `[MISSING: Warehouse deploy/migration approval for fulfillment_provider_shipment_correlations.]`
- `[MISSING: owner approval to enable ALLEGRO_WAREHOUSE_SHIPMENT_CORRELATION_ENABLED=true.]`
- `[MISSING: owner approval before runtime fulfillment status mutation or production fulfillment-row mutation.]`

Next action:

- Confirm runtime volume/permissions for the default dead-letter directory, then run an approved sanitized live smoke before Warehouse correlation deployment/migration and runtime status mutation.

## 2026-07-03 - Allegro Shipment Correlation Dead-Letter Report Integrated

Intent chain:

- Vision: failed Allegro-to-Warehouse shipment correlation attempts must be reviewable and retryable without raw provider payloads or direct Orders ingestion.
- Goal Impact: the retry/DLQ source-policy gate moved from missing to source-validated Allegro dead-letter report evidence, leaving operational retention location and live runtime smoke gates explicit.
- System: Allegro owns handoff retry evidence; Warehouse owns correlation, provider-status ledger, and fulfillment transitions; Orders owns lifecycle read models from Warehouse callbacks.
- Feature: bounded shipment correlation dead-letter report.
- Task: integrate Allegro commit `a3762b7` into Orders orchestration state.
- Execution Plan: accept source-only dead-letter report evidence; keep live provider reads, live Warehouse calls, deployment, migration run, Orders callbacks, and fulfillment status mutation blocked until approved.
- Coding Prompt: no Orders runtime code, no raw Allegro id/waybill/tracking/customer fields in report output, no direct provider payload ingestion by Orders, no deploy, and no production fulfillment mutation.
- Code: Allegro `a3762b7 feat: add shipment correlation dead-letter report`; Orders docs checkpoint in this commit.
- Validation: Allegro `npm run verify:shipment-status-replay`, `npm run verify:shipment-status-snapshot-export`, `npm run verify:shipment-status-handoff`, `npm run verify:warehouse-shipment-correlation`, `npm run verify:shipment-status-snapshot`, `npm run build`, `git diff --check`, pre-commit checks, push to `main`, and Orders `git diff --check`.

Evidence:

- `replay-shipment-status-handoff.ts` now accepts `--dead-letter-file` in apply mode.
- It can write `allegro.shipment_status_dead_letter.v1` reports for blocked, failed, and terminal skipped correlation attempts.
- Report rows contain only idempotency key, bounded reason, retry class, optional central order id, and source reference hash.
- The verifier proves retryable vs terminal classification and rejects raw marker leakage in the report.

Remaining gates:

- `[LANDED: source-only shipment correlation dead-letter report in allegro commit a3762b7.]`
- `[MISSING: owner-approved operational retention location for generated dead-letter report artifacts.]`
- `[MISSING: owner-approved live runtime smoke with a safe order selection file and real token source.]`
- `[MISSING: deploy/migration approval for Warehouse correlation table and endpoint.]`
- `[MISSING: owner approval to enable ALLEGRO_WAREHOUSE_SHIPMENT_CORRELATION_ENABLED=true.]`
- `[MISSING: owner approval before runtime fulfillment status mutation or production fulfillment-row mutation.]`

Next action:

- Choose the operational retention location for generated dead-letter reports, then run an approved sanitized live smoke and Warehouse correlation deploy/migration sequence.

## 2026-07-03 - Allegro Live Shipment Read Bundle Producer Integrated

Intent chain:

- Vision: selected Allegro shipment observations should become sanitized Warehouse correlation input without raw provider payloads or direct Orders ingestion.
- Goal Impact: the live-read implementation gate moved from missing to source-validated Allegro explicit-selection reader evidence, leaving runtime smoke, Warehouse deploy/migration, and status mutation gates explicit.
- System: Allegro owns selected live shipment reads and snapshot-file production; Warehouse owns correlation, provider-status ledger, and fulfillment transitions; Orders owns lifecycle read models from Warehouse callbacks.
- Feature: confirmed Allegro live shipment read bundle producer.
- Task: integrate Allegro commit `7ec7ad2` into Orders orchestration state.
- Execution Plan: accept source-only live-read evidence; keep runtime smoke, DB writes, live Warehouse calls, deployment, migration run, Orders callbacks, and fulfillment status mutation blocked until approved.
- Coding Prompt: no Orders runtime code, no raw Allegro id/waybill/tracking/customer fields in output, no direct provider payload ingestion by Orders, no deploy, and no production fulfillment mutation.
- Code: Allegro `7ec7ad2 feat: add live shipment read bundle producer`; Orders docs checkpoint in this commit.
- Validation: Allegro `npm run verify:shipment-status-snapshot-export`, `npm run verify:shipment-status-replay`, `npm run verify:shipment-status-handoff`, `npm run verify:warehouse-shipment-correlation`, `npm run verify:shipment-status-snapshot`, `npm run build`, `git diff --check`, pre-commit checks, push to `main`, and Orders `git diff --check`.

Evidence:

- `export-shipment-status-snapshots.ts --live-read` now accepts an explicit order selection file.
- The path requires `--confirm-live-read ALLEGRO_SHIPMENT_STATUS_LIVE_READ`.
- It reads only `/order/checkout-forms/{id}/shipments` and `/order/carriers/{carrierId}/tracking?waybill=...`.
- Raw provider identifiers are kept in memory only and mapped into sanitized snapshots before file output.
- Tests prove selected endpoints, successful tracking mapping, partial tracking failure handling, and no raw shipment/waybill marker leakage in the snapshot file.

Remaining gates:

- `[LANDED: source-only Allegro live shipment read bundle producer in allegro commit 7ec7ad2.]`
- `[LANDED: source-only Allegro shipment snapshot-file producer in allegro commit de81866.]`
- `[MISSING: owner-approved live runtime smoke with a safe order selection file and real token source.]`
- `[MISSING: deploy/migration approval for Warehouse correlation table and endpoint.]`
- `[MISSING: owner approval to enable ALLEGRO_WAREHOUSE_SHIPMENT_CORRELATION_ENABLED=true.]`
- `[MISSING: approved retention/retry/dead-letter policy for failed correlation posts.]`
- `[MISSING: owner approval before runtime fulfillment status mutation or production fulfillment-row mutation.]`

Next action:

- Run an owner-approved sanitized live smoke with a safe order selection and real token source, then deploy Warehouse correlation migration/endpoint and run correlation smoke before enabling status mutation.

## 2026-07-03 - Allegro Shipment Snapshot File Producer Integrated

Intent chain:

- Vision: approved Allegro shipment observations should become replayable Warehouse correlation input without raw provider payloads or direct Orders ingestion.
- Goal Impact: the snapshot-file producer gate moved from missing to source-validated Allegro exporter evidence, leaving live provider-read implementation, Warehouse deploy/migration, and status mutation gates explicit.
- System: Allegro owns read-bundle-to-snapshot-file production and replay invocation; Warehouse owns correlation, provider-status ledger, and fulfillment transitions; Orders owns lifecycle read models from Warehouse callbacks.
- Feature: sanitized Allegro shipment status snapshot-file producer.
- Task: integrate Allegro commit `de81866` into Orders orchestration state.
- Execution Plan: accept source-only exporter evidence; keep live Allegro shipment reads, DB writes, live Warehouse calls, deployment, migration run, Orders callbacks, and fulfillment status mutation blocked until approved.
- Coding Prompt: no Orders runtime code, no raw Allegro id/waybill/tracking/customer fields, no direct provider payload ingestion by Orders, no deploy, and no production fulfillment mutation.
- Code: Allegro `de81866 feat: add shipment status snapshot export`; Orders docs checkpoint in this commit.
- Validation: Allegro `npm run verify:shipment-status-snapshot-export`, `npm run verify:shipment-status-replay`, `npm run verify:shipment-status-handoff`, `npm run verify:warehouse-shipment-correlation`, `npm run verify:shipment-status-snapshot`, `npm run build`, `git diff --check`, pre-commit checks, push to `main`, and Orders `git diff --check`.

Evidence:

- Allegro source now has `export-shipment-status-snapshots.ts`.
- The exporter accepts approved `allegro.shipment_status_read_bundle.v1` order inputs and writes replay-compatible `allegro.shipment_status_snapshot_file.v1` JSON.
- It maps through the existing redacting snapshot mapper and rejects forbidden raw marker keys in final snapshots.
- The output file is consumable by `replay-shipment-status-handoff.ts`.
- The live provider-read path remains fail-closed behind `--live-read --confirm-live-read ALLEGRO_SHIPMENT_STATUS_LIVE_READ` until account/order selection, token handling, rate limits, and sanitized smoke are approved.

Remaining gates:

- `[LANDED: source-only Allegro shipment snapshot-file producer in allegro commit de81866.]`
- `[LANDED: source-only Allegro shipment status replay caller in allegro commit f145150.]`
- `[MISSING: approved live shipment read implementation with account/order selection, token handling, rate limits, and sanitized smoke.]`
- `[MISSING: deploy/migration approval for Warehouse correlation table and endpoint.]`
- `[MISSING: owner approval to enable ALLEGRO_WAREHOUSE_SHIPMENT_CORRELATION_ENABLED=true.]`
- `[MISSING: approved retention/retry/dead-letter policy for failed correlation posts.]`
- `[MISSING: owner approval before runtime fulfillment status mutation or production fulfillment-row mutation.]`

Next action:

- Implement the approved live shipment read implementation that produces sanitized read bundles, then deploy Warehouse correlation migration/endpoint and run sanitized correlation smoke.

## 2026-07-03 - Allegro Shipment Replay Caller Integrated

Intent chain:

- Vision: approved Allegro shipment observations should be replayable into Warehouse correlation without raw provider payloads or direct Orders ingestion.
- Goal Impact: the durable replay caller gate moved from missing to source-validated Allegro CLI evidence, leaving live projection-file production, Warehouse deploy/migration, and status mutation gates explicit.
- System: Allegro owns sanitized snapshot replay input and handoff invocation; Warehouse owns correlation, provider-status ledger, and fulfillment transitions; Orders owns lifecycle read models from Warehouse callbacks.
- Feature: guarded Allegro shipment status replay caller.
- Task: integrate Allegro commit `f145150` into Orders orchestration state.
- Execution Plan: accept source-only replay caller evidence; keep live Allegro shipment reads, DB projection writes, live Warehouse calls without exact confirmation, deployment, migration run, Orders callbacks, and fulfillment status mutation blocked until approved.
- Coding Prompt: no Orders runtime code, no raw Allegro id/waybill/tracking/customer fields, no direct provider payload ingestion by Orders, no deploy, and no production fulfillment mutation.
- Code: Allegro `f145150 feat: add shipment status replay caller`; Orders docs checkpoint in this commit.
- Validation: Allegro `npm run verify:shipment-status-replay`, `npm run verify:shipment-status-handoff`, `npm run verify:warehouse-shipment-correlation`, `npm run verify:shipment-status-snapshot`, `npm run build`, `git diff --check`, pre-commit checks, push to `main`, and Orders `git diff --check`.

Evidence:

- Allegro source now has `replay-shipment-status-handoff.ts`.
- The replay caller accepts a JSON file containing sanitized `allegro.shipment_status_snapshot.v1` snapshots or order-input records that are first mapped through the redacting snapshot mapper.
- Dry-run validates snapshot redaction and returns a bounded summary without network, provider, Orders, Warehouse, or DB access.
- Apply mode requires `--confirm-warehouse-handoff ALLEGRO_SHIPMENT_STATUS_WAREHOUSE_CORRELATION` and still relies on `ALLEGRO_WAREHOUSE_SHIPMENT_CORRELATION_ENABLED=true` plus Warehouse token config before any Warehouse post.
- The verifier proves dry-run has no Warehouse mutation, built snapshots omit raw waybills, existing sanitized snapshots replay unchanged, and raw tracking markers are rejected.

Remaining gates:

- `[LANDED: source-only Allegro shipment status replay caller in allegro commit f145150.]`
- `[LANDED: source-only Allegro shipment status handoff hook in allegro commit a234651.]`
- `[LANDED: source-only Allegro Warehouse shipment correlation producer in allegro commit c434d1a.]`
- `[MISSING: approved producer that creates sanitized replay snapshot files from live Allegro shipment projection reads.]`
- `[MISSING: deploy/migration approval for Warehouse correlation table and endpoint.]`
- `[MISSING: owner approval to enable ALLEGRO_WAREHOUSE_SHIPMENT_CORRELATION_ENABLED=true.]`
- `[MISSING: approved retention/retry/dead-letter policy for failed correlation posts.]`
- `[MISSING: owner approval before runtime fulfillment status mutation or production fulfillment-row mutation.]`

Next action:

- Implement the approved sanitized snapshot-file producer from live Allegro shipment projection reads, then deploy Warehouse correlation migration/endpoint and run sanitized correlation smoke.

## 2026-07-03 - Allegro Shipment Handoff Hook Integrated

Intent chain:

- Vision: Allegro-origin shipment progress should reach customer/admin lifecycle only after sanitized Warehouse correlation and bounded Warehouse lifecycle callbacks.
- Goal Impact: the missing producer caller gate narrowed from no source hook to a source-ready handoff service, leaving durable projection/replay runtime, deploy/migration, and status mutation gates explicit.
- System: Allegro owns sanitized shipment snapshots and the handoff hook; Warehouse owns correlation, provider-status ledger, and fulfillment transitions; Orders owns lifecycle read models and receives only Warehouse-owned callbacks.
- Feature: Allegro source-only shipment status handoff hook.
- Task: integrate Allegro commit `a234651` into Orders orchestration state.
- Execution Plan: accept source-only handoff evidence; keep live provider reads, DB projection writes, live Warehouse calls, deployment, migration run, Orders callbacks, and fulfillment status mutation blocked until approved.
- Coding Prompt: no Orders runtime code, no raw Allegro id/waybill/tracking/customer fields, no direct provider payload ingestion by Orders, no deploy, and no production fulfillment mutation.
- Code: Allegro `a234651 feat: add shipment status handoff hook`; Orders docs checkpoint in this commit.
- Validation: Allegro `npm run verify:shipment-status-handoff`, `npm run verify:warehouse-shipment-correlation`, `npm run verify:shipment-status-snapshot`, `npm run build`, `git diff --check`, pre-commit checks, push to `main`, and Orders `git diff --check`.

Evidence:

- Allegro source now has `ShipmentStatusHandoffService.publishWarehouseCorrelations()`.
- The handoff hook accepts only already-sanitized `AllegroShipmentStatusSnapshot[]`.
- It calls the disabled-by-default Warehouse correlation producer per snapshot and returns bounded posted/disabled/skipped/blocked/failed counts.
- It catches per-snapshot failures without exposing raw provider/customer/tracking fields.
- It does not read Allegro, persist projection rows, call Orders, mutate Warehouse fulfillment status, or bypass the `ALLEGRO_WAREHOUSE_SHIPMENT_CORRELATION_ENABLED` gate.

Remaining gates:

- `[LANDED: source-only Allegro shipment status handoff hook in allegro commit a234651.]`
- `[LANDED: source-only Allegro Warehouse shipment correlation producer in allegro commit c434d1a.]`
- `[LANDED: source-only Warehouse shipment correlation endpoint in warehouse-microservice commit 174f92e.]`
- `[MISSING: approved durable Allegro shipment projection/replay runtime caller that feeds sanitized snapshots into ShipmentStatusHandoffService.]`
- `[MISSING: deploy/migration approval for Warehouse correlation table and endpoint.]`
- `[MISSING: approved retention/retry/dead-letter policy for failed correlation posts.]`
- `[MISSING: owner approval before runtime fulfillment status mutation or production fulfillment-row mutation.]`

Next action:

- Implement the durable Allegro shipment projection/replay runtime caller behind explicit approval, then deploy Warehouse correlation migration/endpoint and run sanitized correlation smoke.

## 2026-07-03 - Allegro Warehouse Shipment Correlation Producer Integrated

Intent chain:

- Vision: Allegro-origin shipment status should reach Orders only through sanitized Warehouse-owned fulfillment correlation and bounded lifecycle callbacks.
- Goal Impact: the channel producer path moved from missing to source-validated Allegro client evidence, leaving deploy/migration/runtime caller/status-mutation gates explicit.
- System: Allegro owns provider reads and hashed shipment snapshot identity; Warehouse owns correlation registry, provider-status ledger, and fulfillment transitions; Orders owns central lifecycle and customer/admin read models.
- Feature: disabled-by-default Allegro producer client for Warehouse shipment correlation registration.
- Task: integrate Allegro commit `c434d1a` into Orders orchestration state.
- Execution Plan: accept source-only producer evidence; keep live Warehouse calls, deployment, migration run, runtime replay caller, Orders callbacks, and fulfillment status mutation blocked until approved.
- Coding Prompt: no Orders runtime code, no raw Allegro id/waybill/tracking/customer fields, no direct provider payload ingestion by Orders, no deploy, and no production fulfillment mutation.
- Code: Allegro `c434d1a feat: add warehouse shipment correlation producer`; Orders docs checkpoint in this commit.
- Validation: Allegro `npm run verify:warehouse-shipment-correlation`, `npm run verify:shipment-status-snapshot`, `npm run build`, `git diff --check`, pre-commit checks, push to `main`, and Orders `git diff --check`.

Evidence:

- Allegro source now has `WarehouseShipmentCorrelationClient.publishSnapshotCorrelation()` and `buildWarehouseShipmentCorrelationRequest()`.
- The producer maps sanitized `allegro.shipment_status_snapshot.v1` snapshots to `POST /api/fulfillment-orders/order/:centralOrderId/provider-shipment-correlations`.
- The request contains only `provider`, `sourceChannel`, hashed account/order/shipment/waybill identities, Warehouse-compatible `sourceReferenceHash`, `reasonCode`, and bounded reference.
- Runtime posting is disabled unless `ALLEGRO_WAREHOUSE_SHIPMENT_CORRELATION_ENABLED=true` and a Warehouse/internal service token is configured.
- The verifier proves disabled-by-default behavior, missing-central-order skip, configured post headers, source-reference hash shape, and no raw provider/buyer marker leakage.

Remaining gates:

- `[LANDED: source-only Allegro Warehouse shipment correlation producer in allegro commit c434d1a.]`
- `[LANDED: source-only Warehouse shipment correlation endpoint in warehouse-microservice commit 174f92e.]`
- `[MISSING: deploy/migration approval for Warehouse correlation table and endpoint.]`
- `[MISSING: approved Allegro shipment projection/replay runtime caller that invokes the producer.]`
- `[MISSING: approved retention/retry/dead-letter policy for failed correlation posts.]`
- `[MISSING: product-approved tracking visibility matrix before tracking number/URL display.]`
- `[MISSING: owner approval before runtime fulfillment status mutation or production fulfillment-row mutation.]`

Next action:

- Approve Warehouse deploy/migration plus the Allegro runtime replay caller gate, then run a sanitized smoke proving correlations register before enabling provider-status consumption.

## 2026-07-03 - Warehouse Shipment Correlation Producer Surface Integrated

Intent chain:

- Vision: provider shipment progress needs a controlled Warehouse-owned population path before it can influence customer/admin order lifecycle.
- Goal Impact: the runtime producer path moved from missing source surface to source-validated Warehouse endpoint, leaving deploy/migration and channel producer call gates explicit.
- System: Allegro or Orders will later produce sanitized correlation hashes; Warehouse owns correlation registration, ledger observation, and future status mutation; Orders consumes only bounded Warehouse callbacks.
- Feature: source-only Warehouse endpoint for provider shipment correlation registration.
- Task: integrate Warehouse commit `174f92e` into Orders orchestration state.
- Execution Plan: accept source-only endpoint evidence, keep deployment, migration run, live channel call, status mutation, and Orders callback changes blocked.
- Coding Prompt: no Orders runtime code, no raw provider/tracking/customer fields, no direct Allegro snapshot ingestion by Orders, no deploy, and no production fulfillment mutation.
- Code: Warehouse `174f92e feat: add shipment correlation registration endpoint`; Orders docs checkpoint in this commit.
- Validation: Warehouse focused Jest `30` tests, `npm run build`, `npm run check:hosted-auth`, `git diff --check`, commit hook checks, and Orders `git diff --check`.

Evidence:

- Warehouse source exposes `POST /api/fulfillment-orders/order/:orderId/provider-shipment-correlations`.
- The endpoint resolves the existing fulfillment order by central order id and registers sanitized provider/source hash fields only.
- Authenticated actor derivation is reused through `getAuthenticatedMutationActor`.
- The endpoint does not update fulfillment status, call Orders, read provider APIs, or persist raw provider/tracking/customer fields.

Remaining gates:

- `[LANDED: source-only Warehouse shipment correlation producer endpoint in warehouse-microservice commit 174f92e.]`
- `[MISSING: deploy/migration approval for Warehouse correlation table and endpoint.]`
- `[MISSING: approved channel producer call from Allegro or Orders runtime.]`
- `[MISSING: approved retention/retry/dead-letter policy.]`
- `[MISSING: product-approved tracking visibility matrix before tracking number/URL display.]`
- `[MISSING: owner approval before runtime status mutation or production fulfillment-row mutation.]`

Next action:

- Approve deploy/migration and implement the Allegro or Orders producer call that posts sanitized shipment correlation hashes to Warehouse.

## 2026-07-03 - Warehouse Shipment Correlation Resolver Integrated

Intent chain:

- Vision: Allegro shipment progress must resolve to exactly one Warehouse fulfillment order before any delivery lifecycle status reaches Orders.
- Goal Impact: the correlation decision moved from missing to source-validated Warehouse registry/resolver evidence, leaving runtime population and deploy gates explicit.
- System: Allegro owns sanitized shipment snapshots; Warehouse owns correlation, ledger observation, and future fulfillment mutation; Orders consumes only bounded Warehouse callbacks.
- Feature: source-only provider shipment correlation registry/resolver.
- Task: integrate Warehouse commit `ec04ede` into Orders orchestration state.
- Execution Plan: accept source-only correlation evidence, keep runtime population, status mutation, migration run, deploy, live provider calls, and Orders callback changes blocked.
- Coding Prompt: no Orders runtime code, no raw provider/tracking/customer fields, no direct Allegro snapshot ingestion by Orders, no deploy, and no production fulfillment mutation.
- Code: Warehouse `ec04ede feat: add shipment correlation resolver`; Orders docs checkpoint in this commit.
- Validation: Warehouse focused Jest `35` tests, `npm run build`, `npm run check:hosted-auth`, `git diff --check`, commit hook checks, and Orders `git diff --check`.

Evidence:

- Warehouse source now stores only hashed provider/source shipment identity in `FulfillmentProviderShipmentCorrelation`.
- `FulfillmentProviderShipmentCorrelationService` registers active mappings from sanitized Allegro shipment identity to one central Orders id and one Warehouse fulfillment order id.
- Resolver fails closed for zero matches and ambiguous matches.
- `FulfillmentProviderStatusSnapshotAdapterService.recordResolvedAllegroShipmentSnapshot` can resolve correlation before ledger recording.
- No source path mutates `fulfillment_orders.status` or calls Orders from provider snapshots in this slice.

Remaining gates:

- `[LANDED: source-only Warehouse shipment correlation registry/resolver in warehouse-microservice commit ec04ede.]`
- `[LANDED: source-only Warehouse shipment correlation producer endpoint in warehouse-microservice commit 174f92e.]`
- `[MISSING: deploy/migration approval plus approved channel producer call for shipment correlations.]`
- `[MISSING: approved retention/retry/dead-letter policy.]`
- `[MISSING: product-approved tracking visibility matrix before tracking number/URL display.]`
- `[MISSING: owner approval before Warehouse deploy, migration run, runtime status mutation, or production fulfillment-row mutation.]`

Next action:

- Approve deploy/migration and implement the Allegro or Orders producer call that posts sanitized shipment correlation hashes to Warehouse.

## 2026-07-03 - Warehouse Shipment Snapshot Adapter Mapper Integrated

Intent chain:

- Vision: Allegro delivery progress should reach Orders only through sanitized Warehouse-owned fulfillment observations and bounded Warehouse callbacks.
- Goal Impact: Warehouse can now validate and map sanitized Allegro shipment snapshots into its provider-status ledger source path, while runtime mutation remains correlation/deploy gated.
- System: Allegro owns raw provider reads and sanitized snapshot production; Warehouse owns snapshot validation, candidate status mapping, ledger observation, and future fulfillment mutation; Orders owns lifecycle projection from Warehouse callbacks only.
- Feature: source-only Warehouse adapter mapper for `allegro.shipment_status_snapshot.v1`.
- Task: integrate Warehouse commit `ad8746a` into Orders orchestration state.
- Execution Plan: accept source-only mapper evidence, keep correlation resolver, status mutation, migration run, deploy, live provider calls, and Orders callback changes blocked.
- Coding Prompt: no Orders runtime code, no raw provider/tracking/customer fields, no direct Allegro snapshot ingestion by Orders, no deploy, and no production fulfillment mutation.
- Code: Warehouse `ad8746a feat: add shipment snapshot adapter mapper`; Orders docs checkpoint in this commit.
- Validation: Warehouse focused Jest `27` tests, `npm run build`, `npm run check:hosted-auth`, `git diff --check`, commit hook checks, and Orders `git diff --check`.

Evidence:

- `FulfillmentProviderStatusSnapshotAdapterService` accepts only sanitized `allegro.shipment_status_snapshot.v1` envelopes.
- Adapter mapping is correlation-gated: it requires an already-resolved central `orderId` and Warehouse `fulfillmentOrderId` before ledger recording.
- The mapper rejects raw-looking identifiers and raw tracking/provider/customer fields before a ledger write.
- It maps in-progress Allegro classes to `in_delivery`, `DELIVERED` to `delivered`, `ISSUE` to `not_delivered`, `RETURNED` to `returned`, and `PENDING`/`UNKNOWN`/unavailable reads to no-op diagnostics.
- It records only provider-status ledger observations; it does not call `FulfillmentOrdersService.updateStatus`, call Orders, run provider reads, or resolve correlation.

Remaining gates:

- `[LANDED: Warehouse sanitized Allegro shipment snapshot adapter mapper in warehouse-microservice commit ad8746a.]`
- `[LANDED: source-only Warehouse shipment correlation registry/resolver in warehouse-microservice commit ec04ede; runtime producer/population path still missing.]`
- `[MISSING: approved retention/retry/dead-letter policy.]`
- `[MISSING: product-approved tracking visibility matrix before tracking number/URL display.]`
- `[MISSING: owner approval before Warehouse deploy, migration run, runtime status mutation, or production fulfillment-row mutation.]`

Next action:

- Approve deploy/migration and implement the Allegro or Orders producer call that posts sanitized shipment correlation hashes to Warehouse.

## 2026-07-03 - Warehouse Provider-Status Ledger Source Integrated

Intent chain:

- Vision: Orders lifecycle projection should be backed by durable Warehouse fulfillment evidence without ingesting raw provider shipment payloads.
- Goal Impact: the ledger moved from policy-only to source-validated Warehouse implementation, enabling a future disabled-by-default provider adapter after remaining gates are approved.
- System: Warehouse owns the provider-status observation ledger and future fulfillment mutation decisions; Allegro/source services own sanitized provider projections; Orders remains a bounded lifecycle/event consumer through Warehouse callbacks.
- Feature: Warehouse provider-status ledger source foundation integration.
- Task: integrate Warehouse commit `5bdc473` into Orders orchestration state.
- Execution Plan: accept source-only ledger evidence, keep provider adapter/deploy blocked, and preserve Orders as non-owner of provider payloads.
- Coding Prompt: no Orders runtime code, no provider adapter, no deployment, no live provider call, no secret read, no raw provider/tracking/customer fields, no Orders callback, and no production fulfillment mutation.
- Code: Warehouse `5bdc473 feat: add provider status ledger foundation`; Orders docs checkpoint in this commit.
- Validation: Warehouse focused Jest `14` tests, `npm run build`, `npm run check:hosted-auth`, `git diff --check`, commit hook checks, and Orders `git diff --check`.

Evidence:

- Warehouse source now has `FulfillmentProviderStatusObservation` for sanitized observation persistence and replay diagnostics.
- `FulfillmentProviderStatusLedgerService` records accepted observations, exact replay duplicates, same-key content conflicts, stale source updates, future source timestamps, and raw provider/tracking/customer metadata rejection.
- TypeORM migration `1781600000000-CreateFulfillmentProviderStatusObservations` defines the durable table and indexes, but it has not been deployed or run in production.
- The ledger does not call `FulfillmentOrdersService.updateStatus`, does not call Orders, and does not read provider APIs.

Remaining gates:

- `[LANDED: Warehouse provider-status observation ledger source foundation in warehouse-microservice commit 5bdc473.]`
- `[LANDED: Warehouse sanitized Allegro shipment snapshot adapter mapper in warehouse-microservice commit ad8746a.]`
- `[LANDED: source-only sanitized Allegro shipment snapshot adapter mapper in warehouse-microservice commit ad8746a; runtime consumer flag remains deploy-gated.]`
- `[LANDED: source-only Warehouse shipment correlation registry/resolver in warehouse-microservice commit ec04ede; runtime producer/population path still missing.]`
- `[MISSING: approved retention/retry/dead-letter policy.]`
- `[MISSING: product-approved tracking visibility matrix before tracking number/URL display.]`
- `[MISSING: owner approval before Warehouse deploy, migration run, runtime adapter, or production fulfillment-row mutation.]`

Next action:

- Implement a disabled-by-default sanitized provider adapter only after correlation, retry/DLQ, visibility, and deploy/smoke gates are approved.

## 2026-07-03 - Warehouse Provider-Status Ledger Policy Integrated

Intent chain:

- Vision: Orders lifecycle projection should receive bounded Warehouse fulfillment updates while raw provider shipment evidence stays outside Orders.
- Goal Impact: the durable ledger ownership and timestamp/replay gate moved from missing to Warehouse-owned provisional contract evidence.
- System: Warehouse owns fulfillment status mutation, transition validation, and the future provider-status observation ledger; Allegro/source services own raw provider reads and sanitized projections; Orders owns customer/admin lifecycle projection from Warehouse callbacks.
- Feature: Warehouse provider-status ledger and timestamp policy integration.
- Task: integrate Warehouse commit `72d73ec` into Orders orchestration state.
- Execution Plan: accept docs-only policy evidence, keep runtime adapter/deploy blocked, and preserve Orders as a bounded lifecycle consumer rather than a provider payload processor.
- Coding Prompt: no Orders runtime code, DB migration, deploy, secret read, live provider call, raw provider/tracking/customer fields, or production fulfillment-row mutation.
- Code: Warehouse `72d73ec docs: define provider status ledger policy`; Orders docs checkpoint in this commit.
- Validation: Warehouse `git diff --check`, `npm run check:hosted-auth`, commit hook pre-commit checks, and Orders `git diff --check`.

Evidence:

- Warehouse ledger ownership is decided: Warehouse owns the durable provider-status observation ledger beside fulfillment transition validation.
- The policy defines sanitized logical fields for idempotency key, content hash, provider/source channel, central order id, fulfillment order id, hashed source reference, normalized Warehouse status, timestamp classes, decision, rejection reason, and replay diagnostics.
- Timestamp classes are explicitly separated as `sourceUpdatedAt`, `statusObservedAt`, and `observedAt`; Orders callback `occurredAt` remains bounded to trusted status occurrence time or local observation time.
- Replay/conflict rules fail closed for duplicate same-content, same-key different-content, stale source updates, future timestamps, missing joins, unknown statuses, raw provider/tracking/customer fields, and invalid Warehouse transition skips.

Remaining gates:

- `[LANDED: Warehouse provider-status observation ledger source foundation in warehouse-microservice commit 5bdc473.]`
- `[LANDED: Warehouse sanitized Allegro shipment snapshot adapter mapper in warehouse-microservice commit ad8746a.]`
- `[LANDED: source-only Warehouse ledger migration/schema in warehouse-microservice commit 5bdc473; not deployed or run in production.]`
- `[MISSING: approved future clock-skew window, stale-event age, and retention/retry/dead-letter policy.]`
- `[LANDED: source-only Warehouse shipment correlation registry/resolver in warehouse-microservice commit ec04ede; runtime producer/population path still missing.]`
- `[MISSING: owner approval before Warehouse runtime adapter, migration, deploy, or production fulfillment-row mutation.]`

Next action:

- Implement a disabled-by-default sanitized provider adapter only after correlation, retention/retry/DLQ, visibility, and deploy/smoke gates are approved.

## 2026-07-03 - Orders Allegro Source-Reference Preservation Verified

Intent chain:

- Vision: Warehouse fulfillment joins for Allegro-origin orders must use central Orders and Warehouse identifiers plus bounded source references, not raw Allegro provider payloads.
- Goal Impact: the source-reference preservation gate now has executable Orders verifier evidence for Allegro Warehouse fulfillment handoff payloads.
- System: Orders owns central order id, channel, external checkout reference, paid handoff, and fulfilled reservation lookup; Warehouse owns fulfillment orders and reservation ids; Allegro owns raw checkout/provider payloads.
- Feature: Allegro-origin Warehouse handoff source-reference preservation.
- Task: add an Allegro-specific verifier case proving the Warehouse fulfillment handoff payload preserves safe source references and excludes raw provider/tracking/customer fields.
- Execution Plan: source verifier only; no runtime code change, DB migration, deploy, live order mutation, secret read, or raw provider payload.
- Coding Prompt: preserve `channel=allegro`, central `orderId`, external checkout reference as `orderNumber/reference`, line `reservationId`, `orderItemId`, `productId`, `warehouseId`, and quantity; reject raw provider/tracking/customer markers.
- Code: `scripts/verify-order-fulfillment-handoff.js`.
- Validation: `npm run build`, `npm run verify:order-fulfillment-handoff`, and `git diff --check`.

Evidence:

- The Allegro verifier fixture builds a central Orders record with `channel=allegro` and `externalOrderId=allegro-checkout-form-1001`.
- The Warehouse handoff payload preserves central `orderId`, `channel=allegro`, `orderNumber/reference` from `externalOrderId`, and line-level `orderItemId`, `reservationId`, `productId`, `warehouseId`, and quantity.
- The verifier rejects payload leakage markers: `rawData`, `trackingNumber`, `waybill`, `buyerEmail`, `buyerLogin`, and `providerPayload`.

Remaining gates:

- `[PROVEN: Orders source-reference preservation for synthetic Allegro Warehouse fulfillment handoff payloads.]`
- `[MISSING: live Allegro-origin central order with fulfilled reservations for runtime Warehouse handoff join smoke.]`
- `[LANDED: Warehouse provider-status observation ledger source foundation in warehouse-microservice commit 5bdc473.]`
- `[LANDED: Warehouse sanitized Allegro shipment snapshot adapter mapper in warehouse-microservice commit ad8746a.]`
- `[PARTIAL: provisional timestamp/replay semantics landed in Warehouse commit 72d73ec; runtime constants remain missing.]`
- `[MISSING: owner approval before Warehouse runtime adapter, Allegro projection migration, deployment, or production fulfillment-row mutation.]`

Next action:

- Approve and implement the runtime producer/population path for shipment correlations before any status-mutating provider consumer or deploy/smoke gate.

## 2026-07-03 - Warehouse Allegro Checkout Fulfillment Mapping Integrated

Intent chain:

- Vision: Orders lifecycle projection must be fed by Warehouse-owned fulfillment states while Allegro remains the provider/source owner for marketplace checkout and shipment evidence.
- Goal Impact: a Warehouse-facing provisional mapping now narrows how Allegro checkout-form payment/status/fulfillment hints may inform future Warehouse handoff work without approving runtime mutations.
- System: Allegro owns checkout-form polling and raw provider evidence; Warehouse owns stock/reservations/fulfillment-order transitions; Orders owns central lifecycle/payment handoff and records the integration gate.
- Feature: Warehouse Allegro checkout-form fulfillment status mapping integration.
- Task: integrate Warehouse commit `b44ea08` into Orders orchestration state.
- Execution Plan: accept docs-only mapping evidence, keep runtime adapter/deploy blocked, and preserve Warehouse callback as the only Orders lifecycle bridge.
- Coding Prompt: no Orders runtime code, no DB migration, no deploy, no raw provider/tracking/customer fields in Orders.
- Code: Warehouse `b44ea08 docs: define allegro checkout fulfillment mapping`; Orders docs checkpoint in this commit.
- Validation: Warehouse `git diff --check`, `npm run check:hosted-auth`, pre-commit, and Orders `git diff --check`.

Evidence:

- Warehouse mapping separates checkout-form/order readiness from carrier movement.
- Allegro `paymentStatus=PAID` is only an Orders paid-handoff eligibility signal and not a Warehouse status transition.
- Checkout-form `READY_FOR_PROCESSING` and not-started fulfillment values are only `requested` candidates after Orders has central order id, fulfilled reservation ids, and a valid Warehouse handoff payload.
- Seller fulfillment `SENT` is only a `handed_to_delivery` candidate and must not be projected as carrier `in_delivery`.
- Checkout-form delivery-like values must not bypass `handed_to_delivery -> in_delivery -> delivered/not_delivered`; carrier movement remains in the sanitized shipment snapshot contract.
- The mapping explicitly rejects `AllegroOrder.trackingNumber`, raw checkout-form payloads, shipment-management payloads, carrier tracking payloads, One Fulfillment stock/status, and convenience item fields as Warehouse write keys.

Remaining gates:

- `[LANDED: Warehouse provisional Allegro checkout-form fulfillment status mapping in warehouse-microservice commit b44ea08.]`
- `[MISSING: sanitized checkout-form fulfillment.status fixture set and approved enum/class list.]`
- `[MISSING: approved Orders source-reference preservation evidence proving Allegro-origin central orders preserve source evidence and fulfilled reservation ids for Warehouse joins.]`
- `[LANDED: Warehouse provider-status observation ledger source foundation in warehouse-microservice commit 5bdc473.]`
- `[LANDED: Warehouse sanitized Allegro shipment snapshot adapter mapper in warehouse-microservice commit ad8746a.]`
- `[PARTIAL: provisional timestamp/replay semantics landed in Warehouse commit 72d73ec; runtime constants remain missing.]`
- `[MISSING: owner approval before any Warehouse runtime adapter, src/** mutation, migration, deploy, or production fulfillment-row mutation.]`

Next action:

- Collect sanitized Allegro checkout-form enum fixtures and verify Orders source-reference preservation for Allegro-origin Warehouse handoff joins.

## 2026-07-03 - Allegro Buyer Cabinet Runtime Gate Closed

Intent chain:

- Vision: every selling platform must show customer-owned orders in the buyer personal cabinet without exposing marketplace rows that are not proven to belong to the Auth subject.
- Goal Impact: the Allegro buyer-cabinet runtime gate moved from deploy-gated source to live protected route/API evidence.
- System: Auth owns human identity and bearer `sub`; Allegro owns the buyer-safe marketplace projection and UI; Orders remains canonical order lifecycle and Warehouse handoff source.
- Feature: Allegro subject-bound buyer order cabinet runtime.
- Task: apply the approved additive `buyerAuthSubject` migration, deploy Allegro backend/frontend/gateway, and smoke buyer access.
- Execution Plan: fail closed for unauthenticated and unbound rows, avoid email-only authorization, and preserve cross-buyer detail as 404.
- Coding Prompt: no token, customer, provider payload, raw marketplace identifier, or secret output.
- Code: Allegro backend `78e0f5f`, hardening `9f07efc`, frontend `735ad1f`, gateway status fix `aa612fa`; Orders docs checkpoint in this commit.
- Validation: Allegro DB column/index probe, focused buyer spec, service/frontend/gateway builds, shipment snapshot verifier, `git diff --check`, deploy rollouts, and live HTTP smokes.

Evidence:

- Live Allegro deployments are all `1/1` ready on image tag `aa612fa`: service, api-gateway, frontend, settings, and imports.
- Live DB verification confirmed `AllegroOrder.buyerAuthSubject` and `allegro_orders_buyerAuthSubject_idx`.
- Public route smokes: `https://allegro.alfares.cz/` 200, `/cabinet/orders` 200, `/api/health` 200.
- Buyer API isolation smokes: unauthenticated `GET /api/allegro/buyer/orders` returned 401; synthetic Auth-subject buyer list returned success with zero rows; synthetic non-owned/missing buyer detail returned HTTP 404.
- Gateway defect found during smoke was fixed in Allegro `aa612fa`: upstream 4xx/5xx responses now propagate as HTTP status codes instead of 200 with error-shaped JSON.

Remaining gates:

- `[MISSING: real buyer Auth bearer plus approved subject-bound Allegro order row for live list/detail smoke.]`
- `[MISSING: approved historical marketplace-row binding/backfill source; default remains hidden without explicit Auth-subject binding.]`
- `[MISSING: real forwarded Allegro order lifecycle smoke proving central Orders status renders in the buyer cabinet.]`
- `[BLOCKED: delivery provider/courier runtime still requires approved source credential/scope proof, ledger/correlation ownership, fixture payloads, and tracking visibility policy.]`

Next action:

- Create or identify one safe real subject-bound Allegro order row and run a real-user buyer cabinet lifecycle smoke; keep shipment-status runtime implementation blocked until provider/courier gates are resolved.

## 2026-07-03 - Allegro Live Shipment Read Capability Integrated

Intent chain:

- Vision: runtime shipment reads must be proven with sanitized evidence before any projection migration, Warehouse adapter, or deploy.
- Goal Impact: the Allegro provider-read gate moved from expired-token failure to proven live-listed checkout-form shipment and carrier-tracking read capability, while local order correlation and optional shipment-management detail remain gated.
- System: Allegro owns OAuth/provider read capability; Warehouse owns downstream intake; Orders owns lifecycle orchestration and records the gate.
- Feature: sanitized live shipment-read capability proof integration.
- Task: integrate Allegro commit `795e7e0` live read result into Orders orchestration state.
- Execution Plan: accept sanitized live-listed read evidence, do not implement runtime code, and keep projection/client/adapter work blocked until migration approval, ledger/correlation ownership, visibility policy, and deploy/smoke gates are resolved.
- Coding Prompt: no token printing, no raw order id/waybill/shipment id/payload, no write endpoints, no deploy.
- Code: Allegro `795e7e0 docs: record live allegro shipment read probe`; Orders docs checkpoint in this commit.
- Validation: Allegro docs commit/pre-commit/push and Orders `git diff --check`.

Evidence:

- Runtime target documented by Allegro: live `allegro-service` pod in `statex-apps`.
- Probe used in-pod runtime env and printed only hashes for order, waybill, and shipment identifiers.
- Active account found: true; token present: true; token non-expired at verification time; token scopes configured: true; seller identity verified: true.
- `GET /order/checkout-forms?limit=20&offset=0` returned 200.
- `GET /order/checkout-forms/{id}` for the sampled live-listed order returned 200.
- `GET /order/checkout-forms/{id}/shipments` returned 200 with one shipment and hashed carrier/waybill/shipment identity only.
- `GET /order/carriers/{carrierId}/tracking?waybill=...` returned 200 with zero tracking items/events, which maps to unknown/no-provider-progress rather than a read failure.
- `GET /shipment-management/shipments/{shipmentId}` returned 404 and remains optional/fail-soft.
- A separate local projection sample of 30 non-cancelled local Allegro orders returned 404 for checkout-form shipments, so the runtime adapter must use live-listed checkout forms or fix local external-order correlation before shipment projection.
- No token, raw order id, buyer data, address, waybill, shipment id, or raw provider payload was printed.

Remaining gates:

- `[PROVEN: live-listed Allegro checkout-form list/detail/shipments and carrier-tracking read capability in allegro commit 795e7e0.]`
- `[UNKNOWN: local Allegro order projection correlation; 30 sampled local rows returned 404 through checkout-form shipments.]`
- `[UNKNOWN: shipment-management detail read returned 404 for sampled live-listed shipment id; keep optional/fail-soft.]`
- `[MISSING: owner approval for Allegro shipment projection Prisma migration/service implementation.]`
- `[MISSING: Warehouse consumer/runtime adapter for read-only shipment snapshots.]`
- `[MISSING: approved Warehouse shipment snapshot ledger or adapter-owned durable idempotency store.]`
- `[LANDED: source-only Warehouse shipment correlation registry/resolver in warehouse-microservice commit ec04ede; runtime producer/population path still missing.]`
- `[MISSING: product-approved tracking visibility matrix before any tracking number/URL appears in UI/API responses.]`
- `[MISSING: deploy approval and sanitized runtime smoke.]`

Next action:

- Implement a disabled-by-default Allegro shipment projection/client only after migration approval, Warehouse ledger/correlation decisions, and product tracking visibility rules are approved.

## 2026-07-03 - Allegro Shipment OAuth Capability Probe Integrated

Intent chain:

- Vision: runtime shipment reads must be proven with sanitized evidence before any projection migration, Warehouse adapter, or deploy.
- Goal Impact: the OAuth capability gate was first proven fail-closed in commit `8b1eb49`; newer live-listed read evidence in commit `795e7e0` supersedes the expired-token blocker.
- System: Allegro owns OAuth/provider read capability; Warehouse owns downstream intake; Orders owns lifecycle orchestration and records the gate.
- Feature: sanitized live shipment-read capability probe integration.
- Task: integrate Allegro commit `8b1eb49` capability-probe result into Orders orchestration state.
- Execution Plan: accept sanitized probe evidence, do not implement runtime code, and block projection/client/adapter work until credentials/scopes are fixed and re-probed.
- Coding Prompt: no token printing, no raw order id/waybill/shipment id/payload, no write endpoints, no deploy.
- Code: Allegro `8b1eb49 docs: record allegro shipment capability probe`; Orders docs checkpoint in this commit.
- Validation: Allegro docs commit/pre-commit and Orders `git diff --check`.

Evidence:

- Runtime target documented by Allegro: live `allegro-service` pod in `statex-apps`, image `localhost:5000/allegro-service:2c72f6b`.
- Probe used in-pod runtime env, decrypted token in memory only, selected one active account and one local Allegro-origin order sample, and printed only a hashed external order id.
- Active account found: true; token present: true; token scopes configured: true; seller identity verified: true; token expired: true.
- `GET /order/checkout-forms/{id}/shipments` attempted and returned 401.
- Carrier tracking and shipment-management detail were not attempted because the first read failed closed.
- No token, raw order id, buyer data, address, waybill, shipment id, or raw provider payload was printed.

Remaining gates:

- `[MISSING: refresh or replace active Allegro OAuth token and prove /order/checkout-forms/{id}/shipments read succeeds.]`
- `[UNKNOWN: carrier tracking read capability; not probed because shipment read returned 401.]`
- `[UNKNOWN: shipment-management detail read capability; not probed because shipment read returned 401.]`
- `[MISSING: owner approval for Allegro shipment projection Prisma migration/service implementation.]`
- `[MISSING: Warehouse consumer/runtime adapter and approved ledger/correlation source.]`

Next action:

- Superseded by the 2026-07-03 Allegro Live Shipment Read Capability entry above; next work is migration/ledger/correlation-gated runtime projection, not token repair.

## 2026-07-03 - Allegro Shipment Projection And Warehouse Consumer Contracts Integrated

Intent chain:

- Vision: Allegro-origin delivery progress should flow through sanitized Allegro snapshots, Warehouse transition validation, and bounded Orders lifecycle callbacks.
- Goal Impact: source contract, sensitive-data policy, fixture verifier, projection design, and Warehouse consumer contract are now landed; runtime work remains gated by OAuth, migration, ledger/correlation, adapter, deploy, and smoke approvals.
- System: Allegro owns provider reads and `allegro.shipment_status_snapshot.v1`; Warehouse owns post-`handed_to_delivery` fulfillment status intake and future ledger/correlation decisions; Orders owns lifecycle projection/events and must not consume raw Allegro snapshots directly.
- Feature: cross-repo shipment-status contract integration for the Orders lifecycle goal.
- Task: integrate Allegro projection design `9834f09` and Warehouse consumer contract `d90bd93` into Orders orchestration state.
- Execution Plan: accept committed docs/source evidence, keep runtime code/deploy blocked, and keep raw tracking payloads/numbers/URLs out of Orders events and callbacks.
- Coding Prompt: no runtime code, no DB migration, no secret read, no live provider call, no direct Orders ingestion of Allegro snapshots.
- Code: Allegro `9834f09 docs: design allegro shipment projection`; Warehouse `d90bd93 docs: define Allegro shipment snapshot consumer`; Orders docs checkpoint in this commit.
- Validation: Allegro `git diff --check` and pre-commit passed; Warehouse `git diff --check`, `npm run check:hosted-auth`, and pre-commit passed; Orders `git diff --check` passed.

Evidence:

- Allegro projection design doc proposes `AllegroShipmentProjection`, `AllegroShipmentPackageProjection`, `AllegroShipmentTrackingEventProjection`, and `AllegroShipmentSnapshotLedger`, reusing existing sync/cursor/audit foundation.
- Warehouse consumer contract accepts only normalized, redacted `allegro.shipment_status_snapshot.v1` fields after `handed_to_delivery`.
- Warehouse validation report: `docs/intent-preservation/validation-reports/VAL-WH-ALLEGRO-SNAPSHOT-CONSUMER.md`.
- Sensitive-data policy from Orders `6743613` keeps tracking numbers, tracking URLs, raw provider payloads, credentials, customer contact/address data, and raw provider responses out of events/logs/handoffs by default.

Remaining gates:

- `[PROVEN: live-listed Allegro checkout-form shipments and carrier-tracking read capability in allegro commit 795e7e0; local projection correlation still needs care.]`
- `[UNKNOWN: shipment-management detail read returned 404 for sampled live-listed shipment id; keep optional/fail-soft.]`
- `[MISSING: owner approval for Allegro shipment projection Prisma migration/service implementation.]`
- `[MISSING: Warehouse consumer/runtime adapter for read-only shipment snapshots.]`
- `[MISSING: approved Warehouse shipment snapshot ledger or adapter-owned durable idempotency store.]`
- `[LANDED: source-only Warehouse shipment correlation registry/resolver in warehouse-microservice commit ec04ede; runtime producer/population path still missing.]`
- `[MISSING: product-approved tracking visibility matrix before any tracking number/URL appears in UI/API responses.]`
- `[MISSING: deploy approval and sanitized runtime smoke.]`

Next action:

- Resolve Warehouse ledger/correlation ownership and run sanitized Allegro OAuth capability proof before projection migration/runtime adapter work.

## 2026-07-03 - Allegro Shipment Snapshot Verifier Source Landed

Intent chain:

- Vision: delivery progress for Allegro-origin orders should enter Warehouse/Orders only through sanitized, deterministic shipment snapshots.
- Goal Impact: the earlier missing fixture/test gate is closed at source level; runtime provider reads remain gated by OAuth, projection, and Warehouse consumer decisions.
- System: Allegro owns Ship with Allegro API/OAuth and provider reads; Warehouse owns bounded fulfillment status intake; Orders owns lifecycle projection/events and does not handle raw tracking payloads.
- Feature: Allegro shipment status snapshot mapper and synthetic verifier.
- Task: integrate the source-only Allegro verifier result into Orders orchestration state.
- Execution Plan: accept Allegro committed source evidence, do not deploy, do not read secrets, and keep runtime adapter work blocked until capability/projection gates are resolved.
- Coding Prompt: no provider simulator, no raw provider payload persistence, no tracking number/URL exposure, no Orders runtime code.
- Code: Allegro commit `e626e5c feat: add allegro shipment snapshot verifier`; Orders docs checkpoint in this commit.
- Validation: Allegro `npm run verify:shipment-status-snapshot`, Allegro `npm run build`, Allegro `git diff --check`, and Orders `git diff --check` passed.

Evidence:

- Allegro added `services/allegro-service/src/allegro/shipments/shipment-status-snapshot.mapper.ts`, `.fixtures.ts`, and `.mapper.spec.ts`.
- Verifier covers all approved source fixtures: no shipments, delivered waybill, multi-package batching, mixed carriers, tracking-null, OAuth 403, shipment-management redaction, and non-Allegro channel filter.
- Mapper hashes account/order/shipment/waybill identities, builds the documented idempotency key, derives latest status by newest tracking timestamp, batches carrier waybills at 20, and rejects forbidden sensitive keys.
- No live Allegro API/OAuth call, DB migration, Kubernetes change, deploy, provider simulator, secret read, tracking number/URL exposure, or Warehouse/Orders runtime code was added in this slice.

Remaining gates:

- `[PROVEN: live-listed Allegro checkout-form shipments and carrier-tracking read capability in allegro commit 795e7e0; local projection correlation still needs care.]`
- `[UNKNOWN: shipment-management detail read returned 404 for sampled live-listed shipment id; keep optional/fail-soft.]`
- `[LANDED: durable Allegro shipment projection schema/client design in allegro commit 9834f09; migration/service implementation still gated.]`
- `[MISSING: Warehouse consumer/runtime adapter for read-only shipment snapshots.]`
- `[MISSING: approved Warehouse shipment snapshot ledger or adapter-owned durable idempotency store.]`
- `[MISSING: deploy approval and runtime smoke for the eventual Allegro shipment-status path.]`

Next action:

- Run a sanitized OAuth capability probe and projection design lane before any Warehouse runtime consumer or deploy.

## 2026-07-03 - Warehouse Intake And Allegro Buyer UI Source Landed

Intent chain:

- Vision: delivery status and buyer order visibility should progress through bounded service-owned contracts before any production deploy.
- Goal Impact: Warehouse now has a documented bounded provider-status intake contract, and Allegro now has source for the buyer cabinet route; runtime deployment remains intentionally gated.
- System: Allegro owns buyer UI/API and provider shipment source; Warehouse owns fulfillment status intake; Orders owns lifecycle projection/events.
- Feature: Warehouse provider-status intake docs and Allegro buyer cabinet frontend source integration.
- Task: integrate Worker F and final Worker G frontend handoffs into Orders orchestration state.
- Execution Plan: accept committed source/docs evidence, keep deploy blocked until integration validation and approval, and keep raw tracking/customer/provider payloads out of Orders events.
- Coding Prompt: no runtime deploy, no DB migration, no secret read, no raw provider payload, no tracking URL/number exposure.
- Code: Warehouse `f104202 docs: define fulfillment provider status intake`; Allegro `735ad1f feat: add allegro buyer order cabinet route`.
- Validation: Warehouse `npm test -- --runInBand test/fulfillment-orders.service.spec.ts` passed; Orders `git diff --check` passed; Allegro `services/allegro-service npm run build` passed; Allegro `services/frontend npm run build` passed; Allegro `git diff --check` passed. Allegro has no `npm test` script in `services/allegro-service/package.json`, so focused spec execution remains worker-reported rather than independently rerun here.

Evidence:

- Warehouse `main`/`origin/main` clean at `f104202`; new doc `docs/contracts/fulfillment-provider-status-intake-contract.md` defines accepted post-handoff statuses, transition/idempotency rules, and sensitive-field rejection.
- Warehouse accepted statuses remain bounded to `in_delivery`, `delivered`, `not_delivered`, and `returned` after `handed_to_delivery`; direct terminal delivery transitions before in-delivery remain rejected unless separately approved.
- Allegro `main`/`origin/main` clean at `735ad1f`; buyer cabinet route files are now committed, including `services/frontend/src/pages/BuyerOrdersPage.tsx` and frontend route wiring.
- Runtime deployments were not changed in this slice.

Remaining gates:

- `[PROVEN: live-listed Allegro checkout-form shipments and carrier-tracking read capability in allegro commit 795e7e0; local projection correlation still needs care.]`
- `[UNKNOWN: shipment-management detail read returned 404 for sampled live-listed shipment id; keep optional/fail-soft.]`
- `[MISSING: approved Warehouse shipment snapshot ledger or adapter-owned durable idempotency store.]`
- `[LANDED: sanitized Allegro shipment snapshot fixture/verifier set in allegro commit e626e5c; runtime adapter tests still gated.]`
- `[LANDED: source build validation for Allegro buyer backend/frontend route; runtime authenticated smoke remains deploy-gated.]`
- `[MISSING: deploy approval and runtime smoke for Allegro buyer cabinet and shipment-status path.]`

Next action:

- Decide whether to start source-only Allegro shipment adapter/fixture implementation, then separately request deploy approval for Allegro buyer cabinet when migration/runtime gates are ready.

## 2026-07-03 - Allegro Buyer API Source Landed

Intent chain:

- Vision: customer-facing Allegro order cabinets must expose only orders with explicit Auth subject ownership while Orders remains canonical lifecycle source.
- Goal Impact: the approved Option 2 buyer-ownership contract now has backend source support and isolation test hardening; frontend cabinet files remain uncommitted and deployment is still gated.
- System: Auth owns JWT `sub`; Allegro owns buyer-facing read projection and seller dashboard; Orders owns lifecycle source.
- Feature: subject-bound Allegro buyer order API.
- Task: integrate Worker G backend handoff into Orders orchestration status.
- Execution Plan: accept source-only backend commits; keep `/dashboard/orders` unchanged; keep frontend Workstream B dependency-gated until UI files are validated and committed; no deploy.
- Coding Prompt: no buyerEmail authorization, unbound rows hidden, cross-buyer detail returns 404, buyer DTO remains safe.
- Code: Allegro `78e0f5f feat: add subject-bound allegro buyer order reads` and `9f07efc test: harden allegro buyer order isolation`.
- Validation: Worker G reported focused orders service spec, Allegro service build, diff check, and pushed backend hardening; orchestrator verified pushed `origin/main` at `9f07efc`.

Evidence:

- Allegro `main` and `origin/main` are at `9f07efc`.
- Backend source files changed by the hardening commit: `services/allegro-service/src/allegro/orders/orders.service.ts` and `orders.service.spec.ts`; `docs/orchestrator/STATUS.md` also updated in Allegro.
- Worker G left frontend cabinet files uncommitted because they were outside source-only backend Workstream A.
- Current dirty Allegro files are frontend/workstream docs only: `docs/orchestrator/2026-07-03-allegro-buyer-auth-contract-proposal.md`, `docs/orchestrator/STATUS.md`, `services/frontend/src/App.tsx`, and `services/frontend/src/pages/BuyerOrdersPage.tsx`.

Remaining gates:

- `[LANDED: Allegro buyer cabinet route source in commit 735ad1f.]`
- `[MISSING: migration/backfill decision for historical Allegro rows; default remains no buyer visibility without Auth subject binding.]`
- `[MISSING: deploy approval and runtime smoke after backend/frontend source validation.]`

Next action:

- Let Worker G or a dedicated frontend worker finish/validate the buyer cabinet UI before deployment.

## 2026-07-03 - Allegro Shipment Source Contract Landed

Intent chain:

- Vision: post-warehouse delivery progress for Allegro-origin orders should be based on a concrete provider source without Orders owning raw courier payloads.
- Goal Impact: the provider lane now has an Allegro-owned read-only shipment source contract; runtime adapter implementation remains gated by OAuth/credential proof, Warehouse mapping, and validated sanitized fixtures.
- System: Allegro owns Ship with Allegro API/OAuth and raw provider reads; Warehouse owns bounded fulfillment status intake; Orders owns lifecycle projection and events.
- Feature: Allegro shipment status source contract integration.
- Task: integrate Worker E handoff and update blocker scope from missing source contract to remaining implementation gates.
- Execution Plan: keep Orders documentation-only; do not deploy or add provider runtime code until Warehouse and Allegro workers finish source validation.
- Coding Prompt: preserve sensitive-data exclusion, no tracking numbers/URLs in Orders events, no raw provider payloads, no credential reads.
- Code: Allegro commit `2183fe8 docs: add allegro shipment status source contract`; Orders docs checkpoint in this commit.
- Validation: remote Allegro commit inspection plus Orders `git diff --check`.

Evidence:

- Worker E thread `019f265e-7e9e-7a03-b621-f030cc2ffd4e` pushed Allegro `2183fe8`.
- New Allegro contract doc: `docs/orchestrator/2026-07-03-allegro-shipment-status-source-contract.md`.
- Source decision: primary discovery `GET /order/checkout-forms/{allegroOrderId}/shipments`; primary tracking enrichment `GET /order/carriers/{carrierId}/tracking?waybill={waybill}` batched by carrier; optional `GET /shipment-management/shipments/{shipmentId}` only when a durable shipment id already exists.
- Explicitly forbidden for this lane: create/cancel shipment commands, label/protocol/pickup endpoints, fulfillment writes, fake provider simulators, raw provider payload persistence, and exposing tracking number/URL to Orders events.
- Contract `allegro.shipment_status_snapshot.v1` requires hashed external ids/waybills and bounded statuses only.

Remaining gates:

- `[PROVEN: live-listed Allegro checkout-form shipments and carrier-tracking read capability in allegro commit 795e7e0; local projection correlation still needs care.]`
- `[UNKNOWN: shipment-management detail read returned 404 for sampled live-listed shipment id; keep optional/fail-soft.]`
- `[LANDED: Warehouse bounded intake contract in warehouse-microservice commit f104202.]`
- `[MISSING: approved Warehouse shipment snapshot ledger or adapter-owned durable idempotency store.]`
- `[LANDED: sanitized Allegro shipment snapshot fixture/verifier set in allegro commit e626e5c; runtime adapter tests still gated.]`
- `[MISSING: product-approved tracking visibility matrix before any tracking number/URL appears in UI/API responses.]`

Next action:

- Wait for Worker F Warehouse intake contract and Worker G buyer API handoffs, then decide whether Allegro read-only adapter source can start without deploy.

## 2026-07-03 - Delivery Provider Source Approved For Contracting

Intent chain:

- Vision: customers and admins should see post-warehouse delivery progress without Orders owning courier credentials or raw provider tracking payloads.
- Goal Impact: the provider/courier lane is unblocked only at the source-selection level; implementation remains gated by Allegro-specific contract, credentials, mapping, and sensitive-data policy.
- System: Allegro owns the initial provider source for Allegro-origin orders through Ship with Allegro/shipment APIs; Warehouse owns bounded fulfillment status intake; Orders owns lifecycle projection/events; Notifications consumes bounded Orders events.
- Feature: Allegro shipment status source approval for future delivery-provider integration.
- Task: name and approve the concrete provider/courier owner source, split remaining blockers into parallel worker threads, and avoid runtime implementation until contracts are complete.
- Execution Plan: use `allegro` as the first provider owner source, scoped to Allegro-origin orders only; do not generalize to all channels and do not implement provider logic in Orders.
- Coding Prompt: remote-only on Alfares; documentation-only; no deploys, migrations, secret mutation, raw provider payloads, or shipment label/document writes.
- Code: `docs/orchestrator/2026-07-03-delivery-provider-shipment-status-plan.md`, `docs/orchestrator/STATUS.md`, `docs/IMPLEMENTATION_STATE.md`.
- Validation: remote doc diff hygiene and thread creation evidence: Worker E `019f265e-7e9e-7a03-b621-f030cc2ffd4e` and Worker F `019f265e-a504-78b3-acd8-c8ff42c745c1`.

Decision:

- Approved initial source: `allegro` / Ship with Allegro shipment APIs for Allegro-origin orders only.
- Allegro shipment source contract completed in Allegro `2183fe8`; implementation remains blocked by OAuth-scope confirmation, credential source, Warehouse mapping, idempotency ledger decision, sanitized fixtures, and product tracking visibility policy. Worker F `019f265e-a504-78b3-acd8-c8ff42c745c1` owns the Warehouse bounded intake contract.

Remaining blockers split to worker threads:
Additional per-blocker worker threads started by the orchestrator after source approval:

- P1 Allegro shipment source contract: `019f265f-14b0-74c1-8817-3ee56a6c4fb7`.
- P2 Warehouse Allegro status mapping: `019f265f-42ac-7591-b946-bee3b0184384`.
- P3 Shipment sensitive-data policy: `019f265f-9341-7492-971d-6f89bbe2644c`.
- P4 Allegro shipment credential source: `019f265f-ce89-77f2-a7d1-f584e88c5ed5`.
- P5 Allegro shipment fixture policy: `019f2660-06ce-78a0-bc4f-5f4752ee1a48`.

- `[LANDED: Allegro shipment source contract in allegro commit 2183fe8; endpoint choice and sanitized snapshot contract documented.]`
- `[MISSING: mapping from Allegro shipment/package/fulfillment statuses to Warehouse fulfillment statuses and Orders lifecycle stages after handed_to_delivery.]`
- `[LANDED: P3 sensitive-data policy in Orders commit 6743613; event/log exclusion rules are documented.]`
- `[MISSING: product-approved tracking visibility matrix before any tracking number/URL appears in UI/API responses.]`
- `[MISSING: runtime credential source in Vault/ExternalSecret for allegro-service shipment/fulfillment scope, not Orders.]`
- `[LANDED: sanitized Allegro shipment snapshot fixture/verifier set in allegro commit e626e5c.]`

Next action:

- Run final source integration validation, then decide whether source-only Allegro read adapter work can start without runtime deploy.

## 2026-07-03 - Allegro Buyer Ownership Option 2 Approved

Intent chain:

- Vision: customer-facing Allegro order cabinets must show only orders proven to belong to the authenticated buyer while Orders remains the canonical lifecycle source.
- Goal Impact: the buyer-cabinet blocker is reduced from ownership approval to source implementation and validation of Auth subject binding.
- System: Auth owns human identity and JWT `sub`; Allegro owns marketplace order projection and seller/operator workspace; Orders owns canonical lifecycle and immutable order snapshots.
- Feature: Allegro buyer personal cabinet ownership contract.
- Task: implement buyer-scoped read-only order list/detail and UI only for orders with explicit Auth subject binding.
- Execution Plan: persist or derive `AllegroOrder.authUserId`/`buyerAuthSubject` or equivalent Orders `customer.authSubject`/`customer.authUserId`; add buyer APIs and `/cabinet/orders`; keep seller/operator `/dashboard/orders` unchanged; fail closed for unbound imported marketplace rows.
- Coding Prompt: never authorize by `buyerEmail`; use Auth bearer `sub`; return 404 for cross-buyer detail reads; expose buyer-safe DTO only.
- Code: Allegro `78e0f5f feat: add subject-bound allegro buyer order reads`, `9f07efc test: harden allegro buyer order isolation`, and `735ad1f feat: add allegro buyer order cabinet route`.
- Validation: Allegro `orders.service.spec: PASS`, `services/allegro-service npm run build`, `services/frontend npm run build`, and `git diff --check` passed; runtime authenticated smoke remains deploy-gated.

Evidence:

- Owner approval received in orchestrator chat on 2026-07-03: `Approved. Option2`.
- Allegro contract doc updated in `docs/orchestrator/2026-07-03-allegro-buyer-auth-contract-proposal.md`.
- Approved route/API defaults: `/cabinet/orders`, `GET /api/allegro/buyer/orders`, `GET /api/allegro/buyer/orders/:id`.
- Approved cross-buyer behavior: 404.
- Email-only matching remains rejected; unbound marketplace-imported rows remain hidden.

Remaining gates:

- `[LANDED: Allegro backend source support for subject-bound buyer order reads in commits 78e0f5f and 9f07efc.]`
- `[MISSING: migration/backfill decision for historical Allegro rows; default is no backfill and no buyer visibility without Auth subject binding.]`
- `[LANDED: buyer-safe backend DTO/isolation tests in Allegro commits 78e0f5f and 9f07efc.]`
- `[LANDED: buyer frontend /cabinet/orders route in Allegro commit 735ad1f.]`
- `[MISSING: owner-approved DB migration/deploy and live authenticated buyer smoke.]`

Parallel execution:

| Workstream | Status | Owner role | Scope | Allowed files | Forbidden files | Validation | Merge order |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A Buyer API/schema | source landed: Allegro `78e0f5f` + `9f07efc` | Allegro backend owner | Add subject-bound persistence/derivation, buyer list/detail APIs, DTO, tests | `prisma/schema.prisma`, migrations only if required, `services/allegro-service/src/allegro/orders/*`, focused tests | Orders/Auth runtime, seller dashboard behavior, deploy scripts | orders service spec, build, isolation tests | 1 |
| B Buyer UI | source landed: Allegro `735ad1f` | Allegro frontend owner | Add `/cabinet/orders` only after API contract shape lands | `services/frontend/src/pages/*`, routing/auth client files | backend schema/API internals, seller `/dashboard/orders` rewrite | frontend build and route smoke | 2 |
| C Integration validation | deploy-gated | Orders/Allegro validation owner | Validate A+B together after migration/deploy | validation report/docs only | runtime deploy without approval | authenticated buyer list/detail smoke | 3 |

Next action:

- Run Allegro backend/frontend integration validation and deployment readiness checks before any deploy.

## 2026-07-03 - FlipFlop Admin Order Inventory Pricing RBAC Hardened

Intent chain:

- Vision: marketplace and storefront order/admin surfaces must not expose operational order, inventory, or pricing data to authenticated non-admin users.
- Goal Impact: the remaining FlipFlop admin route role-enforcement blocker from marketplace read-scope hardening is now closed for order, inventory, and pricing admin controllers.
- System: FlipFlop order-service owns storefront-local admin routes; Auth provides JWT roles; Orders remains canonical lifecycle source consumed by FlipFlop cabinets.
- Feature: FlipFlop admin route RBAC hardening.
- Task: apply existing shared `RolesGuard` and `@Roles` to admin order, inventory, and pricing controllers while preserving customer order scoping.
- Execution Plan: reuse the local marketing admin RBAC pattern; validate by focused source verifier and service build; deploy via FlipFlop standard script; smoke public/admin unauthenticated behavior.
- Coding Prompt: no new auth model, no customer cabinet ownership changes, no provider/courier runtime implementation.
- Code: FlipFlop commit `79dba51 feat: enhance admin controllers with role-based access control`.
- Validation: focused RBAC verifier passed; `git diff --check`; `python3 scripts/pre_coding_gate.py --root .`; strict doc audit 100/100; `cd services/order-service && npm run build`; production deploy, public smokes, unauthenticated 401 smokes, and authenticated non-FlipFlop-admin 403 smokes passed.

Evidence:

- `admin-orders.controller.ts`, `admin-inventory.controller.ts`, and `pricing.controller.ts` now use `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles(...)`.
- Allowed roles are `global:superadmin`, `global:platform_admin`, `app:flipflop-service:admin`, `app:flipflop:admin`, and `flipflop:admin`.
- Customer order reads remain scoped by `req.user.id`; no customer cabinet route was widened.
- Standard FlipFlop deploy completed successfully in `128.02s` and rolled out all six FlipFlop deployments.
- Kubernetes post-deploy status showed `flipflop-service`, `flipflop-frontend`, `flipflop-product-service`, `flipflop-cart-service`, `flipflop-order-service`, and `flipflop-user-service` ready/available/updated `1/1`.
- Public smoke: storefront root returned HTTP 200.
- Protected admin route smokes without credentials returned HTTP 401 for `/api/admin/orders`, `/api/admin/inventory/low-stock`, and `/api/admin/pricing/suggestions`.
- Authenticated non-FlipFlop-admin runtime smoke, using an existing in-pod service token without printing it, returned HTTP 403 for `/admin/orders`, `/admin/inventory/low-stock`, and `/admin/pricing/suggestions`.

Remaining blockers:

- `[MISSING: delivery-provider/courier owner repository or approved existing service for shipment-status source.]`
- `[LANDED: Allegro backend source support for subject-bound buyer order reads in commits 78e0f5f and 9f07efc.]`
- `[MISSING: migration/backfill decision for historical Allegro rows; default is no backfill and no buyer visibility without Auth subject binding.]`
- `[LANDED: buyer-safe backend DTO/isolation tests in Allegro commits 78e0f5f and 9f07efc.]`

Next action:

- Continue provider/courier contract-owner lane or buyer ownership contract lane; FlipFlop admin route role-enforcement review is complete.

## 2026-07-03 - Marketplace Order Read Scope Hardened

Intent chain:

- Vision: marketplace order cabinets and dashboards must not expose unrelated seller, workspace, or customer order rows while Orders remains the lifecycle source of truth.
- Goal Impact: Bazos, Aukro, and Heureka order read surfaces are hardened after the Allegro seller/workspace fix; FlipFlop customer order reads were verified already scoped to the authenticated user.
- System: Auth provides JWT actor identity and roles; marketplace services own local account/workspace ownership where available; Orders owns canonical lifecycle projection consumed by marketplace read models.
- Feature: marketplace order read authorization hardening for Bazos, Aukro, and Heureka.
- Task: pass authenticated actors into order read methods and fail closed where no safe account-owner mapping exists.
- Execution Plan: preserve admin operational visibility, use account ownership for Bazos because the schema has user ownership, require explicit admin roles for Aukro and Heureka because their marketplace account schemas do not expose a stable Auth owner field, then deploy and smoke protected routes.
- Coding Prompt: do not infer buyer ownership from raw marketplace email/login snapshots; mark missing buyer/provider contracts explicitly.
- Code: Bazos `1876b9b fix: scope bazos order reads by actor`; Aukro `ba1f6fd fix: require admin for aukro order reads`; Heureka `eec326f fix: require admin for heureka order reads`.
- Validation: `git diff --check`; Bazos service build plus targeted read-scope verifier; Aukro focused tests and service build; Heureka orders/dashboard self-tests and service build; all three commits pushed to `main`; Bazos, Aukro, and Heureka production deploys completed.

Evidence:

- k3s preflight after recovery showed node `alfares` `Ready` on `v1.34.6+k3s1`.
- Bazos `OrdersController` now passes `req.user` into list/detail reads. Non-admin actors are scoped through owned `BazosAccount.userId` or `BazosIdentity.userId`; admin roles retain unscoped visibility.
- Bazos deployed image `localhost:5000/bazos-service:1876b9b`; pod `bazos-service-54c55d79f-2b56r` is `1/1 Running`; `https://bazos.alfares.cz/health` returned HTTP 200; unauthenticated `https://bazos.alfares.cz/orders` returned HTTP 401.
- Aukro `OrdersController` now passes `req.user` into list/detail reads and `OrdersService` requires admin role for order reads because `AukroAccount` has no stable Auth owner field.
- Aukro deployed image `localhost:5000/aukro-service:ba1f6fd`; pod `aukro-service-68cfc6d6ff-5s98l` is `1/1 Running`; `https://aukro.alfares.cz/health` returned HTTP 200; unauthenticated `https://aukro.alfares.cz/aukro/orders` returned HTTP 403 from the admin-only boundary.
- Heureka `OrdersController` and dashboard order read model now require admin roles for order list/detail reads because `HeurekaAccount` has no stable Auth owner field.
- Heureka deployed images `localhost:5000/heureka-service:eec326f` and `localhost:5000/heureka-api-gateway:eec326f`; both deployments are ready/available `1/1`; `https://heureka.alfares.cz/api/health` returned HTTP 200; unauthenticated `https://heureka.alfares.cz/api/heureka/orders` returned HTTP 401.
- FlipFlop was source-audited: customer order reads already call `getOrders(req.user.id)` and `getOrder(req.user.id, id)`, and service lookups filter by `userId`. No FlipFlop runtime change was needed for customer order cabinet scoping in this slice.

Validation notes:

- Bazos Jest remains affected by pre-existing TypeScript/Jest transform debt (`jest-haste-map` name collision and TS syntax parse failure), so a targeted `ts-node` verifier was used and passed after the service build.
- Bazos and Aukro gateway `/api/<channel>/orders` public smoke currently returns 404 because those ingresses expose direct service paths for the checked order endpoints; this was recorded as route-shape debt, not an authorization failure.

Remaining blockers:

- `[LANDED: Allegro backend source support for subject-bound buyer order reads in commits 78e0f5f and 9f07efc.]`
- `[MISSING: migration/backfill decision for historical Allegro rows; default is no backfill and no buyer visibility without Auth subject binding.]`
- `[LANDED: buyer-safe backend DTO/isolation tests in Allegro commits 78e0f5f and 9f07efc.]`
- `[MISSING: stable Auth-owned account field for AukroAccount and HeurekaAccount if non-admin seller-scoped order reads are required.]`
- `[MISSING: delivery-provider/courier owner repository or approved existing service for shipment-status source.]`

Next action:

- Start source-only Allegro buyer API Workstream A behind the approved Option 2 subject-binding contract; do not deploy until validation evidence is reviewed.

## 2026-07-03 - Allegro Seller Workspace Order Read Scope Hardened

Intent chain:

- Vision: marketplace order dashboards must not expose another seller/workspace user's order rows while Orders remains the lifecycle source.
- Goal Impact: the existing Allegro seller/workspace order dashboard is now scoped by authenticated workspace ownership; this is separate from the still-blocked buyer personal cabinet.
- System: Auth provides JWT actor identity/roles; Allegro owns seller workspace account ownership; Orders owns central lifecycle projection consumed by Allegro order read models.
- Feature: Allegro seller/workspace order read authorization hardening.
- Task: pass JWT actor into Allegro order list/statistics/detail reads and scope non-admin users to orders connected to their own Allegro account.
- Execution Plan: avoid schema changes; preserve admin role visibility; filter workspace reads through `offer.account.userId` or `forwardingAttempts.account.userId`; return detail through scoped lookup to avoid order existence leakage.
- Coding Prompt: do not use buyer email equality as authorization; do not implement buyer cabinet without approved Auth/order ownership contract.
- Code: Allegro commit `2c72f6b fix: scope allegro order reads by workspace`.
- Validation: `git diff --check`, `orders.service.spec: PASS`, `npm run build`, GitHub push to Allegro `main`, and production deploy.

Evidence:

- `GET /allegro/orders`, `GET /allegro/orders/statistics`, and `GET /allegro/orders/:id` now receive `req.user` from `JwtAuthGuard`.
- Non-admin actors are scoped to Allegro orders whose related offer account or forwarding-attempt account belongs to the Auth user id.
- Admin roles `global:superadmin` and `app:allegro-service:admin` keep unscoped operational visibility.
- Detail reads use scoped `findFirst` instead of unscoped `findUnique`.
- If a guarded request unexpectedly has no actor, controller passes an empty actor so external reads fail closed instead of becoming unscoped.
- Deployed Allegro stack image tag `2c72f6b`: service, api-gateway, frontend, settings, and imports all report ready/available `1/1`.
- Live smoke: `https://allegro.alfares.cz/api/health` returned HTTP 200; unauthenticated `https://allegro.alfares.cz/api/allegro/orders` returned HTTP 401.

Remaining blockers:

- `[MISSING: buyer-facing Allegro personal cabinet product requirement.]`
- `[MISSING: approved Auth-to-Allegro-buyer ownership rule.]`
- `[MISSING: stable persisted buyer ownership field or verified buyer-link mapping.]`
- `[MISSING: delivery-provider/courier owner repository or approved existing service for shipment-status source.]`

Next action:

- Start source-only Allegro buyer API Workstream A behind the approved Option 2 subject-binding contract; do not deploy until validation evidence is reviewed.

## 2026-07-03 - Allegro Buyer Auth Ownership Audit Integrated

Intent chain:

- Vision: customer-facing order cabinets must show only orders owned by the authenticated customer while preserving Orders as lifecycle source.
- Goal Impact: the Allegro buyer-cabinet blocker is now narrowed from a broad unknown to a concrete Auth/order ownership contract gap.
- System: Auth owns user identity and profile; Allegro owns seller workspace data and marketplace buyer snapshots; Orders owns canonical lifecycle projection.
- Feature: buyer Auth ownership audit for future Allegro personal order cabinet.
- Task: inspect Auth and Allegro current source and record whether Auth identity can safely scope `AllegroOrder` buyer rows.
- Execution Plan: read Auth contract and Allegro source; document implementable ownership models; do not create runtime buyer routes until ownership is approved.
- Coding Prompt: do not use raw email equality as an authorization rule without product/Auth/security approval.
- Code: Allegro commit `9ee7ff3 docs: audit allegro buyer auth ownership contract`.
- Validation: remote source inspection, isolated clean main worktree, `git diff --check`, pre-commit, and push to Allegro `main`.

Evidence:

- Auth source proves canonical user identity via JWT `sub`, primary `email`, profile, checkout-data, delivery-address, and invoice-profile endpoints scoped to bearer subject.
- Allegro source separates workspace/seller identity (`AllegroAccount.userId`, `UserSettings.userId`) from marketplace buyer snapshots (`AllegroOrder.buyerId`, `buyerEmail`, `buyerLogin`).
- Current Allegro order read controller/service does not pass `req.user` into an ownership filter, so `/dashboard/orders` remains a seller/workspace surface, not a buyer personal cabinet.
- The audit explicitly rejects `Auth.email == AllegroOrder.buyerEmail` as a production authorization rule until approved.
- Original Allegro checkout currently has unrelated order-affinity dirty files; the audit was committed from isolated worktree `/tmp/allegro-doc-worktrees/buyer-auth-audit` onto `main` to avoid mixing changes.

Remaining blockers:

- `[MISSING: buyer-facing Allegro personal cabinet product requirement.]`
- `[MISSING: approved Auth-to-Allegro-buyer ownership rule.]`
- `[MISSING: stable persisted ownership field or verified buyer-link mapping.]`
- `[MISSING: buyer-safe API response contract and isolation tests.]`

Next action:

- Product/Auth/security owner must approve one ownership model before Allegro buyer-cabinet API/UI implementation.

## 2026-07-03 - Parallel Worker Outcomes: Provider Tracking And Allegro Buyer Cabinet

Intent chain:

- Vision: Orders lifecycle must be reliable across post-payment fulfillment, delivery visibility, and customer/admin marketplace cabinets.
- Goal Impact: the next two requested lanes were split into independent worker threads and resolved to documented contract blockers rather than unsafe invented runtime behavior.
- System: Orders remains canonical lifecycle source; Warehouse remains fulfillment/status authority; provider-owned delivery tracking and Allegro buyer-owned cabinet identity remain separate missing contracts.
- Feature: orchestrated parallel continuation after Warehouse fulfillment callback and marketplace polling rollout.
- Task: start and control two workers: delivery-provider tracking source discovery and Allegro buyer/customer cabinet scope.
- Execution Plan: keep write scopes disjoint, allow documentation-only blockers, and avoid deploy/runtime mutation without concrete owner contracts.
- Coding Prompt: remote-only on Alfares; do not fabricate courier adapters or buyer portals; mark unavailable contracts as `[MISSING: ...]`.
- Code: Orders commit `bef9df0`; Allegro commit `b5f855a`.
- Validation: remote git status, documentation diff hygiene from workers, and live baseline checks from orchestrator.

Evidence:

- Worker A thread `019f2539-e7fe-7c93-b80e-9c7e237011e1` inspected remote repos and found no standalone delivery/courier/provider/tracking source repository or approved provider contract. It committed `bef9df0 docs: plan delivery provider shipment status integration` in `orders-microservice`.
- Worker A plan file: `docs/orchestrator/2026-07-03-delivery-provider-shipment-status-plan.md`. Decision: implementation blocked until a provider/courier owner repository or approved existing service, webhook/polling contract, credential source, status mapping, and sensitive-data policy exist.
- Worker B thread `019f253a-29be-7e11-bc6b-206f99c07878` inspected remote Allegro and confirmed `/dashboard/orders` is an authenticated seller/workspace order dashboard that already polls central Orders lifecycle every 30 seconds, not a verified buyer personal cabinet. It committed `b5f855a docs: record allegro buyer order cabinet gap` in `allegro`.
- Worker B plan file: `allegro/docs/orchestrator/2026-07-03-buyer-order-cabinet-gap-plan.md`. Decision: implementation blocked until product approves buyer cabinet scope and Auth-to-Allegro-buyer order ownership is defined.
- Orchestrator live baseline after the workers: Orders `1/1` on `localhost:5000/orders-microservice:7bcfadd`, Warehouse `1/1` on `localhost:5000/warehouse-microservice:65e53c6`, Notifications `1/1` on `localhost:5000/notifications-microservice:866a49f`, Allegro service/frontend `1/1` on `c9ba31f`.

Remaining blockers:

- `[MISSING: delivery-provider/courier owner repository or approved existing service that owns courier credentials and raw tracking payloads.]`
- `[MISSING: provider status source contract: webhook or polling, authentication method, idempotency key, timestamp semantics, retry/error semantics, and sample payloads.]`
- `[MISSING: buyer-facing Allegro personal cabinet product requirement.]`
- `[MISSING: buyer Auth/session contract mapping a signed-in user to AllegroOrder buyerId/buyerEmail/buyerLogin or another stable buyer identity.]`
- `[MISSING: buyer-safe Allegro order API response contract and tests proving buyer A cannot see buyer B orders.]`

Next action:

- Continue with a contract-owner lane: either identify/approve the provider/courier owner for delivery tracking, or define the Allegro buyer Auth/order ownership contract before runtime implementation.

## 2026-07-03 - Delivery Provider Shipment Status Discovery

Intent chain:

- Vision: customers and admins should see accurate post-warehouse delivery progress without Orders becoming a courier system or exposing tracking secrets in events.
- Goal Impact: the approved next slice after Warehouse fulfillment callbacks was narrowed to provider-source discovery and contract planning; implementation is blocked until a real provider owner/source exists.
- System: Warehouse owns fulfillment and carrier handoff state; an as-yet-missing provider owner must own courier credentials/raw tracking payloads; Orders owns lifecycle projection/events; Notifications consumes bounded Orders events.
- Feature: delivery-provider shipment/tracking status integration after Warehouse fulfillment status projection.
- Task: discover repos/contracts, decide whether a bounded adapter can be safely implemented, and produce an agent-ready implementation plan.
- Execution Plan: inspect remote repositories and existing Orders/Warehouse/Notifications boundaries; document the provider-owned contract and parallel workstreams; do not invent a provider adapter.
- Coding Prompt: remote-only on Alfares; no local project files, deploys, DB migrations, secret changes, raw tracking data, fake simulators, or broad lifecycle schema changes.
- Code: `docs/orchestrator/2026-07-03-delivery-provider-shipment-status-plan.md`, `docs/orchestrator/STATUS.md`, `docs/IMPLEMENTATION_STATE.md`.
- Validation: documentation/diff validation only; implementation remains blocked by missing provider source.

Evidence:

- Remote repo-name discovery under `/home/ssf/Documents/Github` found no standalone delivery/courier/provider/tracking-source repo matching delivery/courier/carrier/shipment/shipping/tracking/provider/fulfillment.
- Inspected current repo states: Orders `58f8a66` clean before this slice, Warehouse `8b16fdb` clean, Notifications `20cd12a` clean, Suppliers `9745f5f` clean, Catalog `5c6c033` with unrelated docs dirt, Allegro `ed0dedd` clean, Aukro `f0847cf` clean, Heureka `824465e` clean, Bazos `2d47d16` clean, FlipFlop `f758f94` clean.
- Orders has legacy `src/shipments/*` CRUD for carrier/tracking/status records, but `ORDER_STATUS_TRANSITIONS.md` explicitly excludes shipment transitions as a separate contract and lifecycle docs still mark provider source missing.
- Warehouse owns `fulfillment_orders` statuses through `handed_to_delivery`, `in_delivery`, `delivered`, `not_delivered`, and `returned`, and can already sync bounded status updates back to Orders.
- Notifications can consume bounded Orders lifecycle/shipped events and rejects tracking fields; it is not a provider tracking source.

Decision:

- Implementation is blocked now. There is no safely discoverable concrete provider/status source, provider-owned repo, webhook/polling contract, credential source, or sample payload.

Remaining blockers:

- `[MISSING: delivery-provider/courier owner repository or approved existing service that owns courier credentials and raw tracking payloads.]`
- `[MISSING: provider status source contract: webhook or polling, authentication method, idempotency key, timestamp semantics, retry/error semantics, and sample payloads.]`
- `[MISSING: mapping from provider statuses to Warehouse fulfillment statuses and Orders lifecycle stages after handed_to_delivery.]`
- `[LANDED/SUPERSEDED: P3 sensitive-data policy landed later in Orders commit 6743613; product-approved tracking visibility matrix remains missing before any tracking number/URL display.]`
- `[MISSING: runtime credential source in Vault/ExternalSecret for the provider owner, not Orders.]`

Parallel execution:

- Ready now: provider discovery follow-up by orchestrator, limited to read-only repo/config discovery and product/provider owner confirmation.
- Dependency-gated: Warehouse bounded provider-status intake contract under `warehouse-microservice/src/fulfillment/**` and docs after provider source exists.
- Blocked: provider-owned adapter implementation in the owning provider repo.
- Final integration: Orders verifier/doc update only after Warehouse/provider contract exists; Notifications copy/routing validation after bounded Orders event evidence exists.

Next action:

- Orchestrator must identify or approve the provider/courier owner/source before any adapter implementation.

## 2026-07-03 - Warehouse Fulfillment Status Projection

Intent chain:

- Vision: post-payment warehouse/delivery progress should flow back into Orders lifecycle so customer/admin cabinets show current state.
- Goal Impact: Orders now accepts bounded Warehouse fulfillment status updates and projects them into canonical lifecycle stages/events.
- System: Warehouse owns fulfillment operational state; Orders owns lifecycle read models/events; frontends consume Orders lifecycle surfaces.
- Feature: internal `PUT /api/orders/:id/warehouse-fulfillment-status` endpoint for `warehouse-microservice`.
- Task: authorize Warehouse service token, normalize fulfillment status payloads, persist bounded summary under `warehouseHandoff.fulfillmentOrderHandoff`, update coarse order status projection, and publish lifecycle changed events.
- Execution Plan: map Warehouse statuses to existing lifecycle stages without exposing delivery address/tracking/provider data.
- Coding Prompt: do not move delivery-provider ownership into Orders; no raw Warehouse response bodies, tokens, tracking data, or customer data in events.
- Code: Orders auth guard, ExternalSecret token mapping, controller/service endpoint, lifecycle projection, verifier coverage.
- Validation: `npm test`, `npm run verify:event-contracts`, `npm run verify:payment-boundary`, and `git diff --check` passed.

Evidence:

- Warehouse `requested/collecting/forming/formed/handed_to_delivery/in_delivery/delivered/not_delivered/cancelled/returned` statuses map to existing Orders lifecycle stages.
- Lifecycle events remain bounded and continue omitting delivery addresses, tracking data, payment provider fields, tokens, and raw Warehouse bodies.
- `internal:warehouse-microservice:service` is authorized only for the new fulfillment-status update boundary.

Runtime evidence:

- Deployed Orders image `localhost:5000/orders-microservice:7bcfadd`; rollout passed and in-pod health returned `status=healthy`.
- Runtime token check confirmed `WAREHOUSE_INTERNAL_SERVICE_TOKEN` is present in the Orders pod without printing the value.
- Deployed Warehouse image `localhost:5000/warehouse-microservice:65e53c6`; Warehouse runtime has `ORDERS_SERVICE_URL=http://orders-microservice.statex-apps.svc.cluster.local:3203` and a service token present.
- Live smoke order `94ce9a4b-7c6a-4625-85c7-8d1b13228b2d` advanced Warehouse fulfillment order `6ada14af-20f8-4928-9a37-94a331d97be2` from `requested` to `collecting` through `POST /api/fulfillment-orders/order/:orderId/status`.
- Orders DB projection now stores `warehouseHandoff.fulfillmentOrderHandoff.warehouseStatus=collecting`, reason `CODEX_DELIVERY_STATUS_SMOKE`, and reference `codex-warehouse-status-smoke-1783035510`.
- Orders pod audit log recorded `order.warehouse_fulfillment_status.update` with `previousStatus=warehouse_fulfillment_requested` and `resultingStatus=warehouse_collecting`.
- `npm run verify:order-lifecycle-read-model` passed after deploy; Notifications Orders-events health showed `received=2`, `sent=2`, `failed=0`.

## 2026-07-03 - Notifications Orders Events Consumer Enabled

Intent chain:

- Vision: Orders lifecycle events should reach an operational notification route after order lifecycle changes.
- Goal Impact: the Notifications consumer gate is now closed for the approved recipient, with broker connection and one synthetic routed event proven live.
- System: Orders remains lifecycle event producer; Notifications consumes `orders.events` and sends bounded lifecycle notifications through the approved `orders.lifecycle` email route.
- Feature: enabled Notifications Orders events consumer with recipient `ssfskype@gmail.com`.
- Task: approve recipient, seed channel policy, enable consumer, deploy, and smoke through RabbitMQ.
- Execution Plan: validate source, apply ConfigMap before deploy, let startup migration seed `orders.lifecycle`, verify health, publish one synthetic lifecycle event, and read back bounded counters/status only.
- Coding Prompt: no secrets, no customer data, no production order row dump; synthetic smoke only.
- Code: Notifications `866a49f`.
- Validation: passed live consumer health and synthetic routing smoke.

Evidence:

- Notifications deployed `localhost:5000/notifications-microservice:866a49f` and startup ran migration `SeedOrdersLifecycleChannel1746445300000`.
- `orders.lifecycle` channel policy is active with `type=email`, `provider=ses`, `purposesAllowed=transactional`, and `applicationsAllowed=orders-microservice`.
- Public `https://notifications.alfares.cz/health/orders-events` returned `enabled=true`, `connected=true`, `consuming=true`, and `lastErrorCode=null`.
- Synthetic RabbitMQ event `codex-orders-lifecycle-smoke-1783034533137` produced consumer counters `received=1`, `sent=1`, `failed=0`.
- Notifications DB readback for the smoke event returned status `sent`, channel `email`, recipient `ssfskype@gmail.com`, type `order_status_update`, and provider message id present.

Remaining blockers:

- `[MISSING: customer-facing Allegro order cabinet if product requirements require a buyer portal beyond the currently implemented admin/order dashboard surface.]`
- `[MISSING: SSE/WebSocket push infrastructure if product requires server-pushed realtime beyond deployed bounded polling.]`

Next action:

- Continue with delivery-provider shipment-status contract and any product-confirmed Allegro buyer-cabinet scope.

## 2026-07-03 - Marketplace Order Cabinet Polling Rollout

Intent chain:

- Vision: every customer/admin order cabinet should reflect canonical Orders lifecycle changes after order creation, payment, warehouse handoff, and delivery progress without requiring a manual page reload.
- Goal Impact: the previously missing frontend refresh lane is now implemented and deployed for the audited marketplace surfaces that had order cabinets or order dashboards in this wave.
- System: Orders remains lifecycle source of truth; Warehouse remains stock/fulfillment authority; marketplace frontends poll their own bounded read models and render refreshed order state.
- Feature: visible-tab 30s polling/background refresh for customer/admin order lists and details where those surfaces exist.
- Task: implement, validate, push, deploy, and verify FlipFlop, Bazos, Aukro, Heureka, and Allegro order-status UI refresh.
- Execution Plan: keep deploys serialized after k3s recovery, validate source first, deploy each marketplace, then verify Kubernetes readiness and public HTTP where available.
- Coding Prompt: remote-only on Alfares; preserve existing branch/user work; do not mutate Orders/Warehouse data; do not invent realtime infrastructure where a bounded polling read model is the current safe contract.
- Code: FlipFlop `3b99ed4`, Bazos `2d47d16`, Aukro `f0847cf`, Heureka `824465e`, Allegro `c9ba31f`.
- Validation: passed for implemented marketplace polling wave; delivery-provider source remains dependency-gated.

Evidence:

- k3s was checked before continuing: node `alfares` was `Ready`; non-running pod noise was limited to unrelated batch/cron pods plus transient rollout pods.
- FlipFlop implemented shared visible polling hook and customer/admin list/detail background refresh; `npm --prefix services/frontend run build` and `git diff --check` passed; deployed `3b99ed4`; all six FlipFlop deployments became `1/1`; `https://flipflop.alfares.cz/` returned HTTP 200.
- Bazos implemented visible customer/admin UI order-status refresh in `services/aukro-service/src/ui/ui.assets.ts`; service build passed; deployed image `localhost:5000/bazos-service:2d47d16`; deployment `1/1`; repo clean.
- Aukro implemented dashboard polling shell and tests; UI spec, service build, and diff hygiene passed; deployed image `localhost:5000/aukro-service:f0847cf`; deployment `1/1`; repo clean.
- Heureka implemented public/dashboard polling and self-tests; service build and focused self-tests passed; deployed service and gateway images `824465e`; both deployments `1/1`; repo returned to clean `main`.
- Allegro implemented bounded visible polling for the existing order dashboard; frontend build and diff hygiene passed; deployed service, api-gateway, settings, imports, and frontend images `c9ba31f`; all deployments `1/1`; `https://allegro.alfares.cz/` returned HTTP 200; repo returned to clean `main`.

Remaining blockers:

- `[MISSING: customer-facing Allegro order cabinet if product requirements require a buyer portal beyond the currently implemented admin/order dashboard surface.]`
- `[MISSING: SSE/WebSocket push infrastructure; current deployed contract is bounded polling refresh rather than server-pushed realtime.]`

Next action:

- Continue with Notifications recipient/consumer readiness and delivery-provider shipment-status contract; add Allegro buyer-cabinet scope only after product confirms that Allegro needs a customer portal separate from the current dashboard.

## 2026-07-03 - K3s Recovery, Orders Event Health, Warehouse Fulfillment Handoff Smoke

Intent chain:

- Vision: paid Orders must reliably reserve stock, fulfill reservations, and create Warehouse fulfillment orders for delivery without depending on manual recovery.
- Goal Impact: the previously blocked k3s runtime is healthy again; Orders and Warehouse are deployed with the event outbox and fulfillment-order schema live; a fresh FlipFlop paid-order smoke proved create -> reserve -> paid -> fulfill -> Warehouse fulfillment-order handoff after recovery.
- System: Orders remains the canonical lifecycle/payment-status source; Warehouse remains stock/reservation/fulfillment-order authority; FlipFlop remains a channel client.
- Feature: live `/health/order-events` readiness without `/api`, delivery-country normalization for Warehouse fulfillment handoff, and runtime proof for paid-order Warehouse issue handoff.
- Task: verify k3s recovery, repair Orders health route, deploy Warehouse WH-G16, fix fulfillment delivery address normalization, deploy Orders, and run guarded live paid-order smoke.
- Execution Plan: verify cluster first, then Orders/Warehouse health, then one fresh channel smoke and one internal payment-status transition, then Warehouse fulfillment-order readback.
- Coding Prompt: remote-only on Alfares; do not edit local placeholder repo; do not print secrets; do not dump raw customer tables; do not enable Notifications consumer yet.
- Code: Orders commits `af0a4ea` and `fff0314`; Warehouse runtime image `4d0fa85` with `CreateFulfillmentOrders1781500000000` migration applied.
- Validation: passed for Orders/Warehouse paid-order core path; Notifications and frontend realtime remain dependency-gated.

Evidence:

- k3s recovered: node `alfares` is `Ready`; Orders, Warehouse, Auth, and Allegro deployments were observed `1/1` after the recovery wave.
- Orders deployed `localhost:5000/orders-microservice:af0a4ea` to expose `https://orders.alfares.cz/health/order-events` without `/api`; post-deploy endpoint returned `status=ready`, `brokerConnected=true`, `pendingCount=0`, and `failedCount=0`.
- Warehouse deployed `localhost:5000/warehouse-microservice:4d0fa85`; migration `CreateFulfillmentOrders1781500000000` applied and created `fulfillment_orders` plus `fulfillment_order_lines`.
- Orders deployed `localhost:5000/orders-microservice:fff0314` after fixing delivery country normalization so `Czech Republic` maps to `CZ` before Warehouse fulfillment-order payload creation.
- Source validation before deploy passed: `npm run build`, `npm run verify:event-contracts`, `npm run verify:payment-boundary`, `npm run verify:order-fulfillment-handoff`, and `git diff --check`.
- Fresh FlipFlop live smoke created order `ORD-1783032147411-920` with central Orders id `94ce9a4b-7c6a-4625-85c7-8d1b13228b2d` and accepted central contract `orders.create.v1`.
- Internal Payments boundary transition returned HTTP 200 and set `paymentStatus=paid`, `status=confirmed`, `warehouseHandoff.status=fulfilled`, and `warehouseHandoff.fulfillmentOrderHandoff.status=requested`.
- Warehouse fulfillment-order readback returned id `6ada14af-20f8-4928-9a37-94a331d97be2`, status `requested`, one line, requestedBy `service:orders-microservice`, and delivery address country `CZ`.
- Warehouse DB check confirmed one fulfillment order line for order `94ce9a4b-7c6a-4625-85c7-8d1b13228b2d`.
- Orders event outbox health after smoke remained ready with pending/failed `0`; DB status count showed `published|42`.

Operational notes:

- During k3s recovery there was a transient mass rollout/dependency wave; one payment smoke against `37eadfc3-f467-4395-8ba8-c82a1b256737` failed Warehouse lifecycle at the same time, but the identical Warehouse fulfill payload succeeded manually and the subsequent fresh smoke passed end to end after deployments stabilized.
- Warehouse reservation expiry CronJob initially showed 401/Error during recovery, then later completed with `expire-due` summary `examined=0 expired=0 failed=0` after runtime stabilization.
- Existing unrelated dirty changes remain in Orders repo and were not touched by this lane: `package.json`, `src/orders/orders.controller.ts`, `src/orders/orders.service.ts`, and `scripts/verify-order-affinity-replay-contract.js`.

Remaining blockers:


Next action:

- Continue with Notifications recipient/consumer readiness and frontend realtime/polling status propagation lanes, keeping Orders/Warehouse core path as the verified baseline.

## 2026-07-02 - Orders RabbitMQ URL Durable Source Repair

Intent chain:

- Vision: Orders lifecycle events should publish through the in-cluster RabbitMQ broker during paid-order smoke and normal Kubernetes runtime.
- Goal Impact: downstream consumers such as invoices can receive `orders.order.created.v1` and `orders.order.paid.v1` without relying on a host-only RabbitMQ address.
- System: Orders remains event producer; RabbitMQ remains broker; invoices remains a consumer.
- Feature: durable source config for Orders RabbitMQ URL.
- Task: align `k8s/configmap.yaml` with the live runtime repair that allowed the invoices final smoke to pass.
- Execution Plan: update source ConfigMap only; do not deploy from this lane.
- Coding Prompt: replace `host.k3s.internal` with the cluster service DNS name and record evidence.
- Code: `k8s/configmap.yaml`.
- Validation: source diff check plus live runtime evidence below.

Evidence:

- Live runtime was patched to `amqp://guest:guest@rabbitmq.statex-apps.svc.cluster.local:5672` and the active Orders pod exposed the same `RABBITMQ_URL`.
- Active Orders pod logged `Connected to RabbitMQ` after the config-only restart.
- The approved Cliplot invoices final-smoke fixture passed after this repair: `ORDER_ID=0a3e7eb8-244f-420b-bce7-67fe8f3d18f1`, `PAYMENT_APPLICATION_ID=cliplot`.
- This source update does not deploy Orders, Warehouse, Notifications, or Invoices.

## 2026-07-02 - Orders Outbox Migration Applied; K3s Control-Plane Blocker

Intent chain:

- Vision: the paid-order reliability wave must not leave Orders dependent on best-effort event publish or unavailable Warehouse handoff.
- Goal Impact: the Orders outbox database gate has been applied and the source/deployment image was prepared, but live rollout is blocked by a cluster-control-plane datastore lock before a ready Orders pod could be restored.
- System: Orders remains lifecycle/event source of truth; Warehouse WH-G16 deploy remains paused; Notifications remains disabled/drifted until producer and recipient gates are stable.
- Feature: live Orders `order_event_outbox` schema and immutable image rollout preparation for `/health/order-events`.
- Task: apply the approved outbox migration, validate source, deploy the image, repair local-registry image pull policy, and stop before Warehouse deploy because Orders has no live endpoint.
- Execution Plan: restore k3s control-plane health first, verify Orders ready `1/1` and `/health/order-events`, then continue with Warehouse WH-G16 migration/deploy and paid-order smoke.
- Coding Prompt: do not start Warehouse migration/deploy while Orders endpoint is unavailable; do not enable Notifications consumer without recipient and broker gates.
- Code: `migrations/007_create_order_event_outbox.sql` applied live; `bf74d38` sets Orders local-registry `imagePullPolicy: IfNotPresent`; live deployment template patched to `localhost:5000/orders-microservice:4d9c917` with `IfNotPresent`.
- Validation: source validation passed; runtime rollout is blocked by Alfares k3s datastore lock.

Evidence:

- Applied `migrations/007_create_order_event_outbox.sql` against the live `orders` database; PostgreSQL returned `CREATE TABLE` plus expected index creation.
- Orders source validation passed after the migration gate: `npm run build`, `npm run verify:event-contracts`, `npm run verify:order-fulfillment-handoff`, and `git diff --check`.
- `./scripts/deploy.sh` built and pushed `localhost:5000/orders-microservice:4d9c917`, but rollout stalled under local registry pull behavior; source fix `bf74d38` was committed and pushed to use `imagePullPolicy: IfNotPresent`.
- Runtime deployment currently has the correct desired state: `spec.replicas=1`, image `localhost:5000/orders-microservice:4d9c917`, policy `IfNotPresent`.
- Orders is not healthy live: pod `orders-microservice-6c54cf9765-67slg` is `Pending` with no pod IP, `orders-microservice` endpoints are empty, and external `https://orders.alfares.cz/health` returns HTTP 503 `no available server`.
- Alfares k3s logs show repeated `database is locked`, `Slow SQL`, EndpointSlice update timeouts, and node lease update timeouts.
- Non-interactive restart is unavailable for the current SSH user: `sudo -n systemctl restart k3s` fails with `sudo: a password is required`, and plain `systemctl restart k3s` requires interactive authentication.

Remaining blockers:

- `[MISSING: owner/platform k3s restart or equivalent Alfares control-plane recovery; Orders has no ready pod or endpoint.]`
- `[MISSING: Orders live /health and /health/order-events readiness after control-plane recovery.]`
- `[MISSING: Warehouse WH-G16 deployment/migration; intentionally paused while Orders is unavailable.]`
- `[MISSING: single guarded paid-order smoke create/reserve/pay/outbox/fulfillment after Orders and Warehouse are both ready.]`
- `[MISSING: Notifications consumer recipient/broker gate and drift repair after producer health is stable.]`
- `[MISSING: realtime or polling refresh in customer/admin order cabinets across marketplace frontends.]`

Next command after platform recovery:

1. `kubectl get deploy,pods,endpoints -n statex-apps -l app=orders-microservice`
2. `curl -k -fsS https://orders.alfares.cz/health && curl -k -fsS https://orders.alfares.cz/health/order-events`
3. `cd /home/ssf/Documents/Github/warehouse-microservice && ./scripts/deploy.sh`

## 2026-07-02 - Orders Warehouse Migration Gate Preflight

Intent chain:

- Vision: the final paid-order lifecycle wave should run only after the DB-mutating Orders and Warehouse changes have current non-mutating evidence.
- Goal Impact: the remaining runtime gate is narrower: Orders outbox source is valid, WH-G16 source is valid, Warehouse migration build output is hardened, and live schema checks prove both required table sets are still pending.
- System: Orders remains lifecycle/event source of truth; Warehouse remains fulfillment-order persistence and stock authority; Notifications remains deployed but disabled until the producer and recipient gates are live.
- Feature: preflight evidence for Orders durable event outbox deployment and Warehouse WH-G16 fulfillment-order deployment.
- Task: validate source/build contracts, inspect live schema read-only, and document exact owner-approval gates without running migrations.
- Execution Plan: keep Orders migration and Warehouse deploy as explicit owner-approved DB-mutating steps; after approval, apply Orders outbox migration/deploy, deploy Warehouse WH-G16, run live paid-order smoke, and only then enable Notifications consumer.
- Coding Prompt: no DB mutation, no deploy, no secret value print, no customer/order row dump in this preflight.
- Code: Warehouse `4d0fa85` hardens `npm run build` to full non-incremental TypeScript emit so TypeORM migration jobs include required entity files; Orders source remains `0f1f959` with outbox code already merged from `f7abb42`.
- Validation: passed for non-mutating preflight scope.

Evidence:

- Orders source validation passed: `git diff --check`, `npm run build`, `npm run verify:event-contracts`, `npm run verify:order-lifecycle-read-model`, `npm run verify:order-fulfillment-handoff`, and `npm run verify:order-reservation-gate`.
- Orders live checks: `orders-microservice` is ready `1/1` on `localhost:5000/orders-microservice:537a103`; external `/health/order-events` returns HTTP 404; read-only schema check returned `0` for `public.order_event_outbox`.
- Warehouse source validation passed after `4d0fa85`: `npm run build`, `node -e "require('./dist/src/database/typeorm-data-source.js')"`, `npm test -- --runInBand test/fulfillment-orders.service.spec.ts`, and `git diff --check`.
- Warehouse live checks: `warehouse-microservice` is ready `1/1` on `localhost:5000/warehouse-microservice:salespoint-20260702165156b`; external `/api/fulfillment-orders/order/codex-synthetic-probe` returns HTTP 404; read-only schema check returned `0` for fulfillment tables; `warehouse_migrations` contains only `InitialWarehouseSchema1781200000000`, `StockEventOutbox1781300000000`, and `AddSupplierConflictReviewMetadata1781400000000`.

Owner-approved commands still required:

1. Orders outbox migration and deploy:
   `ssh alfares "cd /home/ssf/Documents/Github/orders-microservice && kubectl exec -i -n statex-apps deploy/db-server-postgres -- psql -U dbadmin -d orders -v ON_ERROR_STOP=1 < migrations/007_create_order_event_outbox.sql && ./scripts/deploy.sh"`
2. Warehouse WH-G16 migration/deploy:
   `ssh alfares "cd /home/ssf/Documents/Github/warehouse-microservice && ./scripts/deploy.sh"`
3. Post-deploy live smoke: create/replay paid order through a channel, verify Warehouse reservation and fulfillment order, customer cabinet lifecycle, admin stats, and Notifications `/health/orders-events` before enabling the consumer.

Remaining blockers:

- `[MISSING: owner approval for Orders event outbox migration/deploy.]`
- `[MISSING: owner approval for Warehouse WH-G16 database migration deployment.]`
- `[MISSING: live paid-order end-to-end smoke after both DB-mutating deploys.]`
- `[MISSING: Notifications recipient route plus owner-approved ORDERS_EVENTS_CONSUMER_ENABLED=true flip.]`

## 2026-07-02 - Safe Marketplace And Notifications Runtime Wave

Intent chain:

- Vision: source-validated marketplace lifecycle views and notification routing should become live wherever deployment does not require database migrations or irreversible runtime flips.
- Goal Impact: Bazos, FlipFlop, and Notifications were deployed safely; Heureka, Allegro, and Aukro were confirmed already running their lifecycle commit-tag images; Orders and Warehouse remain explicitly migration-gated.
- System: Orders remains lifecycle/event source of truth; Warehouse remains reservation/fulfillment authority; marketplaces render Orders read models; Notifications is deployed with the Orders events RabbitMQ consumer disabled until recipient and enablement are owner-approved.
- Feature: live marketplace customer/admin order lifecycle visibility and Notifications consumer readiness surface without enabling live notification consumption.
- Task: deploy only non-migration services, preserve outbox/WH-G16 gates, verify readiness without secrets, row dumps, or live notification sends.
- Execution Plan: audit deploy scripts first, deploy safe services, correct Notifications deploy immutability, verify live HTTP/deployment health, then update the coordinator state.
- Coding Prompt: do not run Orders outbox migration/deploy or Warehouse WH-G16 migration/deploy without owner approval; do not query production customer/order rows or print secrets.
- Code: Bazos `cdcd739`, FlipFlop `216264b` from detached clean `origin/main`, Notifications `583da28` deploy-script hardening plus previously merged consumer code/config; coordinator docs in Orders.
- Validation: passed for runtime-safe scope.

Deployment evidence:

- Bazos deployed with `./scripts/deploy.sh`; deployment ready `1/1` on `localhost:5000/bazos-service:cdcd739`; public `https://bazos.alfares.cz/` returned HTTP 200.
- FlipFlop deployed from detached clean `origin/main` at `216264b`; generated ignored `dist` artifacts in temporary worktree, then `./scripts/deploy.sh` rebuilt and rolled out `flipflop-service`, frontend, product, cart, order, and user services; public `/` and `/api/products?limit=1` returned HTTP 200.
- Notifications deployed at `localhost:5000/notifications-microservice:583da28`; fixed `scripts/deploy.sh` to set the immutable image tag instead of mutable `latest`; `/health/orders-events` returned HTTP 200 with `enabled=false`, `connected=false`, `consuming=false`, queue `notifications.orders.lifecycle`, exchange `orders.events`, DLX/DLQ configured, and zero counters.
- Heureka, Allegro, and Aukro runtime deployments were already ready `1/1` on lifecycle commit-tag images `976a1a8`, `6c64a30`, and `ba61422`; public root checks returned HTTP 200 for all three.
- Source validation rerun in this wave: Bazos full service suite passed 10 suites / 125 tests; Notifications full suite passed 7 suites / 30 tests; FlipFlop clean worktree builds passed for shared plus api/product/cart/order/user services and Next frontend during deploy.

Remaining blockers:

- `[MISSING: owner approval for Orders event outbox migration/deploy and live /health/order-events readiness smoke.]`
- `[MISSING: owner approval for Warehouse WH-G16 deployment with database migration job.]`
- `[MISSING: live end-to-end paid order smoke after Orders outbox and Warehouse WH-G16 deployments.]`
- `[MISSING: Notifications production recipient route or ORDERS_EVENTS_NOTIFICATION_RECIPIENT plus owner-approved ORDERS_EVENTS_CONSUMER_ENABLED=true flip.]`
- `[MISSING: Delivery provider or shipment-status source contract after Warehouse handoff.]`

Boundary notes: no Orders or Warehouse deployment/migration was run; no production DB/customer/order rows, token values, raw Warehouse response bodies, or live notification sends were used.

## 2026-07-02 - Orders Event Outbox Source Lane

Intent chain:

- Vision: order lifecycle and status propagation should not depend only on an in-memory RabbitMQ publish attempt.
- Goal Impact: Orders now has a source-level durable event outbox and retry/readiness model for versioned order lifecycle events, preserving the existing RabbitMQ routing keys and payload contracts.
- System: Orders remains event producer and lifecycle source of truth; downstream consumers still consume `orders.events`; live consumer wiring remains service-owned.
- Feature: `order_event_outbox` entity, guarded migration, publisher bookkeeping for pending/published/failed attempts, retry loop for pending/failed order events, and `GET /health/order-events` readiness metadata.
- Task: record every Orders event publish attempt in an outbox row before RabbitMQ publish, update the row after accepted publish or failure, retry pending/failed rows after broker recovery, expose bounded readiness counts, and verify payload privacy/contract shape.
- Execution Plan: keep routing keys and payloads unchanged, add source-only persistence model and migration, extend `verify:event-contracts`, and defer production migration/deploy execution until owner approval.
- Coding Prompt: do not deploy, do not mutate production DB, do not print secrets/customer rows/order rows, and do not invent consumer queue ownership.
- Code: `src/orders/order-event-outbox.entity.ts`, `src/orders/order-events.service.ts`, `src/orders/orders.module.ts`, `src/health/health.controller.ts`, `src/health/health.module.ts`, `migrations/007_create_order_event_outbox.sql`, `scripts/verify-event-contracts.js`, `docs/orchestrator/ORDER_EVENT_CONTRACTS.md`.
- Validation: passed. Commands: `git diff --check`, `npm run build`, `npm run verify:event-contracts`, and full `npm test`.

Runtime gate: outbox table and `GET /health/order-events` are source-ready, but production remains gated by owner-approved Orders migration/deploy and a live readiness smoke. No production DB migration, deployment, secret read, customer row read, order row read, or event publish was run in this source lane.

Parallel execution: source lane is final-integration owned by Orders because it edits shared event producer files. Notifications, channel frontends, Warehouse WH-G16 deploy, and delivery-provider tracking remain dependency-gated parallel lanes with separate owners and must consume the unchanged `orders.events` contract after this lane is deployed.

## 2026-07-02 - Product Lifecycle Delivery Statistics For Catalog

Intent chain:

- Vision: Catalog can show product-level order, lifecycle, payment, delivery, and exception statistics without becoming order truth.
- Goal Impact: the C1 Catalog/admin delivery statistics lane no longer depends on a missing Orders source contract.
- System: Orders remains lifecycle/payment-status/delivery-status truth; Catalog remains product/admin UI truth; Warehouse remains stock and fulfillment-order truth.
- Feature: product-scoped `lifecycleStatistics` and `orderDeliveryStatistics` on `GET /api/orders/statistics/products/:productId`.
- Task: derive bounded aggregate lifecycle, payment, delivery, exception, and per-channel lifecycle counts from Orders that contain the requested Catalog product ID.
- Execution Plan: reuse the existing product statistics filters, cap lifecycle sampling at 1000 matching orders, keep delivery delay at `0` until an approved delivery-provider timestamp/ETA source exists, and return aggregate counts only.
- Coding Prompt: preserve privacy boundaries; do not expose PII, addresses, external IDs, payment-provider fields, raw Warehouse handoff details, item Warehouse IDs, tokens, or secrets.
- Code: `src/orders/orders.service.ts`, `scripts/verify-product-sales-statistics.js`, and `docs/orchestrator/GOAL17_PRODUCT_SALES_STATISTICS_CONTRACT.md`.
- Validation: passed. Commands: `git diff --check`, `npm run build`, `npm run verify:product-sales-statistics`, full `npm test`; Catalog consumer revalidation also passed with focused product-service tests, backend build, and frontend build.

Runtime gate: source is ready, but live Catalog smoke still requires Orders production deploy/scale-up after the Warehouse WH-G16 fulfillment-order deployment gate is approved and completed.

## 2026-07-02 - O0 Cross-Repo Validation And Deployment Gate

Intent chain:

- Vision: the full order lifecycle is reliable in source and can be proven live only after the required Warehouse and Orders/Payments runtime wave is deployed.
- Goal Impact: O0 consolidated the sub-agent outputs, cleaned and pushed the remaining handoff commits, reran source validation across Orders, Warehouse, Payments, FlipFlop, Heureka, Allegro, Aukro, Bazos, Catalog, and Notifications, and identified the exact live blockers.
- System: Orders is the lifecycle authority; Warehouse is the reservation and fulfillment-order authority; Payments is the payment authority; channel frontends render central Orders read models; Notifications remains router-only until broker runtime is approved.
- Feature: deployment-readiness evidence for reservation, payment, fulfillment handoff, lifecycle read models, status propagation, admin stats, and bounded notifications routing.
- Task: verify current remote state after sub-agent execution and record the deploy gate without running owner-approval-required migrations.
- Execution Plan: clean dirty handoff files, push scoped commits, run targeted validators/builds, inspect production deployments and live endpoints read-only, then document blockers.
- Coding Prompt: remote-only on `alfares`; do not run destructive actions, do not run Warehouse migrations without owner approval, and do not print secrets or customer data.
- Code: documentation/state only in this O0 sweep; feature source changes were already present in the remote repos.
- Validation: passed for source and contract scope; live end-to-end remains blocked by deployment state.

Validation evidence:

- Orders: `npm run verify:order-lifecycle-read-model`, `npm run verify:warehouse-handoff`, `npm run verify:order-fulfillment-handoff`, `npm run verify:payment-boundary`, `npm run verify:order-reservation-gate`, and full `npm test` passed.
- Warehouse: `npm test -- --runInBand test/fulfillment-orders.service.spec.ts` and `npm run build` passed.
- Payments: `npm test -- --runTestsByPath test/payments-orders-status-bridge.spec.ts` and `npm run build` passed.
- FlipFlop: `npm run verify:orders-hub-integration`, shared/order-service/frontend builds, and non-mutating `npm run verify:guest-checkout-ui` passed.
- Heureka: order ingestion verifier, runtime-readiness verifier, and service build passed.
- Allegro: shared/order service specs plus service/frontend builds passed.
- Aukro: service tests and build passed; synthetic smoke is blocked by `[MISSING: ORDER_SYNTHETIC_SMOKE_TOKEN]`.
- Bazos: shared Orders client spec, shared build, focused order-service spec, and service build passed.
- Catalog: focused product service spec, backend build, and frontend build passed.
- Notifications: Orders event notification router spec and build passed; live consumer remains blocked.

Runtime findings:

- Runtime recheck on 2026-07-02 found `orders-microservice` and `payments-microservice` deployments ready `1/1`; external `/health` returns HTTP 200 for both. This supersedes the earlier scale-to-zero finding.
- Production Warehouse health is HTTP 200, but `/api/fulfillment-orders/order/<synthetic>` is HTTP 404 because WH-G16 fulfillment-order endpoints are not deployed.
- Warehouse deploy script runs a Kubernetes migration job; WH-G16 deployment therefore needs explicit owner approval.
- FlipFlop `/cart` and `/orders` are HTTP 200 after the transient 503 cleared, and the non-mutating guest checkout UI verifier passed.

Blockers:

- `[MISSING: owner approval for Warehouse WH-G16 deployment with database migration job.]`
- `[MISSING: live end-to-end paid order smoke after Warehouse WH-G16 deployment.]`
- `[MISSING: Delivery provider or shipment-status source contract after Warehouse handoff.]`
- `[MISSING: Notifications live broker queue/retry/DLQ/recipient contract.]` Source branch `codex/notifications-orders-lifecycle-event` adds `orders.order.lifecycle_changed.v1` validation/routing, but live consumer wiring remains dependency-gated.
- `[MISSING: Bazos provider-backed order item and Warehouse warehouseId contract.]`

Next command:

- After owner approval: deploy `warehouse-microservice` WH-G16 first, then rerun live create/payment/fulfillment/cabinet and Catalog product-statistics smoke while confirming Orders/Payments remain healthy.

## 2026-07-02 - O1 Orders Lifecycle Read Model And Fulfillment Handoff

Intent chain:

- Vision: every sellable order exposes one authoritative lifecycle to customer and admin frontends without moving Warehouse, Payments, Catalog, Auth, Notifications, Leads, or Marketing ownership into Orders.
- Goal Impact: O1 gives channel frontends and admin dashboards a canonical Orders lifecycle read model and event contract, while W1 fulfillment handoff is now called from the paid transition.
- System: Orders owns lifecycle stage derivation, compatibility status projection, read models, lifecycle events, and the client call to Warehouse fulfillment orders; Warehouse owns stock, reservations, fulfillment-order persistence, and dispatch state; Payments owns payment truth; Auth owns identities and RBAC.
- Feature: additive lifecycle read model, `orders.order.lifecycle_changed.v1`, and Warehouse fulfillment-order dispatch handoff after payment fulfillment.
- Task: implement the O1 lane from `docs/orchestrator/2026-07-02-order-lifecycle-warehouse-status-rollout-plan.md` and incorporate the W1 `POST /api/fulfillment-orders` contract update.
- Execution Plan: keep existing coarse `status` backward-compatible, derive lifecycle from existing stored fields, add protected customer/admin reads, add lifecycle event contract/verifier, and wire the post-paid Warehouse fulfillment-order handoff without deploying.
- Coding Prompt: remote-only on `alfares`, preserve dirty product-affinity/event work, do not edit other repos, do not print secrets or raw customer/production data, and document unresolved contracts with `[MISSING: ...]`.
- Code: `src/orders/order-lifecycle.ts`, `src/orders/order-fulfillment-handoff.client.ts`, `src/orders/orders.service.ts`, `src/orders/orders.controller.ts`, `src/orders/order-event-contracts.ts`, `src/orders/order-events.service.ts`, `src/auth/jwt-roles.guard.ts`, event fixtures, verifiers, `package.json`, and lifecycle/event docs.
- Validation: passed. Commands: `npm run build`, `npm run verify:order-lifecycle-read-model`, `npm run verify:order-fulfillment-handoff`, `npm run verify:event-contracts`, `npm run verify:payment-boundary`, `npm run verify:order-reservation-gate`, `git diff --check`, and full `npm test`.

Implementation notes:

- Customer read surface: `GET /api/orders/customer/lifecycle`, protected by Auth-valid human users plus Orders read/admin roles, scoped to persisted `customer.email` until a stronger Auth subject-to-order mapping exists.
- Admin read surface: `GET /api/orders/admin/lifecycle`, protected by Orders read/admin/operator roles plus `internal:aukro-service:service`, with filters and aggregate counts by lifecycle stage, payment status, channel, delivery status, exception state, and totals by currency.
- AU1 read boundary: `internal:aukro-service:service` is explicitly allowed through `ORDER_ADMIN_LIFECYCLE_READ_ROLES` and `ORDER_DETAIL_READ_ROLES` for `GET /api/orders/admin/lifecycle` and `GET /api/orders/:id`; no customer-scope bypass was added.
- Event contract: `orders.order.lifecycle_changed.v1` is additive and does not replace existing created/updated/paid/shipped/cancelled events. Lifecycle events omit customer objects, delivery addresses, billing addresses, payment provider data, tracking data, tokens, raw Warehouse response bodies, raw reservation records, and item `warehouseId` values.
- W1 handoff: after first paid transition and existing reservation `fulfill` calls, Orders reads fulfilled reservations by order id and posts `POST /api/fulfillment-orders` with the W1-approved dispatch payload. The bounded handoff summary is stored under `warehouseHandoff.fulfillmentOrderHandoff`.

Boundary notes:

- No deployment or push was run.
- No production DB rows, token values, decoded JWTs, customer payload dumps, raw Warehouse response bodies, or non-Orders repo edits were used.
- Remaining blockers: `[MISSING: Delivery provider or shipment-status source contract after Warehouse handoff]`, `[MISSING: owner-approved FlipFlop auth-subject create/read smoke proving persisted customer.authSubject]`, `[MISSING: Cliplot hosted Auth callback/session contract before authenticated checkout can pass Auth subject]`, and `[MISSING: channel lead attribution source mapping]`.

2026-07-02 runtime update: FlipFlop `flipflop-order-service` now runs the
Auth-subject forwarding marker from commit `23b22e0`. Because the normal
Dockerfile rebuild path hit npm registry `ETIMEDOUT`, the deployed runtime was
updated by a patch image overlaying the already built order-service/shared
artifacts onto the current live image, then restarting only
`deployment/flipflop-order-service`. Rollout succeeded; live pod grep found the
`customer.authSubject` payload builder, public FlipFlop `/` and
`/api/products?limit=1` returned HTTP 200, and the guarded smoke default
preflight failed closed with `mutation=false`, `providerCall=false`, and only
approval/confirmation env blockers. The remaining F1 invoice-account evidence
gate is an owner-approved synthetic create/read smoke proving persisted
`customer.authSubject`.

Next unfinished chunk:

- O0 should integrate O1/W1 evidence, then unblock F1 FlipFlop central lifecycle UI and H1/A1/AU1/B1 marketplace lifecycle read-model consumers.

## 2026-07-02 - Invoices Service Read Boundary

Added a minimal Orders read boundary for the new `invoices-microservice`.
Orders now recognizes `x-service-name: invoices-microservice` with
`INVOICES_INTERNAL_SERVICE_TOKEN`/`INVOICES_ORDERS_SERVICE_TOKEN` as
`internal:invoices-microservice:service`, and `GET /api/orders/:id` explicitly
allows that role through `ORDER_DETAIL_READ_ROLES`.

Boundary decision: Orders events remain trigger-only and no customer, billing,
address, provider, or payment-detail fields were added to event payloads. The
new invoices service must use this internal read path to retrieve full order
snapshots for legal invoice generation.

Validation:

- `npm run verify:invoices-read-boundary`: passed.
- `npm run build`: passed.
- `git diff --check`: passed.
- `kubectl apply --dry-run=client -f k8s/external-secret.yaml -n statex-apps`: passed.

Deployment was not run. Runtime remains blocked until Vault projects the
invoices Orders service token and the new invoices service is deployed.

## 2026-07-01 - Cliplot No-Mutation Order Create Validation

Intent chain:

- Vision: Orders remains the canonical order lifecycle backbone and does not expose live create as a validation shortcut.
- Goal Impact: Cliplot can prove its `orders.create.v1` payload, caller identity, and idempotency shape before live order creation or Warehouse reservation is approved.
- System: Orders owns create/idempotency/status/events; Cliplot owns guarded checkout; Warehouse remains stock/reservation authority; Auth owns service identity.
- Feature: Protected no-mutation create-order validator.
- Task: add `POST /api/orders/validate-create` with the same create-order roles as live `POST /api/orders`, but without transaction/save/Warehouse/event side effects.
- Execution Plan: Orders-only endpoint and verifier first, then Cliplot guarded checkout integration.
- Coding Prompt: do not print token values, customer payloads, production order rows, DB rows, or Warehouse response bodies; keep live create untouched.
- Code: added `OrdersService.validateCreate`, controller route `POST /orders/validate-create`, and verifier coverage proving no transaction, save, Warehouse reservation, or event publish occurs.
- Validation: passed. Commands: `git diff --check`, `npm run build`, `npm run verify:create-order-contract`, and full `npm test`.

Deployment evidence:

- Commit `0611e4c feat: validate order create payload without mutation` built and deployed as `localhost:5000/orders-microservice:0611e4c`.
- `./scripts/deploy.sh` completed successfully; rollout passed and in-pod health returned `status=healthy`.
- No-token smoke to `POST /api/orders/validate-create` returned HTTP `401`, proving the endpoint remains protected.
- Cliplot pod smoke with `x-service-name=cliplot-service` and runtime `ORDERS_SERVICE_TOKEN` returned HTTP `201`, `success=true`, `valid=true`, `mutation=false`, `orderCreated=false`, `warehouseMutation=false`, `eventPublished=false`, `channel=cliplot`, `currency=CZK`, `paymentMethod=invoice`, and `idempotencyStatus=available`.

Boundary notes:

- No live order was created, no Warehouse reservation was attempted, and no `orders.order.created.v1` event was published by the validation endpoint.
- Token values remained runtime-only and were not printed or documented.
- Live Cliplot order creation still requires approved Warehouse reservation evidence and `ENABLE_LIVE_ORDER_SUBMIT=true` in Cliplot.

## 2026-07-01 - Cliplot Order Contract Support

Intent chain:

- Vision: Orders remains the canonical order lifecycle backbone for supported sellable channels.
- Goal Impact: Cliplot can use the same Orders create contract and machine-auth pattern as existing channel services without changing payment, stock, or provider ownership.
- System: Orders owns create/idempotency/status/events; Cliplot owns storefront checkout and caller headers; Auth owns service identity; Warehouse remains stock/reservation authority.
- Feature: Minimal Cliplot order contract support.
- Task: accept channel `cliplot`, accept internal caller `cliplot-service`, and wire the Orders-side token alias from Cliplot's existing Orders token source.
- Execution Plan: single-worker Orders patch only; no payment-provider code, destructive database work, secret value reads, or deployment.
- Coding Prompt: do not revert other edits, do not print token values or customer/order rows, preserve existing channels and callers.
- Code: updated Orders channel allowlists, create-order role allowlist, internal service-token guard, ExternalSecret alias, source docs, and contract verifier.
- Validation: passed. Commands: `git diff --check`, `npm run build`, `npm run verify:create-order-contract`, and `npm test`.

Boundary notes:

- No non-Orders repo was edited. `cliplot-service` was inspected read-only to confirm it already sends `x-service-name: cliplot-service` and has an `ORDERS_SERVICE_TOKEN` key name.
- DocsRAG query was skipped because no session token was available: `[MISSING: DocsRAG session JWT]`.
- Cliplot live submission remains gated by owner-approved smoke evidence and runtime secret sync; no deploy was run in this worker patch.

## 2026-07-01 - Goal 7.4A Orders Lead Attribution Event Contract For Leads

Intent chain:

- Vision: Orders remains the canonical order lifecycle and event producer while Leads consumes bounded read-only lifecycle signals.
- Goal Impact: Leads Goal 7.4 is unblocked by a stable optional attribution field on `orders.order.created.v1`.
- System: Orders owns create/idempotency/status/events; channel services own explicit source attribution mapping; Leads owns CRM attribution and may reject events without attribution; no downstream service becomes order truth.
- Feature: Goal 7.4A Orders lead-attribution event contract for Leads.
- Task: add a backwards-compatible optional `leadAttribution` contract to created events without inventing attribution from customer/contact/address/payment data.
- Execution Plan: single-owner Orders source lane; update DTO normalization, event builder/publisher, created-event fixture, verifiers, contract docs, and IPS state; no deploy without coordinator approval.
- Coding Prompt: do not edit non-Orders repos, add live consumers, mutate production DB data, print secrets/JWTs/DB rows/customer payloads, or infer CRM correlation from PII.
- Code: `orders.create.v1` now accepts optional `leadAttribution` with `leadId`, `source`, and `campaignId`; `orders.order.created.v1` includes `payload.leadAttribution` only when supplied; events without attribution preserve the prior `{ orderId, channel }` core shape.
- Validation: passed. Commands: `git diff --check`, `npm run build`, `npm run verify:create-order-contract`, `npm run verify:event-contracts`, `npm test`, missing-marker scan, and added-line sensitive literal scan.

Contract:

```ts
payload: {
  orderId: string;
  channel: string;
  leadAttribution?: {
    leadId?: string;
    source?: string;
    campaignId?: string;
  };
}
```

Validation evidence:

- Preflight remote status before edits: clean `main` with `## main...origin/main`.
- `git diff --check`: pass.
- `npm run build`: pass.
- `npm run verify:create-order-contract`: pass; create order contract verification ok.
- `npm run verify:event-contracts`: pass; event contract verification ok.
- `npm test`: pass; build plus transition, sensitive logging, create-order, idempotency, duplicate protection, reservation gate, event, warehouse, payment, pricing, product statistics, and admin operations verifiers all passed.
- Missing-marker scan: documented blockers only, including `[MISSING: DocsRAG session JWT]`, `[MISSING: channel lead attribution source mapping]`, pre-existing IPS/auth/monitoring debt, and Bazos provider-backed webhook unknown.
- Added-line sensitive literal scan: pass; no raw secret, bearer/JWT, email-like, or password-like literals were added. A broader source scan still sees the pre-existing `process.env.DB_PASSWORD` environment reference, not a raw value.

Deployment evidence:

- Owner approved continuation after source review; deployment was run with `./scripts/deploy.sh`.
- Image built and pushed as `localhost:5000/orders-microservice:5e97a1d` with digest `sha256:77a7f4606a5c9ba42981c31f04761b124393d5a49dec4288af8b5a6d38bbb62d`; `latest` points to the same digest.
- Kubernetes rollout completed successfully; in-pod `/health` returned `status=healthy` for `orders-microservice`.
- Post-deploy deployment snapshot: image `localhost:5000/orders-microservice:5e97a1d`, replicas `1`, updated `1`, ready `1`, available `1`.
- External health `https://orders.alfares.cz/health` returned `status=healthy`.

Boundary notes:

- No Leads, Marketing, Notifications, channel, Warehouse, Catalog, Auth, marketplace, or non-Orders repo was edited.
- No live consumer, deployment, DB mutation, runtime smoke, secret read, decoded JWT, customer payload, production order row, DB row, or payment data was used.
- Current blocker for automatic attribution remains `[MISSING: channel lead attribution source mapping]`; channel callers must supply explicit approved attribution fields before Leads can attribute automatically.

Next unfinished chunk:

- Goal 7.4 Leads consumer lane: consume `orders.order.created.v1` as a read-only signal, use `payload.leadAttribution` when present, and reject/skip events without approved attribution.

## 2026-07-01 - Goal 7.2 Channel Smoke Integration

Current focus:

- Integrate the completed channel caller header, Warehouse `warehouseId`, and sanitized create/idempotency/reservation smoke evidence into Orders coordinator state.

Intent Preservation Chain:

- Vision: Orders remains the canonical order lifecycle and statistics backbone for supported sellable channels.
- Goal Impact: FlipFlop, Heureka, Allegro, Aukro, and Bazos can authenticate to Orders, send `orders.create.v1`, preserve idempotency, and prove Warehouse reservation handoff without duplicating order truth.
- System: Orders owns canonical order lifecycle and Warehouse handoff requirement; channel services own channel ingestion and caller headers; Warehouse owns stock/reservation truth; Auth owns service identity.
- Feature: Goal 7.2 channel create caller readiness.
- Task: classify current repo state, preserve dirty worktree boundaries, consolidate channel smoke evidence, and update Orders coordinator docs.
- Execution Plan: inspect remote status/logs/reports read-only, do not edit channel repos, update only Orders coordinator docs, run docs validation.
- Coding Prompt: remote-only on `alfares`; no local Orders source writes; no raw secrets, decoded JWTs, customer data, DB rows, production order rows, or payment data.
- Code: `docs/IMPLEMENTATION_STATE.md`, `docs/orchestrator/PRODUCTION_ORDER_INTEGRATION_PLAN.md`, `docs/orchestrator/STATUS.md`.
- Validation: `git diff --check` for docs patch; no Orders build/deploy required because no runtime source changed.

Read-only repo state:

- `orders-microservice`: clean on `main`, latest `4abcaba`, deployed image observed as `localhost:5000/orders-microservice:43f9774`, deployment ready `1/1`.
- `flipflop-service`: clean on `main`; Orders readiness smoke report is present and passing. Later head `bcd1eb6` is separate FlipFlop lifecycle work and not used as the Orders smoke evidence anchor.
- `heureka-service`: dirty with dashboard/feed/admin/auth/report changes (`TASK-009`, feed mutation guard, dashboard module, JWT user context, Dockerfile/README/report updates). Classified as separate Heureka work, not an Orders Goal 7.2 credential-gate change.
- `allegro-service`, `aukro-service`, and `bazos-service`: clean on `main` with Goal 7.2 smoke evidence commits recorded.

Channel evidence:

- FlipFlop `reports/validation/orders-readiness-smoke/report-latest.json`: `ok=true`, owner-approved live smoke, auth accepted, HTTP 201, central Orders ID present, `contractVersion=orders.create.v1`, and Warehouse reservation status present.
- Heureka `ac26098 docs: record Heureka Orders smoke pass`: final sanitized smoke supersedes earlier reservation blockers; create/replay/cleanup evidence includes reservation status present and `reserved`.
- Allegro `ec6f97a fix: use warehouse uuid for order forwarding` plus `ac56dc4 docs: record allegro orders warehouse uuid smoke`: smoke passed after forwarding a Warehouse-owned UUID instead of non-UUID stock warehouse name.
- Aukro `4e11cdb fix: map aukro warehouse token to auth service credential`, `df8d16e docs: record aukro orders live smoke`, and `12f445e docs: record aukro live smoke cleanup`: live smoke and cleanup are recorded.
- Bazos `230c6b5 fix: align Bazos Orders auth token runtime fallback` plus `c028495 docs: record Bazos warehouse reservation smoke pass`: owner-approved create/replay/cancel Warehouse reservation smoke passed. True provider-backed Bazos marketplace order ingestion remains `[UNKNOWN: live Bazos marketplace webhook support]`.

Deployment evidence:

- Kubernetes readiness snapshot showed Orders, FlipFlop order service, Heureka, Allegro, Aukro, Bazos, and Warehouse deployments ready `1/1`.
- No deploy was run in this coordinator pass because the work is documentation-only and the runtime evidence was already deployed by the channel/Orders lanes.

Sensitive-data handling:

- No raw token values, decoded JWTs, customer payloads, production order rows, DB rows, Vault values, Warehouse response bodies beyond bounded smoke counters, or payment data were printed or changed.

Gate decision:

- Goal 7.2 channel caller header/`warehouseId` wiring and sanitized smokes: accept at the Orders coordinator level.
- Remaining Goal 7 work moves to 7.4 `orders.events` consumer design for Leads, Marketing, and Notifications, plus separate owner-approved non-marketplace app contracts.
- Heureka's current dirty dashboard/feed/admin worktree must stay isolated from this Orders coordinator docs integration.

Next unfinished chunk:

- Start Goal 7.4 design for Leads, Marketing, and Notifications `orders.events` consumers, or separately resolve the Heureka dashboard/feed lane outside Orders Goal 7.2.

## 2026-07-01 - Goal 7.2B Orders Warehouse Token Trim And Allegro Smoke

Intent chain:

- Vision: Orders remains the canonical lifecycle owner while Warehouse remains stock/reservation authority for sellable channels.
- Goal Impact: Allegro can complete the first sanitized canonical create/idempotency/reservation smoke without Orders inventing local stock truth.
- System: Auth owns service identity/RBAC; Orders owns create/idempotency/status; Warehouse owns reservation lifecycle; Allegro owns channel caller headers and payload mapping.
- Feature: Goal 7.2B Allegro create-order runtime readiness.
- Task: rotate/fix Orders-to-Warehouse runtime credential handling, deploy Orders, and rerun the owner-approved Allegro synthetic smoke.
- Execution Plan: use Auth service principal provisioning without printing token values, store only `WAREHOUSE_SERVICE_TOKEN` in Vault, force ESO sync, deploy the smallest Orders client fix, then create/replay/cancel a synthetic Allegro order.
- Coding Prompt: no raw Vault values, decoded JWTs, customer payloads, production order rows, DB row dumps, or payment data; record only bounded synthetic ids/statuses and env key names.
- Code: `src/warehouse/warehouse-reservation.client.ts` now trims `WAREHOUSE_SERVICE_TOKEN` or `WAREHOUSE_INTERNAL_SERVICE_TOKEN` before building the Axios `Authorization` header; `scripts/verify-warehouse-handoff-contract.js` covers raw newline and prefixed newline token shapes.
- Validation: passed. Commands/evidence: `git diff --check`, `npm run build`, `npm run verify:warehouse-handoff`, `npm run verify:order-reservation-gate`, `npm test`, Auth/Vault/Kubernetes secret key-name checks without values, post-deploy Axios reserve/cancel, and owner-approved Allegro create/replay/cancel smoke.

Runtime credential evidence:

- Auth service principal provisioning dry-run reported `wouldCreateUser=true`, `wouldAssignRole=true` for `orders-microservice` with `internal:warehouse-microservice:admin`.
- Apply created service principal `orders-warehouse-service@internal.alfares.cz` as `userType=service`, assigned `internal:warehouse-microservice:admin`, emitted a JWT only to a `0600` temp file, and did not print the token.
- Auth `/auth/validate` for the emitted token returned valid service identity with `serviceName=orders-microservice` and the Warehouse admin role.
- Vault key `secret/prod/orders-microservice#WAREHOUSE_SERVICE_TOKEN` was patched from stdin without printing the value; ExternalSecret `orders-microservice-secret` synced and the Kubernetes Secret key validated as Auth-valid through an in-pod check.
- Temp JWT files were removed from Auth, Allegro, and remote `/tmp` after smoke.

Bug and fix:

- Before the code fix, Warehouse protected reads and direct `fetch` reserve/cancel worked, but Axios reserve from Orders failed with `Invalid character in header content ["Authorization"]`.
- Root cause: the runtime token value was valid but contained surrounding whitespace/newline; `WarehouseReservationClient` checked `token?.trim()` but used the untrimmed value in the Axios header.
- Commit `43f9774 fix: trim warehouse reservation token` trims the selected runtime token before preserving a `Bearer ` prefix or adding one.

Deployment evidence:

- `./scripts/deploy.sh` built and pushed `localhost:5000/orders-microservice:43f9774` with digest `sha256:63407ca9b7bafce13798530a4dbef68f62a351a76f2b12f6c0e95980d4b3ff41`.
- Rollout completed successfully after a slow local image pull; in-pod `/health` returned `status=healthy`.
- Active deployment image is `localhost:5000/orders-microservice:43f9774`, ready `1/1`, updated `1`.
- Post-deploy Axios reserve/cancel from the Orders pod succeeded for synthetic order `codex-axios-reserve-1782895016472` and returned stock to the prior available/reserved counts.

Smoke evidence:

- Owner-approved Allegro smoke from the live Allegro pod used `orders.create.v1`, `x-internal-service-token`, `x-service-name=allegro-service`, stable synthetic `channelAccountId=codex-allegro-smoke-account`, Catalog product `c0de0000-0000-4000-8000-000000000011`, Warehouse-owned `warehouseId=c0de0000-0000-4000-8000-000000000013`, quantity `1`, and synthetic external order id `codex-allegro-smoke-1782895044726`.
- Create returned HTTP 201 with order `6898c3fa-e3e8-4eed-a723-11b58fc2ea3b`, `warehouseHandoff.status=reserved`, `reservedCount=1`, `failedCount=0`, `reasonCode=ORDER_CREATE_RESERVATION`.
- Exact idempotent replay returned HTTP 201, `sameOrder=true`, and the same `warehouseHandoff.status=reserved`, proving no duplicate order/reservation side effect on replay.
- Owner-approved cleanup cancellation returned HTTP 200 with order status `cancelled`, `warehouseHandoff.status=cancelled`, `reservedCount=1`, `failedCount=0`, `reasonCode=ORDER_CANCELLED`.
- Warehouse readback for order `6898c3fa-e3e8-4eed-a723-11b58fc2ea3b` returned HTTP 200, `totalReservations=1`, `active=0`, `cancelled=1`.
- Boundary: no Orders production customer data, production order rows, raw Allegro payloads, token values, decoded JWTs, or payment data were printed.

## 2026-07-01 - Goal 7.2 Orders Runtime Credential And Deploy Gate

Intent chain:

- Vision: Orders is the canonical order lifecycle and statistics backbone for supported sellable channels.
- Goal Impact: channel services can authenticate to the live `POST /api/orders` guard with least-privilege service identities before per-channel create smokes.
- System: Orders owns create/idempotency/status/events; Auth owns identity/RBAC; channel services own their caller tokens and header wiring; Warehouse remains stock/reservation authority.
- Feature: Goal 7 production order integration rollout.
- Task: prepare the Orders-side runtime credential and deploy gate for Goal 7.2 without editing channel repositories or printing token values.
- Execution Plan: single-owner Orders manifest/verifier/docs update; deploy only after validation and Kubernetes dry-run; channel code and smoke lanes remain separate.
- Coding Prompt: do not create or print Vault values, decoded JWTs, customer data, DB rows, or production orders; inspect only structural secret key names and runtime env-name presence.
- Code: updated `k8s/external-secret.yaml`, `scripts/verify-create-order-contract.js`, `docs/orchestrator/CHANNEL_ORDER_CREATE_CONTRACT.md`, `docs/orchestrator/CONTEXT_PACKAGE.md`, and `docs/orchestrator/EXECUTION_PLAN.md`.
- Validation: passed. Commands: `git diff --check`, `npm run build`, `npm run verify:create-order-contract`, `npm test`, Kubernetes server dry-run for `k8s/external-secret.yaml`, sensitive literal scan, missing-marker scan with documented blockers, `./scripts/deploy.sh`, rollout status, external `/health`, and runtime env-name presence check.

Preflight and deployed-state evidence:

- Remote source was clean on `main` at `d1c5a48 feat: plan production order integration`; `d1c5a48` was present and equal to `origin/main`.
- Before this lane, Kubernetes deployed image was `localhost:5000/orders-microservice:dba03dc`, so the 7.1 allowlist commit was present in source but not deployed.
- Before this lane, live Orders runtime exposed only `HEUREKA_INTERNAL_SERVICE_TOKEN` among the five requested channel token aliases; FlipFlop, Allegro, Aukro, and Bazos aliases were missing.
- Existing channel ExternalSecrets were structurally ready without printing values: FlipFlop secret exposed key names `JWT_TOKEN` and `ORDERS_SERVICE_TOKEN`; Allegro, Aukro, Bazos, and Heureka exposed `JWT_TOKEN`; all five channel ExternalSecrets reported `SecretSynced=True`.
- DocsRAG was not queried because no session `JWT_TOKEN` was available: `[MISSING: DocsRAG session JWT]`.

Implementation evidence:

- Orders ExternalSecret now maps `FLIPFLOP_INTERNAL_SERVICE_TOKEN` from `secret/prod/flipflop-service#ORDERS_SERVICE_TOKEN`.
- Orders ExternalSecret now maps `ALLEGRO_INTERNAL_SERVICE_TOKEN`, `AUKRO_INTERNAL_SERVICE_TOKEN`, and `BAZOS_INTERNAL_SERVICE_TOKEN` from each channel service `JWT_TOKEN` property.
- Existing `HEUREKA_INTERNAL_SERVICE_TOKEN` mapping remains `secret/prod/heureka-service#JWT_TOKEN`.
- `scripts/verify-create-order-contract.js` now verifies the guard roles, contract doc, and ExternalSecret mappings for all five supported channel service callers.

Validation evidence:

- `git diff --check`: pass.
- `npm run build`: pass.
- `npm run verify:create-order-contract`: pass; create order contract verification ok.
- `npm test`: pass; build plus transition, sensitive logging, create-order, idempotency, duplicate protection, reservation gate, event, warehouse, payment, pricing, product statistics, and admin operations verifiers all passed.
- `kubectl apply --dry-run=server -f k8s/external-secret.yaml -n statex-apps`: pass; ExternalSecret configured in server dry-run.
- Sensitive literal scan: pass; no raw secret/token literals reported.
- Missing-marker scan: documented blockers only, including `[MISSING: DocsRAG session JWT]`, pre-existing parallel handoff debt, and existing non-current auth/monitoring markers.

Deployment evidence:

- Pre-applied `k8s/external-secret.yaml`, forced ESO reconcile, and verified the Kubernetes Secret exposes all five requested channel token key names without printing values.
- Commit `342f003 chore: wire channel order caller tokens` was deployed with `./scripts/deploy.sh`.
- Image built and pushed as `localhost:5000/orders-microservice:342f003` with digest `sha256:d864e64aecbc7bb939108524e870822c0b05669a7893409474ac031197b438be`; `latest` was pushed to the same digest.
- Kubernetes rollout completed successfully in 254.51s; in-pod `/health` returned `status=healthy`.
- Post-deploy rollout status passed; deployment spec is `1` replica, `1` updated, `1` ready, active image `localhost:5000/orders-microservice:342f003`.
- External health `https://orders.alfares.cz/health` returned HTTP 200 with body `status=healthy` at `2026-07-01T06:46:39.616Z`.
- Runtime env-name presence check in the new pod reported all five aliases present: `FLIPFLOP_INTERNAL_SERVICE_TOKEN`, `ALLEGRO_INTERNAL_SERVICE_TOKEN`, `AUKRO_INTERNAL_SERVICE_TOKEN`, `BAZOS_INTERNAL_SERVICE_TOKEN`, and `HEUREKA_INTERNAL_SERVICE_TOKEN`.
- The prior `dba03dc` pod was observed terminating and no longer counted by the deployment replica status.

Boundary notes:

- No channel repositories were edited.
- No Vault secret values were created, printed, decoded, copied, or committed.
- No production database rows, customer data, payment data, order rows, or live create smokes were read or mutated.
- The remote `main` branch has the runtime credential commit locally; push was not run because deployment did not require it and the lane instruction said not to push unless required.

Parallel execution:

- Orders runtime credential/deploy gate: complete in this coordinator thread.
- Channel header plus `warehouseId` lanes remain separate and can now proceed without editing Orders files.
- Event consumer lanes and non-marketplace app contract decisions remain separate from this credential gate.

Next unfinished chunk:

- Goal 7.2 channel lanes: wire/verify create-order headers and Warehouse `warehouseId` forwarding in channel repositories, then run sanitized create/idempotency/Warehouse reservation smokes without printing secrets.

## 2026-06-30 - Goal 7 Production Order Integration Planning And Create Caller Allowlist

Intent chain:

- Vision: Orders becomes the canonical order/statistics backbone for supported sellable channels while downstream services consume bounded lifecycle signals.
- Goal Impact: production rollout is split into channel create readiness, event consumer readiness, and domain-local application decisions instead of forcing every application into Orders.
- System: Orders owns create/idempotency/status/events; Catalog owns products; Warehouse owns stock/reservations; Payments owns provider payment identity; Auth owns service/user identity; Leads/Marketing/Notifications consume signals.
- Feature: Goal 7 production order integration rollout.
- Task: create the rollout plan, start Goal 7, and expand Orders create caller role/machine-auth allowlist for supported channels.
- Execution Plan: coordinator-owned Orders slice; subagents ran read-only audits for channel services, event consumers, and non-marketplace candidates.
- Coding Prompt: do not read or print secrets, do not query production DB, do not copy customer/payment/address data, and do not edit neighboring repos in this slice.
- Code: updated `src/auth/jwt-roles.guard.ts`, `src/orders/orders.controller.ts`, `scripts/verify-create-order-contract.js`, `docs/orchestrator/CHANNEL_ORDER_CREATE_CONTRACT.md`, `docs/orchestrator/GOALS.md`, `docs/orchestrator/PRODUCTION_ORDER_INTEGRATION_PLAN.md`, `docs/orchestrator/CONTEXT_PACKAGE.md`, and `docs/orchestrator/EXECUTION_PLAN.md`.
- Validation: passed. Commands: `git diff --check`, `npm run build`, `npm run verify:create-order-contract`, `npm test`, missing-marker scan with documented pre-existing/new blockers, and sensitive literal scan with no matches.

Audit evidence:

- Channel services: FlipFlop and Heureka are source-ready by current evidence; Allegro, Aukro, and Bazos are not production-ready for canonical Orders create because they need accepted Orders auth wiring and `warehouseId` forwarding before the fail-closed Warehouse reservation gate can pass.
- Event consumers: Leads, Marketing, and Notifications do not currently subscribe to `orders.events` / `orders.order.*.v1`; each needs a queue binding, DTO/envelope mapper, idempotency/replay handling, and safe validation smoke before being marked integrated.
- Non-marketplace apps: Marathon, SpeakASAP, School Committee, and Rentabox remain domain-local. Future integration must be a separate owner-approved contract and should usually be a bounded purchase/contribution/rental signal, not central Orders ownership.
- DocsRAG: `[MISSING: DocsRAG session JWT]`; no RAG query was run in this session. This marker is an explicit blocker, not invented evidence.

Parallel execution:

- 7.1 Orders contract/RBAC slice: coordinator-owned and active.
- 7.2 channel auth/warehouseId lanes: ready to split by repo after dirty worktree review.
- 7.4 event consumer lanes: ready as separate Leads, Marketing, and Notifications design/implementation lanes.
- 7.5 non-marketplace app contracts: blocked for coding until owner approves a concrete app contract.

Next unfinished chunk:

- Goal 7.2: wire and validate channel caller credentials and create-order headers, starting with Allegro/Aukro/Bazos `warehouseId` plus auth gaps and a controlled FlipFlop/Heureka smoke plan.

## 2026-06-29 - Sellable Channel Warehouse Reservation Fail-Closed Gate

Intent chain:

- Vision: Orders remains canonical order lifecycle owner while Warehouse remains stock authority.
- Goal Impact: sellable channel creates no longer silently bypass Warehouse reservation when stock reservation is required for oversell prevention.
- System: central Orders create flow gates FlipFlop, Allegro, Aukro, Bazos, and Heureka orders on Warehouse reservation success.
- Feature: `POST /api/orders` persists and publishes a new sellable-channel order only when `WarehouseReservationClient.reserveOrderItems` returns `reserved`.
- Task: reject `disabled`, `skipped`, and `failed` Warehouse handoff results before the create transaction commits and before `orders.order.created.v1` publishes.
- Execution Plan: single coordinator-owned code/test/docs change; no parallel lane because the service create path, handoff contract, package test script, and shared status docs are coupled.
- Coding Prompt: implement the smallest Orders-local fail-closed gate without direct DB edits, raw secret output, channel-service edits, or local stock truth.
- Code: updated `src/orders/orders.service.ts`, `scripts/verify-order-reservation-gate.js`, `package.json`, and `docs/orchestrator/WAREHOUSE_HANDOFF_CONTRACT.md`.
- Validation: passed on 2026-06-29: `git diff --check`, `npm run build && npm run verify:order-reservation-gate && npm run verify:warehouse-handoff`, and `npm test`.

Parallel execution: final integration lane only. This change touches shared create behavior and shared IPS/status docs, so it was intentionally not split across agents.

Current evidence:

- Preflight remote worktree was clean on `main` at `ff820dd feat: allow Heureka order ingestion service role`.
- Channel audit input from the Catalog cross-repo plan identified the previous skip path: `WAREHOUSE_RESERVATION_ENABLED=false`, missing item `warehouseId`, or Warehouse request failure could leave sellable-channel orders with non-reserved handoff metadata.
- Orders now treats sellable channels as requiring Warehouse reservation at create time. `disabled`, `skipped`, and `failed` handoff statuses reject with a bounded BadRequest before created-event publication; no Warehouse response body, token, customer data, address, or payment data is included in the rejection.
- Channel-specific follow-up remains outside this repo: sellable channel services must keep resolving canonical Catalog product IDs and `warehouseId` before calling Orders.
- Deployment passed on 2026-06-29 with image `localhost:5000/orders-microservice:dba03dc`; rollout completed and in-pod `/health` returned `status=healthy`.

## 2026-06-27 - Dedicated Catalog Internal Service Token Runtime Wiring

Change: switched Orders ExternalSecret `CATALOG_INTERNAL_SERVICE_TOKEN` mapping from Catalog-owned storage to Auth-owned Vault property `secret/prod/auth-microservice#CATALOG_INTERNAL_SERVICE_TOKEN`. The Orders runtime guard still accepts Catalog calls only when `x-service-name` is `catalog-microservice` and the token matches the configured runtime key, mapping the actor to `internal:catalog-microservice:service`.

Boundary decision: no token values, decoded JWTs, passwords, or raw secret material were printed, committed, or copied into docs. Auth `/auth/validate` currently requires an active user-backed `sub`, so this remains a machine-auth header contract rather than an arbitrary Auth-signed service JWT.

Validation evidence: Kubernetes server dry-run passed for `k8s/external-secret.yaml`; the manifest was applied and force-reconciled with `SecretSynced=True`; live Orders pod `orders-microservice-757696f875-8gprf` exposes `CATALOG_INTERNAL_SERVICE_TOKEN`; live Catalog pod `catalog-microservice-77b79bd855-5xj9t` completed sanitized Catalog-to-Orders smoke with health/products/sales HTTP 200, `success=true`, `sourceStatus=available`, five channel rows, zero recent-history rows, and no customer/payment/address/provider markers. Source validation passed: `git diff --check`, `npm run verify:product-sales-statistics`, and `npm run build`.

Next action: monitor scheduled Catalog contract checks and keep Catalog/Bazos token rotation separate.

```yaml
id: ORDERS-ORCHESTRATOR-STATUS
status: active
owner: Orders owner
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: validated
upstream:
  - docs/orchestrator/EXECUTION_PLAN.md
  - docs/orchestrator/READINESS_GATES.md
downstream:
  - docs/IMPLEMENTATION_STATE.md
related_adrs: []
```


## 2026-06-12 - Intent Preservation Pack

Current focus:

- Owner-selected task: use the company standard Intent Preservation System in `orders-microservice`.
- Goal 1 - Orders Intent Preservation Pack.

Context search evidence:

- Reviewed current orders docs: `AGENTS.md`, `BUSINESS.md`, `SYSTEM.md`, `README.md`, `TASKS.md`, `CLAUDE.md`, and `STATE.json`.
- Reviewed current source layout and key modules under `src/orders`, `src/items`, `src/shipments`, `src/pricing`, and `src/auth`.
- Reviewed company-standard IPS examples from `auth-microservice/docs/orchestrator/*` and `catalog-microservice/docs/orchestrator/*`.
- Searched repository ecosystem docs for `orders-microservice`, order ownership, order events, pricing ownership, and FlipFlop order contract references.
- Reviewed shared ecosystem map entries naming Orders as central order processing and product list-pricing owner.
- Reviewed indexed shared e-commerce architecture references naming Orders as owner of orders, order items, status history, and shipments.
- Reviewed indexed FlipFlop e-commerce platform references requiring all orders to go through Orders and forbidding duplicate channel order truth.

Implementation evidence:

- Added `docs/IMPLEMENTATION_ORCHESTRATOR.md`.
- Added `docs/IMPLEMENTATION_STATE.md`.
- Added `docs/orchestrator/MASTER_PROMPT.md`.
- Added `docs/orchestrator/INTENT.md`.
- Added `docs/orchestrator/GOALS.md`.
- Added `docs/orchestrator/PLAN.md`.
- Added `docs/orchestrator/PROJECT_INVARIANTS.md`.
- Added `docs/orchestrator/CONTEXT_PACKAGE.md`.
- Added `docs/orchestrator/EXECUTION_PLAN.md`.
- Added `docs/orchestrator/PRE_CODING_GATE.md`.
- Added `docs/orchestrator/READINESS_GATES.md`.
- Added `docs/orchestrator/PROMPTS.md`.
- Added `implementation-goals/README.md` and reusable execution templates.
- Updated `AGENTS.md` to point future agents to the IPS pack.

Gate decision:

- Documentation-only readiness: accept.
- No runtime code changed.
- No deployment required.
- Live DocsRAG query was not run because no session JWT was available; local indexed docs and source-of-truth repository docs were used as compensating evidence.

Verification evidence:

- Documentation presence, missing-marker, and secret-pattern scans passed on 2026-06-12.
- `npm run build` was not required because no runtime TypeScript changed.

Next unfinished chunk:

- No active coding goal remains.
- Suggested next owner-selected item: Goal 2 - Order Contract And State Machine Hardening.

## 2026-06-12 - IPS Compliance Hardening

Current focus:

- Owner-selected task: use the company standard Intent Preservation System in the remote `orders-microservice` repository.
- Goal 1 - Orders Intent Preservation Pack, compliance hardening pass.

Context search evidence:

- Read company IPS standard files from `/Users/Sergej.Stasok/Documents/Gitlab/intent-preservation-system`: `README.md`, `23_documentation_contracts/DOCUMENTATION_COMPLETENESS_STANDARD.md`, and `23_documentation_contracts/OPERATIONAL_GATE_STANDARD.md`.
- Read current Orders source-of-truth docs: `AGENTS.md`, `BUSINESS.md`, `SYSTEM.md`, `README.md`, `TASKS.md`, `CLAUDE.md`, `STATE.json`, `docs/IMPLEMENTATION_ORCHESTRATOR.md`, `docs/IMPLEMENTATION_STATE.md`, `docs/orchestrator/*`, and `implementation-goals/*`.
- Searched remote repository ecosystem docs under `/home/ssf/Documents/Github` for `orders-microservice`, order events, channel forwarding, order processing, pricing suggestions, payment boundary, warehouse boundary, and marketplace order flow.
- Verified remote docs name Orders as central order processing owner; marketplace/channel services forward orders; payments leaves list-pricing ownership to Orders; warehouse owns stock effects; notifications/leads/marketing consume events without becoming order truth.

Implementation evidence:

- Added required metadata to IPS major documents that lacked it.
- Updated `docs/orchestrator/EXECUTION_PLAN.md` with company-required sections: metadata, traceability, goal impact, invariants, sensitive-data handling, contract validation, replay/determinism, scope, non-goals, files to inspect/create/modify/protect, implementation steps, tests, validation, gate commands, documentation updates, rollback, handoff prompt, and checklist.
- Created `docs/orchestrator/VALIDATION_REPORT.md`.
- Created `docs/orchestrator/AUDIT_REPORT.md`.
- Updated `implementation-goals/templates/EXECUTION_PLAN.md` with all required execution-plan sections.
- Updated `implementation-goals/templates/VALIDATION_REPORT.md` with all required validation-report sections.
- Updated `docs/IMPLEMENTATION_STATE.md` with metadata, evidence, and the next recommended goal.

Gate decision:

- Documentation-only readiness: accept pending final command verification.
- No runtime code changed.
- No deployment required.
- Live DocsRAG API was not run because no session JWT was available; remote indexed docs and source-of-truth repository docs were searched as compensating evidence.

Next unfinished chunk:

- Goal 2, chunk 2.1: document allowed order and item fulfillment status transitions.

Final verification evidence:

- Documentation presence check: pass; 18 IPS markdown files listed under `docs/orchestrator` and `implementation-goals`.
- Missing-marker check: pass; `rg '\[(MISSING|UNKNOWN):' ...` returned no matches.
- Metadata audit: pass; required metadata block present for 20 IPS markdown files checked.
- Sensitive literal audit: pass; no literal bearer-token, token, private-key, JWT-secret, DB-password, or client-secret values detected in IPS documentation scope.
- Runtime build: not run; no runtime source code changed.

Gate decision:

- Documentation-only readiness: accept.

Next unfinished chunk:

- Goal 2, chunk 2.1: document allowed order and item fulfillment status transitions.

## 2026-06-12 - Goal 2 Chunk 2.1 Status Transition Contract

Current focus:

- Owner-selected task: continue with the next task from IPS state.
- Goal 2 - Order Contract And State Machine Hardening.
- Chunk 2.1 - Document allowed order and item fulfillment status transitions.

Context search evidence:

- Read `docs/IMPLEMENTATION_STATE.md`, `docs/orchestrator/GOALS.md`, `docs/orchestrator/PLAN.md`, `docs/orchestrator/PROJECT_INVARIANTS.md`, and `docs/orchestrator/PRE_CODING_GATE.md`.
- Read `BUSINESS.md` and `SYSTEM.md`; confirmed the business requirement for a defined state machine and explicit human approval for cancellation/refund behavior.
- Read `src/orders/order.entity.ts`, `src/orders/orders.service.ts`, `src/items/order-item.entity.ts`, and `src/items/items.service.ts`; confirmed current persisted status values and current arbitrary-string update gap.
- Attempted live DocsRAG query; skipped with documented exception because `JWT_TOKEN` is unavailable in this session.

Implementation evidence:

- Added `docs/orchestrator/ORDER_STATUS_TRANSITIONS.md`.
- Updated `docs/orchestrator/EXECUTION_PLAN.md` for Goal 2, chunk 2.1.
- Updated `docs/orchestrator/GOALS.md` to mark chunk 2.1 complete and Goal 2 active.
- Updated `docs/IMPLEMENTATION_STATE.md` with compressed continuation state and next action.

Transition contract summary:

- Order normal path: `pending -> confirmed -> processing -> shipped -> delivered`.
- Order cancellation path: `pending|confirmed|processing -> cancelled` only with explicit human owner approval and audit evidence.
- Order terminal states: `delivered` and `cancelled` cannot transition through the normal status endpoint.
- Item fulfillment normal path: `pending -> reserved -> shipped -> delivered`.
- Runtime enforcement remains missing and is deferred to chunk 2.2.

Gate decision:

- Documentation-only readiness: pass with DocsRAG exception.
- No runtime code changed.
- No deployment required.

Final verification evidence:

- Documentation presence check: pass; `docs/orchestrator/ORDER_STATUS_TRANSITIONS.md` is present.
- Missing-marker check: pass; no `[(MISSING|UNKNOWN):` matches found.
- Transition discoverability check: pass; IPS docs reference the new contract and next Goal 2 chunk.
- Sensitive literal audit: pass; no literal bearer-token, token, private-key, JWT-secret, DB-password, password, or client-secret values detected in documentation scope.

Next unfinished chunk:

- Goal 2, chunk 2.2: add or verify runtime validation for order status transitions and item fulfillment transitions.

## 2026-06-12 - Production Readiness Roadmap

Current focus:

- Owner-selected task: study Orders and DocsRAG documentation and organize a production-readiness plan for making Orders available to FlipFlop and other ecosystem applications.
- Scope: documentation and roadmap only; no runtime code changed.

Context search evidence:

- Read Orders docs: `AGENTS.md`, `BUSINESS.md`, `SYSTEM.md`, `README.md`, `TASKS.md`, `STATE.json`, `docs/IMPLEMENTATION_STATE.md`, `docs/IMPLEMENTATION_ORCHESTRATOR.md`, `implementation-goals/README.md`, and `docs/orchestrator/*`.
- Read Orders source surfaces under `src/orders`, `src/items`, `src/shipments`, `src/pricing`, `src/auth`, and `src/main.ts`.
- Read DocsRAG docs: `AGENTS.md`, `BUSINESS.md`, `SYSTEM.md`, `GOALS.md`, `TASKS.md`, `STATE.json`, `docs/RAG_USAGE.md`, and production migration plans under `docs/superpowers/plans/`.
- Read DocsRAG source surfaces under `src/retrieval`, `src/ingestion`, `src/qdrant`, and `src/service-identity`.
- Read FlipFlop integration docs: `AGENTS.md`, `BUSINESS.md`, `SYSTEM.md`, `README.md`, and available external service integration references.
- Read company IPS baseline: `README.md` and `23_documentation_contracts/OPERATIONAL_GATE_STANDARD.md`.

Findings:

- Orders is deployed and documented as the canonical order lifecycle service, but production readiness for broad ecosystem use still depends on runtime state-machine enforcement, channel ingestion DTOs, idempotent order creation, event schema hardening, RBAC/service access, sensitive-data-safe audit logs, and deployment readiness evidence.
- DocsRAG is the intended source for broad ecosystem context. Live retrieval remains a known dependency while the parallel session fixes DocsRAG access/GVT/JWT availability.
- FlipFlop should be the first reference client for the canonical channel order contract because it is the clearest checkout-to-order use case.

Implementation evidence:

- Added `docs/orchestrator/PRODUCTION_READINESS_ROADMAP.md`.
- Updated this status file with documentation reviewed, findings, and the next action.
- Updated `docs/IMPLEMENTATION_STATE.md` to point to the roadmap and retain Goal 2 chunk 2.2 as the immediate next implementation step.

Final verification evidence:

- Documentation presence check: pass; `docs/orchestrator/PRODUCTION_READINESS_ROADMAP.md` is present in the IPS documentation set.
- Missing-marker check: pass; no `[(MISSING|UNKNOWN):` matches found in the IPS documentation scope.
- Sensitive literal audit: pass; no literal bearer-token, token, private-key, JWT-secret, DB-password, password, or client-secret values detected in documentation scope.
- Roadmap discoverability check: pass; `docs/IMPLEMENTATION_STATE.md` and this status file reference `docs/orchestrator/PRODUCTION_READINESS_ROADMAP.md`.
- Runtime build: pass; `npm run build` completed successfully.

Gate decision:

- Documentation-only readiness: accept.
- No deployment required.
- Live DocsRAG query was not executed in this session because service access is being fixed separately; source-of-truth docs and mirrored DocsRAG snapshots were used as compensating evidence.

Next unfinished chunk:

- Goal 2, chunk 2.2: add runtime validation for order status transitions and item fulfillment transitions.


## 2026-06-12 - Owner-Selected Orders Admin Frontend

Current focus:

- Owner-selected task: create a frontend/admin panel for `orders-microservice`.
- Scope: all-orders dashboard, source application/service tracking, order details, filters, and safe lifecycle logs.

Context search evidence:

- Read required Orders source-of-truth docs: `AGENTS.md`, `BUSINESS.md`, `SYSTEM.md`, `README.md`, `TASKS.md`, `STATE.json`, `docs/IMPLEMENTATION_STATE.md`, `docs/IMPLEMENTATION_ORCHESTRATOR.md`, `docs/orchestrator/*`, and `implementation-goals/README.md`.
- Read runtime source files: `src/main.ts`, `src/app.module.ts`, `src/auth/*`, `src/orders/*`, `src/items/*`, and `src/shipments/*`.
- Confirmed the service has no existing frontend framework or static asset setup; implemented a conservative NestJS-served admin panel instead of introducing a new frontend build pipeline.
- Generated a dashboard design concept for implementation guidance at `/Users/Sergej.Stasok/.codex/generated_images/019ebc4c-c3e5-77e2-82aa-4950fcd39b7b/ig_01b0f654ec60ad76016a2c2ac5af84819195dae361378f6c48.png`.
- Live DocsRAG query was not run because no session `JWT_TOKEN` was available; this bounded Orders-local admin surface proceeded from repository source-of-truth docs and source files.

Implementation evidence:

- Added `src/admin/admin.module.ts`.
- Added `src/admin/admin.controller.ts` with public HTML shell routes and protected admin JSON routes.
- Added `src/admin/admin.service.ts` with read-only dashboard/detail queries, application/service/source derivation from `channel`, filter handling, metrics, item/shipment detail serialization, timeline generation, and safe derived lifecycle logs.
- Added `src/admin/admin-ui.ts` with a self-contained responsive admin panel UI for token entry, metrics, filters, order table, details, timeline, and logs.
- Updated `src/app.module.ts` to register `AdminModule`.
- Updated `src/main.ts` so `/admin` and `/admin/orders` are served outside the `/api` prefix while `/api/admin/orders/dashboard` and `/api/admin/orders/:id` remain protected by the existing JWT role guard.
- Updated `docs/orchestrator/CONTEXT_PACKAGE.md`, `docs/orchestrator/EXECUTION_PLAN.md`, and `docs/IMPLEMENTATION_STATE.md` for this owner-selected chunk.

Safety and boundary notes:

- No order status mutation behavior changed.
- No cancellation, refund, payment identity, warehouse stock, catalog truth, notification delivery, CRM, or pricing behavior changed.
- No database migration was added.
- Admin logs are derived lifecycle/audit entries from existing order, item, and shipment metadata; raw production logs are not queried or exposed.
- Shipping and billing addresses are not serialized in the admin dashboard/detail APIs.

Verification evidence:

- `npm run build`: pass.
- Missing-marker scan: pass; no `[(MISSING|UNKNOWN):` matches found.
- Sensitive-pattern scan: reviewed; only hit was the existing `process.env.DB_PASSWORD` environment-variable reference in `src/app.module.ts`, with no literal secret value present.
- Browser/runtime UI verification was not run before deployment because the changed service was not yet running with the new build in production during implementation.

Gate decision:

- Integration readiness: accept with deployment follow-up.
- Deployment readiness: pending commit and deploy.

Next unfinished chunk:

- Deploy and smoke-check `/admin/orders`, then continue Goal 2, chunk 2.2: runtime validation for order and item fulfillment status transitions.


## 2026-06-12 - Orders Admin Deployment Evidence

Deployment evidence:

- Commit `c7eed31` created: `Add orders admin dashboard`.
- `./scripts/deploy.sh` built and pushed `localhost:5000/orders-microservice:c7eed31` / `latest` successfully.
- The deploy script rolled Kubernetes but failed its final in-pod health check because the runtime image does not include `wget`.
- Initial rollout did not pick up the new `latest` digest because the running pod still used an older cached image digest.
- Set deployment image to immutable `localhost:5000/orders-microservice:c7eed31`.
- Rollout initially blocked in init because BusyBox `nc` checks without timeout could hang while waiting on dependencies.
- Commit `086400b` created: `Add timeouts to orders init checks`, changing Orders init checks to `nc -w 2 -z ...`.
- Applied the manifest and kept the deployment image at `localhost:5000/orders-microservice:c7eed31`.
- Kubernetes rollout completed successfully.

Production verification evidence:

- Running pod: `orders-microservice-564ffdfbb-hgvk4`, status `1/1 Running`.
- Running image: `localhost:5000/orders-microservice@sha256:e88340faed13915bddfc8655bec5e90c325871d2e86f18d2b3693a7df0e869d1`.
- `curl -I -H 'Cache-Control: no-cache' https://orders.alfares.cz/health`: HTTP 200.
- `curl -I -H 'Cache-Control: no-cache' https://orders.alfares.cz/admin/orders`: HTTP 200, `content-type: text/html; charset=utf-8`.
- `curl -i -H 'Cache-Control: no-cache' 'https://orders.alfares.cz/api/admin/orders/dashboard?limit=1'`: HTTP 401 without bearer token, confirming admin JSON data remains protected by the existing JWT role guard.

Known follow-up:

- `./scripts/deploy.sh` should replace its final in-pod `wget` health check with a tool available in the runtime image, or use Kubernetes probes/external curl instead.
- Browser/IAB visual verification was not available in this turn; HTTP route checks verified the deployed admin shell and protected API behavior.

Gate decision:

- Deployment readiness: accept with deploy-script health-check follow-up.

Next unfinished chunk:

- Goal 2, chunk 2.2: add runtime validation for order status transitions and item fulfillment transitions.


## 2026-06-12 - Orders Runtime Image Health Tooling

Current focus:

- Owner-selected follow-up: add `wget` or `curl` to the Orders runtime Docker image so deploy-script in-pod health checks do not fail because of missing tools.

Implementation evidence:

- Updated `Dockerfile` production stage to install `ca-certificates`, `curl`, and `wget` with `--no-install-recommends`, then remove apt package lists.
- Commit `95432d0` created: `Add curl and wget to orders runtime image`.

Verification evidence:

- `npm run build`: pass before commit.
- `./scripts/deploy.sh`: pass after rerun.
- Docker image built and pushed as `localhost:5000/orders-microservice:95432d0` and `latest` with digest `sha256:1142327b6a4162ce1af4cbaa6375196691429413f9113dfcb65800e9d7630b09`.
- Deploy script rollout phase completed successfully.
- Deploy script in-pod health check using `wget -qO- http://localhost:3203/health` returned healthy JSON.
- Verified live pod has `/usr/bin/wget` and `/usr/bin/curl` available.

Gate decision:

- Deployment readiness: accept.

Next unfinished chunk:

- Goal 2, chunk 2.2: add runtime validation for order status transitions and item fulfillment transitions in a separate thread.

## 2026-06-12 - Goal 2 Chunk 2.2 Runtime Transition Validation

Current focus:

- Goal 2 - Order Contract And State Machine Hardening.
- Chunk 2.2 - Runtime validation for order status transitions and item fulfillment transitions.

Context search evidence:

- Read required Orders source-of-truth docs: `AGENTS.md`, `BUSINESS.md`, `SYSTEM.md`, `README.md`, `TASKS.md`, `STATE.json`, `docs/IMPLEMENTATION_STATE.md`, `docs/IMPLEMENTATION_ORCHESTRATOR.md`, `docs/orchestrator/MASTER_PROMPT.md`, `docs/orchestrator/INTENT.md`, `docs/orchestrator/GOALS.md`, `docs/orchestrator/PLAN.md`, `docs/orchestrator/PROJECT_INVARIANTS.md`, `docs/orchestrator/PRE_CODING_GATE.md`, `docs/orchestrator/READINESS_GATES.md`, `implementation-goals/README.md`, and `docs/orchestrator/ORDER_STATUS_TRANSITIONS.md`.
- Read affected runtime source: `src/orders/order.entity.ts`, `src/orders/orders.service.ts`, `src/orders/orders.controller.ts`, `src/items/order-item.entity.ts`, `src/items/items.service.ts`, `src/items/items.controller.ts`, and `package.json`.
- Refreshed `docs/orchestrator/CONTEXT_PACKAGE.md` and `docs/orchestrator/EXECUTION_PLAN.md` before coding.
- Live DocsRAG query was not run because no session `JWT_TOKEN` was available; this bounded Orders-local validation chunk proceeded from repository source-of-truth docs.

Implementation evidence:

- Added `src/orders/status-transitions.ts` with order and item fulfillment status normalization plus transition validation helpers.
- Updated `src/orders/orders.service.ts` so `PUT /api/orders/:id/status` validates before saving and before publishing `order.updated`.
- Updated `src/items/items.service.ts` so `PUT /api/items/:id/fulfillment` loads the current item, returns `404` for missing items, validates before saving, and rejects invalid fulfillment transitions.
- Marked Goal 2 chunk 2.2 complete in `docs/orchestrator/GOALS.md`.

Runtime behavior enforced:

- Allowed order path remains `pending -> confirmed -> processing -> shipped -> delivered`.
- Order jumps, reverse moves, unrecognized statuses, and transitions out of terminal states are rejected with `400 Bad Request`.
- `cancelled` through the normal status endpoint is rejected until Goal 2 chunk 2.3 adds explicit owner approval and audit evidence.
- Order `shipped` requires every item to be `shipped` or `delivered`; order `delivered` requires every item to be `delivered`.
- Allowed item path remains `pending -> reserved -> shipped -> delivered`.
- Item jumps, reverse moves, unrecognized statuses, terminal-state changes, and synthetic `cancelled` values are rejected.
- Item fulfillment updates do not silently move the parent order status.

Verification evidence:

- `npm run build`: pass.
- Direct compiled-helper verification: pass for allowed order transitions, rejected order jumps, terminal protection, cancellation rejection, item alignment rules, allowed item fulfillment transitions, rejected item jumps, terminal protection, and synthetic item cancellation rejection.
- `node --check dist/main.js`: pass.
- Missing-marker scan: pass; no `[(MISSING|UNKNOWN):` matches found.
- Sensitive-pattern scan over docs plus `src/orders` and `src/items`: pass; no literal bearer-token, token, private-key, JWT-secret, DB-password, password, or client-secret values detected.
- No `npm test` command exists and no test directory exists in the repo, so direct compiled-helper verification was used as targeted evidence.

Safety and boundary notes:

- No payment identity, stock ownership, product truth, notification delivery, CRM, cancellation approval automation, refund automation, or sensitive data logging changes were made.
- No database migration or production data dump was used.
- Existing unrelated dirty worktree files were not reverted.

Gate decision:

- Integration readiness: accept.
- Deployment readiness: pending commit and deploy.

Next unfinished chunk:

- Goal 2, chunk 2.3: add human-approval gates for cancellation, refund-like transitions, and destructive corrections.

## 2026-06-12 - Goal 2 Chunk 2.2 Deployment Evidence

Deployment evidence:

- Commit `e598278` created: `Record order transition validation evidence`.
- Source validation implementation was present in commit `9c04018`: `Update documentation and configuration for order status transitions`.
- `./scripts/deploy.sh` completed successfully and built/pushed `localhost:5000/orders-microservice:e598278` plus `latest` with digest `sha256:c836a04a46001718c5255217783596662ee14076fc97579286bc72139dafb68a`.
- Because the deployment initially stayed on the older cached `latest` digest, the deployment image was set to immutable `localhost:5000/orders-microservice:e598278` and rollout completed successfully.
- Final running pod: `orders-microservice-7bb7db659d-nrmx5`.
- Final running image: `localhost:5000/orders-microservice:e598278` with image ID `localhost:5000/orders-microservice@sha256:c836a04a46001718c5255217783596662ee14076fc97579286bc72139dafb68a`.

Production verification evidence:

- Deployment status: `replicas=1`, `updated=1`, `ready=1`, `available=1`.
- In-pod health check returned healthy JSON from `http://localhost:3203/health`.
- Public health check `curl -I -H 'Cache-Control: no-cache' https://orders.alfares.cz/health`: HTTP 200.
- Unauthenticated protected mutation smoke check `PUT /api/orders/00000000-0000-0000-0000-000000000000/status`: HTTP 401, confirming existing JWT guard still protects the mutation endpoint.
- Live container transition helper check rejected `pending -> processing` with `runtime transition rejection ok`.

Gate decision:

- Deployment readiness: accept.

Next unfinished chunk:

- Goal 2, chunk 2.3: add human-approval gates for cancellation, refund-like transitions, and destructive corrections.

## 2026-06-13 - Goal 2 Chunk 2.3 Approval Gates

Current focus:

- Goal 2 - Order Contract And State Machine Hardening.
- Chunk 2.3 - Human-approval gates for cancellation, refund-like transitions, and destructive corrections.

Context search evidence:

- Read required Orders source-of-truth docs: `AGENTS.md`, `BUSINESS.md`, `SYSTEM.md`, `README.md`, `TASKS.md`, `STATE.json`, `docs/IMPLEMENTATION_STATE.md`, `docs/IMPLEMENTATION_ORCHESTRATOR.md`, `docs/orchestrator/MASTER_PROMPT.md`, `docs/orchestrator/INTENT.md`, `docs/orchestrator/GOALS.md`, `docs/orchestrator/PLAN.md`, `docs/orchestrator/PROJECT_INVARIANTS.md`, `docs/orchestrator/PRE_CODING_GATE.md`, `docs/orchestrator/READINESS_GATES.md`, `implementation-goals/README.md`, and `docs/orchestrator/ORDER_STATUS_TRANSITIONS.md`.
- Read affected runtime source: `src/orders/status-transitions.ts`, `src/orders/orders.controller.ts`, `src/orders/orders.service.ts`, `src/orders/order-events.service.ts`, `src/auth/jwt-roles.guard.ts`, `src/auth/roles.decorator.ts`, `src/items/items.service.ts`, and `package.json`.
- Refreshed `docs/orchestrator/CONTEXT_PACKAGE.md` and `docs/orchestrator/EXECUTION_PLAN.md` before coding.
- Live DocsRAG query was not run because no session `JWT_TOKEN` was available; this bounded Orders-local approval-gate chunk proceeded from repository source-of-truth docs.

Implementation evidence:

- Extended `src/orders/status-transitions.ts` with constrained approval payload types, cancellation approval validation, refund-like order status rejection, terminal destructive correction rejection, and explicit item cancellation/refund/return rejection messages.
- Updated `src/orders/orders.controller.ts` so `PUT /api/orders/:id/status` accepts optional `approval` metadata and passes Auth actor identity from the request.
- Updated `src/orders/orders.service.ts` to validate through the audited transition helper and publish approval metadata only for approved cancellations.
- Updated `src/orders/order-events.service.ts` so `order.updated` can carry additive safe approval metadata for approved cancellation events.
- Updated `docs/orchestrator/GOALS.md`, `docs/orchestrator/PLAN.md`, `implementation-goals/README.md`, and `docs/orchestrator/ORDER_STATUS_TRANSITIONS.md` so the next chunk is Goal 2 chunk 2.4.

Runtime behavior enforced:

- Normal order transitions remain unchanged.
- `pending|confirmed|processing -> cancelled` is allowed only with `approval.approved=true`, `approval.approvalType=human`, actor identity, safe `reasonCode`, and side-effect acknowledgements for payment, warehouse, notification, CRM, and channel.
- Cancellation without approval or without complete side-effect acknowledgements returns `400 Bad Request`.
- `shipped -> cancelled` remains rejected.
- Terminal-state destructive corrections remain rejected through the normal status endpoint.
- Refund-like order statuses remain rejected as Payments-owned.
- Synthetic item cancellation, refund, and return statuses remain rejected until owner-approved schema/API work exists.

Verification evidence:

- `npm run build`: pass.
- Direct compiled-helper verification: pass for normal transition preservation, approved cancellation audit output, missing approval rejection, missing side-effect rejection, shipped cancellation rejection, terminal destructive correction rejection, refund-like order rejection, and synthetic item return rejection.
- `node --check dist/main.js`: pass.
- Missing-marker scan: pass; no `[(MISSING|UNKNOWN):` matches found.
- Sensitive-pattern scan over docs plus `src/orders` and `src/items`: pass; no literal bearer-token, token, private-key, JWT-secret, DB-password, password, or client-secret values detected.
- `git diff --check`: pass.
- No `npm test` command exists and no test directory exists in the repo, so direct compiled-helper verification was used as targeted evidence.

Safety and boundary notes:

- No payment identity, refund execution, stock ownership, warehouse stock release, product truth, notification delivery, CRM campaign execution, pricing, auth, shipment status, sensitive-data logging, schema migration, or production data dump changes were made.
- Cancellation approval records only safe metadata: actor identity, reason code, side-effect booleans, previous/requested/resulting statuses, and timestamp.
- Existing unrelated dirty worktree files were not reverted.

Gate decision:

- Integration readiness: accept.
- Deployment readiness: pending commit and deploy.

Next unfinished chunk:

- Goal 2, chunk 2.4: add tests or direct API verification for allowed, rejected, and owner-approved transitions.

## 2026-06-13 - Goal 2 Chunk 2.3 Deployment Evidence

Deployment evidence:

- Commit `445e455` created: `Add approved order cancellation gates`.
- `./scripts/deploy.sh` completed successfully and built/pushed `localhost:5000/orders-microservice:445e455` plus `latest` with digest `sha256:f175ef81a254bca57369456fa4154794f2906ba5ac854c87cf1b5132a7c40c8f`.
- The Kubernetes deployment was set to immutable image `localhost:5000/orders-microservice:445e455` after the deploy script completed.
- Final deployment status: `replicas=1`, `updated=1`, `ready=1`, `available=1`.
- Final running pod: `orders-microservice-6498bf95fd-mznjn`.
- Final running image: `localhost:5000/orders-microservice:445e455` with image ID `localhost:5000/orders-microservice@sha256:f175ef81a254bca57369456fa4154794f2906ba5ac854c87cf1b5132a7c40c8f`.

Production verification evidence:

- In-pod health check returned healthy JSON from `http://localhost:3203/health`.
- Public health check `curl -I -H 'Cache-Control: no-cache' https://orders.alfares.cz/health`: HTTP 200.
- Unauthenticated protected cancellation smoke check `PUT /api/orders/00000000-0000-0000-0000-000000000000/status`: HTTP 401, confirming the existing JWT guard still protects the mutation endpoint.
- Live container helper check returned `runtime approval gates ok`, confirming approved cancellation succeeds through the helper and refund-like status rejection remains active in the deployed image.

Gate decision:

- Deployment readiness: accept.

Next unfinished chunk:

- Goal 2, chunk 2.4: add tests or direct API verification for allowed, rejected, and owner-approved transitions.

## 2026-06-13 - Goal 2 Chunk 2.4 Transition Verification

Current focus:

- Owner-selected task: continue Goal 2 chunk 2.4.
- Goal 2 - Order Contract And State Machine Hardening.
- Chunk 2.4 - Tests or direct API verification for allowed, rejected, and owner-approved transitions.

Context search evidence:

- Read `docs/IMPLEMENTATION_STATE.md`, `docs/orchestrator/STATUS.md`, `docs/orchestrator/GOALS.md`, `docs/orchestrator/PLAN.md`, `docs/orchestrator/ORDER_STATUS_TRANSITIONS.md`, `docs/orchestrator/PRE_CODING_GATE.md`, and `docs/orchestrator/READINESS_GATES.md`.
- Read `src/orders/status-transitions.ts` and `package.json`.
- Confirmed the repository has no existing Jest/test directory or test runner setup, so direct compiled-helper verification is the least invasive durable coverage path.
- DocsRAG live query was not run because no session `JWT_TOKEN` was available; repository source-of-truth docs were sufficient for this bounded verification chunk.

Implementation evidence:

- Added `scripts/verify-status-transitions.js`.
- Added `npm test` as `npm run build && npm run verify:transitions`.
- Added `npm run verify:transitions` as `node scripts/verify-status-transitions.js`.
- Updated `docs/orchestrator/CONTEXT_PACKAGE.md`, `docs/orchestrator/EXECUTION_PLAN.md`, `docs/orchestrator/GOALS.md`, `docs/orchestrator/PLAN.md`, `docs/orchestrator/ORDER_STATUS_TRANSITIONS.md`, `implementation-goals/README.md`, and `docs/IMPLEMENTATION_STATE.md`.

Verification coverage:

- Allowed order transitions: `pending -> confirmed`, `confirmed -> processing`, `processing -> shipped` with shipped/delivered items, and `shipped -> delivered` with delivered items.
- Rejected order transitions: jump, item-gating failure, terminal correction, cancelled terminal correction, refund-like status, unknown status, cancellation without approval, non-human approval, invalid reason code, missing side-effect acknowledgement, and shipped cancellation.
- Owner-approved cancellation transitions: `pending|confirmed|processing -> cancelled` with safe audit metadata, actor identity, reason code, side-effect acknowledgements, prior/requested/resulting statuses, and deterministic timestamp.
- Allowed item fulfillment transitions: `pending -> reserved`, `reserved -> shipped`, and `shipped -> delivered`.
- Rejected item fulfillment transitions: jump, reversal, terminal transition, synthetic return/refund/cancellation value, and unknown value.

Final verification evidence:

- `npm test`: pass; build completed and `scripts/verify-status-transitions.js` printed `status transition verification ok`.
- `node --check dist/main.js`: pass.
- Missing-marker scan: pass; no matches.
- Sensitive literal audit: pass; no matches.
- `git diff --check`: pass.

Gate decision:

- Integration readiness: accept.
- Deployment not required because no runtime service behavior changed.

Next unfinished chunk:

- Goal 3, chunk 3.1: review order, item, shipment, pricing, event, and logger paths for sensitive fields.

## 2026-06-13 - Goal 3 Chunk 3.1 Sensitive Field Review

Current focus:

- Owner-selected task: continue the next recommended chunk.
- Goal 3 - Sensitive Customer Data And Audit Safety.
- Chunk 3.1 - Review order, item, shipment, pricing, event, and logger paths for sensitive fields.

Context search evidence:

- Read `docs/IMPLEMENTATION_STATE.md`, `docs/orchestrator/GOALS.md`, `docs/orchestrator/PLAN.md`, `docs/orchestrator/PROJECT_INVARIANTS.md`, `docs/orchestrator/PRE_CODING_GATE.md`, and `docs/orchestrator/READINESS_GATES.md`.
- Reviewed source paths under `src/orders`, `src/items`, `src/shipments`, `src/pricing`, `src/logger`, `src/auth`, `src/admin`, plus `src/main.ts` and `src/app.module.ts`.
- Searched for logging calls, event publishing, response surfaces, customer/address/payment/tracking/token field names, and sensitive-literal patterns.
- DocsRAG live query was not run because no session `JWT_TOKEN` was available; this was a local source review with no cross-service contract or runtime behavior changes.

Implementation evidence:

- Added `docs/orchestrator/SENSITIVE_DATA_REVIEW.md`.
- Updated `docs/orchestrator/CONTEXT_PACKAGE.md` and `docs/orchestrator/EXECUTION_PLAN.md` for Goal 3 chunk 3.1.
- Updated `docs/orchestrator/GOALS.md`, `docs/orchestrator/PLAN.md`, `implementation-goals/README.md`, and `docs/IMPLEMENTATION_STATE.md`.

Review findings:

- Core order API responses return full `Order` entities containing customer JSON, shipping/billing address JSON, customer/internal notes, payment method, and payment status under JWT guard.
- Item API responses contain operational item and pricing data but no direct customer PII fields.
- Shipment API responses expose tracking number and tracking URL, which are sensitive operational delivery data.
- Pricing service logs are currently product-level diagnostics and do not include customer/address/payment fields, but upstream error messages should be treated as redactable in future hardening.
- Order events avoid customer/address/payment fields except `order.shipped`, which includes tracking number.
- `LoggerService` accepts raw string messages and has no centralized redaction boundary.
- Admin JSON endpoints are JWT-protected, but detail responses expose customer email and shipment tracking values to authenticated admins; admin synthetic logs avoid raw notes but timeline context includes tracking numbers.
- Auth guard does not log bearer token values and returns generic token errors.

Follow-up named:

- Goal 3 chunk 3.2: add safe structured audit metadata for writes and status changes.
- Goal 3 chunk 3.3: add redaction or no-log guarantees for customer, address, payment, token, secret, tracking, and arbitrary upstream error fields.
- Goal 3 chunk 3.4: add regression checks or static scans for sensitive logging.

Final verification evidence:

- Missing-marker scan: pass; no matches.
- Sensitive literal audit: pass; no matches.
- `git diff --check`: pass.

Gate decision:

- Documentation review readiness: accept.
- Deployment not required because no runtime source changed.

Next unfinished chunk:

- Goal 3, chunk 3.2: add safe structured audit metadata for writes and status changes.


## 2026-06-13 - Goal 3 Chunk 3.2 Safe Structured Audit Metadata

Current focus:

- Owner-selected task: continue Goal 3 chunk 3.2.
- Scope: safe structured audit metadata for writes and status changes.

Context search evidence:

- Read `docs/IMPLEMENTATION_STATE.md`, `docs/orchestrator/GOALS.md`, `docs/orchestrator/PLAN.md`, `docs/orchestrator/PROJECT_INVARIANTS.md`, `docs/orchestrator/PRE_CODING_GATE.md`, `docs/orchestrator/READINESS_GATES.md`, and `docs/orchestrator/SENSITIVE_DATA_REVIEW.md`.
- Read affected runtime paths: `src/logger/logger.service.ts`, `src/orders/orders.service.ts`, `src/items/items.service.ts`, `src/shipments/shipments.service.ts`, and `src/pricing/pricing.service.ts`.
- DocsRAG live query was not run because no session `JWT_TOKEN` was available; this bounded logging-hardening chunk did not require a cross-service contract decision.

Implementation evidence:

- Added `LoggerService.audit` with an allowlisted structured metadata schema and scalar sanitization.
- Added audit records for `order.create` and `order.status.update` with resource ID, actor identity where available, channel, status movement, outcome, reason code when present, and duration.
- Added audit records for `order_item.create` and `order_item.fulfillment.update` with item/order IDs, status movement, outcome, and duration.
- Added audit records for `shipment.create`, `shipment.tracking.update`, and `shipment.status.update` without logging tracking numbers or tracking URLs.
- Added audit records for pricing suggestion generation plus pricing suggestion approve/reject status changes without logging product names, AI responses, customer data, payment data, or raw errors.
- Updated `docs/orchestrator/CONTEXT_PACKAGE.md`, `docs/orchestrator/EXECUTION_PLAN.md`, `docs/orchestrator/GOALS.md`, `docs/orchestrator/PLAN.md`, and `docs/IMPLEMENTATION_STATE.md`.

Sensitive-data safety:

- Audit records use only operation names, resource IDs, parent resource IDs, actor/source metadata, channel, bounded statuses, reason code, outcome, duration, and aggregate counters.
- No raw order entities, request bodies, customer JSON, addresses, notes, payment metadata, shipment tracking values, bearer tokens, JWT secrets, DB passwords, production rows, or raw exception traces were added to audit logs.

Verification evidence:

- `npm run build`: pass.
- `npm test`: pass; `scripts/verify-status-transitions.js` printed `status transition verification ok`.
- Missing-marker scan: pass; no matches.
- Sensitive-literal scan: pass; no matches.
- `git diff --check`: pass.

Gate decision:

- Runtime readiness: accept.
- Deployment not run because it was not requested for this chunk.

Next unfinished chunk:

- Goal 3 chunk 3.3: add redaction or no-log guarantees for customer, address, payment, token, and secret fields.

## 2026-06-13 - Goal 3 Chunk 3.3 Redaction And No-Log Guarantees

Current focus:

- Owner-selected task: continue Goal 3 chunk 3.3.
- Scope: add runtime redaction or no-log guarantees for customer, address, payment, token, and secret fields.

Context search evidence:

- Read `docs/IMPLEMENTATION_STATE.md`, `docs/orchestrator/GOALS.md`, and `docs/orchestrator/SENSITIVE_DATA_REVIEW.md`.
- Read affected runtime paths: `src/logger/logger.service.ts`, `src/admin/admin.service.ts`, `src/pricing/pricing.service.ts`, `src/orders/order-events.service.ts`, `src/orders/orders.controller.ts`, `src/orders/orders.service.ts`, and shipment/order entity surfaces.
- Searched source for logger/console calls and sensitive field names covering customer, address, payment, token, secret, bearer, authorization, and tracking paths.
- DocsRAG live query was not run because no session `JWT_TOKEN` was available; this bounded hardening chunk relied on repository source-of-truth docs and the Goal 3 sensitive-data review.

Implementation evidence:

- Added centralized message redaction to `LoggerService.log`, `LoggerService.warn`, and `LoggerService.error` for bearer tokens, JWT-looking values, sensitive key/value pairs, and sensitive JSON keys.
- Kept `LoggerService.audit` allowlisted and added guards against bearer/JWT/sensitive key-value payloads without dropping safe operation names such as `shipment.tracking.update`.
- Masked admin order summaries and details so customer labels, customer name/email, payment method/status, shipment tracking URLs, tracking numbers, and timeline/log tracking context no longer expose raw values.
- Replaced RabbitMQ console error details with generic no-secret messages.
- Replaced raw product-service price-update exception propagation with a bounded upstream-failure message.
- Updated `docs/orchestrator/GOALS.md` and `docs/IMPLEMENTATION_STATE.md`.

Sensitive-data safety:

- Logger calls now redact customer/address/payment/token/secret-shaped data even when a future caller passes raw strings accidentally.
- Admin synthetic logs and timeline context no longer include raw tracking values.
- Admin JSON detail preserves operational booleans and masked indicators rather than raw customer, payment, or tracking fields.
- No database schema, order lifecycle, payment ownership, warehouse ownership, catalog ownership, event routing, JWT/RBAC, or API authentication behavior was changed.

Verification evidence:

- `npm run build`: pass.
- `npm test`: pass; `scripts/verify-status-transitions.js` printed `status transition verification ok`.
- Logger redaction verification snippet: pass; raw customer email, token, and bearer-like values were absent and safe audit operation names remained present.
- `git diff --check`: pass.
- Sensitive logger call scan: pass; no raw customer/address/payment/token/secret/tracking terms found in logger/console call arguments.
- Sensitive literal scan: pass with a documented false positive for the source comment `Bearer JWT`; no literal bearer token, JWT, JWT secret, DB password, client secret, or password assignment was found.

Gate decision:

- Runtime readiness: accept.
- Deployment not run because it was not requested for this chunk.

Next unfinished chunk:

- Goal 3 chunk 3.4: add regression checks or static scans for sensitive logging.

## 2026-06-13 - Goal 3 Chunk 3.4 Sensitive Logging Regression Checks

Current focus:

- Owner-selected task: continue Goal 3 chunk 3.4.
- Scope: add regression checks or static scans for sensitive logging.

Context search evidence:

- Read `docs/IMPLEMENTATION_STATE.md`, `docs/orchestrator/GOALS.md`, `docs/orchestrator/SENSITIVE_DATA_REVIEW.md`, existing `scripts/verify-status-transitions.js`, `package.json`, and `src/logger/logger.service.ts`.
- Confirmed repository verification style uses dependency-free Node scripts after `nest build`.
- DocsRAG live query was not run because no session `JWT_TOKEN` was available; this bounded verification-gate chunk did not alter ecosystem contracts.

Implementation evidence:

- Added `scripts/verify-sensitive-logging.js`.
- Wired `npm test` to run `npm run verify:sensitive-logging` after the build and status-transition verifier.
- Added `verify:sensitive-logging` package script.
- The verifier statically scans logger/console call arguments for sensitive customer/address/payment/token/secret/tracking terms.
- The verifier statically scans source and IPS documentation for bearer-token, JWT, and secret-assignment literals.
- The verifier executes the compiled `LoggerService` and asserts sensitive runtime values are redacted while safe audit operation names remain present.
- Tightened logger context sanitization after the new verifier caught `customerContext` as unsafe.
- Updated `docs/orchestrator/GOALS.md` and `docs/IMPLEMENTATION_STATE.md`.

Sensitive-data safety:

- Future `npm test` runs now fail if a logger/console call includes sensitive field names in arguments.
- Future `npm test` runs now fail if source or IPS docs contain token/JWT/secret-like literals matching the gate patterns.
- Runtime redaction is checked with sample customer, address, payment, token, bearer, JWT, password, and sensitive context values.
- No database schema, API auth, order lifecycle, payment ownership, warehouse ownership, catalog ownership, or event contract behavior changed.

Verification evidence:

- `npm test`: pass; build completed, `status transition verification ok`, and `sensitive logging verification ok`.
- `npm run verify:sensitive-logging`: pass.
- `git diff --check`: pass.
- Missing-marker scan: pass; no matches.

Gate decision:

- Runtime verification readiness: accept.
- Goal 3 is complete.
- Deployment not run because it was not requested for this chunk.

Next unfinished chunk:

- Goal 4 chunk 4.1: reconcile current `POST /orders` request/response shape with FlipFlop and marketplace expectations.

## 2026-06-13 - Goal 4 Chunk 4.1 Channel Create-Order Contract Reconciliation

Current focus:

- Owner-selected task: implement Goal 4 chunk 4.1.
- Scope: reconcile current `POST /orders` request/response shape with FlipFlop and marketplace expectations.

Context search evidence:

- Read `docs/IMPLEMENTATION_STATE.md`, `docs/orchestrator/GOALS.md`, `BUSINESS.md`, `SYSTEM.md`, `README.md`, `CLAUDE.md`, and `docs/orchestrator/PRODUCTION_READINESS_ROADMAP.md`.
- Read current runtime paths: `src/orders/orders.controller.ts`, `src/orders/orders.service.ts`, `src/orders/order.entity.ts`, `src/items/order-item.entity.ts`, `src/items/items.service.ts`, and `src/orders/orders.module.ts`.
- Searched repository docs/source for FlipFlop, marketplace, `POST /orders`, `externalOrderId`, `channelAccountId`, create-order contract, and idempotency references.
- DocsRAG live query was not run because no session `JWT_TOKEN` was available; this bounded implementation used repository source-of-truth docs and local source evidence.

Implementation evidence:

- Added `src/orders/create-order.dto.ts` with `orders.create.v1` contract normalization and validation.
- Updated `POST /api/orders` to use `CreateOrderRequestDto` instead of raw `Partial<Order>`.
- Updated order creation to persist order item rows from `items[]` in the same database transaction as the order row.
- Added `docs/orchestrator/CHANNEL_ORDER_CREATE_CONTRACT.md` documenting request shape, accepted values, persistence mapping, response shape, current guarantees, deferrals, and client expectations.
- Added `scripts/verify-create-order-contract.js`.
- Wired `npm test` to run `verify:create-order-contract` after build, transition verification, and sensitive logging verification.
- Updated `docs/orchestrator/GOALS.md` and `docs/IMPLEMENTATION_STATE.md`.

Contract summary:

- New channel clients should send `contractVersion=orders.create.v1`.
- Supported channels are `flipflop`, `allegro`, `aukro`, `bazos`, and `heureka`.
- `externalOrderId`, non-empty `items[]`, and `totals` with a three-letter currency are required.
- Create-time status is limited to `pending` or `confirmed`; default is `pending`.
- Unknown top-level request fields are rejected.
- Saved response keeps the existing `{ success: true, data }` envelope and includes saved item rows.

Boundary notes:

- Duplicate detection and idempotent replay remain deferred to Goal 4 chunks 4.2 and 4.3.
- Catalog product truth, warehouse stock truth, payment identity/reconciliation, auth/RBAC, notifications, and event versioning ownership did not change.
- Audit logging remains bounded and does not log raw customer/address/payment request data.

Verification evidence:

- `npm run build`: pass.
- `npm run verify:create-order-contract`: pass; `create order contract verification ok`.
- `npm test`: pass; build completed, `status transition verification ok`, `sensitive logging verification ok`, and `create order contract verification ok`.
- `git diff --check`: pass.
- Missing-marker scan: pass; no matches.

Gate decision:

- Runtime readiness: accept.
- Deployment not run because it was not requested for this chunk.

Next unfinished chunk:

- Goal 4 chunk 4.2: document idempotency expectations for external order IDs and channel account IDs.

## 2026-06-13 - Goal H1 public landing, admin access surface, and roadmap

Selected goal: Goal H1 - Public Landing And Admin Access Surface.

Selected chunks:

- H1.1 Add public landing HTML route for `/` and `/landing`.
- H1.2 Add landing CTAs for registration and admin entry.
- H1.3 Improve admin shell locked/authenticated states without embedding order data.
- H1.4 Make admin JSON route roles explicit.

Work completed:

- Created `src/landing/landing.module.ts`.
- Created `src/landing/landing.controller.ts`.
- Created `src/landing/landing-ui.ts`.
- Updated `src/main.ts` to exclude `/` and `/landing` from the `/api` global prefix.
- Updated `src/app.module.ts` to import `LandingModule`.
- Updated `src/admin/admin.controller.ts` to add explicit roles for protected admin JSON routes.
- Replaced `src/admin/admin-ui.ts` with an improved admin operations shell.
- Created `docs/orchestrator/ORDERS_HUB_ROADMAP.md`.
- Refreshed `docs/orchestrator/CONTEXT_PACKAGE.md`.
- Refreshed `docs/orchestrator/EXECUTION_PLAN.md`.
- Updated `docs/orchestrator/GOALS.md`, `docs/orchestrator/PLAN.md`, and `docs/IMPLEMENTATION_STATE.md`.

Ecosystem discovery:

- Sub-agent discovery confirmed FlipFlop and marketplace channels are aligned with `POST /api/orders` and `orders.create.v1`.
- Catalog, Warehouse, Payments, Auth, Notifications, Leads, and Marketing have distinct ownership boundaries that Orders must preserve.
- Speak ASAP, School Committee, Rentabox, and Marathon have order/payment-like concepts but no confirmed central Orders integration mandate. They are recorded as candidate integrations requiring owner decisions before runtime work.
- DocsRAG live query was not run because no session `JWT_TOKEN` was available.

Pre-coding gate:

- Decision: `pass-with-exception`.
- Exception: DocsRAG unavailable; compensating evidence came from Orders source-of-truth docs and remote neighboring repository discovery.

Verification:

- Pending at initial documentation time; see follow-up entries for build, test, deployment, and live route checks.

Next unfinished action:

- Run `npm run build`, `npm test`, static scans, route smoke checks, deploy, and live verification.

## 2026-06-13 - Goal H1 validation and deployment

Commit:

- `bf0510f` - `Add orders hub landing roadmap`

Commands and checks:

- `npm run build`: pass.
- `npm test`: pass; build completed, `status transition verification ok`, `sensitive logging verification ok`, and `create order contract verification ok`.
- `git diff --check`: pass.
- Missing-marker scan: pass; no unresolved `[(MISSING|UNKNOWN):` markers found.
- Sensitive-pattern scan: pass for new docs/UI scope; no raw secrets/tokens found. The scanner reported only the existing source configuration reference `process.env.DB_PASSWORD`.
- `./scripts/deploy.sh`: pass.

Deployment evidence:

- Built and pushed `localhost:5000/orders-microservice:bf0510f` and `latest`.
- Image digest: `sha256:8b6a5edfe26e50ff2393b8488bc2cd7d600cc17c1c86309e0aaa019e9b39eea7`.
- Kubernetes rollout completed successfully.
- In-pod health check returned healthy JSON from `http://localhost:3203/health`.

Live route checks:

- `curl -I -H 'Cache-Control: no-cache' https://orders.alfares.cz/`: HTTP 200, `content-type: text/html; charset=utf-8`.
- `curl -I -H 'Cache-Control: no-cache' https://orders.alfares.cz/landing`: HTTP 200, `content-type: text/html; charset=utf-8`.
- `curl -I -H 'Cache-Control: no-cache' https://orders.alfares.cz/admin/orders`: HTTP 200, `content-type: text/html; charset=utf-8`.
- `curl -I -H 'Cache-Control: no-cache' https://orders.alfares.cz/health`: HTTP 200.
- `curl -i -H 'Cache-Control: no-cache' 'https://orders.alfares.cz/api/admin/orders/dashboard?limit=1'`: HTTP 401 without bearer token, confirming protected admin JSON remains guarded.

Visual/browser verification:

- Attempted bundled Playwright screenshot capture for desktop/mobile landing and admin pages.
- Browser capture was blocked because local Chrome failed to launch under Playwright in the sandbox.
- HTTP route checks, deployment logs, Nest route mapping logs, and protected API checks verified the deployed behavior.

Gate decision:

- Integration readiness: accept.
- Deployment readiness: accept with follow-up for browser screenshot verification when Browser/IAB or local Chrome automation is available.

Next unfinished chunk:

- Goal H3 chunk H3.1 / Goal 4 chunk 4.2: document idempotency expectations for external order IDs and channel account IDs.

## 2026-06-13 - Goal 4 Chunk 4.2 / Goal H3 Chunk H3.1 Idempotency Expectations

Current focus:

- Owner-selected task: implement the next Goal 4 chunk.
- Scope: document idempotency expectations for external order IDs and channel account IDs.
- Cross-reference: this also completes Goal H3 chunk H3.1 from `docs/orchestrator/ORDERS_HUB_ROADMAP.md`.

Context search evidence:

- Read `docs/IMPLEMENTATION_STATE.md`, `docs/orchestrator/GOALS.md`, `docs/orchestrator/CHANNEL_ORDER_CREATE_CONTRACT.md`, `docs/orchestrator/ORDERS_HUB_ROADMAP.md`, `docs/orchestrator/PLAN.md`, `package.json`, `src/orders/create-order.dto.ts`, and `src/orders/orders.service.ts`.
- Searched repository source and docs for idempotency, `externalOrderId`, `channelAccountId`, duplicate handling, replay behavior, and order creation references.
- DocsRAG live query was not run because no session `JWT_TOKEN` was available; this bounded documentation chunk used repository source-of-truth docs and the implemented create-order contract.

Implementation evidence:

- Added `docs/orchestrator/ORDER_IDEMPOTENCY_CONTRACT.md`.
- Updated `docs/orchestrator/CHANNEL_ORDER_CREATE_CONTRACT.md` to reference `contractVersion + channel + channelAccountId + externalOrderId` as the full key.
- Added `scripts/verify-idempotency-contract.js`.
- Wired `npm test` to run `verify:idempotency-contract`.
- Updated `docs/orchestrator/GOALS.md` to mark Goal 4 chunk 4.2 and H3.1 complete.
- Updated `docs/orchestrator/ORDERS_HUB_ROADMAP.md`, `docs/orchestrator/PLAN.md`, and `docs/IMPLEMENTATION_STATE.md`.

Contract summary:

- Canonical idempotency key: `contractVersion + channel + channelAccountId + externalOrderId`.
- `channelAccountId` scopes storefront, seller account, shop, tenant, source mailbox/feed, or integration account.
- Clients without a natural account partition must send a stable sentinel such as `default`.
- Safe retry means same key and same normalized order fingerprint.
- Safe retry must return the existing canonical order without duplicate rows, duplicate item rows, duplicate `order.created` events, or repeated cross-service side effects.
- Mismatched duplicate must become bounded `409 ORDER_IDEMPOTENCY_CONFLICT` without raw customer/address/payment data.

Boundary notes:

- No runtime duplicate detection was added in this chunk; it is the next implementation chunk.
- No database schema, order lifecycle, JWT/RBAC, warehouse, catalog, payment, notification, CRM, or event contract behavior changed.
- The contract explicitly preserves Orders as canonical order truth while keeping channel services as clients.

Verification evidence:

- `npm run verify:idempotency-contract`: pass; `idempotency contract verification ok`.
- Full `npm test`, `git diff --check`, and missing-marker scan are recorded in the final verification state for this run.

Gate decision:

- Documentation readiness: accept pending final command verification.
- Deployment not required because no runtime behavior changed.

Next unfinished chunk:

- Goal 4 chunk 4.3 / Goal H3 chunk H3.2: add duplicate-order protection with database uniqueness or deterministic duplicate lookup.

## 2026-06-13 - Goal 4.3 / H3 runtime idempotency protection

Selected goal: Goal 4 chunk 4.3 / Goal H3 - Channel Idempotency And Duplicate Protection.

Selected chunks:

- Goal 4.3 Add duplicate-order protection where missing.
- H3.2 Add deterministic duplicate lookup.
- H3.3 Return stable existing order response on safe retry.
- H3.4 Add conflict response for mismatched duplicate payloads.

Implementation summary:

- Added runtime idempotency lookup for `contractVersion + channel + channelAccountId + externalOrderId`.
- Added normalized replay comparison against stored order snapshot and item rows.
- Exact replay returns the existing canonical order and does not publish another `order.created` event.
- Same-key different-payload replay is rejected with HTTP 409.
- Added contract verification coverage for idempotency key extraction, exact replay matching, total mismatch, and item mismatch.
- Updated `docs/orchestrator/CHANNEL_ORDER_CREATE_CONTRACT.md`, `docs/orchestrator/CONTEXT_PACKAGE.md`, `docs/orchestrator/EXECUTION_PLAN.md`, and `docs/IMPLEMENTATION_STATE.md`.

Pre-coding gate:

- Decision: `pass-with-exception`.
- Exception: DocsRAG unavailable because no session `JWT_TOKEN` was provided. This is a bounded Orders-local runtime chunk based on existing source-of-truth contract docs.

Known follow-up:

- Add database-level uniqueness or another concurrency-safe guard for simultaneous duplicate creates. The current implementation prevents ordinary retries but does not fully eliminate concurrent insert races.


Final verification evidence:

- npm test: pass; build, status transition, sensitive logging, create-order contract, idempotency contract, and duplicate-order protection checks completed.
- verify:duplicate-order-protection asserts exact duplicate replay returns the existing order without starting a transaction or publishing order.created.
- verify:duplicate-order-protection asserts mismatched same-key replay rejects with HTTP 409 before inserts or event publishing.
- Goal 4 chunk 4.3 and Goal H3 chunks H3.2-H3.4 are complete for deterministic duplicate lookup, stable replay response, and conflict rejection.

Gate decision:

- Runtime readiness: accept for normal retry duplicate protection.
- Known hardening follow-up: add database-level uniqueness or another concurrency-safe guard once production migrations are available.

Next unfinished chunk:

- Goal H3 chunk H3.5: verify FlipFlop and marketplace adapters can retry safely.


## 2026-06-13 - Goal 4.3 / H3 validation and deployment

Commit:

- `b28f311` - `Add channel order idempotency protection`

Commands and checks:

- `npm test`: pass; build, transition verification, sensitive logging verification, create-order contract verification, idempotency contract verification, and duplicate-order protection verification passed.
- `git diff --check`: pass.
- Missing-marker scan: pass.
- Sensitive-pattern scan over docs, orchestrator artifacts, order source, and scripts: pass.
- `npm run verify:duplicate-order-protection`: pass.

Deployment evidence:

- `./scripts/deploy.sh`: pass.
- Built and pushed `localhost:5000/orders-microservice:b28f311` and `latest`.
- Image digest: `sha256:a4149cc0c49929cc3f76ae2cf152fcf35bc8a45f0f74250bdb91ab2c539948cb`.
- Deployment was pinned to immutable image `localhost:5000/orders-microservice:b28f311`.
- Kubernetes rollout completed with `1/1` ready replicas.
- Public health check `curl -I -H Cache-Control: no-cache https://orders.alfares.cz/health`: HTTP 200.
- Unauthenticated `curl -i -H Cache-Control: no-cache https://orders.alfares.cz/api/orders`: HTTP 401, confirming protected API behavior remains active.

Gate decision:

- Integration readiness: accept.
- Deployment readiness: accept with follow-up for database-level uniqueness/concurrency hardening.

Next unfinished chunk:

- Goal H3 chunk H3.5: verify FlipFlop and marketplace adapters can retry safely; then add database-level uniqueness hardening for simultaneous duplicate creates.


## 2026-06-13 - Goal 4.4 / H3.5 Channel Adapter Retry Verification

Current focus:

- Owner-selected continuation: implement Goal H3 chunk H3.5 after runtime duplicate protection.
- Scope: make FlipFlop and marketplace order adapters send the Orders idempotency contract fields so ordinary retries use the same deterministic key.

Implementation evidence:

- Updated flipflop-service/shared/clients/order-client.service.ts.
- Updated allegro-service/shared/clients/order-client.service.ts.
- Updated aukro-service/shared/clients/order-client.service.ts.
- Updated bazos-service/shared/clients/order-client.service.ts.
- Updated heureka-service/shared/clients/order-client.service.ts.
- Updated flipflop-service/services/order-service/src/orders/orders.service.ts to send ORDERS_CHANNEL_ACCOUNT_ID or fallback flipflop-storefront.
- Added scripts/verify-channel-adapter-idempotency.js in orders-microservice and package script verify:channel-adapter-idempotency.

Adapter behavior:

- Channel clients send contractVersion=orders.create.v1 on create-order calls.
- Channel clients normalize channelAccountId to the supplied value or stable default sentinel default.
- Same channel retries reuse channel, channelAccountId, and externalOrderId, preserving the Orders idempotency key.
- Same-key payload conflicts from Orders keep HTTP 409 semantics through ORDER_IDEMPOTENCY_CONFLICT.
- Channel adapters remain clients of Orders and do not become canonical order lifecycle owners.

Verification evidence:

- orders-microservice npm run verify:channel-adapter-idempotency: pass.
- orders-microservice npm test: pass.
- flipflop-service/shared npm run build: pass.
- allegro-service/shared npm run build: pass.
- bazos-service/shared npm run build: pass.
- flipflop-service/services/order-service npm run build: pass.
- aukro-service/shared npm run build: not run to completion because tsc is not installed in that repo environment.
- heureka-service/shared npm run build: not run to completion because tsc is not installed in that repo environment.

Gate decision:

- H3.5 readiness: accept with dependency note for Aukro and Heureka local TypeScript install state.
- Deployment not run in this chunk.

Next unfinished chunk:

- Add database-level uniqueness or another concurrency-safe guard for simultaneous duplicate creates.

## 2026-06-13 - Goal 4.5 / H3 Database Idempotency Guard Migration

Current focus:

- Owner-approved continuation after channel adapter retry verification.
- Scope: add database-level uniqueness hardening for the Orders create idempotency key without inventing or manually creating the production base orders schema.

Implementation evidence:

- Added `migrations/002_order_idempotency_unique_index.sql`.
- Migration creates `ux_orders_create_idempotency` on `(channel, COALESCE("channelAccountId", ''), "externalOrderId")` only when `public.orders` exists.
- The API validates `contractVersion=orders.create.v1`, but contract version is not persisted in the current order shape; the index therefore enforces the persisted idempotency dimensions and the docs call out this limitation.

Database evidence:

- Applied the guarded migration to the live `orders` database with `psql -f migrations/002_order_idempotency_unique_index.sql`: pass, returned `DO`.
- Confirmed `to_regclass('public.orders')` is null in the current live `orders` database, so the migration intentionally did not create an index yet.
- No production table was manually created and no schema ownership boundary was bypassed.

Verification evidence:

- `npm run verify:channel-adapter-idempotency`: pass.
- `npm test`: pass.
- `git diff --check`: pass.

Gate decision:

- Migration readiness: accept as repository hardening and safe live no-op.
- Runtime concurrency readiness: partial until the production base orders table migration path exists and the unique index is materialized.

Next unfinished chunk:

- Create or reconcile the production `public.orders` table migration path, then verify `ux_orders_create_idempotency` exists and run a real concurrent duplicate-create test.

## 2026-06-13 - Goal 4.6 / H3.6 Production Schema And Idempotency Index Materialized

Current focus:

- Owner-approved continuation after the guarded idempotency index migration no-op.
- Scope: create the missing production base table migration path, materialize the idempotency index, and verify live duplicate-key concurrency behavior.

Implementation evidence:

- Added `migrations/000_create_order_core_tables.sql`.
- The migration creates `orders`, `order_items`, and `shipments` with `CREATE TABLE IF NOT EXISTS`, matching the current TypeORM entities while production `synchronize` stays disabled.
- Added `scripts/verify-live-idempotency-index.sh` for repeatable live verification of `ux_orders_create_idempotency`.

Database evidence:

- Applied `migrations/000_create_order_core_tables.sql` to the live `orders` database: created `orders`, `order_items`, and `shipments`.
- Reapplied `migrations/002_order_idempotency_unique_index.sql`: `ux_orders_create_idempotency` materialized on `orders`.
- Confirmed public tables: `orders`, `order_items`, `shipments`.
- Confirmed indexes include `orders_pkey`, `idx_orders_channel_created_at`, `idx_orders_external_channel`, `idx_orders_status_created_at`, and `ux_orders_create_idempotency`.

Concurrency evidence:

- `scripts/verify-live-idempotency-index.sh`: pass.
- Two concurrent live inserts with the same channel, channelAccountId, and externalOrderId produced exactly one success and one duplicate-key failure on `ux_orders_create_idempotency`.
- Surviving duplicate-test row count was `1`; cleanup deleted the test row.

Verification evidence:

- `npm test`: pass.
- `git diff --check`: pass.
- Exact IPS unresolved-marker scan: pass.

Gate decision:

- H3 database hardening readiness: accept.
- Production schema readiness: accept for the current Orders, OrderItem, and Shipment entities.

Next unfinished chunk:

- Goal H4 event contract versioning, then Goal H5 warehouse reservation choreography and Goal H6 payments callback boundary.

## 2026-06-13 - Goal H4 Event Contract Versioning

Current focus:

- Owner-approved continuation after H3 database idempotency hardening.
- Scope: make order lifecycle events versioned, documented, fixture-backed, and safe for Warehouse, Payments, Notifications, Leads, Marketing, and channel consumers.

Implementation evidence:

- Added `src/orders/order-event-contracts.ts`.
- Added `docs/orchestrator/ORDER_EVENT_CONTRACTS.md`.
- Added fixtures in `docs/orchestrator/event-fixtures/` for `orders.order.created.v1`, `orders.order.updated.v1`, `orders.order.paid.v1`, `orders.order.shipped.v1`, and `orders.order.cancelled.v1`.
- Added `scripts/verify-event-contracts.js` and wired `npm test` to run `npm run verify:event-contracts`.
- Updated `src/orders/order-events.service.ts` to publish versioned routing keys and RabbitMQ headers `eventType` and `eventVersion`.

Contract decisions:

- `orders.order.shipped.v1` does not include tracking numbers or tracking URLs; authorized consumers must look up shipment details through the owning API.
- Cancellation events include safe approval metadata only: approval type, reason code, side-effect acknowledgements, and approval timestamp.
- Payment-success event helper is reserved for the future H6 Payments boundary; Orders does not take over payment identity or reconciliation.
- Live production RabbitMQ publish/consume smoke was not run because synthetic order lifecycle events on `orders.events` could trigger real consumers. The verifier exercises publisher routing keys, headers, and payload safety with a mocked channel instead.

Verification evidence:

- `npm run verify:event-contracts`: pass.
- `npm test`: pass.
- Sensitive logging verification: pass.
- `git diff --check`: pass.
- Exact IPS unresolved-marker scan: pass.

Gate decision:

- H4 readiness: accept.
- Consumer compatibility: accept as documented contract update; deploy should be coordinated with consumers that currently bind to legacy unversioned routing keys.

Next unfinished chunk:

- Goal H5 warehouse reservation choreography, then Goal H6 payments callback boundary.

## 2026-06-13 - Goal 4.3 / H3.2-H3.5 Channel Duplicate Protection Deployed

Current focus:

- Owner-approved continuation to deploy duplicate-order protection through channel adapters after runtime and database idempotency verification.
- Scope: restore missing shared build dependencies where needed, rebuild affected channel service images, and verify Kubernetes rollout health.

Implementation evidence:

- FlipFlop, Allegro, Aukro, Bazos, and Heureka shared order clients send `contractVersion=orders.create.v1`, normalize `channelAccountId`, preserve retry payloads, and surface `ORDER_IDEMPOTENCY_CONFLICT` as HTTP 409.
- FlipFlop checkout forwarding sends a stable `channelAccountId` using `ORDERS_CHANNEL_ACCOUNT_ID` with fallback `flipflop-storefront`.
- Restored Aukro and Heureka shared build dependencies with `npm ci`; both shared builds now pass.
- Patched `allegro-service/services/allegro-service/Dockerfile` so Prisma generation runs with OpenSSL available in the builder stage and a dummy `DATABASE_URL` during client generation.
- Patched `allegro-service/k8s/deployment.yaml` so runtime-only `ENCRYPTION_KEY` and `JWT_SECRET` are read from Kubernetes secrets rather than image files.

Deployment evidence:

- Bazos deployed via its deploy script; pushed `localhost:5000/bazos-service:latest` digest `sha256:67e0ce2d98b413413fe7c55faab141af6317a142c0c997c4e60f0cbe365a36b9`.
- FlipFlop deployed via its deploy script; the script timed out while images were pulling, but all six deployments subsequently rolled out. The order-service image digest was `sha256:926d9b1cbd88bcddc1077d89a3f4f6ce5c7d4892aca2b1ccede2f00d08e41aaa`.
- Allegro initial rebuild exposed a Prisma/OpenSSL runtime mismatch; the deployment was rolled back, Dockerfile/config was corrected, and the final image digest was `sha256:c0085d9563032b3259ed069ba7f2ca11cbf25c525af88d4ead5df54473496a0b`.
- Aukro rebuilt manually with the root Dockerfile and rolled out; final image digest was `sha256:bab7ad5a6db21b754c02e5e25bbe6ab08e46c713bac773223ead1bea94117f12`.
- Heureka rebuilt manually with the root Dockerfile and rolled out; final image digest was `sha256:7f2c022bbe948a78205a3b7a0d48a312547ea2b884582a87aae32a89ffcdc887`.

Verification evidence:

- `npm ci`: pass in `aukro-service/shared` and `heureka-service/shared`; audit warnings remain in those dependency trees.
- `npm run build`: pass in `aukro-service/shared` and `heureka-service/shared` after dependency restore.
- Kubernetes rollout status: pass for `allegro-service`, `aukro-service`, `bazos-service`, `flipflop-service`, and `heureka-service` in namespace `statex-apps`.
- Pod readiness check: all affected service pods were `1/1 Running` after rollout; one old Heureka pod was terminating during the final pod listing.
- FlipFlop public checks: `/` and `/api/products?limit=1` returned successfully after deployment.

Gate decision:

- H3 channel deployment readiness: accept.
- Residual follow-up: audit and reduce channel dependency vulnerabilities separately from this idempotency deployment chunk.

Next unfinished chunk:

- Goal H5 warehouse reservation choreography, then Goal H6 payments callback boundary.

## 2026-06-13 - Goal H5.1-H5.4 Warehouse Reservation Choreography

Current focus:

- Owner-approved continuation after H4 event contracts and H3 channel duplicate protection deployment.
- Scope: coordinate Warehouse reservation handoff without making Orders the stock authority.

Implementation evidence:

- Added `docs/orchestrator/WAREHOUSE_HANDOFF_CONTRACT.md` documenting lifecycle mapping for reserve, release, fulfill, cancel, expire, and return.
- Added `src/warehouse/warehouse-reservation.client.ts` as an outbound Warehouse reservation client behind `WAREHOUSE_RESERVATION_ENABLED`.
- Added `orders.warehouseHandoff` audit-safe metadata on the Orders entity and guarded migration `migrations/004_add_order_warehouse_handoff.sql`.
- Wired order creation to call Warehouse reservation only after the canonical order and item rows are created, and only when the runtime flag is enabled.
- Idempotent create replay returns before Warehouse handoff, so duplicate retry does not repeat reservation side effects.

Boundary decisions:

- Warehouse remains stock, availability, reservation, movement, fulfillment, expiry, cancellation reversal, and return authority.
- Orders stores only handoff metadata: status, timestamps, item counts, reason code, actor, skip reason, and bounded failure code.
- Orders does not store Warehouse response bodies, stock truth, availability calculations, customer data, address data, payment details, secrets, tokens, or tracking data in handoff metadata.
- H5.5 remains pending because payment-success fulfillment, payment-failed release, approved cancellation, and returns need the H6 payment boundary and owner-approved return workflow before runtime triggers are added.

Verification evidence:

- `npm run verify:warehouse-handoff`: pass.
- `npm test`: pass, including build, transitions, sensitive logging, create-order contract, idempotency, duplicate protection, event contracts, and warehouse handoff contract.

Gate decision:

- H5.1-H5.4 readiness: accept.
- Runtime deployment: not run in this chunk. The new Warehouse call is disabled unless `WAREHOUSE_RESERVATION_ENABLED=true`; migration should be applied before enabling persistent handoff metadata in production.

Next unfinished chunk:

- Goal H5.5 after Goal H6 payment callback/status boundary decisions.

## 2026-06-13 - Goal H5 Warehouse Reservation Choreography

Current focus:

- Owner-approved continuation after H4 event contract versioning.
- Scope: map Orders lifecycle states to Warehouse reservation endpoints, add a safe outbound client, and record audit-safe handoff metadata without moving stock authority into Orders.

Implementation evidence:

- Added `docs/orchestrator/WAREHOUSE_HANDOFF_CONTRACT.md`.
- Added `src/warehouse/warehouse-reservation.client.ts`.
- Added `orders.warehouseHandoff` to `src/orders/order.entity.ts`.
- Added `migrations/004_add_order_warehouse_handoff.sql` and updated the base schema migration.
- Added `scripts/verify-warehouse-handoff-contract.js` and wired `npm test` to run `npm run verify:warehouse-handoff`.
- Updated `OrdersService.create` to record warehouse handoff metadata after order/item persistence and before `orders.order.created.v1` publication.

Contract decisions:

- Reservation mutation is disabled unless `WAREHOUSE_RESERVATION_ENABLED=true`.
- Orders skips reservation when any item lacks a Warehouse-owned `warehouseId`.
- Warehouse failure does not expose raw error text and does not make Orders calculate stock; Orders records `failed` handoff metadata for operator retry/follow-up.
- Release, fulfill, cancel, expire, and return payloads are verified against Warehouse endpoints, but payment-triggered runtime callers are deferred to H6.

Database evidence:

- Applied `migrations/004_add_order_warehouse_handoff.sql` to the live `orders` database.
- Verified `orders.warehouseHandoff` exists with `jsonb` type.

Verification evidence:

- `npm run verify:warehouse-handoff`: pass.
- `npm test`: pass.
- `git diff --check`: pass.
- Exact IPS unresolved-marker scan: pass.

Gate decision:

- H5 readiness: accept.
- Deployment readiness: hold for explicit release decision because runtime behavior changes order creation metadata and optionally Warehouse reservation calls if enabled.

Next unfinished chunk:

- Goal H6 payments callback boundary.


## 2026-06-13 - Goal H6 Payments Callback And Status Boundary

Current focus:

- Owner-approved continuation after H5.1-H5.4 Warehouse reservation choreography.
- Scope: align Orders with Payments status updates while Payments remains payment identity, provider webhook, reconciliation, and refund authority.

Implementation evidence:

- Added `docs/orchestrator/PAYMENT_STATUS_BOUNDARY.md` documenting that Orders does not receive raw provider webhooks and accepts only bounded Payments-owned status updates.
- Added `src/payments/payment-status.dto.ts` with contract version `orders.payment-status.v1`, status normalization, allowed fields, and explicit rejection of refund/provider-owned fields.
- Added protected `PUT /api/orders/:id/payment-status` for `global:superadmin`, `internal:orders-microservice:admin`, and `internal:payments-microservice:service` actors.
- Added `paymentReferenceId`, `paymentApplicationId`, and `paymentUpdatedAt` to the Orders entity, base production schema, and guarded migration `migrations/005_add_order_payment_status_boundary.sql`.
- Added `scripts/verify-payment-boundary.js` and wired `npm test` to run `npm run verify:payment-boundary`.

Boundary decisions:

- Payments remains owner of provider sessions, checkout redirects, webhooks, reconciliation, provider transaction IDs, variable symbols, transactions, and refunds.
- Orders may store only Payments-owned payment ID, bounded application ID, bounded method label, normalized payment status, and status timestamp.
- `completed` maps to Orders `paymentStatus=paid`; if the order is `pending`, Orders moves it to `confirmed`, publishes `orders.order.updated.v1`, and publishes `orders.order.paid.v1`.
- `failed` and `cancelled` update only `paymentStatus`; Warehouse release/cancel choreography remains H5.5 follow-up.
- Refund-like statuses and provider-owned fields are rejected by the Orders boundary.

Verification evidence:

- `npm run verify:payment-boundary`: pass.
- `npm test`: pass, including build, transitions, sensitive logging, create-order contract, idempotency, duplicate protection, event contracts, warehouse handoff, and payment boundary checks.

Gate decision:

- H6 readiness: accept.
- Runtime deployment: not run in this chunk. Apply `migrations/005_add_order_payment_status_boundary.sql` before enabling production use of the new payment status endpoint.

Next unfinished chunk:

- Goal H5.5 payment-success, cancellation, and return verification using the approved H6 payment status boundary.

## 2026-06-13 - Goal H5.5 Payment Success, Cancellation, And Return Verification

Current focus:

- Owner-approved continuation after H6 payment status boundary completion.
- Scope: verify Warehouse reservation choreography for payment success, payment failure/cancellation, approved order cancellation, and return exclusion.

Implementation evidence:

- Extended `WarehouseReservationClient` with config-gated `releaseOrderItems`, `fulfillOrderItems`, and `cancelOrderItems` lifecycle methods.
- Wired `OrdersService.applyPaymentStatus` so `orders.payment-status.v1` `completed` updates call Warehouse `fulfill`, while `failed` and `cancelled` payment statuses call Warehouse `release`.
- Wired approved `OrdersService.updateStatus(... cancelled ...)` to call Warehouse `cancel` after the Orders cancellation approval gate succeeds.
- Kept return out of normal Orders status updates; synthetic return/refund statuses remain rejected by the status-transition verifier and Payments refund-like statuses remain rejected by the H6 boundary.

Boundary decisions:

- Warehouse remains stock truth and performs release, fulfill, cancel, expire, and return mutations.
- Payments remains refund owner; Orders does not perform refund or return payment logic.
- Handoff failures remain bounded `warehouseHandoff` metadata and do not expose raw Warehouse error text.

Verification evidence:

- `npm run verify:payment-boundary`: pass; paid payment triggers Warehouse fulfill metadata and failed payment triggers Warehouse release metadata.
- `npm run verify:warehouse-handoff`: pass; release, fulfill, cancel, expire, and return payloads target the expected Warehouse endpoints and contain no sensitive data.

Gate decision:

- H5.5 readiness: accept.
- Runtime deployment: not run in this chunk. Apply H5/H6 migrations and make an explicit release decision before enabling production Warehouse reservation calls.

Next unfinished chunk:

- Goal H7 admin operations console or owner-selected deployment/migration step.

## 2026-06-13 - Goal H7 Admin Operations Console, Read-Only Operations Panels

Current focus:

- Owner-approved continuation for Goal H7 - Admin Operations Console.
- Scope: read-only operational visibility and diagnostics only; no cancellation, refund, destructive correction, pricing mutation, warehouse mutation, payment mutation, or catalog mutation behavior changed.

Implementation evidence:

- Added protected `GET /api/admin/operations/overview` for read-only integration health, admin mode metadata, lifecycle operating metrics, and idempotency summary.
- Added protected `GET /api/admin/operations/idempotency` for `orders.create.v1` diagnostics by channel, optional channel account ID, and external order ID.
- Extended `src/admin/admin-ui.ts` with integration health and idempotency diagnostic panels that load only through the existing Auth bearer-token path.
- Kept default admin operations mode read-only. The API explicitly reports `actionWorkflowsEnabled=false`; H7.4 and H7.5 remain open.
- Added `scripts/verify-admin-operations-console.js` and wired `npm test` to run `npm run verify:admin-operations-console`.
- Updated `docs/orchestrator/GOALS.md`, `docs/orchestrator/ORDERS_HUB_ROADMAP.md`, and `docs/IMPLEMENTATION_STATE.md` to mark H7.1-H7.3 complete and H7.4-H7.5 open.

Boundary decisions:

- Auth remains the authority for admin identity and roles. Orders consumes Auth-issued JWT roles and does not mint sessions or users.
- Warehouse, Payments, Catalog, Notifications, Leads, and Marketing are shown as integration boundaries/status signals only; Orders does not take over their domain ownership.
- Idempotency diagnostics return canonical order IDs, bounded source metadata, state, totals, item counts, and timestamps only. They do not expose addresses, raw payment references, provider payloads, tracking URLs, tokens, secrets, or customer free text.
- Safe lifecycle timeline/log panels remain derived from bounded order, item, and shipment metadata.

Verification evidence:

- `npm run build`: pass.
- `npm run verify:admin-operations-console`: pass; read-only integration health, idempotency diagnostics, protected route declarations, UI panels, and sensitive response exclusions passed.
- `npm test`: pass; build, transitions, sensitive logging, create-order contract, idempotency contract, duplicate protection, event contracts, warehouse handoff, payment boundary, and admin operations console checks passed.

Gate decision:

- H7.1-H7.3 readiness: accept.
- Deployment readiness: pending explicit release/deploy decision.

Next unfinished chunk:

- Goal H7.4 role-scoped read-only versus action-capable admin modes.

## 2026-06-13 - Goal H7 Admin Operations Console, Role-Scoped Approved Actions

Current focus:

- Complete Goal H7 - Admin Operations Console by adding role-scoped read-only versus action-capable modes and bounded human-approved action workflows.
- Scope: admin operations only. No payment provider identity, refund execution, warehouse stock authority, catalog truth, notifications delivery, CRM ownership, or pricing mutation ownership moved into Orders.

Implementation evidence:

- Added `ADMIN_READ_ROLES` and `ADMIN_ACTION_ROLES` to `src/admin/admin.service.ts`.
- Kept default `internal:orders-microservice:admin` read-only. Action-capable workflows require `global:superadmin` or `internal:orders-microservice:action-admin`.
- Added protected `GET /api/admin/operations/actions` to expose the available workflow catalog and current mode.
- Added protected `POST /api/admin/operations/actions/order-status` for approved order lifecycle actions.
- Wired the action endpoint through `OrdersService.updateStatus`, preserving the existing state-machine validation, cancellation approval audit, side-effect acknowledgements, Warehouse cancellation handoff, and event publishing behavior.
- Extended `src/admin/admin-ui.ts` with an approved actions panel. The action button is disabled in read-only mode and the request sends only order ID, target status, reason code, approver label, and side-effect acknowledgement booleans.
- Imported `OrdersModule` into `AdminModule` so the admin action layer delegates to the existing Orders service.
- Extended `scripts/verify-admin-operations-console.js` to check read-only/action-capable policy, compiled Nest role metadata, approved action workflow delegation, UI wiring, and sensitive response exclusions.
- Updated `docs/orchestrator/GOALS.md`, `docs/orchestrator/ORDERS_HUB_ROADMAP.md`, and `docs/IMPLEMENTATION_STATE.md` to mark H7 complete.

Boundary decisions:

- Default admin remains read-only.
- Action-capable mode is explicit and role-scoped.
- Human approval metadata is required for cancellation by the existing `validateOrderStatusTransitionWithAudit` gate.
- Refund-like operations remain rejected by the Payments boundary and are not exposed through the admin operations workflow.
- Destructive terminal-state corrections remain outside this workflow.

Verification evidence:

- `npm run build`: pass.
- `npm run verify:admin-operations-console`: pass; read-only integration health, idempotency diagnostics, protected route declarations and role metadata, read-only/action-capable mode policy, approved order status workflow delegation, UI panels, and sensitive response exclusions passed.
- `npm test`: pass; build, transitions, sensitive logging, create-order contract, idempotency contract, duplicate protection, event contracts, warehouse handoff, payment boundary, and admin operations console checks passed.
- Local Playwright render smoke against the admin HTML: pass; Integration health, Idempotency diagnostics, and Approved actions panels rendered; the action button starts disabled with `Read-only mode`; no visible error banner was present.

Gate decision:

- H7 readiness: accept.
- Deployment readiness: pending explicit release/deploy decision.

Next unfinished chunk:

- Goal H8 candidate application integration decisions or owner-selected deployment/migration step.

## 2026-06-13 - Goal H8 Candidate Application Integration Decisions

Current focus:

- Complete Goal H8 - Candidate Application Integration Decisions.
- Scope: documentation and decision record only. No runtime integration, API behavior, database schema, deployment, or candidate repository code changed.

Context search evidence:

- Read Orders preserved intent and invariants: `docs/orchestrator/INTENT.md`, `docs/orchestrator/PROJECT_INVARIANTS.md`, `docs/orchestrator/GOALS.md`, `docs/orchestrator/ORDERS_HUB_ROADMAP.md`, and `docs/IMPLEMENTATION_STATE.md`.
- Reviewed SpeakASAP docs and targeted payment/order evidence: `speakasap/BUSINESS.md`, `speakasap/SYSTEM.md`, `speakasap/README.md`, `speakasap/docs/refactoring/GATEWAY_API_CONTRACT.md`, `speakasap/docs/refactoring/GATEWAY_ROUTE_OWNERSHIP_MATRIX.md`, and `speakasap/docs/orchestrator/WORKFLOW_OWNERSHIP_MAP.md`.
- Reviewed School Committee docs and schema evidence: `school-committee/BUSINESS.md`, `school-committee/SYSTEM.md`, `school-committee/README.md`, `school-committee/prisma/schema.prisma`, `school-committee/types/payments.ts`, and focused payment tests/docs search.
- Reviewed Rentabox docs: `rent-a-box/docs/mvp-boundary.md`, `rent-a-box/docs/goals/GOAL-04-reservation-payment-rental-lifecycle.md`, `rent-a-box/docs/goals/GOAL-05-contracts-pin-notifications.md`, `rent-a-box/docs/api.md`, `rent-a-box/docs/database.md`, and `rent-a-box/docs/goals/ORCHESTRATION_STATE.md`.
- Reviewed Marathon docs and targeted payment ledger evidence: `marathon/BUSINESS.md`, `marathon/SYSTEM.md`, `marathon/GOALS.md`, `marathon/docs/intent/05_subsystems/SUB-002-vip-payments.md`, `marathon/docs/intent/07_decisions/ADR-003-payment-attempt-ledger.md`, and `marathon/docs/intent/04_systems/SYS-001-marathon-platform.md`.
- DocsRAG live query was not run from this Orders session because no session `JWT_TOKEN` was available; repository source-of-truth docs were used as compensating evidence.

Decision evidence:

- Added `docs/orchestrator/CANDIDATE_APPLICATION_INTEGRATION_DECISIONS.md`.
- Marked H8 chunks H8.1-H8.5 complete in `docs/orchestrator/GOALS.md` and `docs/orchestrator/ORDERS_HUB_ROADMAP.md`.
- Updated `docs/IMPLEMENTATION_STATE.md` to record H8 completion and the next action.

Decision summary:

- SpeakASAP: excluded for now. SpeakASAP `payment-service` owns its education order/invoice/subscription/payment-webhook domain; external payment processing remains in `payments-microservice`.
- School Committee: excluded. Contributions are QR/bank payment intents, variable symbols, and reconciliation events owned by the committee platform and legal association context.
- Rentabox: excluded for MVP v1. The domain is reservation, mock payment, rental activation, contracts, PIN access, and customer/admin self-storage workflows, not a sales-channel order flow.
- Marathon: excluded. Marathon owns participant registration, VIP payment-attempt ledger, gift redemption, assignment progress, and VIP state; VIP unlock requires a matching payment attempt.
- No approved integrations were identified, so no per-application runtime contract goals were created.

Boundary decisions:

- No application is forced into central Orders without owner approval.
- Future candidate integration requires a new owner-approved contract goal naming create contract, idempotency key, event payloads, payment references, warehouse/no-warehouse decision, sensitive-data policy, rollback, and coexistence plan.
- Orders remains canonical for sales-channel orders and lifecycle events; it does not take over education payments, parent-committee contributions, self-storage rentals/access, or Marathon participant/VIP state.

Verification evidence:

- Documentation-only gate: runtime build not required.
- H8 decision discoverability: pass; `docs/orchestrator/CANDIDATE_APPLICATION_INTEGRATION_DECISIONS.md` exists and is referenced by `docs/IMPLEMENTATION_STATE.md`.
- IPS missing-marker scan: pass; no missing or unknown markers found in IPS documentation scope.
- Sensitive logging/literal scan: pass; `npm run verify:sensitive-logging` completed successfully.
- `git diff --check`: pass.

Gate decision:

- H8 documentation readiness: accept.

Next unfinished chunk:

- Owner-selected deployment/migration step or future approved candidate contract goal.

## 2026-06-13 - Owner-Selected H6 Payment Status Migration Verification

Current focus:

- Owner request: choose the next deployment/migration step.
- Selected step: verify and replay the guarded H6 payment status boundary migration before any runtime deployment, because the H6 payment callback endpoint depends on the live `orders` table columns.

Migration evidence:

- Pre-check against the live `orders` database found `public.orders.paymentReferenceId`, `public.orders.paymentApplicationId`, and `public.orders.paymentUpdatedAt` already present.
- Replayed `migrations/005_add_order_payment_status_boundary.sql` through the live `db-server-postgres` pod in namespace `statex-apps`.
- Guarded replay emitted expected existing-column notices for all three columns and completed with `ALTER TABLE`.
- Post-check verified the three columns remain present with bounded varchar/timestamp types.

Gate decision:

- Migration readiness: accept.
- Runtime deployment: not run in this step. The next deployment decision should be explicit because the worktree includes H7/H8 admin and documentation changes beyond the schema verification.

Verification evidence:

- Live schema pre-check: pass.
- Guarded migration replay: pass.
- Live schema post-check: pass.

Next unfinished chunk:

- Commit/deploy the completed H7/H8 source and documentation changes when the owner approves the runtime release, or start a future approved candidate contract goal.

## 2026-06-13 - Owner-Approved H7/H8 Runtime Deployment

Current focus:

- Owner approved the runtime release after H6 migration verification.
- Scope: deploy the current `orders-microservice` main branch containing completed H7 admin operations console changes, H8 candidate integration decisions, and H6 migration evidence.

Release evidence:

- Pre-deploy `npm test`: pass; build, transitions, sensitive logging, create-order contract, idempotency contract, duplicate protection, event contracts, warehouse handoff, payment boundary, and admin operations console verification all passed.
- Committed IPS migration evidence as `2f82535 Record H6 payment status migration verification`.
- Ran `./scripts/deploy.sh` from `/home/ssf/Documents/Github/orders-microservice`.
- Built Docker image `localhost:5000/orders-microservice:2f82535` and tagged/pushed `localhost:5000/orders-microservice:latest`.
- Applied Kubernetes manifests in namespace `statex-apps`, set the deployment image, and completed rollout.
- Live deployment status after rollout: `1/1` ready replica, one updated replica, generation 25 observed.
- Live health check from the deployed pod returned `{"status":"healthy","service":"orders-microservice"}`.

Operational notes:

- The rollout wait initially exceeded the first wait window while the new pod started, but the old pod remained ready during that period.
- New pod `orders-microservice-6cc649d75f-27z7p` became ready with zero restarts.
- Application logs showed the H7 admin operations routes mapped and the service listening on port 3203.
- Logs also showed a non-fatal `Failed to connect to RabbitMQ` message during startup; readiness and health still passed.

Gate decision:

- Deployment readiness: accept.
- Runtime deployment: complete.

Next unfinished chunk:

- Post-deploy monitoring, or a future owner-approved candidate contract goal.

## 2026-06-13 - Owner-Approved Warehouse Handoff Auth Hardening

Current focus:

- Owner approved using cross-project contracts, service APIs, and generated/runtime keys as needed.
- Selected bounded gap: Orders already had Warehouse reservation handoff enabled and a runtime Warehouse service token configured, but the reservation client did not attach bearer authorization to Warehouse lifecycle requests.

Source change:

- Updated src/warehouse/warehouse-reservation.client.ts to normalize the Warehouse base URL and attach Authorization bearer auth from WAREHOUSE_SERVICE_TOKEN or WAREHOUSE_INTERNAL_SERVICE_TOKEN on reserve, release, fulfill, cancel, expire, and return calls.
- Updated scripts/verify-warehouse-handoff-contract.js to prove both unprefixed and already-prefixed token env values are sent as bearer auth.
- Updated docs/orchestrator/WAREHOUSE_HANDOFF_CONTRACT.md to record the runtime-only auth requirement.

Sensitive-data handling:

- No token value, JWT, customer data, address, payment data, or Warehouse response body was written to source or docs.
- DocsRAG query was attempted for the cross-service handoff context, but returned no usable context output; checked-in Orders and Warehouse source-of-truth contracts were used as compensating evidence.

Validation evidence:

- npm run build: pass.
- npm run verify:warehouse-handoff: pass.
- npm test: pass.
- git diff --check: pass.

Next unfinished chunk:

- Deploy Orders and run an owner-approved synthetic order reservation smoke against Warehouse using the existing synthetic stock fixture, then record runtime evidence.

## 2026-06-13 - Warehouse Handoff Auth Deployment Attempt And Runtime Blocker

Deployment evidence:

- Commit 7591b98d64d4b398b84cad8b413f137a607569eb was pushed to origin/main.
- ./scripts/deploy.sh built and pushed localhost:5000/orders-microservice:7591b98 and latest with digest sha256:7c50721a35a759a12637a8053e6ff7035003fc6e8607cdfbd66d34d2a8bf8e5b.
- The standard deploy script reported health against the already-running pod because the deployment still referenced mutable latest and did not rotate the pod.

Runtime smoke attempt:

- A synthetic order create was attempted for product c0de0000-0000-4000-8000-000000000011 and warehouse c0de0000-0000-4000-8000-000000000013.
- The first smoke returned warehouseHandoff.status=disabled, proving production reservation handoff was still configuration-gated; the synthetic order was cancelled under the disabled handoff path.
- WAREHOUSE_RESERVATION_ENABLED=true was applied to the deployment and the image was pinned to localhost:5000/orders-microservice:7591b98 for a deterministic rollout, but replacement pods stalled before IP assignment and never reached app startup.
- The deployment was restored to the previous stable template with WAREHOUSE_RESERVATION_ENABLED removed and image latest. Production health returned healthy on the previous serving pod.

Current production state:

- Serving pod imageID is localhost:5000/orders-microservice@sha256:c37c09130e514fa040dc5eb2123a115e700a298c2645b7e4486a407f44c56fe9.
- Deployment spec image is localhost:5000/orders-microservice:latest.
- Warehouse handoff auth hardening is committed and pushed, but not live until Kubernetes can rotate the Orders pod to the new image.

Next unfinished chunk:

- Resolve the Orders replacement pod scheduling/IP assignment issue, roll out commit 7591b98 or a follow-up immutable image, enable reservation handoff, and rerun the synthetic order reservation smoke.

## 2026-06-13 - Warehouse Handoff Auth Runtime Smoke Complete

Runtime deployment evidence:

- Orders fixed image is live on digest sha256:7c50721a35a759a12637a8053e6ff7035003fc6e8607cdfbd66d34d2a8bf8e5b from commit 7591b98d64d4b398b84cad8b413f137a607569eb.
- Replacement pod startup was delayed by Kubernetes init/image-pull timing but ultimately rolled out successfully.
- External health returned healthy after rollout.

Runtime smoke evidence:

- Generated short-lived Orders and Warehouse smoke JWTs inside the remote shell; token values were not written to docs or chat.
- Created synthetic FlipFlop-channel order d13d6dc6-cb89-4f07-8763-a83eb2b6e1e2 for product c0de0000-0000-4000-8000-000000000011 and warehouse c0de0000-0000-4000-8000-000000000013.
- Orders warehouseHandoff after create: status=reserved, itemCount=1, reservedCount=1, failedCount=0, reasonCode=ORDER_CREATE_RESERVATION.
- Warehouse reservation lookup after create returned one reservation row for the synthetic order.
- Owner-approved cancellation returned order status=cancelled and warehouseHandoff status=cancelled, reservedCount=1, failedCount=0, reasonCode=ORDER_CANCELLED.

Cleanup and safe production state:

- A longer-lived Warehouse token could not be persisted through Vault because the available ExternalSecrets token returned 403 on write.
- The ad hoc deployment Warehouse token was removed after the smoke, and WAREHOUSE_RESERVATION_ENABLED was removed from the deployment.
- Active pod orders-microservice-768c84b58c-45swf is healthy on the fixed image digest and has JWT_SECRET present, WAREHOUSE_RESERVATION_ENABLED missing, and WAREHOUSE_SERVICE_TOKEN missing.

Next unfinished chunk:

- Add a managed Vault-backed WAREHOUSE_SERVICE_TOKEN entry for Orders, map it through ExternalSecret, enable WAREHOUSE_RESERVATION_ENABLED through reviewed config, then rerun the same synthetic reservation smoke as a persistent production configuration check.

## 2026-06-13 - Managed Warehouse Handoff Runtime Wiring

Current focus:

- Owner approved adding required variables to Vault, Kubernetes Vault/ESO wiring, and env examples by following ecosystem patterns.

Implementation evidence:

- Created an Orders-to-Warehouse service JWT with role internal:warehouse-microservice:admin and stored it as WAREHOUSE_SERVICE_TOKEN at Vault path secret/prod/orders-microservice without printing or committing the token value.
- Mapped WAREHOUSE_SERVICE_TOKEN through k8s/external-secret.yaml into orders-microservice-secret.
- Enabled WAREHOUSE_RESERVATION_ENABLED=true in k8s/configmap.yaml with WAREHOUSE_SERVICE_URL=http://warehouse-microservice.statex-apps.svc.cluster.local:3201 and WAREHOUSE_RESERVATION_TTL_MINUTES=15.
- Added .env.example placeholders for the Warehouse handoff runtime variables.
- Changed scripts/deploy.sh to set the deployment image to the immutable commit tag it builds instead of mutable latest.
- Updated README.md, SYSTEM.md, and docs/orchestrator/WAREHOUSE_HANDOFF_CONTRACT.md to record the managed runtime wiring.

Validation evidence:

- kubectl apply --dry-run=server for k8s/configmap.yaml and k8s/external-secret.yaml: pass.
- npm run verify:warehouse-handoff: pass.
- npm test: pass.
- git diff --check: pass.

Next unfinished chunk:

- Completed in follow-up runtime closeout below.

## 2026-06-13 - Persistent Warehouse Handoff Runtime Smoke Complete

Runtime deployment evidence:

- Commit 634d570 was built, pushed, and deployed as localhost:5000/orders-microservice:634d570.
- The standard deploy script timed out while Kubernetes was still starting init containers, but a manual rollout wait immediately afterward completed successfully.
- Active pod orders-microservice-6f797c7cf9-rzc5z is healthy on image localhost:5000/orders-microservice:634d570 with digest sha256:7c50721a35a759a12637a8053e6ff7035003fc6e8607cdfbd66d34d2a8bf8e5b.
- ExternalSecret status is Ready/SecretSynced; the live Kubernetes Secret key list includes DB_PASSWORD, JWT_SECRET, JWT_TOKEN, and WAREHOUSE_SERVICE_TOKEN.
- Runtime env presence check confirmed WAREHOUSE_RESERVATION_ENABLED, WAREHOUSE_SERVICE_TOKEN, WAREHOUSE_SERVICE_URL, and JWT_SECRET are present without printing values.

Persistent smoke evidence:

- Created synthetic FlipFlop-channel order 5c277990-acb6-411e-8895-89cd9826981e with externalOrderId codex-reservation-persistent-1781373803 for product c0de0000-0000-4000-8000-000000000011 and warehouse c0de0000-0000-4000-8000-000000000013.
- Orders warehouseHandoff after create: status=reserved, itemCount=1, reservedCount=1, failedCount=0, reasonCode=ORDER_CREATE_RESERVATION.
- Warehouse reservation lookup after create returned one reservation row for the synthetic order.
- Owner-approved cancellation returned order status=cancelled and warehouseHandoff status=cancelled, itemCount=1, reservedCount=1, failedCount=0, reasonCode=ORDER_CANCELLED.

Validation evidence:

- kubectl rollout status deployment/orders-microservice: pass after manual wait.
- In-pod GET /health: pass.
- Persistent production synthetic reservation smoke: pass.

Next unfinished chunk:

- Monitor normal Orders traffic with managed reservation handoff enabled and consider lengthening deploy rollout timeout for slow init-container startups.

## 2026-06-13 - Post-Deploy Monitoring Check

Current focus:

- Owner asked to start Goal 2, but the remote repository already records Goal 2 as complete across chunks 2.1-2.4.
- Followed the current remote continuation state instead: post-deploy monitoring for the latest Orders runtime.

Monitoring evidence:

- Confirmed `docs/orchestrator/GOALS.md` marks Goal 2 - Order Contract And State Machine Hardening as complete.
- Confirmed `docs/IMPLEMENTATION_STATE.md` states Goal 2 remains complete and owner-approved cancellation gates plus state-transition validation remain in force.
- Current repository HEAD: `6cac242 Record managed warehouse runtime smoke`.
- External health check `curl -sS -i -H 'Cache-Control: no-cache' https://orders.alfares.cz/health`: pass, HTTP 200.
- Health response body: `{"status":"healthy","service":"orders-microservice","uptime":7421,"timestamp":"2026-06-13T20:05:12.633Z"}`.

Next unfinished chunk:

- Continue monitoring normal Orders traffic with managed reservation handoff enabled and consider lengthening deploy rollout timeout for slow init-container startups.

## 2026-06-13 - Post-Deploy Monitoring And Rollout Timeout Hardening

Current focus:

- Owner request: check plans and execute the next goal.
- Current authoritative state had no active coding goal and pointed to post-deploy monitoring plus a deploy rollout timeout hardening follow-up.

Monitoring evidence:

- Repository HEAD before this change was `2bc236e Record orders post-deploy monitoring check`.
- Kubernetes deployment `orders-microservice` is available with `1/1` ready replica on image `localhost:5000/orders-microservice:634d570`.
- Active pod `orders-microservice-6f797c7cf9-rzc5z` is running with zero restarts.
- Deployment conditions are `Available=True` and `Progressing=True`.
- External health check `https://orders.alfares.cz/health` returned HTTP 200 with body `{"status":"healthy","service":"orders-microservice"}` and timestamp `2026-06-13T20:14:00.255Z`.
- Recent application logs included a safe audit entry for `order.create` with outcome `success`; no customer/address/payment/token values were recorded in this status update.

Implementation evidence:

- Updated `scripts/deploy.sh` to use `ORDERS_ROLLOUT_TIMEOUT`, defaulting to `300s`, when calling the shared Kubernetes rollout wait helper.
- This keeps the timeout scoped to Orders deployments and addresses the observed slow init-container replacement behavior without changing shared deployment behavior for other services.

Gate decision:

- Monitoring: pass.
- Runtime deployment: not required for this script/documentation hardening change.

Verification evidence:

- `bash -n scripts/deploy.sh`: pass.
- `git diff --check`: pass after trimming trailing EOF whitespace.
- `npm test`: pass; build, transition, sensitive logging, create-order contract, idempotency, duplicate protection, event contract, warehouse handoff, payment boundary, and admin operations console checks completed successfully.

Next unfinished chunk:

- Continue normal traffic monitoring. Start a future candidate contract goal only when the owner approves a concrete application integration.


## 2026-06-13 - Parallel Planning Refactor

Current focus:

- Owner request: refactor planning so future work is split into goals that can start in parallel across different sessions and agents.
- Scope: IPS/orchestrator documentation and Codex planning preference only; no runtime code changed.

Implementation evidence:

- Updated `docs/IMPLEMENTATION_ORCHESTRATOR.md` so the session algorithm decomposes available work into independent chunks before assigning implementation.
- Updated `docs/orchestrator/PLAN.md` with a parallel-first execution rule, `parallel-ready` and `integration` stages, coordinator duties, blocker rules, and a current parallel-ready work packet table.
- Updated `docs/orchestrator/GOALS.md` with a reusable parallel planning rule for every goal.
- Updated `implementation-goals/README.md` and `implementation-goals/templates/EXECUTION_PLAN.md` so delegated packets include lane owner, file ownership, blockers, dependencies, validation, and handoff evidence.
- Updated `AGENTS.md` so project agents plan for maximum safe parallel execution while keeping shared state docs coordinator-owned.
- Updated `docs/IMPLEMENTATION_STATE.md` with the compressed continuation state and current parallel packet list.

Parallel-ready packets:

- P1: Goal H2.1/H2.2 Auth-owned admin login contract and role policy documentation. Lane output: `implementation-goals/parallel/P1-auth-admin-contract-handoff.md`. Blocker: Auth source/docs access needed before UI implementation.
- P2: Goal 6.1/6.2 pricing suggestion safety review. Lane output: `implementation-goals/parallel/P2-pricing-safety-handoff.md`. Blocker: runtime behavior changes require owner approval; review/documentation can start.
- P4: normal Orders traffic monitoring evidence collection. Lane output: `implementation-goals/parallel/P4-monitoring-evidence-handoff.md`. Blocker: Kubernetes/log access required; must not print secrets or raw customer data.

Blocked packet:

- P3: future candidate application contract packet. Blocker: owner must approve a concrete application integration before contract work starts.

Gate decision:

- Documentation-only readiness: pass.

Verification evidence:

- Documentation presence check: pass; 28 markdown files found under docs/orchestrator and implementation-goals.
- Missing-marker scan: pass; no unresolved placeholder markers found.
- Sensitive literal scan: pass; no bearer token, secret, password, private key, JWT secret, or DB password literals detected in docs scope.
- git diff --check: pass.

Next unfinished chunk:

- Start P1, P2, and P4 as separate agent lanes using non-overlapping handoff files; coordinator then integrates lane evidence into shared IPS docs.

## 2026-06-15 - Goal 6.1/6.2 Pricing Suggestion Safety Hardening

Current focus:

- Owner request: check plans and proceed to implementation.
- Followed the active parallel plan: reviewed completed P1/P2/P4 lane handoffs, selected P2's next safe Goal 6 coding packet, and kept shared IPS docs coordinator-owned.

Implementation evidence:

- Added explicit `PRICING_ADMIN_ROLES` on `PricingController` so pricing routes no longer rely only on guard default roles.
- Forwarded the authenticated Auth actor from pricing approve/reject endpoints into `PricingService`.
- Added bounded pricing approval provenance fields: `approvedAt`, `approvedBy`, `rejectedAt`, and `rejectedBy`.
- Added guarded migration `migrations/006_add_price_suggestion_approval_metadata.sql`.
- Approval and rejection now persist safe actor identifiers only, capped at 200 characters and sanitized; no tokens, raw JWTs, payment data, or customer data are stored.
- Added `scripts/verify-pricing-safety.js` and wired `npm test` to run `npm run verify:pricing-safety`.

Boundary notes:

- Payments remains payment capture, provider identity, reconciliation, webhook, refund, and variable-symbol owner.
- Catalog/product update behavior was not expanded; existing bounded price update calls remain unchanged.
- No live database migration or deployment was run in this pass.
- Local `alfares` mDNS resolution failed during the run; direct SSH to the verified host `192.168.88.53` was used for remote repair and validation.

Gate decision:

- Integration readiness: accept.
- Deployment readiness: pending live guarded migration and deploy.

Verification evidence:

- `npm run build`: pass.
- `npm run verify:pricing-safety`: pass.
- `npm test`: pass; build, transition, sensitive logging, create-order contract, idempotency contract, duplicate protection, event contracts, warehouse handoff, payment boundary, pricing safety, and admin operations console checks completed successfully.
- `git diff --check`: pass.

Next unfinished chunk:

- Apply the guarded pricing approval metadata migration to the live Orders database and deploy the validated change after owner approval. Then continue Goal 6.3/6.4 for FlipFlop pricing consolidation review plus pricing event/Catalog contract documentation.

## 2026-06-15 - Goal 6.1/6.2 Pricing Safety Migration And Deployment

Current focus:

- Owner approved proceeding with the live migration and deployment after validated implementation commit `2280b32`.

Migration evidence:

- Pre-check confirmed the live `orders` database was reachable and `public.price_suggestion` was absent.
- Applied existing guarded base migration `migrations/001_create_price_suggestion.sql`; it created or confirmed the `price_suggestion` table and indexes.
- Applied guarded metadata migration `migrations/006_add_price_suggestion_approval_metadata.sql`; it completed with `ALTER TABLE`.
- Post-check verified `approvedAt`, `approvedBy`, `rejectedAt`, and `rejectedBy` on `public.price_suggestion` with bounded timestamp/varchar types.
- No table rows, customer data, tokens, secrets, raw JWTs, or payment data were printed.

Deployment evidence:

- Deployed commit `2280b32` with `./scripts/deploy.sh 2280b32`.
- Built and pushed `localhost:5000/orders-microservice:2280b32` and `latest` with digest `sha256:5d189feb7bcd10400b70129558852c2a7a918596f86a670feebcf2c447c5fec7`.
- Kubernetes deployment `orders-microservice` rolled out successfully in namespace `statex-apps`.
- Active deployment image is `localhost:5000/orders-microservice:2280b32`; new pod `orders-microservice-64f99996cc-bqqr2` is `Running` with `0` restarts at verification time.
- In-pod health check passed during deploy.
- External health check `https://orders.alfares.cz/health` returned HTTP 200 with body status `healthy` at `2026-06-15T10:09:01.721Z`.

Gate decision:

- Migration readiness: accept.
- Deployment readiness: accept.

Next unfinished chunk:

- Continue Goal 6.3/6.4 for FlipFlop pricing consolidation review and pricing event/Catalog contract documentation, plus normal post-deploy traffic monitoring.

## 2026-06-15 - Goal 6.3/6.4 Pricing Consolidation Contract Closure

Current focus:

- Owner approved proceeding further after DNS recovered.
- Selected Goal 6.3/6.4 because Goal 6.1/6.2 were already implemented, migrated, deployed, committed, and pushed.

Context evidence:

- Orders source confirms approved suggestions publish current legacy `pricing.price_changed` payloads to exchange `pricing.events` only after Catalog/product update succeeds.
- FlipFlop source confirms `/api/pricing/*` routes through the gateway to Orders via `ordersPricing`, and storefront/product-service price display reads Catalog product/pricing data.
- FlipFlop still contains a local `PricingEventsPublisher`, but no active FlipFlop subscriber for Orders pricing events was found in the reviewed source.
- Catalog source confirms guarded pricing writes live under `POST /api/pricing`, `POST /api/pricing/bulk`, and `PUT /api/pricing/:id`, and current-price reads live under `GET /api/pricing/product/:productId/current`.

Implementation evidence:

- Added `docs/orchestrator/PRICING_CONSOLIDATION_AND_EVENT_CONTRACT.md`.
- Added `scripts/verify-pricing-consolidation-contract.js`.
- Wired `npm run verify:pricing-consolidation-contract` into `npm test`.
- Marked Goal 6.3 and Goal 6.4 complete in `docs/orchestrator/GOALS.md`; Goal 6 is now complete at the reviewed contract/reconciliation level.

Boundary notes:

- No runtime Orders pricing adapter change was made. The current `updateProductPrice` legacy fallback remains documented as a G6-A follow-up because replacing it requires approved Catalog service authentication and price-row semantics.
- No pricing event routing-key change was made. Versioned `pricing.price_changed.v1` remains a G6-B follow-up because it requires consumer inventory and migration/dual-publish approval.
- No FlipFlop source was changed. Decommissioning FlipFlop's local publisher remains G6-C and must run in a separate FlipFlop session.
- No payment capture, provider identity, refund, cart price snapshot, checkout total, product truth, customer data, token, or secret behavior changed.

Parallel execution notes:

- G6-A, G6-B, and G6-C are dependency-gated and can later run in parallel only after their named blockers are cleared.
- Coordinator owns shared Orders IPS state/status integration.

Gate decision:

- Integration readiness: accept for documentation/verifier contract closure.
- Deployment readiness: not applicable; no runtime source or manifest changed.

Verification evidence:

- `npm run verify:pricing-consolidation-contract`: pass.
- `npm test`: pass; includes pricing consolidation contract verification.
- `git diff --check`: pass.

Next unfinished chunk:

- Select owner-approved runtime follow-up G6-A Catalog Pricing Write Adapter, G6-B Pricing Event Versioning, or G6-C FlipFlop Local Pricing Publisher Decommission; otherwise resume normal Orders traffic monitoring.

## 2026-06-15 - Goal 6 Pricing Rationale Bound

Current focus:

- Owner approved proceeding further after DNS recovered.
- Followed the existing Goal 6 contract state: Goal 6.1/6.2 and Goal 6.3/6.4 were already committed, so this pass closed the remaining P2 risk around unbounded AI rationale text without changing event routing, Catalog writes, payment behavior, or FlipFlop source.

Implementation evidence:

- Added `PricingService.MAX_RATIONALE_LENGTH = 280`.
- Normalized AI rationale strings by replacing control characters and repeated whitespace before persistence.
- Capped persisted rationale text to 280 characters.
- Preserved the current legacy `pricing.price_changed` event shape and routing key because versioned pricing events remain dependency-gated by consumer migration approval.

Boundary notes:

- No payment capture, provider identity, refund, variable-symbol, provider webhook, customer data, token, or secret behavior changed.
- No Catalog write adapter change was made.
- No FlipFlop source changed.
- Existing unrelated local modifications to `AGENTS.md` and `CLAUDE.md` were left untouched.

Verification evidence:

- `npm run build && npm run verify:pricing-safety`: pass.
- `npm run verify:event-contracts`: pass.
- `npm run verify:pricing-consolidation-contract`: pass.
- `npm test`: pass; full Orders verification suite completed successfully.
- Commit `b79e5d9` created and deployed.
- `./scripts/deploy.sh b79e5d9`: pass; image `localhost:5000/orders-microservice:b79e5d9` pushed with digest `sha256:7a30a11d9da094226c83b2b345b366e731bffcce163fc9c4bba0ac8addde4673`.
- Kubernetes rollout: pass; deployment `orders-microservice` is `1/1` ready on image `localhost:5000/orders-microservice:b79e5d9`.
- External health: pass; `https://orders.alfares.cz/health` returned HTTP 200 with body status `healthy` at `2026-06-15T10:26:35.908Z`.

Next unfinished chunk:

- Select owner-approved runtime follow-up G6-A Catalog Pricing Write Adapter, G6-B Pricing Event Versioning, or G6-C FlipFlop Local Pricing Publisher Decommission; otherwise resume normal Orders traffic monitoring.

## 2026-06-15 - Pricing Deployment Post-Deploy Monitoring

Current focus:

- Monitor normal Orders runtime after the deployed Goal 6.1/6.2 pricing safety release and Goal 6.3/6.4 contract closure.

Monitoring evidence:

- Kubernetes deployment `orders-microservice` is `READY 1/1`, `UP-TO-DATE 1`, `AVAILABLE 1`.
- Active image remains `localhost:5000/orders-microservice:2280b32`.
- Active pod `orders-microservice-64f99996cc-bqqr2` is `Running` with `0` restarts at observation time.
- `kubectl rollout status deployment/orders-microservice --timeout=30s`: pass.
- External health check `https://orders.alfares.cz/health`: HTTP 200 with body status `healthy` at `2026-06-15T10:23:47.199Z`.
- Redacted log sample from the last 30 minutes showed PricingModule and pricing/admin-pricing routes initialized.
- Redacted log sample showed the known startup `Failed to connect to RabbitMQ` line before `Nest application successfully started`; no later sampled application failure line was recorded.

Sensitive-data handling:

- No secrets, bearer tokens, raw JWTs, customer data, payment data, addresses, or table rows were captured in this status entry.

Gate decision:

- Monitoring readiness: accept.

Next unfinished chunk:

- Select owner-approved runtime follow-up G6-A Catalog Pricing Write Adapter, G6-B Pricing Event Versioning, or G6-C FlipFlop Local Pricing Publisher Decommission; otherwise select the next backlog goal.

## 2026-06-15 - Pricing Rationale Bound Deployment

Current focus:

- Deploy and verify commit `b79e5d9` after the bounded rationale update passed the full Orders test suite.

Deployment evidence:

- Pushed `b79e5d9` to `origin/main`.
- Deployed with `./scripts/deploy.sh b79e5d9`.
- Built and pushed `localhost:5000/orders-microservice:b79e5d9` and `latest` with digest `sha256:7a30a11d9da094226c83b2b345b366e731bffcce163fc9c4bba0ac8addde4673`.
- Kubernetes deployment `orders-microservice` rolled out successfully in namespace `statex-apps`.
- Active deployment image is `localhost:5000/orders-microservice:b79e5d9`; new pod `orders-microservice-86c49fcd85-cs5hc` is `Running` with `0` restarts at verification time.
- In-pod health check passed during deploy.
- External health check `https://orders.alfares.cz/health` returned HTTP 200 with body status `healthy` at `2026-06-15T10:26:40.100Z`.
- Redacted new-pod log sample showed pricing routes initialized and the known startup `Failed to connect to RabbitMQ` line before `Nest application successfully started`; no later sampled failure line was recorded.

Sensitive-data handling:

- No secrets, bearer tokens, raw JWTs, customer data, payment data, addresses, or table rows were captured.

Gate decision:

- Deployment readiness: accept.
- Monitoring readiness: accept.

Next unfinished chunk:

- Select owner-approved runtime follow-up G6-A Catalog Pricing Write Adapter, G6-B Pricing Event Versioning, or G6-C FlipFlop Local Pricing Publisher Decommission; otherwise select the next backlog goal.

## 2026-06-15 - Parallel Handoff Integration P2/P4

Current focus:

- Integrate completed parallel lane handoffs from P2 pricing suggestion safety review and P4 normal traffic monitoring evidence.

P2 coordinator decision:

- P2 review is accepted and superseded by later Goal 6 implementation/deployment work already recorded on 2026-06-15. The recommended pricing hardening packet was effectively approved and completed: explicit pricing roles, bounded approval/rejection actor provenance, pricing verifier coverage, Goal 6 contract documentation, and bounded AI rationale persistence are now implemented, validated, deployed, and monitored.
- No additional P2 follow-up is needed for the original handoff. Remaining owner-approvable runtime follow-ups are G6-A Catalog Pricing Write Adapter, G6-B Pricing Event Versioning, and G6-C FlipFlop Local Pricing Publisher Decommission.

P4 coordinator decision:

- P4 monitoring handoff is accepted. Live health passed, Kubernetes deployment was rolled out and ready, the active pod had zero restarts, Warehouse reservation handoff config and token presence were verified without printing secrets, and sampled logs showed sanitized successful order.create audit entries.
- The startup RabbitMQ warning is not an immediate blocker because it occurred before Nest application startup and no later sampled RabbitMQ failure appeared. Keep it as normal monitoring unless repeated post-startup failures appear.
- Missing explicit WAREHOUSE_RESERVATION_TTL_SECONDS is not an immediate blocker because managed handoff was enabled and live health passed. Track as low-priority config hygiene for the next Warehouse handoff review.
- No Warehouse handoff log lines appeared in the sampled window; no side-effect conclusion is inferred from absence of sampled traffic.

Validation evidence:

- P2 lane: npm run build passed, sensitive literal scan passed, git diff --check passed.
- P4 lane: sensitive literal scan outside fenced command blocks passed, git diff --check passed.
- Coordinator verification on 2026-06-15: production deployment image remains localhost:5000/orders-microservice:b79e5d9, deployment is 1/1 ready, and external health returned HTTP 200 with status healthy.

Next unfinished chunk:

- Select owner-approved runtime follow-up G6-A, G6-B, or G6-C; otherwise continue normal Orders monitoring or select the next backlog goal. P3 candidate application contract work remains blocked until owner approval names a concrete integration.


## 2026-06-26 - Catalog Goal 17 Product Sales Statistics Read Model

Current focus:

- Implement Workstream A for Catalog Goal 17: a protected Orders-owned product sales statistics read model for Catalog while preserving Orders as order truth, Catalog as product truth, Payments as payment truth, Warehouse as stock truth, and Auth as identity/RBAC truth.

Pre-coding gate:

- Decision: pass-with-exception.
- Owner-selected task overrides the stale next-action pointer in `docs/IMPLEMENTATION_STATE.md`.
- DocsRAG was not queried because no session `JWT_TOKEN` was available in this remote shell; this bounded work used repository source-of-truth docs and current Orders source instead.
- Sensitive-data classification: aggregate order/item operational data only. No customer, address, payment provider/reference, token, secret, stock authority, or raw production row data is exposed.

Implementation evidence:

- Added `docs/orchestrator/GOAL17_PRODUCT_SALES_STATISTICS_CONTRACT.md` for the protected read model contract.
- Added protected `GET /api/orders/statistics/products/:productId` under the existing `/api` prefix.
- Aggregation joins canonical `order_items` to `orders` by `order_items.productId`.
- Default statuses are `confirmed`, `processing`, `shipped`, and `delivered`; `cancelled` is excluded unless explicitly requested by the `status` filter.
- Optional filters: `from`, `to`, `channel`, and comma-separated `status`.
- Response envelope includes `success`, product ID, generated time, applied filters, summary, channel/status breakdowns, and bounded recent history.
- Revenue wording is `grossItemRevenue`; mixed-currency data is grouped in `totalsByCurrency` and the top-level gross value is not flattened.
- Auth roles include existing Orders read/admin/operator roles plus `internal:catalog-microservice:service`, following the existing internal service-role convention used by Payments.

Validation evidence:

- `git diff --check`: pass.
- `npm run build`: pass.
- `npm run verify:product-sales-statistics`: pass; verified route protection, explicit roles, response envelope, default cancelled exclusion, filter validation, mixed-currency grouping, gross item revenue wording, and sensitive-field exclusions.
- `npm test`: pass; full Orders build and verifier chain passed, including create-order contract, payment boundary, warehouse handoff, pricing, product sales statistics, and admin operations checks.
- Deployment: not run; this workstream does not approve deployment.

Blockers and follow-ups:

- [MISSING: Catalog-owned consumer smoke against the live Catalog integration path after deployment approval.]
- Auth-owned confirmation resolved: `internal:catalog-microservice:service` is the Catalog service actor for Orders product statistics when authenticated with `CATALOG_INTERNAL_SERVICE_TOKEN` from `secret/prod/auth-microservice#CATALOG_INTERNAL_SERVICE_TOKEN`.

Next unfinished chunk:

- Hand off to the coordinator for Catalog-side integration and deployment approval. Do not deploy from this workstream.


## 2026-07-02 - Auth Subject Snapshot For Invoices

Selected chunk: source-only Orders/Auth customer identity contract for invoices
account matching.

Intent chain:

- Vision: authenticated customers can retrieve their invoices and order
  lifecycle without relying only on mutable email matching.
- Goal Impact: Invoices can match account access by stable Auth subject when
  Orders snapshots carry one.
- System: Auth remains identity owner; Orders stores only the bounded Auth user
  UUID supplied by authenticated create callers; Invoices consumes the order
  snapshot; RabbitMQ events remain trigger-only.
- Feature: additive `customer.authSubject`/alias input normalized to
  `customer.authUserId` and `customer.subject`.
- Task: implement create-order normalization, persisted snapshot typing,
  subject-first customer lifecycle read scope, verifiers, and docs.
- Execution Plan: source-only remote edit; no deploy, no DB reads/writes, no
  secret reads, no production customer/order rows.
- Coding Prompt: do not infer identity from email; reject malformed UUIDs;
  preserve legacy orders; keep customer identity out of order events.
- Code: `src/orders/create-order.dto.ts`, `src/orders/order.entity.ts`,
  `src/orders/orders.service.ts`, focused verifiers, and IPS docs.
- Validation: `npm test`, `npm run verify:invoices-read-boundary`, and
  `git diff --check` passed.
- DocsRAG: `[MISSING: service JWT for docs-rag query in this session]`; work
  proceeded from repository source-of-truth docs and read-only sub-agent source
  audits.

Runtime evidence:

- Deployed Orders image is `localhost:5000/orders-microservice:537a103`.
- `git merge-base --is-ancestor c4f1332 537a103` exited `0`, proving the
  deployed image commit contains the Auth-subject accepting contract.
- `npm run verify:invoices-read-boundary` and
  `npm run verify:create-order-contract` passed in `orders-microservice`.
- FlipFlop authenticated checkout source now forwards the UUID-shaped local
  Auth user id as central Orders `customer.authSubject`.
- FlipFlop commit `23b22e0 test: add auth subject orders smoke gate` added a
  non-mutating-by-default `smoke:orders-auth-subject` runner for approved
  runtime proof.

Blockers converted:

- `[MISSING: approved FlipFlop smoke:orders-auth-subject execution proving authenticated central order snapshots carry customer.authSubject]`
- `[MISSING: Cliplot hosted Auth callback/session contract before authenticated checkout can pass Auth subject]`


## 2026-07-03 - Order Affinity Historical Replay Export

Current focus: Orders-owned bounded historical export for Marketing order-affinity backfill.

Intent Preservation Chain:

- Vision: Real customer purchases can safely create product relationship evidence for related-product and future bundle surfaces.
- Goal Impact: Marketing can replay historical paid Orders without reading Orders tables directly or receiving customer/address/payment details.
- System: Orders owns order history and emits a redacted replay contract; Marketing owns affinity aggregation and Catalog publishing; Catalog owns persisted product relations.
- Feature: Protected `orders.order_affinity_replay_candidates.v1` export.
- Task: Add a guarded replay endpoint, paid/successful status filters, redacted Orders-created compatible envelopes, Marketing internal-service auth, and contract verifier coverage.
- Execution Plan: Add only Orders-owned API/auth/config; no broad order list reuse, no PII fields, no direct Marketing DB access, no live Catalog writes from Orders.
- Coding Prompt: Only expose `orderId`, channel, currency, and item product snapshots needed for co-purchase evidence; keep customer/address/billing/payment references out of the serializer.
- Code: `src/orders/orders.controller.ts`, `src/orders/orders.service.ts`, `src/auth/jwt-roles.guard.ts`, `k8s/external-secret.yaml`, `.env.example`, and `scripts/verify-order-affinity-replay-contract.js`.
- Validation: `npm run verify:order-affinity-replay`, `npm run build`, and `git diff --check` passed.

Deployment and runtime evidence:

- Commits pushed: `6154389` added the replay export; `43189fe` added Marketing internal auth; `9ead8f3` and `be9fee8` fixed runtime TypeORM sort compatibility.
- Current deployed image: `localhost:5000/orders-microservice:be9fee8`.
- Deploy completed successfully and `/health` returned `status=healthy`.
- ExternalSecret `orders-microservice-secret` is `Ready=True` and maps `MARKETING_INTERNAL_SERVICE_TOKEN` from `secret/prod/marketing-microservice#JWT_TOKEN` without printing secret values.
- Marketing live dry-run against `GET /api/orders/internal/order-affinity/replay-candidates?limit=50` succeeded after deployment.
- Dry-run result: `inputRecords=0`, `aggregatePairs=0`, `candidates=[]`; no historical Catalog relation writes were performed.

Remaining blockers:

- `[MISSING: qualifying historical paid multi-product Orders rows for a non-empty historical backfill batch]`.
- `[MISSING: owner-reviewed publish window if a future replay window returns non-zero candidates]`.
