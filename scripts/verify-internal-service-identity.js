/**
 * Verifies the legacy static-header path in JwtRolesGuard cannot be used to choose
 * an identity via the x-service-name header.
 *
 * Background: aukro, bazos, heureka, marketing, payments and warehouse once all held
 * the SAME internal value (sha256 a2880693). Because the guard string-compares the
 * value and then synthesises the role from x-service-name, one holder could
 * authenticate as any of the six. Those six are now Bearer lanes; the entries that
 * remain must each hold a value unique to one caller, and the guard must deny any
 * value configured for more than one name rather than picking between them.
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

// The six migrated callers must not be resolvable from the static header at all.
for (const migrated of [
  'aukro-service',
  'bazos-service',
  'heureka-service',
  'marketing-microservice',
  'payments-microservice',
  'warehouse-microservice',
]) {
  assert.ok(
    !guardSource.includes(`'${migrated}': {`),
    `${migrated} is a Bearer lane and must not appear in the guard's static map`,
  );
}

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
  try {
    // Two distinct callers deliberately sharing one value: the ambiguity check must
    // deny BOTH names, not pick one.
    process.env.CATALOG_INTERNAL_SERVICE_TOKEN = 'shared-value';
    process.env.FLIPFLOP_INTERNAL_SERVICE_TOKEN = 'shared-value';
    delete process.env.ALLEGRO_INTERNAL_SERVICE_TOKEN;
    delete process.env.INVOICES_INTERNAL_SERVICE_TOKEN;
    delete process.env.INVOICES_ORDERS_SERVICE_TOKEN;
    delete process.env.CLIPLOT_ORDERS_SERVICE_TOKEN;
    delete process.env.CLIPLOT_SERVICE_TOKEN;

    for (const claimed of ['catalog-microservice', 'flipflop-service']) {
      const guard = makeGuard(['internal:catalog-microservice:service', 'internal:flipflop-service:service']);
      const ctx = makeContext(
        { 'x-internal-service-token': 'shared-value', 'x-service-name': claimed },
        [],
      );
      await assert.rejects(
        () => guard.canActivate(ctx),
        (error) => error?.status === 401 || error?.status === 403,
        `a value shared by two callers must not authenticate as ${claimed}`,
      );
    }

    // A value unique to one caller still works.
    process.env.CATALOG_INTERNAL_SERVICE_TOKEN = 'catalog-only-value';
    process.env.FLIPFLOP_INTERNAL_SERVICE_TOKEN = 'flipflop-only-value';
    const guard = makeGuard(['internal:catalog-microservice:service']);
    const ctx = makeContext(
      { 'x-internal-service-token': 'catalog-only-value', 'x-service-name': 'catalog-microservice' },
      [],
    );
    assert.equal(
      await guard.canActivate(ctx),
      true,
      'a value unique to one caller must still authenticate',
    );

    // ...and it must not authenticate as a different caller.
    const wrongName = makeGuard(['internal:flipflop-service:service']);
    const wrongCtx = makeContext(
      { 'x-internal-service-token': 'catalog-only-value', 'x-service-name': 'flipflop-service' },
      [],
    );
    await assert.rejects(
      () => wrongName.canActivate(wrongCtx),
      (error) => error?.status === 401 || error?.status === 403,
      "catalog's value must not authenticate as flipflop-service",
    );

    console.log('internal service identity verification ok');
  } finally {
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
