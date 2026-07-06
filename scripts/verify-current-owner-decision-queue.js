#!/usr/bin/env node
const assert = require("assert/strict");
const fs = require("fs");
const path = require("path");
const root = process.cwd();
const files = {
  doc: path.join(root, "docs/orchestrator/2026-07-06-owner-decision-optional-gate-queue.md"),
  report: path.join(root, "reports/validation/VAL-W7-current-owner-decision-queue-2026-07-06.md"),
  status: path.join(root, "docs/orchestrator/STATUS.md"),
  state: path.join(root, "docs/IMPLEMENTATION_STATE.md"),
  runtime: path.join(root, "docs/orchestrator/2026-07-05-runtime-gate-packet-contracts.md"),
  completion: path.join(root, "docs/orchestrator/2026-07-03-orders-lifecycle-completion-audit.md"),
  bazosPacket: "/home/ssf/Documents/Github/bazos/docs/orchestrator/2026-07-06-w8-bazos-product-decision-intake-packet.md",
};
function read(file) {
  assert.equal(fs.existsSync(file), true, file + " is missing");
  return fs.readFileSync(file, "utf8");
}
function includes(source, marker, label) {
  assert.equal(source.includes(marker), true, `${label} missing marker: ${marker}`);
}
function notIncludes(source, marker, label) {
  assert.equal(source.includes(marker), false, `${label} must not include marker: ${marker}`);
}
const doc = read(files.doc);
const report = read(files.report);
const status = read(files.status);
const state = read(files.state);
const runtime = read(files.runtime);
const completion = read(files.completion);
const bazosPacket = read(files.bazosPacket);
for (const marker of ["Vision ->","Goal Impact ->","System ->","Feature ->","Task ->","Execution Plan ->","Coding Prompt ->","Code ->","Validation ->"]) {
  includes(doc, marker, "queue doc IPS");
  includes(report, marker, "queue report IPS");
}
const decision = "[RESOLVED/NARROWED: required Orders lifecycle implementation is complete and current remaining work is owner/product-gated optional proof or exact runtime packets]";
includes(doc, decision, "queue decision");
includes(report, decision, "queue report decision");
includes(status, "W8 Bazos Scope Decision Recorded", "status top entry");
includes(state, "W8 Bazos scope decision recorded as `bounded_synthetic_accepted_for_now`", "state top entry");
includes(runtime, "selected_scope_only=`bounded_synthetic_accepted_for_now`", "runtime W8 selected scope marker");
includes(completion, "selected scope-only option `bounded_synthetic_accepted_for_now`", "completion W8 selected scope marker");
for (const marker of [
  "selected_scope_only=`bounded_synthetic_accepted_for_now`",
  "provider-backed proof intentionally unclaimed",
  "[UNKNOWN: live Bazos marketplace webhook support]",
  "Preserve current-release bounded synthetic/internal scope",
  "Run optional natural/human/session proofs only when product explicitly requires proof beyond accepted bounded/service-scoped evidence and supplies an approved session packet.",
  "[MISSING: approved Warehouse fulfillment runtime packet]",
  "[MISSING: approved exact payment/refund/provider correction runtime packet naming target order hash/state, payment/provider hashes, actor/approvedBy, approval id, safe reason, idempotency key, sideEffectsHandled payment|warehouse|notification|crm|channel, Warehouse lookup state, channel acknowledgement, and final redacted evidence path]",
]) {
  includes(doc, marker, "queue doc marker");
  includes(report, marker, "queue report marker");
}
notIncludes(doc, "[MISSING: Bazos owner must select exactly one allowed product decision option]", "queue doc stale owner blocker");
notIncludes(report, "[MISSING: Bazos owner must select exactly one allowed product decision option]", "queue report stale owner blocker");
includes(bazosPacket, 'selected_option: "bounded_synthetic_accepted_for_now"', "bazos selected option");
const result = {
  ok: true,
  verifier: "orders-current-owner-decision-queue.v2",
  requiredImplementation: "complete",
  remainingWork: "optional_natural_proof_or_exact_runtime_packets",
  w8Bazos: "scope_only_selected_provider_proof_unclaimed",
  mutation: false,
};
process.stdout.write(JSON.stringify(result, null, 2) + "\n");
