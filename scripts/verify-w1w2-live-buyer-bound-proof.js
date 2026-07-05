#!/usr/bin/env node
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const w1ReportPath = path.join(root, 'reports/validation/VAL-W1-orders-runtime-proof-2026-07-05.md');
const smokeReportPath = path.join(root, 'reports/validation/lifecycle-mutation-smoke/report-latest.json');
const fixedSmokeReportPath = path.join(root, 'reports/validation/lifecycle-mutation-smoke/VAL-W1W2-buyer-bound-runtime-proof-2026-07-05.json');
const subjectBoundReportPath = path.join(root, 'reports/validation/lifecycle-mutation-smoke/report-subject-bound-latest.json');
const proofPath = path.join(root, 'reports/validation/VAL-W7-W1W2-live-buyer-bound-proof-2026-07-05.md');
const servicePath = path.join(root, 'src/orders/orders.service.ts');
const guardPath = path.join(root, 'src/auth/jwt-roles.guard.ts');

function read(file) {
  assert.equal(fs.existsSync(file), true, path.relative(root, file) + ' is missing');
  return fs.readFileSync(file, 'utf8');
}
function assertIncludes(source, marker, label) {
  assert.equal(source.includes(marker), true, label + ' missing marker: ' + marker);
}

const w1Report = read(w1ReportPath);
const proof = read(proofPath);
const service = read(servicePath);
const guard = read(guardPath);
const smokeReport = JSON.parse(read(smokeReportPath));
const fixedSmokeReport = JSON.parse(read(fixedSmokeReportPath));
const subjectBoundReport = JSON.parse(read(subjectBoundReportPath));

const ipsMarkers = ['Vision ->','Goal Impact ->','System ->','Feature ->','Task ->','Execution Plan ->','Coding Prompt ->','Code ->','Validation ->'];
for (const marker of ipsMarkers) assertIncludes(proof, marker, 'proof IPS chain');

const proofMarkers = [
  'status: live_buyer_bound_w1w2_proven',
  'mode=live_buyer_bound_synthetic_lifecycle_mutation',
  'confirmation=CREATE_PAY_WAREHOUSE_CUSTOMER_ADMIN_READ',
  'createHttpStatus=201',
  'initialWarehouseReserved=true',
  'paymentHttpStatus=200',
  'warehouseHttpStatus=200',
  'customerLifecycleHttpStatus=200',
  'adminLifecycleHttpStatus=200',
  'customerSawWarehouseCollecting=true',
  'adminSawWarehouseCollecting=true',
  'customerScopedCountPositive=true',
  'adminAggregateStageCountPositive=true',
  'tokenValuesPrinted=false',
  'rawOrderRowsPrinted=false',
  'live_buyer_bound_w1w2_proven',
];
for (const marker of proofMarkers) {
  assertIncludes(proof, marker, 'W7 buyer-bound proof report');
  assertIncludes(w1Report, marker, 'W1 report final addendum');
}

assert.deepEqual(smokeReport, fixedSmokeReport, 'report-latest must match fixed buyer-bound artifact');
assert.equal(smokeReport.ok, true, 'smoke must be ok');
assert.equal(smokeReport.mode, 'live_buyer_bound_synthetic_lifecycle_mutation', 'smoke mode mismatch');
assert.equal(smokeReport.mutation, true, 'smoke must record bounded mutation');
assert.equal(smokeReport.confirmation, 'CREATE_PAY_WAREHOUSE_CUSTOMER_ADMIN_READ', 'smoke confirmation mismatch');
assert.equal(smokeReport.channel, 'flipflop', 'smoke channel mismatch');
assert.equal(smokeReport.serviceName, 'flipflop-service', 'smoke serviceName mismatch');
assert.equal(smokeReport.result.createHttpStatus, 201, 'create must succeed');
assert.equal(smokeReport.result.orderIdPresent, true, 'order id presence must be true');
assert.equal(typeof smokeReport.result.orderIdHash, 'string', 'orderIdHash must be present');
assert.equal(typeof smokeReport.result.buyerSubjectHash, 'string', 'buyerSubjectHash must be present');
assert.equal(smokeReport.result.initialWarehouseReserved, true, 'Warehouse reservation must be true');
assert.equal(smokeReport.result.paymentHttpStatus, 200, 'payment update must succeed');
assert.equal(smokeReport.result.warehouseHttpStatus, 200, 'Warehouse fulfillment update must succeed');
assert.equal(smokeReport.result.customerLifecycleHttpStatus, 200, 'customer lifecycle read must succeed');
assert.equal(smokeReport.result.adminLifecycleHttpStatus, 200, 'admin lifecycle read must succeed');
assert.equal(smokeReport.result.customerSawWarehouseCollecting, true, 'customer must see warehouse_collecting');
assert.equal(smokeReport.result.adminSawWarehouseCollecting, true, 'admin must see warehouse_collecting');
assert.equal(smokeReport.result.customerScopedCountPositive, true, 'customer scoped count must be positive');
assert.equal(smokeReport.result.adminAggregateStageCountPositive, true, 'admin aggregate must include warehouse_collecting');
assert.equal(smokeReport.result.tokenValuesPrinted, false, 'token values must not be printed');
assert.equal(smokeReport.result.rawOrderRowsPrinted, false, 'raw order rows must not be printed');
assert.deepEqual(smokeReport.blockers, [], 'buyer-bound smoke must have no blockers');

