# AOS Auth Static Inventory - orders-microservice

Date: 2026-06-24
Worker: parallel Alfares Auth modernization inventory worker
Scope: static source/docs inspection only
Central standard: `/home/ssf/Documents/Github/auth-microservice/docs/HOSTED_AUTH_CONSUMER_STANDARD.md`
Legacy exclusion: legacy `speakasap-portal` was not inspected or touched.

## IPS Chain

- Vision: align orders-microservice with Auth-hosted consumer behavior while preserving Orders as order lifecycle authority.
- Goal Impact: replace token-paste/local session debt with Auth-owned login/session behavior and keep service/admin APIs role-scoped.
- System: commerce/backend service `orders-microservice`; provider standard is hosted Auth UI plus server-side Auth token validation.
- Feature: Auth-owned admin login/session, backend role validation, and service identity propagation for Orders APIs.
- Task: inventory current Auth surfaces without secrets, live rows, production logs, deploy, backfill, smoke, or legacy portal access.
- Execution Plan: compare static surfaces to the central standard, split UI/session, backend validation, service identity, and validation lanes.
- Coding Prompt: [MISSING: implementation prompt for Orders hosted Auth compliance after this inventory is accepted].
- Code: no code changes in this worker; static inventory document only.
- Validation: `git diff --check -- docs/orchestrator/2026-06-24-aos-auth-static-inventory.md` is required after this write.

## Static Commands Used

- `git status --short --branch`
- `rg -n "." docs/HOSTED_AUTH_CONSUMER_STANDARD.md` in `auth-microservice`
- `rg --files src docs` with `.env`, secret-name, `node_modules`, `build`, and `dist` exclusions
- `rg -n -i "auth|jwt|token|login|register|guard|passport|bearer|cookie|localStorage|session|validate|role|permission" src docs` with the same exclusions
- Focused `rg` over `src/auth`, admin/landing UI, protected controllers, Warehouse client, and Orders auth roadmap docs

## 2026-06-24 Admin Hosted Auth Slice

Status: implemented first admin hosted Auth slice after this inventory.

- `src/admin/admin-ui.ts` now starts Auth-hosted login at `https://auth.alfares.cz/login` with `client_id=orders-microservice`, absolute `return_url=/admin/orders`, and generated `state`.
- The admin shell now consumes `#access_token` from the URL fragment, validates returned `state`, stores the access token in `sessionStorage` as transitional browser storage, strips the fragment with `window.history.replaceState`, and rejects mismatched callback state.
- The manual password-style bearer-token input was removed from the admin shell. Admin JSON APIs remain protected by the existing backend JWT/role guard.
- `scripts/verify-admin-operations-console.js` now fails if the token-paste UI returns or if the hosted Auth callback markers disappear.
- No backend auth guard, JWT validation mode, DB schema, secret, package, deployment, live DB row, smoke, or legacy `speakasap-portal` behavior changed in this slice.

Remaining implementation debt:

- [MISSING: decision on preferred session model: BFF HTTP-only cookie vs documented transitional browser storage].
- Orders human bearer validation now uses Auth `/auth/validate`; remaining guard work is runtime network verification once allowlists/secrets are available.
- [MISSING: runtime allowlist verification for the Orders callback origin].

## Auth Surfaces Found

- Login/register UI: landing page contains mailto registration links, not hosted Auth redirects. Admin UI now starts hosted Auth login for admin access instead of prompting for a pasted bearer token.
- Auth API/proxy routes: no local Orders `/api/auth/login` or `/api/auth/register` proxy found in scanned source.
- Token storage: `src/admin/admin-ui.ts` stores the hosted Auth fragment access token in `sessionStorage` under `ordersAdminToken` as transitional browser storage, then sends `Authorization: Bearer ...` to admin JSON routes.
- Backend guards/validation: global `JwtRolesGuard` validates human bearer tokens server-side through Auth `POST /auth/validate`, enforces Auth-owned roles, and attaches `request.user`.
- Public routes: landing/admin shell routes are marked `@Public()`; protected admin JSON routes require read/action roles.
- Protected route examples: admin dashboard/operations/actions, pricing suggestion routes, and payment-status callback route use explicit `@Roles(...)`; default guard roles are `global:superadmin` and `internal:<service>:admin`.
- Service-token paths: Warehouse reservation client forwards a runtime Warehouse service token; Orders payment-status route accepts `internal:payments-microservice:service` as a role.

