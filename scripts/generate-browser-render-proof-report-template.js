#!/usr/bin/env node
const assert = require('assert/strict');
const { execFileSync } = require('child_process');

const allowedChannels = new Set(['flipflop', 'heureka', 'bazos', 'aukro', 'allegro']);
const allowedProofModes = new Set(['safe_human_session', 'service_scoped_proxy']);
const allowedArtifactModes = new Set(['path', 'sha256']);
const channelHosts = {
  flipflop: 'flipflop.alfares.cz',
  heureka: 'heureka.alfares.cz',
  bazos: 'bazos.alfares.cz',
  aukro: 'aukro.alfares.cz',
  allegro: 'allegro.alfares.cz',
};

function readArg(name, fallback) {
  const prefix = `--${name}=`;
  const arg = process.argv.slice(2).find((entry) => entry.startsWith(prefix));
  return arg ? arg.slice(prefix.length).trim() : fallback;
}

function currentCommit() {
  return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
}

const channel = readArg('channel', 'flipflop');
const proofMode = readArg('proof-mode', 'service_scoped_proxy');
const stage = readArg('stage', 'warehouse_collecting');
const artifactMode = readArg('artifact-mode', 'path');
const commit = readArg('orders-evidence-commit', currentCommit());

assert.equal(allowedChannels.has(channel), true, `channel must be one of ${Array.from(allowedChannels).join(', ')}`);
assert.equal(allowedProofModes.has(proofMode), true, `proof-mode must be one of ${Array.from(allowedProofModes).join(', ')}`);
assert.equal(/^[0-9a-f]{40}$/.test(commit), true, 'orders-evidence-commit must be a 40-character lowercase git commit');
assert.equal(allowedArtifactModes.has(artifactMode), true, 'artifact-mode must be path or sha256');
assert.equal(Boolean(stage), true, 'stage must not be empty');

const host = channelHosts[channel];
const placeholderSha = '0'.repeat(64);
function artifactFor(surface) {
  if (artifactMode === 'sha256') {
    return {
      kind: 'redacted_screenshot_hash',
      redacted: true,
      sha256: placeholderSha,
    };
  }
  return {
    kind: 'redacted_screenshot_path',
    redacted: true,
    path: `reports/validation/orders-browser-render-proof/${channel}-${surface}-redacted.png`,
  };
}

const report = {
  schemaVersion: 'orders.browser_render_proof.v1',
  status: 'incomplete',
  channel,
  proofMode,
  checkedAt: new Date().toISOString(),
  ordersEvidenceCommit: commit,
  mutationEvidence: {
    source: 'smoke:lifecycle-mutation',
    approvalId: '[MISSING: approval id for approved lifecycle mutation or existing mutation artifact]',
    summary: '[MISSING: sanitized lifecycle mutation summary]',
    artifactHash: 'sha256:[MISSING: 64 lowercase hex artifact hash]',
    expectedLifecycleStage: stage,
  },
  routes: [
    {
      url: `https://${host}/orders`,
      httpStatus: 200,
      surface: 'customer_cabinet',
      renderedLifecycleLabel: '[MISSING: visible customer lifecycle label]',
      renderedLifecycleStage: stage,
      artifact: artifactFor('customer'),
      authContext: proofMode,
      dataSourceStatus: 200,
    },
    {
      url: `https://${host}/admin/orders`,
      httpStatus: 200,
      surface: 'admin_cabinet',
      renderedLifecycleLabel: '[MISSING: visible admin lifecycle label]',
      renderedLifecycleStage: stage,
      artifact: artifactFor('admin'),
      authContext: proofMode,
      dataSourceStatus: 200,
    },
  ],
  refreshMechanism: 'manual_refresh',
  centralReadModelBacked: false,
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
    summary: '[MISSING: sanitized rendered proof result summary]',
    nextAction: 'Replace all [MISSING: ...] placeholders and validate with BROWSER_RENDER_PROOF_REPORT_PATH plus BROWSER_RENDER_PROOF_EXPECTED_COMMIT.',
  },
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
