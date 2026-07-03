# Browser Render Proof Report Contract

Date: 2026-07-03
Repository of record: `orders-microservice`
Schema version: `orders.browser_render_proof.v1`

## Purpose

Rendered browser proof must be captured as a sanitized machine-checkable report before the Orders lifecycle goal can be called complete. Route availability, source markers, and service-scoped lifecycle reads are not enough to prove customer/admin cabinet rendering.

The browser proof report channel must be one of approved sellable marketplaces.

## Required Report Shape

A valid report is JSON with these top-level fields:

- `schemaVersion`: must be `orders.browser_render_proof.v1`.
- `status`: one of `proven`, `incomplete`, or `blocked`.
- `channel`: one of `flipflop`, `heureka`, `bazos`, `aukro`, or `allegro`; for the first lane this must be `flipflop`.
- `proofMode`: one of `safe_human_session` or `service_scoped_proxy`.
- `checkedAt`: ISO timestamp; it must not be in the future beyond a 5-minute verifier clock-skew allowance. For a supplied real proven report, it must also be within 24 hours of verifier execution.
- Proven report route URLs must be unique after normalization; one route URL cannot stand in for multiple surface proofs.
- `ordersEvidenceCommit`: immutable 40-character lowercase git commit hash used for the proof; `HEAD` is not valid for `status=proven`. ordersEvidenceCommit must be an immutable git commit hash for proven reports.
- `mutationEvidence`: sanitized object with `source`, `approvalId`, `summary`, required `expectedLifecycleStage` for `status=proven`, and required `artifactHash` for `status=proven`; for `status=proven`, `source` must be `smoke:lifecycle-mutation` or `approved-existing-mutation-artifact`, and `artifactHash` must be `sha256:<64 lowercase hex>`.
- `routes`: non-empty array of route evidence entries.
- `refreshMechanism`: one of `manual_refresh`, `visible_polling_30s`, `full_reload`, or `api_backed_render_probe`.
- `centralReadModelBacked`: boolean proving the rendered state came from Orders lifecycle read model or a channel API backed by it.
- `evidencePolicy`: object with all sensitive-data controls set to `true`.
- `result`: sanitized summary and next action; `summary` and `nextAction` must be non-empty.

Each `routes[]` entry must include:

- `url`: route tested; for `status=proven`, the URL must use `https`, its host must match the declared `channel`, and its path must target an order lifecycle surface.
- `httpStatus`: numeric HTTP status.
- `surface`: one of `customer_cabinet`, `admin_cabinet`, or `admin_dashboard`.
- `renderedLifecycleLabel`: localized visible lifecycle text or status shown in the UI.
- `renderedLifecycleStage`: canonical lifecycle stage if visible or inferred from sanitized UI state.
- `artifact`: object with `kind`, `redacted`, and either `sha256` or `path`; `sha256` must be 64 lowercase hex characters and `path` must stay under `reports/validation/orders-browser-render-proof/`. For supplied real reports, every referenced `artifact.path` file must exist.
- `authContext`: optional route-level proof context; if present it must be `safe_human_session` or `service_scoped_proxy`.
- `dataSourceStatus`: optional numeric backing Orders/channel API status; `status=proven` cannot include `401` or `403` data-source statuses.

## Sensitive Data Policy

The report must not contain raw bearer tokens, cookies, customer names, email addresses, phone numbers, street addresses, payment references, raw order rows, database dumps, tracking numbers, provider payloads, or screenshots with unredacted customer data.

Required `evidencePolicy` booleans:

- `noTokenValues`
- `noCookies`
- `noCustomerPii`
- `noRawOrderRows`
- `noDatabaseDump`
- `noPaymentReference`
- `noTrackingValues`
- `noProviderPayload`
- `artifactsRedacted`

## Proven Criteria

`status=proven` requires all of the following:

