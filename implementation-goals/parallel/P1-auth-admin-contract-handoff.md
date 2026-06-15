# P1 Auth Admin Contract Handoff

Date: 2026-06-13
Lane owner: parallel implementation agent P1
Goal scope: Goal H2.1/H2.2 only
Status: handoff ready for coordinator review; runtime implementation remains blocked by Auth-owned role/session decisions.

## Objective

Document the Auth-owned admin login/session/JWT/RBAC contract needed before Orders admin UI implementation changes. This handoff preserves the Orders IPS chain and separates confirmed contracts from missing Auth decisions.

## IPS Trace

- Vision: Orders remains the canonical order lifecycle service while Auth remains identity, login, JWT, refresh-token, hosted-auth, and RBAC role-claim authority.
- Goal Impact: Goal H2 can replace token-paste admin access only after Auth session handoff and Orders admin role policy are confirmed.
- System: Orders consumes Auth-issued access tokens and enforces endpoint roles locally; Orders must not mint users, passwords, sessions, roles, access tokens, refresh tokens, or service identities.
- Feature: Orders admin shell at `/admin` and `/admin/orders` should redirect to or consume Auth-hosted session state instead of asking operators to paste bearer tokens.
- Task: H2.1 confirms Auth frontend/session contract; H2.2 defines Orders admin read/action/service role policy.
- Execution Plan: keep this lane documentation-only; no runtime source, deployment, secret, manifest, or package changes. Coordinator may later open a separate UI/code lane after missing Auth facts are resolved.
- Coding Prompt: [MISSING: owner-approved coding prompt for H2.3/H2.4/H2.5 after Auth contract confirmation].
- Code: none changed in this lane.
- Validation: missing-marker review, sensitive literal scan, and `git diff --check` only.

## Source Evidence Reviewed

Orders source-of-truth docs/source:

- `docs/orchestrator/GOALS.md`: Goal H2 requires confirming Auth frontend/session contract and defining role policy before UI changes.
- `docs/orchestrator/ORDERS_HUB_ROADMAP.md`: Goal H2 acceptance includes Auth authority, role-scoped data access, and minimized browser-held secrets.
- `docs/orchestrator/PLAN.md`: P1 is a parallel-ready documentation lane limited to this handoff and optional Auth contract note.
- `src/auth/jwt-roles.guard.ts`: Orders currently verifies bearer JWTs locally with `JWT_SECRET`, reads `payload.roles`, preserves role strings, and defaults to `global:superadmin` plus `internal:<SERVICE_NAME>:admin`.
- `src/admin/admin.controller.ts`: public HTML admin shell; JSON admin routes require explicit read/action roles.
- `src/admin/admin.service.ts`: read roles are `global:superadmin`, `internal:orders-microservice:admin`, `internal:orders-microservice:readonly`, and `internal:orders-microservice:operator`; action roles are `global:superadmin` and `internal:orders-microservice:action-admin`.
- `src/admin/admin-ui.ts`: current browser UX asks for an Auth-issued admin bearer token and stores/uses it client-side for protected JSON calls.
- `docs/orchestrator/SENSITIVE_DATA_REVIEW.md`: current admin shell must not embed order records or secrets; tokens/JWT secrets remain sensitive.

Auth source-of-truth docs/source:

- `auth-microservice/docs/UNIFIED_AUTH_CONTRACT.md`: Auth owns identity, credentials, JWT shape, refresh tokens, OAuth, magic links, RBAC role claims, and hosted entry points.
- `auth-microservice/docs/UNIFIED_AUTH_CONTRACT.md`: hosted entry points are `GET /login`, `GET /register`, and `GET /admin`; integrations should redirect to Auth-hosted UI rather than host credential forms.
- `auth-microservice/docs/UNIFIED_AUTH_CONTRACT.md`: `/auth/login` returns user plus access/refresh token pair; `/auth/validate` accepts an access token and returns the current Auth user; `/auth/refresh` returns a new token pair.
- `auth-microservice/docs/UNIFIED_AUTH_CONTRACT.md`: JWT payload includes `sub`, `email`, `type`, `roles`, optional `auth_method`, and standard issued/expiry fields.
- `auth-microservice/docs/UNIFIED_AUTH_CONTRACT.md`: OAuth and magic-link success redirect to validated `return_url` with token handoff in the URL fragment, not query string.
- `auth-microservice/docs/CONSUMER_JWT_VALIDATION_STANDARD.md`: default browser-facing/admin consumer pattern is server-side `POST /auth/validate`; Orders is currently classified as a shared local verifier exception.
- `auth-microservice/scripts/seed-rbac.ts`: Auth seeds `orders-microservice` as an internal application and creates global `superadmin`/`platform_admin`, app `user`/`admin`, and internal `admin` roles.
- `auth-microservice/scripts/seed-rbac.ts` and repository search: no confirmed seed/assignment support was found for `internal:orders-microservice:readonly`, `internal:orders-microservice:operator`, or `internal:orders-microservice:action-admin`.