assert.equal(subjectBoundReport.ok, true, 'subject-bound smoke must be ok');
assert.equal(subjectBoundReport.mode, 'live_subject_bound_lifecycle_mutation', 'subject-bound mode mismatch');
assert.equal(subjectBoundReport.authValidationHttpStatus, 201, 'Auth validation should return 201');
assert.equal(subjectBoundReport.authSubjectValidUuid, true, 'Auth subject must be a UUID');
assert.equal(subjectBoundReport.customerLifecycleHttpStatus, 200, 'subject-bound customer lifecycle read must succeed');
assert.equal(subjectBoundReport.adminLifecycleHttpStatus, 200, 'subject-bound admin lifecycle read must succeed');
assert.equal(subjectBoundReport.customerSawWarehouseCollecting, true, 'subject-bound customer must see warehouse_collecting');
assert.equal(subjectBoundReport.adminSawWarehouseCollecting, true, 'subject-bound admin must see warehouse_collecting');
assert.equal(subjectBoundReport.customerScopedCountPositive, true, 'subject-bound customer scoped count must be positive');
assert.equal(subjectBoundReport.adminAggregateStageCountPositive, true, 'subject-bound admin aggregate must be positive');
assert.equal(subjectBoundReport.tokenValuesPrinted, false, 'subject-bound token values must not be printed');
assert.equal(subjectBoundReport.decodedJwtOutput, false, 'decoded JWT output must be false');
assert.equal(subjectBoundReport.rawOrderRowsPrinted, false, 'subject-bound raw order rows must not be printed');
assert.equal(subjectBoundReport.rawCustomerOutput, false, 'subject-bound raw customer output must not be printed');
assert.equal(subjectBoundReport.tokenSourceDestroyedOrInvalidated, true, 'temporary token source must be destroyed or invalidated');
assert.deepEqual(subjectBoundReport.blockers, [], 'subject-bound smoke must have no blockers');

assertIncludes(service, "throw new ForbiddenException('Authenticated customer Auth subject is required for customer order lifecycle reads')", 'customer lifecycle fail-closed guard remains');
assertIncludes(service, "orders.customer ->> 'authUserId'", 'customer authUserId scope remains');
assertIncludes(service, "orders.customer ->> 'subject'", 'customer subject scope remains');
assertIncludes(guard, 'sub: `service:${serviceName}`', 'service identity subject remains non-buyer');
assertIncludes(proof, 'authScopeRelaxed=false', 'proof must not relax auth scope');

const result = {
  ok: true,
  verifier: 'orders-w1w2-live-buyer-bound-proof.v1',
  liveBuyerBoundW1W2Proven: true,
  createReservedPaidWarehouseCustomerAdminReadback: true,
  authScopeRelaxed: false,
  deploy: false,
  providerCall: false,
  tokenValuesReadOrPrinted: false,
  rawOrderRowsPrinted: false,
  subjectBoundAuthValidationProven: true,
  tokenSourceDestroyedOrInvalidated: true,
};
process.stdout.write(JSON.stringify(result, null, 2) + '\n');
