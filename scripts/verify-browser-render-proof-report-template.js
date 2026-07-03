#!/usr/bin/env node
const assert = require('assert/strict');
const { execFileSync } = require('child_process');

const raw = execFileSync(process.execPath, ['scripts/generate-browser-render-proof-report-template.js'], {
  encoding: 'utf8',
});
const report = JSON.parse(raw);
const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();

assert.equal(report.schemaVersion, 'orders.browser_render_proof.v1', 'template schemaVersion mismatch');
assert.equal(report.status, 'incomplete', 'template must not claim proven status');
assert.equal(report.channel, 'flipflop', 'template default channel must be first FlipFlop proof lane');
assert.equal(report.proofMode, 'service_scoped_proxy', 'template default proof mode must be service scoped');
assert.equal(report.ordersEvidenceCommit, head, 'template must bind to current immutable Orders commit');
assert.equal(report.centralReadModelBacked, false, 'template must not claim central read-model proof before evidence is filled');
assert.equal(report.routes.length, 2, 'template must include customer and admin routes');
assert.equal(report.routes[0].surface, 'customer_cabinet', 'template must include customer cabinet route first');
assert.equal(report.routes[1].surface, 'admin_cabinet', 'template must include admin cabinet route second');
assert.equal(report.routes.every((route) => route.url.includes('flipflop.alfares.cz')), true, 'template routes must target FlipFlop by default');
assert.equal(report.routes.every((route) => route.artifact.redacted === true), true, 'template artifacts must be marked redacted');
assert.equal(JSON.stringify(report).includes('[MISSING:'), true, 'template must keep missing evidence placeholders');

process.stdout.write(`${JSON.stringify({
  schemaVersion: 'orders.browser_render_proof_template_verifier.v1',
  status: 'template_verified_incomplete',
  ordersEvidenceCommit: report.ordersEvidenceCommit,
  routeCount: report.routes.length,
  mutation: false,
  browserSessionUsed: false,
  providerCall: false,
  databaseRead: false,
  tokenValuesReadOrPrinted: false,
}, null, 2)}\n`);
