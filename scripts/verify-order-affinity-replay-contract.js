#!/usr/bin/env node

const fs = require('node:fs');

const controller = fs.readFileSync('src/orders/orders.controller.ts', 'utf8');
const service = fs.readFileSync('src/orders/orders.service.ts', 'utf8');
const guard = fs.readFileSync('src/auth/jwt-roles.guard.ts', 'utf8');
const externalSecret = fs.readFileSync('k8s/external-secret.yaml', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const serializer = service.slice(service.indexOf('private toOrderAffinityReplayEvent'), service.indexOf('private parseOptionalDate'));

const checks = [
  [controller.includes("@Get('internal/order-affinity/replay-candidates')"), 'replay endpoint is declared'],
  [controller.includes('ORDER_AFFINITY_REPLAY_READ_ROLES'), 'endpoint has explicit read roles'],
  [controller.includes("'internal:marketing-microservice:service'"), 'Marketing service role can read bounded replay'],
  [guard.includes("'marketing-microservice'") && guard.includes('MARKETING_INTERNAL_SERVICE_TOKEN'), 'Orders guard trusts Marketing internal service token'],
  [externalSecret.includes('MARKETING_INTERNAL_SERVICE_TOKEN') && externalSecret.includes('secret/prod/marketing-microservice'), 'Orders secret maps Marketing token for replay auth'],
  [service.includes("ORDER_AFFINITY_REPLAY_PAYMENT_STATUSES = ['paid']"), 'replay is paid-only by default'],
  [service.includes("ORDER_AFFINITY_REPLAY_STATUSES = ['confirmed', 'processing', 'shipped', 'delivered']"), 'replay excludes pending and cancelled orders'],
  [service.includes("leftJoinAndSelect('orders.items', 'items')"), 'replay reads item snapshots'],
  [service.includes("type: 'orders.order.created.v1'"), 'replay emits Orders-created compatible envelopes'],
  [!serializer.includes('customer'), 'replay serializer excludes customer fields'],
  [!serializer.includes('shippingAddress'), 'replay serializer excludes address fields'],
  [!serializer.includes('billingAddress'), 'replay serializer excludes billing fields'],
  [!serializer.includes('paymentReferenceId'), 'replay serializer excludes payment reference fields'],
  [pkg.scripts['verify:order-affinity-replay'] === 'node scripts/verify-order-affinity-replay-contract.js', 'package script is registered'],
];

const failed = checks.filter(([ok]) => !ok);
for (const [ok, label] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
}
if (failed.length) {
  process.exit(1);
}
