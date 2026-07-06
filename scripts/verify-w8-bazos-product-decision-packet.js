#!/usr/bin/env node
const assert = require("assert/strict");
const fs = require("fs");
const path = require("path");
const root = process.cwd();
const files = {
  packet: path.join(root, "docs/orchestrator/2026-07-06-w8-bazos-product-decision-intake-packet.md"),
  report: path.join(root, "reports/validation/VAL-W8-bazos-product-decision-intake-2026-07-06.md"),
  currentGate: path.join(root, "reports/validation/VAL-W8-bazos-provider-current-gate-2026-07-06.md"),
  runtime: path.join(root, "docs/orchestrator/2026-07-05-runtime-gate-packet-contracts.md"),
  status: path.join(root, "docs/orchestrator/STATUS.md"),
  bazosPacket: "/home/ssf/Documents/Github/bazos/docs/orchestrator/2026-07-06-w8-bazos-product-decision-intake-packet.md",
  bazosReport: "/home/ssf/Documents/Github/bazos/reports/validation/2026-07-06-W8-bazos-product-decision-intake.md",
  bazosState: "/home/ssf/Documents/Github/bazos/docs/IMPLEMENTATION_STATE.md",
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
const packet = read(files.packet);
const report = read(files.report);
const currentGate = read(files.currentGate);
const runtime = read(files.runtime);
const status = read(files.status);
const bazosPacket = read(files.bazosPacket);
const bazosReport = read(files.bazosReport);
const bazosState = read(files.bazosState);
for (const marker of ["Vision ->","Goal Impact ->","System ->","Feature ->","Task ->","Execution Plan ->","Coding Prompt ->","Code ->","Validation ->"]) {
  includes(packet, marker, "orders packet IPS");
  includes(report, marker, "orders report IPS");
}
for (const doc of [packet, report, runtime, status]) {
  includes(doc, "W8 Bazos scope decision is recorded", "orders W8 decision propagation");
  includes(doc, "provider-backed Bazos lifecycle remains explicitly unclaimed and future-product-gated until non-secret evidence exists", "orders W8 future-product gate wording");
}
includes(packet, "bounded_synthetic_accepted_for_now", "orders packet selected option");
includes(report, "Selected option: `bounded_synthetic_accepted_for_now`", "orders report selected option");
includes(currentGate, "Provider/status packet fields are required only for `provider_backed_supported`", "current gate conditional provider fields");
includes(runtime, "selected_scope_only=`bounded_synthetic_accepted_for_now`", "runtime selected scope status");
includes(bazosPacket, 'selected_option: "bounded_synthetic_accepted_for_now"', "bazos packet selected option");
includes(bazosReport, "selected option is `bounded_synthetic_accepted_for_now`", "bazos report selected option");
includes(bazosState, "W8 Bazos scope decision recorded as `bounded_synthetic_accepted_for_now`", "bazos state selected option");
for (const marker of [
  "[UNKNOWN: live Bazos marketplace webhook support]",
  "[MISSING: provider-backed Bazos order item/status ingestion contract]",
  "[MISSING: provider-backed Bazos order status transition sample]",
  "[MISSING: provider-backed Bazos order item identity mapping sample]",
  "[MISSING: Warehouse-owned warehouseId for provider-backed Bazos order items]",
  "[MISSING: approved provider-backed non-secret fixture or live provider smoke packet]",
]) {
  includes(packet, marker, "orders packet preserved provider blocker");
  includes(report, marker, "orders report preserved provider blocker");
}
notIncludes(packet, "[MISSING: explicit product decision accepting bounded synthetic/internal Bazos scope or declaring provider-backed Bazos out of scope]", "orders packet stale explicit decision blocker");
notIncludes(report, "[MISSING: explicit product decision accepting bounded synthetic/internal Bazos scope or declaring provider-backed Bazos out of scope]", "orders report stale explicit decision blocker");
for (const marker of ["provider-backed proof complete", "provider-backed proof verified", "live Bazos marketplace webhook support resolved"]) {
  notIncludes(packet, marker, "orders packet forbidden overclaim");
  notIncludes(report, marker, "orders report forbidden overclaim");
}
const result = {
  ok: true,
  verifier: "orders-w8-bazos-product-decision-packet.v2",
  selectedOption: "bounded_synthetic_accepted_for_now",
  providerBackedProof: "unclaimed_future_product_gated",
  mutation: false,
};
process.stdout.write(JSON.stringify(result, null, 2) + "\n");
