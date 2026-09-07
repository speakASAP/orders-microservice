/**
 * Verifies JwtRolesGuard rejects the legacy static-header path.
 *
 * Static x-internal-service-token / x-service-name authentication is deleted.
 * Callers must present an Auth-issued Bearer token validated via /auth/validate.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { Reflector } = require('@nestjs/core');
const { JwtRolesGuard } = require('../dist/auth/jwt-roles.guard');

const guardSource = fs.readFileSync(
  path.join(__dirname, '..', 'src/auth/jwt-roles.guard.ts'),
  'utf8',
);

assert.ok(
  !guardSource.includes('resolveInternalServiceActor'),
  'resolveInternalServiceActor must be deleted',
);
assert.ok(
  !guardSource.includes('x-internal-service-token'),
  'x-internal-service-token static path must be deleted',
);
assert.ok(
  !guardSource.includes('x-service-name'),
  'x-service-name static path must be deleted',
);
assert.ok(
  !guardSource.includes('CATALOG_INTERNAL_SERVICE_TOKEN'),
  'CATALOG_INTERNAL_SERVICE_TOKEN static path must be deleted',
);
assert.ok(
  guardSource.includes('/auth/validate'),
  'Auth /auth/validate path must remain',
);

function makeContext(headers, roles) {
  const request = { headers, header: (name) => headers[name.toLowerCase()] };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => function handler() {},
    getClass: () => function Controller() {},
    __request: request,
    __roles: roles,
  };
}

function makeGuard(roles) {
  const reflector = new Reflector();
  const guard = new JwtRolesGuard(reflector);
  guard.logger = { log() {}, warn() {}, error() {} };
  reflector.getAllAndOverride = (key) =>
    (String(key).includes('public') ? false : { roles });
  return guard;
}

async function run() {
  const saved = { ...process.env };
  const originalFetch = global.fetch;
  try {
    process.env.CATALOG_INTERNAL_SERVICE_TOKEN = 'catalog-only-value';

    // Static headers alone must never authenticate, even with a matching env secret.
    {
      const guard = makeGuard(['internal:catalog-microservice:service']);
      const ctx = makeContext(
        { 'x-internal-service-token': 'catalog-only-value', 'x-service-name': 'catalog-microservice' },
        [],
      );
      await assert.rejects(
        () => guard.canActivate(ctx),
        (error) => error?.status === 401 || error?.status === 403,
        'static catalog headers must be rejected',
      );
    }

    // Presenting the static secret as Bearer must go through Auth and fail closed
    // when Auth rejects it — never grant roles from the env string alone.
    global.fetch = async () => ({
      ok: true,
      async json() {
        return { valid: false };
      },
    });
    {
      const guard = makeGuard(['internal:catalog-microservice:service']);
      const ctx = makeContext(
        { authorization: 'Bearer catalog-only-value' },
        [],
      );
      await assert.rejects(
        () => guard.canActivate(ctx),
        (error) => error?.status === 401 || error?.status === 403,
        'static secret as Bearer must not bypass Auth validation',
      );
    }

    // Auth-validated RS256 principal still works.
    global.fetch = async () => ({
      ok: true,
      async json() {
        return {
          valid: true,
          user: {
            sub: 'service:catalog-microservice',
            roles: ['internal:catalog-microservice:service'],
          },
        };
      },
    });
    {
      const guard = makeGuard(['internal:catalog-microservice:service']);
      const ctx = makeContext(
        { authorization: 'Bearer auth-issued-rs256' },
        [],
      );
      assert.equal(
        await guard.canActivate(ctx),
        true,
        'Auth-validated Bearer principal must still authenticate',
      );
    }

    console.log('internal service identity verification ok');
  } finally {
    global.fetch = originalFetch;
    for (const key of Object.keys(process.env)) {
      if (!(key in saved)) delete process.env[key];
    }
    Object.assign(process.env, saved);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