DocsRAG evidence:

- Attempted `docs-rag-microservice` retrieval from the remote host first, as required by `AGENTS.md`.
- Retrieval was unavailable: `curl` exited with code 6 and no response body, consistent with remote DNS/service resolution failure. No token, secret, or response payload was recorded.

## Confirmed Contract Facts

1. Auth owns user registration, login, refresh, token validation, JWT payload shape, role assignment, and hosted auth entry points.
2. Orders may consume Auth-issued access tokens and enforce endpoint authorization locally, but Orders must not issue or rewrite Auth identity or roles.
3. Current Orders JSON admin endpoints accept Auth role strings through bearer JWTs.
4. Current Orders admin read policy already distinguishes read-capable roles from action-capable roles in source constants.
5. Current Orders action-capable policy allows only `global:superadmin` and `internal:orders-microservice:action-admin` to run approved lifecycle mutation workflows.
6. Auth currently documents hosted login/admin entry points but does not document an Orders-specific admin callback path, return URL, or browser session transfer contract.
7. Auth currently documents fragment token handoff for OAuth/magic-link flows, but not a dedicated cookie/session-sharing contract for cross-service admin shells.
8. Auth role seed evidence confirms `internal:orders-microservice:admin` can exist through the generic internal admin role pattern.
9. Auth role seed evidence does not confirm Orders-specific `readonly`, `operator`, or `action-admin` role creation.

## Proposed Orders Admin Role Policy

This is the recommended H2.2 policy for owner/Auth confirmation. It matches current Orders source where possible and marks unconfirmed Auth role facts explicitly.

| Actor category | Auth role string | Orders access | Notes |
| --- | --- | --- | --- |
| Platform superadmin | `global:superadmin` | Read and action workflows | Confirmed global role in Auth seed; should remain break-glass/platform-wide. |
| Orders admin | `internal:orders-microservice:admin` | Read-only by default | Confirmed generic internal admin pattern; current Orders source treats this as read-capable only. |
| Orders read-only operator | `internal:orders-microservice:readonly` | Read-only dashboard/detail/operations | [MISSING: Auth role registration and assignment workflow]. |
| Orders operations operator | `internal:orders-microservice:operator` | Read-only dashboard/detail/operations | [MISSING: Auth role registration and assignment workflow, and whether this differs from readonly]. |
| Orders action admin | `internal:orders-microservice:action-admin` | Approved action workflows plus read | [MISSING: Auth role registration and assignment workflow]. |
| Service caller | Auth user RBAC role: none by default | No admin UI access | Machine/service authentication must stay separate from user RBAC. Service roles for Orders APIs need endpoint-specific contracts and must not unlock browser admin UI unless explicitly approved. |

Policy notes:

- Default admin mode should stay read-only.
- Action workflows must remain explicit, human-approved, and delegated to existing Orders state-machine gates.
- Service-to-service credentials must not be treated as browser user identity.
- `global:platform_admin` is Auth-seeded but is not currently accepted by Orders admin endpoints; adding it would be a policy change requiring owner approval.
- `app:orders-microservice:admin` is not confirmed as the preferred scope for internal Orders admin surfaces. Current Orders source uses `internal:orders-microservice:*` roles.

## H2.1 Auth Session/Login Contract Needed Before UI Changes