- At least one `customer_cabinet` route has HTTP `2xx` or `3xx`; if `dataSourceStatus` is present it must also be `2xx` or `3xx`. proven report needs successful customer cabinet route evidence.
- At least one `admin_cabinet` or `admin_dashboard` route has HTTP `2xx` or `3xx`; if `dataSourceStatus` is present it must also be `2xx` or `3xx`. proven report needs successful admin cabinet or dashboard route evidence.
- At least one successful `customer_cabinet` route has a non-empty `renderedLifecycleLabel` and `renderedLifecycleStage`. proven report needs rendered lifecycle label and stage on customer cabinet route evidence.
- At least one successful `admin_cabinet` or `admin_dashboard` route has a non-empty `renderedLifecycleLabel` and `renderedLifecycleStage`. proven report needs rendered lifecycle label and stage on admin cabinet or dashboard route evidence.
- Every proven route must render the same canonical stage as `mutationEvidence.expectedLifecycleStage`.
- At least one route must cover `customer_cabinet`.
- At least one route must cover `admin_cabinet` or `admin_dashboard`.
- `centralReadModelBacked=true`.
- `mutationEvidence.summary` is present and sanitized.
- `mutationEvidence.source` is an approved lifecycle mutation source: `smoke:lifecycle-mutation` or `approved-existing-mutation-artifact`. proven report mutationEvidence.source must be an approved lifecycle mutation source.
- `mutationEvidence.approvalId` is present and non-empty.
- `mutationEvidence.artifactHash` is present and formatted as `sha256:<64 lowercase hex>`. proven report mutationEvidence.artifactHash must be sha256-prefixed 64 lowercase hex.
- Every artifact is marked `redacted=true`.
- Artifact SHA-256 values must be 64 lowercase hex characters. artifact sha256 must be 64 lowercase hex characters for browser proof reports.
- Artifact paths must be relative and under `reports/validation/orders-browser-render-proof/`. artifact path must be under reports/validation/orders-browser-render-proof for browser proof reports.
- Supplied real reports must not reference missing artifact files. artifact.path file must exist for real browser proof reports.
- All `evidencePolicy` controls are `true`.
- `result.summary` is present and non-empty. report result.summary must not be empty.
- `result.nextAction` is present and non-empty. report result.nextAction must not be empty.
- `checkedAt` is not in the future beyond the verifier clock-skew allowance. report checkedAt must not be in the future beyond allowed clock skew.
- Supplied real proven reports must have `checkedAt` within 24 hours of verifier execution. real proven browser proof report checkedAt must be recent within 24 hours.
- At least one route must include `authContext=safe_human_session` or `authContext=service_scoped_proxy`.
- Route `authContext` values must match report-level `proofMode`. route authContext must match report proofMode for proven browser reports.
- Public shell routes, anonymous DOM snapshots, and route-only HTML checks cannot satisfy `status=proven`. Backing API `401`/`403` responses also cannot satisfy `status=proven`.
- Route URL host must match report channel for proven browser reports. route url host must match report channel for proven browser reports.
- Route URL path must target an order lifecycle surface for proven browser reports. route url path must target an order lifecycle surface for proven browser reports.
- Route URLs must be unique for proven browser reports. proven report route urls must be unique.


## Template Generator

`npm run generate:browser-render-proof-template` emits a sanitized `orders.browser_render_proof.v1` template bound to the current immutable Orders commit. The template defaults to the first FlipFlop validation lane, `status=incomplete`, and `--artifact-mode=path`; `--artifact-mode=sha256` is available for hash-only redacted proof evidence. It is a capture aid only and cannot close the rendered browser proof gate until all `[MISSING: ...]` placeholders are replaced with approved rendered evidence and the supplied report passes `verify:browser-render-proof-report`.

`npm run verify:browser-render-proof-template` verifies the template generator remains incomplete by default, includes customer/admin route shells, supports redacted artifact path and hash modes, keeps schema-compatible route statuses, cross-checks both generated modes through `verify:browser-render-proof-report`, and does not claim browser proof.

## Default Verifier Mode

`npm run verify:browser-render-proof-report` is non-mutating by default. Without `BROWSER_RENDER_PROOF_REPORT_PATH`, it only validates this contract and reports the proof as gated. With `BROWSER_RENDER_PROOF_REPORT_PATH=/path/to/report.json`, it validates the supplied sanitized report, requires referenced artifact files to exist, and requires a real proven report to be no older than 24 hours. A real proven report must also set `BROWSER_RENDER_PROOF_EXPECTED_COMMIT=<40-char-commit>`, and `ordersEvidenceCommit` must match `BROWSER_RENDER_PROOF_EXPECTED_COMMIT`. `BROWSER_RENDER_PROOF_EXPECTED_COMMIT=<40-char-commit>` must be supplied when validating a real proven report. ordersEvidenceCommit must match BROWSER_RENDER_PROOF_EXPECTED_COMMIT for proven browser reports.

