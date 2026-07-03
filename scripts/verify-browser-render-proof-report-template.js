#!/usr/bin/env node
const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

function generate(args = []) {
  return JSON.parse(execFileSync(process.execPath, [
    'scripts/generate-browser-render-proof-report-template.js',
    ...args,
  ], { encoding: 'utf8' }));
}

function generateToOutput(outputPath, args = []) {
  return JSON.parse(execFileSync(process.execPath, [
    'scripts/generate-browser-render-proof-report-template.js',
    `--output=${outputPath}`,
    ...args,
  ], { encoding: 'utf8' }));
}

function createTemporaryArtifactFiles(report) {
  const created = [];
  for (const route of report.routes) {
    if (!route.artifact.path) continue;
    const artifactPath = path.join(process.cwd(), route.artifact.path);
    fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
    if (!fs.existsSync(artifactPath)) {
      fs.writeFileSync(artifactPath, 'redacted placeholder for template verifier\n');
      created.push(artifactPath);
    }
  }
  return created;
}

function removeTemporaryArtifactFiles(files) {
  for (const file of files.reverse()) {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
}

function verifyGeneratedReportWithMainVerifier(report, mode, head) {
  const reportPath = path.join(os.tmpdir(), `orders-browser-proof-template-${mode}-${process.pid}.json`);
  const temporaryArtifacts = createTemporaryArtifactFiles(report);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  try {
    const verifierOutput = execFileSync(process.execPath, ['scripts/verify-browser-render-proof-report.js'], {
      encoding: 'utf8',
      env: {
        ...process.env,
        BROWSER_RENDER_PROOF_REPORT_PATH: reportPath,
        BROWSER_RENDER_PROOF_EXPECTED_COMMIT: head,
      },
    });
    const verification = JSON.parse(verifierOutput);
    assert.equal(verification.reportValidation.status, 'report_validated', `${mode} template must pass main report verifier as supplied report`);
    assert.equal(verification.reportValidation.reportStatus, 'incomplete', `${mode} template must remain incomplete in main report verifier`);
    assert.deepEqual(verification.reportValidation.blockers, ['[MISSING: proven rendered lifecycle report]'], `${mode} template must keep rendered proof blocker`);
  } finally {
    if (fs.existsSync(reportPath)) fs.unlinkSync(reportPath);
    removeTemporaryArtifactFiles(temporaryArtifacts);
  }
}

function verifyBaseTemplate(report, head) {
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
  assert.equal(report.routes.every((route) => route.httpStatus >= 100 && route.httpStatus < 600), true, 'template route HTTP statuses must be schema-compatible');
  assert.equal(report.routes.every((route) => route.dataSourceStatus >= 100 && route.dataSourceStatus < 600), true, 'template route data-source statuses must be schema-compatible');
  assert.equal(report.routes.every((route) => route.artifact.redacted === true), true, 'template artifacts must be marked redacted');
  assert.equal(JSON.stringify(report).includes('[MISSING:'), true, 'template must keep missing evidence placeholders');
  assert.equal(report.result.summary.includes('[MISSING:'), true, 'template result must stay incomplete');
}

function verifyUnsafeOutputRejected() {
  let rejected = false;
  try {
    execFileSync(process.execPath, [
      'scripts/generate-browser-render-proof-report-template.js',
      '--output=../unsafe.json',
    ], { encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    rejected = true;
    assert.equal(error.status, 1, 'unsafe output path must fail template generation');
    assert.match(
      String(error.stderr),
      /output path must not traverse directories|output path must be reports\/validation\/orders-browser-render-proof\/<file>\.json/,
      'unsafe output path must explain the rejected path boundary',
    );
  }
  assert.equal(rejected, true, 'template generator must reject unsafe output paths');
}

verifyUnsafeOutputRejected();

const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const pathReport = generate();
const hashReport = generate(['--artifact-mode=sha256']);
const outputPath = `reports/validation/orders-browser-render-proof/template-output-${process.pid}.json`;
const outputResult = generateToOutput(outputPath, ['--artifact-mode=sha256']);
const outputReport = JSON.parse(fs.readFileSync(outputPath, 'utf8'));

try {
  verifyBaseTemplate(pathReport, head);
  verifyBaseTemplate(hashReport, head);
  verifyBaseTemplate(outputReport, head);
  verifyGeneratedReportWithMainVerifier(pathReport, 'path', head);
  verifyGeneratedReportWithMainVerifier(hashReport, 'sha256', head);
  assert.equal(pathReport.routes.every((route) => typeof route.artifact.path === 'string'), true, 'path template must use artifact paths');
  assert.equal(pathReport.routes.every((route) => route.artifact.sha256 === undefined), true, 'path template must not include placeholder artifact hashes');
  assert.equal(hashReport.routes.every((route) => /^[0-9a-f]{64}$/.test(route.artifact.sha256)), true, 'sha256 template must use schema-compatible artifact hashes');
  assert.equal(hashReport.routes.every((route) => route.artifact.path === undefined), true, 'sha256 template must not reference artifact files');
  assert.equal(outputResult.status, 'template_written_incomplete', 'output mode must report incomplete template write');
  assert.equal(outputResult.outputPath, outputPath, 'output mode must report written path');
  assert.equal(outputReport.status, 'incomplete', 'output report must stay incomplete');
} finally {
  if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
}

process.stdout.write(`${JSON.stringify({
  schemaVersion: 'orders.browser_render_proof_template_verifier.v1',
  status: 'template_verified_incomplete',
  ordersEvidenceCommit: pathReport.ordersEvidenceCommit,
  routeCount: pathReport.routes.length,
  artifactModesVerified: ['path', 'sha256'],
  mainReportVerifierCrossCheck: true,
  outputModeVerified: true,
  mutation: false,
  browserSessionUsed: false,
  providerCall: false,
  databaseRead: false,
  tokenValuesReadOrPrinted: false,
}, null, 2)}\n`);