Required decisions before H2.3/H2.4 implementation:

1. Auth-hosted login URL for Orders admin entry:
   - Proposed target: `https://auth.alfares.cz/login?return_url=<orders-admin-callback>&client_id=orders-microservice&state=<opaque-state>`.
   - [MISSING: approved Orders admin callback URL and whether it is already in `AUTH_ALLOWED_REDIRECT_ORIGINS`].
2. Token handoff mode:
   - Confirmed Auth contract supports token handoff in URL fragments for OAuth/magic-link success.
   - [MISSING: whether email/password hosted login uses the same `return_url#access_token=...` fragment handoff for Orders admin].
   - [MISSING: whether Auth has or plans a cookie-based session check that Orders admin shell can consume without exposing access tokens to client storage].
3. Token storage policy in Orders browser UI:
   - Current Orders UI uses browser-held bearer token input.
   - H2.4 should remove persistent browser token storage once Auth session flow is available.
   - [MISSING: approved short-lived in-memory storage, refresh handling, logout behavior, and refresh-token handling for the Orders admin shell].
4. Server validation pattern:
   - Current Orders backend is a local verifier exception using Auth-sourced `JWT_SECRET`.
   - Auth standard recommends `POST /auth/validate` for browser-facing admin consumers.
   - [MISSING: owner/Auth decision whether Orders admin JSON should keep local verification for all requests or move admin endpoints to Auth `/auth/validate` for fresher role state].
5. 401/403 browser UX contract:
   - Missing/invalid token must show login-required state and redirect affordance.
   - Wrong role must show forbidden state without leaking protected order data.
   - Expired token must clear local state and require Auth reauthentication or refresh through approved flow.

## Non-Goals And Boundaries

- No runtime code changes in this lane.
- No deployment.
- No database changes.
- No package or manifest changes.
- No changes to shared coordinator-owned IPS state files.
- No secrets, raw JWTs, refresh tokens, decoded production tokens, customer data, or production order rows captured.
- No Auth role creation was performed; role gaps are documented only.

## Recommended Next Work Packets

These can be assigned after coordinator review with non-overlapping file ownership:

| Packet | Status | Owner role | Scope | Allowed files | Dependencies |
| --- | --- | --- | --- | --- | --- |
| H2-A Auth role contract confirmation | ready now | Auth contract/documentation agent | Confirm/create documented role strings for Orders readonly/operator/action-admin, or decide to collapse them to existing internal admin/global roles. | Auth repo docs/source only, per Auth owner approval | None, but must not change Orders runtime. |
| H2-B Orders admin login design | dependency-gated | Orders frontend/backend agent | Design redirect/callback/session handling for `/admin/orders`; remove token-paste path only after Auth handoff contract is approved. | Orders admin UI/source and tests, after owner approval | Blocks on H2-A and callback/storage decisions. |
| H2-C Route authorization validation | dependency-gated | Orders validation agent | Verify 401/403/200 behavior for read/action roles and expired/wrong-role states. | Tests/scripts only, after implementation | Blocks on H2-B implementation. |
| H2-D Coordinator integration | final integration | Coordinator | Consolidate accepted contract and evidence into shared IPS status/state docs. | `docs/orchestrator/STATUS.md`, `docs/IMPLEMENTATION_STATE.md` | Blocks on packet handoffs. |

Parallel execution notes:

- H2-A can run in parallel with unrelated P2/P4 lanes because it does not touch Orders files.
- H2-B and H2-C must not start until H2-A resolves missing Auth facts.
- H2-D remains sequential and coordinator-owned.

## Validation Evidence

Completed in this lane after writing the handoff:

- Missing-marker review: pass with 9 intentional missing-fact markers for unresolved Auth/owner decisions. Command used rg for MISSING or UNKNOWN markers on the touched handoff file.
- Sensitive literal scan: pass; no literal bearer tokens, token values, client secrets, passwords, private keys, JWT secrets, or DB passwords matched. Command used the project sensitive-literal regex on the touched handoff file.
- git diff --check: pass with no whitespace errors.

Touched file from this lane:

- implementation-goals/parallel/P1-auth-admin-contract-handoff.md
