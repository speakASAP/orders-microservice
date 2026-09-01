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
  'flipflop-service',
  'allegro-service',
  'invoices-microservice',
  'cliplot',
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
    // Only catalog-microservice remains in the legacy map (2026-09-01). The
    // two-caller ambiguity rule therefore cannot be exercised against real entries any
    // more, and writing it against a REMOVED name would pass for the wrong reason --
    // rejecting because the entry is gone, not because the rule fired. That trap already
    // bit once here: the flipflop cases kept passing after flipflop was removed while
    // proving nothing. So the ambiguity rule is asserted structurally below instead, and
    // the runtime cases cover only what a single remaining entry can actually prove.
    process.env.CATALOG_INTERNAL_SERVICE_TOKEN = 'catalog-only-value';
    delete process.env.FLIPFLOP_INTERNAL_SERVICE_TOKEN;
    delete process.env.ALLEGRO_INTERNAL_SERVICE_TOKEN;
    delete process.env.INVOICES_INTERNAL_SERVICE_TOKEN;
    delete process.env.INVOICES_ORDERS_SERVICE_TOKEN;
    delete process.env.CLIPLOT_ORDERS_SERVICE_TOKEN;
    delete process.env.CLIPLOT_SERVICE_TOKEN;

    // The one remaining caller still authenticates with its own value.
    const guard = makeGuard(['internal:catalog-microservice:service']);
    const ctx = makeContext(
      { 'x-internal-service-token': 'catalog-only-value', 'x-service-name': 'catalog-microservice' },
      [],
    );
    assert.equal(
      await guard.canActivate(ctx),
      true,
      'catalog-microservice must still authenticate with its own value',
    );

    // A name that is not in the map must not authenticate, whatever token it presents.
    for (const removed of ['flipflop-service', 'allegro-service', 'invoices-microservice', 'cliplot']) {
      const g = makeGuard(['internal:catalog-microservice:service']);
      const c = makeContext(
        { 'x-internal-service-token': 'catalog-only-value', 'x-service-name': removed },
        [],
      );
      await assert.rejects(
        () => g.canActivate(c),
        (error) => error?.status === 401 || error?.status === 403,
        `${removed} is a Bearer lane and must not authenticate via the static header`,
      );
    }

    // The ambiguity rule itself: asserted on the source, since it can no longer be
    // triggered through the map. If a second entry is ever added, this pins that the
    // deny-on-shared-value check is still present to police it.
    assert.ok(
      guardSource.includes('namesSharingToken'),
      'the shared-credential ambiguity check must not be removed while the static path exists',
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
