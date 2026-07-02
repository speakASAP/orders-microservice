const fs = require('fs');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const guard = read('src/auth/jwt-roles.guard.ts');
const controller = read('src/orders/orders.controller.ts');
const externalSecret = read('k8s/external-secret.yaml');

assert(guard.includes("'invoices-microservice'"), 'invoices service actor is not configured');
assert(guard.includes("role: 'internal:invoices-microservice:service'"), 'invoices service role is missing');
assert(guard.includes("'INVOICES_INTERNAL_SERVICE_TOKEN'"), 'invoices internal token env is missing');
assert(controller.includes('ORDER_DETAIL_READ_ROLES'), 'order detail read role list is missing');
assert(controller.includes("'internal:invoices-microservice:service'"), 'orders detail endpoint does not allow invoices service role');
assert(controller.includes('@Roles(...ORDER_DETAIL_READ_ROLES)'), 'orders detail endpoint is not explicitly role scoped');
assert(externalSecret.includes('secretKey: INVOICES_INTERNAL_SERVICE_TOKEN'), 'orders ExternalSecret does not project invoices token');
assert(externalSecret.includes('key: secret/prod/invoices-microservice'), 'orders ExternalSecret does not source invoices secret');

console.log('Invoices read boundary verification passed');
