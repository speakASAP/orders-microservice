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
- `checkedAt`: ISO timestamp.
- `ordersEvidenceCommit`: immutable 40-character lowercase git commit hash used for the proof; `HEAD` is not valid for `status=proven`. ordersEvidenceCommit must be an immutable git commit hash for proven reports.
- `mutationEvidence`: sanitized object with `source`, `approvalId`, `summary`, required `expectedLifecycleStage` for `status=proven`, and optional `artifactHash`.
- `routes`: non-empty array of route evidence entries.
- `refreshMechanism`: one of `manual_refresh`, `visible_polling_30s`, `full_reload`, or `api_backed_render_probe`.
- `centralReadModelBacked`: boolean proving the rendered state came from Orders lifecycle read model or a channel API backed by it.
- `evidencePolicy`: object with all sensitive-data controls set to `true`.
- `result`: sanitized summary and next action.

Each `routes[]` entry must include:

- `url`: route tested.
- `httpStatus`: numeric HTTP status.
- `surface`: one of `customer_cabinet`, `admin_cabinet`, or `admin_dashboard`.
- `renderedLifecycleLabel`: localized visible lifecycle text or status shown in the UI.
- `renderedLifecycleStage`: canonical lifecycle stage if visible or inferred from sanitized UI state.
- `artifact`: object with `kind`, `redacted`, and either `sha256` or `path`.
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

- At least one customer or admin route has HTTP `2xx` or `3xx`.
- At least one route has a non-empty `renderedLifecycleLabel`.
- At least one route has a non-empty `renderedLifecycleStage`.
- Every proven route must render the same canonical stage as `mutationEvidence.expectedLifecycleStage`.
- At least one route must cover `customer_cabinet`.
- At least one route must cover `admin_cabinet` or `admin_dashboard`.
- `centralReadModelBacked=true`.
- `mutationEvidence.summary` is present and sanitized.
- Every artifact is marked `redacted=true`.
- All `evidencePolicy` controls are `true`.
- At least one route must include `authContext=safe_human_session` or `authContext=service_scoped_proxy`.
- Route `authContext` values must match report-level `proofMode`. route authContext must match report proofMode for proven browser reports.
- Public shell routes, anonymous DOM snapshots, and route-only HTML checks cannot satisfy `status=proven`. Backing API `401`/`403` responses also cannot satisfy `status=proven`.

## Default Verifier Mode

`npm run verify:browser-render-proof-report` is non-mutating by default. Without `BROWSER_RENDER_PROOF_REPORT_PATH`, it only validates this contract and reports the proof as gated. With `BROWSER_RENDER_PROOF_REPORT_PATH=/path/to/report.json`, it validates the supplied sanitized report.

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

These fixtures are contract tests only. They are not browser-render proof and must not be used to close the rendered UI gate.
