const assert = require('assert/strict');
const { ForbiddenException } = require('@nestjs/common');
const { JwtRolesGuard } = require('../dist/auth/jwt-roles.guard');

function makeContext(requiredRoles, validateUser) {
  const request = {
    headers: { authorization: 'Bearer redacted-test-token' },
    header() { return undefined; },
  };
  return {
    request,
    context: {
      getHandler() { return function handler() {}; },
      getClass() { return function Controller() {}; },
      switchToHttp() {
        return {
          getRequest() { return request; },
        };
      },
    },
    reflector: {
      getAllAndOverride(key) {
        if (key === 'public') return false;
        if (key === 'roles') return { roles: requiredRoles };
        return undefined;
      },
    },
  };
}

async function runGuard(requiredRoles, validateUser) {
  const fixture = makeContext(requiredRoles, validateUser);
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    async json() {
      return {
        valid: true,
        user: validateUser,
      };
    },
  });
  try {
    const guard = new JwtRolesGuard(fixture.reflector);
    const result = await guard.canActivate(fixture.context);
    return { result, requestUser: fixture.request.user };
  } finally {
    global.fetch = originalFetch;
  }
}

async function assertForbidden(requiredRoles, user, label) {
  await assert.rejects(
    () => runGuard(requiredRoles, user),
    ForbiddenException,
    label,
  );
}

(async () => {
  await assertForbidden(
    ['authenticated:user'],
    {
      sub: 'user-marathon-only',
      roles: ['app:marathon:user'],
      source: 'marathon-import',
      perApplicationPreferences: { marathon: { imported: true } },
    },
    'marathon-only imported user must not pass generic authenticated:user',
  );

  await assertForbidden(
    ['authenticated:user'],
    {
      sub: 'user-marathon-source-only',
      roles: [],
      source: { application: 'marathon' },
    },
    'marathon source marker without non-marathon roles must not pass generic authenticated:user',
  );

  await assertForbidden(
    ['authenticated:user'],
    {
      sub: 'user-marathon-admin-only',
      roles: ['app:marathon:admin'],
      source: 'marathon-import',
    },
    'every app:marathon:* role remains marathon-only for generic authenticated:user',
  );

  const platformUser = await runGuard(['authenticated:user'], {
    sub: 'user-platform',
    roles: ['app:marathon:user', 'global:platform_admin'],
    source: 'marathon-import',
  });
  assert.equal(platformUser.result, true, 'platform role should preserve generic authenticated access');
  assert.deepEqual(platformUser.requestUser.roles, ['app:marathon:user', 'global:platform_admin']);

  const globalAdmin = await runGuard(['global:superadmin'], {
    sub: 'user-superadmin',
    roles: ['app:marathon:user', 'global:superadmin'],
    source: 'marathon-import',
  });
  assert.equal(globalAdmin.result, true, 'explicit global role check should still pass');

  const ordersUser = await runGuard(['authenticated:user'], {
    sub: 'user-orders',
    roles: ['app:orders-microservice:user'],
    perApplicationPreferences: { 'orders-microservice': { enabled: true } },
  });
  assert.equal(ordersUser.result, true, 'non-marathon app user should still pass generic authenticated:user');

  const ordersPreferenceUser = await runGuard(['authenticated:user'], {
    sub: 'user-orders-preference',
    roles: ['app:marathon:user'],
    source: 'marathon-import',
    perApplicationPreferences: {
      marathon: { imported: true },
      'orders-microservice': { enabled: true },
    },
  });
  assert.equal(ordersPreferenceUser.result, true, 'non-marathon app entitlement should preserve generic authenticated:user');

  await assertForbidden(
    ['global:superadmin'],
    {
      sub: 'user-marathon-only-specific',
      roles: ['app:marathon:user'],
      source: 'marathon-import',
    },
    'marathon-only users still must not satisfy explicit admin roles',
  );

  console.log('auth marathon-only boundary verification ok');
})();