## Remaining Gate

`[MISSING: approved safe buyer/admin session source or explicit service-scoped browser proxy proof for FlipFlop validation-only lane.]`

`[MISSING: rendered customer/admin UI lifecycle stage after approved mutation or approved existing mutation artifact.]`

## Fixture Coverage

`verify:browser-render-proof-report` validates two checked-in sanitized fixtures by default:

- `docs/orchestrator/browser-render-proof-report-fixtures/valid-flipflop-service-scoped.json` must pass the schema and proven criteria, including customer and admin surfaces.
- `docs/orchestrator/browser-render-proof-report-fixtures/invalid-sensitive-key.json` must be rejected because it contains a forbidden sensitive key name.
- `docs/orchestrator/browser-render-proof-report-fixtures/invalid-public-shell-route.json` must be rejected because route-only anonymous shell evidence cannot prove lifecycle rendering.
- `docs/orchestrator/browser-render-proof-report-fixtures/invalid-mismatched-stage.json` must be rejected because customer/admin rendered stages diverge from `mutationEvidence.expectedLifecycleStage`.
- `docs/orchestrator/browser-render-proof-report-fixtures/invalid-unknown-channel.json` must be rejected because the report channel is not one of the approved sellable marketplaces.
- `docs/orchestrator/browser-render-proof-report-fixtures/invalid-proof-mode-mismatch.json` must be rejected because route `authContext` does not match report-level `proofMode`.
- `docs/orchestrator/browser-render-proof-report-fixtures/invalid-head-commit.json` must be rejected because `ordersEvidenceCommit=HEAD` is not immutable proof evidence.
- `docs/orchestrator/browser-render-proof-report-fixtures/invalid-expected-commit-mismatch.json` must be rejected because `ordersEvidenceCommit` does not match `BROWSER_RENDER_PROOF_EXPECTED_COMMIT`.
- `docs/orchestrator/browser-render-proof-report-fixtures/invalid-route-channel-mismatch.json` must be rejected because route URLs belong to a different marketplace host than the declared report `channel`.
- `docs/orchestrator/browser-render-proof-report-fixtures/invalid-artifact-evidence.json` must be rejected because route artifact evidence has an invalid SHA-256/path shape.
- `docs/orchestrator/browser-render-proof-report-fixtures/invalid-surface-http-status.json` must be rejected because one required surface lacks successful route/data-source evidence.
- `docs/orchestrator/browser-render-proof-report-fixtures/invalid-mutation-source.json` must be rejected because `mutationEvidence.source` is not an approved lifecycle mutation source.
- `docs/orchestrator/browser-render-proof-report-fixtures/invalid-surface-rendered-lifecycle.json` must be rejected because one required surface lacks a rendered lifecycle label/stage.
- `docs/orchestrator/browser-render-proof-report-fixtures/invalid-result-summary.json` must be rejected because the report result summary/next action is incomplete.
- `docs/orchestrator/browser-render-proof-report-fixtures/invalid-future-checked-at.json` must be rejected because `checkedAt` is in the future beyond the allowed clock-skew window.
- `docs/orchestrator/browser-render-proof-report-fixtures/invalid-duplicate-route-url.json` must be rejected because one route URL cannot satisfy multiple rendered surface proofs.
- `docs/orchestrator/browser-render-proof-report-fixtures/invalid-stale-checked-at.json` must be rejected in real-report validation mode because stale rendered UI evidence cannot close the current browser proof gate.
- `docs/orchestrator/browser-render-proof-report-fixtures/invalid-mutation-artifact-hash.json` must be rejected because mutation evidence lacks a reproducible `sha256:<64 lowercase hex>` artifact hash.
- `docs/orchestrator/browser-render-proof-report-fixtures/invalid-missing-artifact-file.json` must be rejected in real-report validation mode because referenced artifact files must exist.

These fixtures are contract tests only. They are not browser-render proof and must not be used to close the rendered UI gate.
