const assert = require("assert/strict");
const fs = require("fs");
const path = require("path");

const workspaceRoot = path.resolve(__dirname, "../..");
const adapterRepos = ["flipflop-service", "allegro-service", "aukro-service", "bazos-service", "heureka-service"];

for (const repo of adapterRepos) {
  const clientPath = path.join(workspaceRoot, repo, "shared/clients/order-client.service.ts");
  assert.ok(fs.existsSync(clientPath), repo + " shared order client is missing");
  const source = fs.readFileSync(clientPath, "utf8");
  for (const required of [
    "CREATE_ORDER_CONTRACT_VERSION",
    "orders.create.v1",
    "contractVersion: CREATE_ORDER_CONTRACT_VERSION",
    "normalizeChannelAccountId",
    "DEFAULT_CHANNEL_ACCOUNT_ID",
    "default",
    "ORDER_IDEMPOTENCY_CONFLICT",
    "httpService.post",
    "/api/orders",
    "payload",
  ]) {
    assert.ok(source.includes(required), repo + " order client missing: " + required);
  }
}

const flipflopForwarderPath = path.join(workspaceRoot, "flipflop-service/services/order-service/src/orders/orders.service.ts");
const flipflopForwarder = fs.readFileSync(flipflopForwarderPath, "utf8");
assert.ok(flipflopForwarder.includes("ORDERS_CHANNEL_ACCOUNT_ID"), "FlipFlop forwarder must allow configured account scope");
assert.ok(flipflopForwarder.includes("flipflop-storefront"), "FlipFlop forwarder must have stable default account scope");

console.log("channel adapter idempotency verification ok");