## Comparison To Hosted Auth Consumer Standard

- Consumer entry points: partially complete. Admin UI redirects to Auth-hosted `/login` with `client_id=orders-microservice`, absolute `return_url`, and generated `state`; customer/public registration remains out of scope for this admin slice.
- Callback handoff: partially complete. `/admin/orders` consumes URL-fragment tokens, validates returned state, strips the fragment, and reloads protected data. A dedicated `/auth/callback` route is still not implemented.
- Session model: transitional/debt. `sessionStorage` bearer-token use is now fed by hosted Auth callback rather than manual paste, but the preferred BFF HTTP-only cookie model is still missing.
- Backend token validation: compliant for human bearer sessions. Orders calls Auth `POST /auth/validate`, requires `{ valid: true, user }`, preserves Auth role strings, and fails closed on Auth validation errors.
- Forbidden local credential model: no local credential POST proxy found; token-paste admin access was removed from the admin UI.
- Logout: partial. Clear-token behavior removes the browser session token, but no central/global logout is claimed.
- Service tokens: separate boundary. Warehouse service-token and Payments service-role flows should be reviewed without blocking human hosted Auth migration.

## Implementation-Ready Workstreams

| Workstream | Status | Owner role | Scope | Allowed files | Forbidden files | Expected output | Dependencies | Validation candidates | Handoff notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ORD-A Admin hosted Auth redirect | ready now | admin UI owner | replace token-paste entry with Auth-hosted login/register links and generated state | `src/admin/admin-ui.ts`, focused docs/tests if approved | secrets, package/deploy files, DB migrations | redirect URLs with `client_id=orders-microservice`, callback return state, no credential collection | [MISSING: production callback origin] | static marker tests; browser UI smoke only after approval | keep admin shell public but data APIs protected |
| ORD-B Callback/session adapter | dependency-gated | session owner | parse fragment, validate state, strip fragment, store session transitionally or via BFF | [MISSING: target callback file/route] | raw token logging, analytics, production data | compliant `/auth/callback` behavior | ORD-A callback contract | unit tests for hash parsing/state mismatch/fragment clearing | prefer HTTP-only cookie if BFF pattern exists |
| ORD-C Backend token validation | ready now | backend auth owner | document local JWT exception or call Auth `/auth/validate` | `src/auth/*`, focused tests, docs if approved | runtime secrets/live JWTs | standard-compliant 401/403 behavior and role preservation | [UNKNOWN: Auth validate outage/failure policy] | unauthorized/wrong-role/allowed-role tests | keep role strings from Auth unchanged |
| ORD-D Service identity review | ready now | service access owner | clarify Payments and Warehouse service caller roles/tokens | docs and affected clients/tests if approved | raw service-token values, K8s Secret data | service-role matrix and fail-closed handling | [UNKNOWN: final Auth service token contract] | synthetic header/role tests with placeholders | do not merge service-token redesign into UI lane |
| ORD-E Final integration | final integration | integration owner | merge UI/session/backend/service lanes | approved files only | all forbidden files above | final IPS validation record | ORD-A through ORD-D | build/test/diff checks; deploy evidence only if later authorized | merge order: ORD-C tests, ORD-A UI, ORD-B callback, ORD-D docs, ORD-E integration |

## 2026-06-24 Auth Validate Guard Slice

Status: completed bounded backend guard slice; no order lifecycle logic, warehouse handoff token logic, payment mutation, deploy, secret, DB, live smoke, or legacy `speakasap-portal` access.

IPS chain:
- Vision: Orders human/admin API access validates identity centrally through Auth, not through service-local JWT secrets.
- Goal Impact: Auth remains the source of truth for active users and roles while Orders keeps local order/admin authorization decisions.
- System: Orders global Auth roles guard and Auth module wiring.
- Feature: server-side Auth `/auth/validate` bearer-token validation with local role enforcement.
- Task: replace local `JwtService.verify(... JWT_SECRET ...)` usage with a fail-closed Auth validation call.
- Execution Plan: auth guard/module/verifier/docs only; preserve Warehouse service-token handoff and payment-service role behavior.
- Coding Prompt: send `{ token }` to Auth `/auth/validate`, require `{ valid: true, user }`, preserve full Auth roles, attach request user, and never log or print tokens.
- Code: `src/auth/jwt-roles.guard.ts`, `src/auth/auth.module.ts`, `scripts/verify-admin-operations-console.js`, and this inventory.
- Validation: `npm run verify:admin-operations-console`, `npm run build`, and diff checks for touched files.

