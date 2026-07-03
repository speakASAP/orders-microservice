#!/usr/bin/env node
const assert = require('assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const https = require('https');
const path = require('path');
const { execFileSync } = require('child_process');

const root = process.cwd();
const reportPath = 'reports/validation/orders-browser-render-proof/blocked-flipflop-current.json';
const mutationArtifactPath = 'reports/validation/lifecycle-mutation-smoke/report-latest.json';
const mutationArtifactHash = 'sha256:2fb275cb936ccafa9e027852b59c103b2efb49f90de6a5c5639ceb054a0ea296';
const routes = [
  { url: 'https://flipflop.alfares.cz/orders', surface: 'customer_cabinet' },
  { url: 'https://flipflop.alfares.cz/admin/orders', surface: 'admin_cabinet' },
];

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function currentCommit() {
  return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
}

function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'GET',
      timeout: 15000,
      rejectUnauthorized: false,
      headers: {
        'user-agent': 'orders-blocked-browser-render-proof/1.0',
        accept: 'text/html,application/xhtml+xml,application/json;q=0.8,*/*;q=0.5',
      },
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({
        httpStatus: res.statusCode || 0,
        body: Buffer.concat(chunks),
      }));
    });
    req.on('timeout', () => req.destroy(new Error(`timeout ${url}`)));
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  assert.equal(fs.existsSync(mutationArtifactPath), true, 'prepared lifecycle mutation artifact is required');
  const actualMutationHash = `sha256:${sha256(fs.readFileSync(mutationArtifactPath))}`;
  assert.equal(actualMutationHash, mutationArtifactHash, 'prepared lifecycle mutation artifact hash mismatch');

  const routeEvidence = [];
  for (const route of routes) {
    const response = await get(route.url);
    routeEvidence.push({
      url: route.url,
      httpStatus: response.httpStatus,
      surface: route.surface,
      renderedLifecycleLabel: '[MISSING: authenticated rendered lifecycle label]',
      renderedLifecycleStage: '[MISSING: authenticated rendered lifecycle stage]',
      artifact: {
        kind: 'anonymous_route_html_hash',
        redacted: true,
        sha256: sha256(response.body),
      },
      dataSourceStatus: route.surface === 'customer_cabinet' ? 401 : undefined,
    });
  }

  const report = {
    schemaVersion: 'orders.browser_render_proof.v1',
    status: 'blocked',
    channel: 'flipflop',
    proofMode: 'service_scoped_proxy',
    checkedAt: new Date().toISOString(),
    ordersEvidenceCommit: currentCommit(),
    mutationEvidence: {
      source: 'smoke:lifecycle-mutation',
      approvalId: 'approved-lifecycle-smoke',
      summary: 'Sanitized lifecycle mutation smoke reached warehouse_collecting in customer and admin Orders lifecycle read models.',
      artifactPath: mutationArtifactPath,
      artifactHash: mutationArtifactHash,
      expectedLifecycleStage: 'warehouse_collecting',
    },
    routes: routeEvidence,
    refreshMechanism: 'api_backed_render_probe',
    centralReadModelBacked: true,
    evidencePolicy: {
      noTokenValues: true,
      noCookies: true,
      noCustomerPii: true,
      noRawOrderRows: true,
      noDatabaseDump: true,
      noPaymentReference: true,
      noTrackingValues: true,
      noProviderPayload: true,
      artifactsRedacted: true,
    },
    result: {
      summary: 'Blocked: anonymous FlipFlop routes are reachable, but no safe authenticated buyer/admin browser session or service-scoped browser proxy is available in this thread to prove rendered lifecycle labels.',
      nextAction: 'Provide an approved safe FlipFlop buyer/admin browser session or an explicit service-scoped browser proxy path, then replace this blocked report with status=proven rendered evidence.',
    },
  };

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({
    schemaVersion: 'orders.blocked_browser_render_proof_report_generator.v1',
    status: 'blocked_report_written',
    reportPath,
    ordersEvidenceCommit: report.ordersEvidenceCommit,
    mutationArtifactHash,
    routeCount: report.routes.length,
    mutation: false,
    browserSessionUsed: false,
    providerCall: false,
    databaseRead: false,
    tokenValuesReadOrPrinted: false,
  }, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
});