Evidence:
- `JwtRolesGuard` uses `AUTH_SERVICE_URL` with Kubernetes-safe default `http://auth-microservice:3370` and posts to `/auth/validate`.
- `JwtRolesGuard` no longer imports `JwtService`, calls `jwtService.verify`, references `JWT_SECRET`, or registers `JwtModule`.
- Auth validation must return `valid` and `user`; missing/invalid Auth responses fail closed with `UnauthorizedException`.
- Role enforcement still uses explicit `@Roles(...)` metadata or default `global:superadmin` / `internal:orders-microservice:admin` roles.
- Existing Warehouse service-token handoff and payment-service role contracts were not redesigned in this slice.

## 2026-06-24 Orders Warehouse Service JWT Caller Alignment Slice

Status: completed source-contract alignment for the Orders -> Warehouse caller side; no runtime secret reads, token values, database access, deployment, live Warehouse calls, or legacy `speakasap-portal` access.

IPS chain:
- Vision: all human and service identities used by Orders are centrally owned by Auth while Orders remains the order workflow owner.
- Goal Impact: Warehouse reservation handoff can interoperate with Warehouse's Auth-validated service actor lane without Orders minting local service tokens.
- System: Orders Warehouse reservation client and handoff contract guardrail.
- Feature: Auth-compatible service JWT caller contract for `WAREHOUSE_SERVICE_TOKEN` / `WAREHOUSE_INTERNAL_SERVICE_TOKEN`.
- Task: clarify that Orders transports only an Auth-issued Warehouse service JWT and add a verifier marker so the contract cannot silently regress.
- Execution Plan: documentation and verifier only; preserve existing Bearer header behavior and reservation lifecycle payloads.
- Coding Prompt: keep Warehouse token values runtime-only, require the Auth service identity consumer standard, require `internal:warehouse-microservice:admin`, and do not sign, decode, persist, or log the token in Orders.
- Code: `scripts/verify-warehouse-handoff-contract.js`, `docs/orchestrator/WAREHOUSE_HANDOFF_CONTRACT.md`, and this inventory.
- Validation: `npm run verify:warehouse-handoff`, `npm run verify:admin-operations-console`, `npm run build`, and diff checks for touched files.

Evidence:
- `WarehouseReservationClient` reads only `WAREHOUSE_SERVICE_TOKEN` or `WAREHOUSE_INTERNAL_SERVICE_TOKEN` and sends `Authorization: Bearer ...`.
- The client does not use `JwtService`, `jwt.sign`, `JWT_SECRET`, or a local Warehouse token issuer.
- The handoff contract now requires an Auth-compatible service JWT following `auth-microservice/docs/SERVICE_IDENTITY_CONSUMER_STANDARD.md`.
- The expected Warehouse receiver role is `internal:warehouse-microservice:admin`.
- Service identity metadata must include `serviceName` where possible; Warehouse accepts the documented fallback service identity claims on its receiving side.
- Existing reservation lifecycle business behavior was not redesigned in this slice.

## Blockers And Unknowns

- [MISSING: Orders hosted Auth callback URL and allowed production origin].
- [MISSING: decision on preferred session model: BFF HTTP-only cookie vs documented transitional browser storage].
- Orders human bearer validation now uses Auth `/auth/validate`; no repo-local local-JWT exception is required for this guard.
- [UNKNOWN: runtime Auth behavior; runtime checks were forbidden for this worker].
- Orders Warehouse caller side now references the Auth service identity consumer standard; runtime token provisioning and live Warehouse acceptance remain owner-gated because they require secret/runtime access.

## Validation Candidates

- Static: marker check that admin token-paste UX is removed or explicitly transitional.
- Unit: callback state mismatch, malformed fragment, successful fragment parse, fragment strip redirect, token clear/logout behavior.
- Guard: missing token, invalid token, wrong role, read role, action role, Payments service role.
- Contract: Auth `/auth/validate` success/failure mapping if replacing local JWT verification.
- Sensitive-output: scan docs/tests for raw bearer tokens, JWTs, passwords, customer data, payment data, and secrets.
- Diff: `git diff --check -- docs/orchestrator/2026-06-24-aos-auth-static-inventory.md` for this inventory change.
