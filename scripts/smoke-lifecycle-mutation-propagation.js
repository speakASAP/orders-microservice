#!/usr/bin/env node
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const namespace = process.env.NAMESPACE || 'statex-apps';
const deployment = process.env.ORDERS_DEPLOYMENT || 'orders-microservice';
const reportDir = process.env.LIFECYCLE_MUTATION_SMOKE_REPORT_DIR || path.join('reports', 'validation', 'lifecycle-mutation-smoke');
const reportPath = path.join(reportDir, 'report-latest.json');
const approved = process.env.RUN_LIVE_LIFECYCLE_MUTATION_SMOKE === '1';
const approvalId = String(process.env.LIFECYCLE_MUTATION_SMOKE_APPROVAL_ID || '').trim();
const confirm = String(process.env.LIFECYCLE_MUTATION_SMOKE_CONFIRM || '').trim();
const channel = String(process.env.LIFECYCLE_MUTATION_SMOKE_CHANNEL || 'flipflop').trim().toLowerCase();
const serviceName = String(process.env.LIFECYCLE_MUTATION_SMOKE_SERVICE_NAME || 'flipflop-service').trim();
const catalogProductId = String(
  process.env.LIFECYCLE_MUTATION_SMOKE_CATALOG_PRODUCT_ID || 'c0de0000-0000-4000-8000-000000000011',
).trim();
const warehouseId = String(
  process.env.LIFECYCLE_MUTATION_SMOKE_WAREHOUSE_ID || 'c0de0000-0000-4000-8000-000000000013',
).trim();
const externalOrderId = String(
  process.env.LIFECYCLE_MUTATION_SMOKE_EXTERNAL_ORDER_ID || `codex-lifecycle-mutation-${Date.now()}`,
).trim();

function kubectl(args, options = {}) {
  return execFileSync('kubectl', ['-n', namespace, ...args], {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    ...options,
  }).trim();
}

function podNode(code) {
  return kubectl(['exec', `deployment/${deployment}`, '--', 'node', '-e', code]);
}

function parseJson(text, fallback = {}) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function hash(value) {
  if (!value) return null;
  return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 12);
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function writeReport(report) {
  if (process.env.WRITE_LIFECYCLE_MUTATION_SMOKE_REPORT === '0') return;
  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}

function sourceOnlyReport(blockers) {
  return {
    ok: false,
    mode: 'source_only_approval_gate',
    generatedAt: new Date().toISOString(),
    mutation: false,
    tokenValuesPrinted: false,
    rawOrderRowsPrinted: false,
    channel,
    serviceName,
    externalOrderIdHash: hash(externalOrderId),
    catalogProductIdHash: hash(catalogProductId),
    warehouseIdHash: hash(warehouseId),
    wouldExercise: [
      'POST /api/orders',
      'PUT /api/orders/:id/payment-status',
      'PUT /api/orders/:id/warehouse-fulfillment-status',
      'GET /api/orders/customer/lifecycle',
      'GET /api/orders/admin/lifecycle',
    ],
    blockers,
  };
}

function preflight() {
  const deploymentJson = parseJson(kubectl(['get', 'deployment', deployment, '-o', 'json']));
  const desired = deploymentJson.spec?.replicas || 0;
  const ready = deploymentJson.status?.readyReplicas || 0;
  const available = deploymentJson.status?.availableReplicas || 0;
  const image = deploymentJson.spec?.template?.spec?.containers?.[0]?.image || '';
  const env = parseJson(podNode(`
    console.log(JSON.stringify({
      port: Boolean(process.env.PORT || '3203'),
      WAREHOUSE_RESERVATION_ENABLED: process.env.WAREHOUSE_RESERVATION_ENABLED === 'true',
      FLIPFLOP_INTERNAL_SERVICE_TOKEN: Boolean((process.env.FLIPFLOP_INTERNAL_SERVICE_TOKEN || '').trim()),
      PAYMENTS_INTERNAL_SERVICE_TOKEN: Boolean((process.env.PAYMENTS_INTERNAL_SERVICE_TOKEN || process.env.PAYMENTS_ORDERS_SERVICE_TOKEN || '').trim()),
      WAREHOUSE_INTERNAL_SERVICE_TOKEN: Boolean((process.env.WAREHOUSE_INTERNAL_SERVICE_TOKEN || process.env.WAREHOUSE_ORDERS_SERVICE_TOKEN || '').trim())
    }));
  `));

  const blockers = [];
  if (!desired || ready < desired || available < desired) {
    blockers.push('[MISSING: orders-microservice ready deployment]');
  }
  if (!env.WAREHOUSE_RESERVATION_ENABLED) blockers.push('[MISSING: WAREHOUSE_RESERVATION_ENABLED=true in Orders pod]');
  if (!env.FLIPFLOP_INTERNAL_SERVICE_TOKEN) blockers.push('[MISSING: FLIPFLOP_INTERNAL_SERVICE_TOKEN in Orders pod]');
  if (!env.PAYMENTS_INTERNAL_SERVICE_TOKEN) blockers.push('[MISSING: Payments internal token in Orders pod]');
  if (!env.WAREHOUSE_INTERNAL_SERVICE_TOKEN) blockers.push('[MISSING: Warehouse internal token in Orders pod]');

  return {
    deploymentReady: `${ready}/${desired}`,
    deploymentAvailable: `${available}/${desired}`,
    image,
    envPresence: env,
    blockers,
  };
}

function approvalBlockers() {
  const blockers = [];
  if (!approved) blockers.push('[MISSING: RUN_LIVE_LIFECYCLE_MUTATION_SMOKE=1]');
  if (!approvalId) blockers.push('[MISSING: LIFECYCLE_MUTATION_SMOKE_APPROVAL_ID]');
  if (confirm !== 'CREATE_PAY_WAREHOUSE_READ') {
    blockers.push('[MISSING: LIFECYCLE_MUTATION_SMOKE_CONFIRM=CREATE_PAY_WAREHOUSE_READ]');
  }
  if (channel !== 'flipflop' || serviceName !== 'flipflop-service') {
    blockers.push('[MISSING: supported channel/service pair flipflop/flipflop-service]');
  }
  if (!isUuid(catalogProductId)) blockers.push('[MISSING: UUID LIFECYCLE_MUTATION_SMOKE_CATALOG_PRODUCT_ID]');
  if (!isUuid(warehouseId)) blockers.push('[MISSING: UUID LIFECYCLE_MUTATION_SMOKE_WAREHOUSE_ID]');
  return blockers;
}

function runLiveSmoke() {
  const input = {
    approvalId,
    channel,
    serviceName,
    catalogProductId,
    warehouseId,
    externalOrderId,
  };
  const encoded = Buffer.from(JSON.stringify(input)).toString('base64');

  return parseJson(podNode(`
    (async () => {
      const crypto = require('crypto');
      const input = JSON.parse(Buffer.from('${encoded}', 'base64').toString('utf8'));
      const port = process.env.PORT || '3203';
      const baseUrl = 'http://127.0.0.1:' + port + '/api/orders';
      const serviceToken = String(process.env.FLIPFLOP_INTERNAL_SERVICE_TOKEN || '').trim();
      const paymentsToken = String(process.env.PAYMENTS_INTERNAL_SERVICE_TOKEN || process.env.PAYMENTS_ORDERS_SERVICE_TOKEN || '').trim();
      const warehouseToken = String(process.env.WAREHOUSE_INTERNAL_SERVICE_TOKEN || process.env.WAREHOUSE_ORDERS_SERVICE_TOKEN || '').trim();
      const customerEmail = input.serviceName + '@internal.invalid';
      const runRef = input.externalOrderId;
      const hash = (value) => crypto.createHash('sha256').update(String(value || '')).digest('hex').slice(0, 12);
      async function request(url, options) {
        const response = await fetch(url, options);
        const body = await response.json().catch(() => ({}));
        return { status: response.status, body };
      }
      const serviceHeaders = {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-service-name': input.serviceName,
        'x-internal-service-token': serviceToken,
        'idempotency-key': 'orders.create.v1:' + input.channel + ':lifecycle-mutation:' + runRef,
      };
      const createPayload = {
        contractVersion: 'orders.create.v1',
        channel: input.channel,
        channelAccountId: 'codex-lifecycle-mutation',
        externalOrderId: runRef,
        customer: {
          name: 'Lifecycle Mutation Smoke',
          email: customerEmail
        },
        shippingAddress: {
          name: 'Lifecycle Mutation Smoke',
          street: 'Smoke Street 1',
          city: 'Praha',
          postalCode: '11000',
          country: 'CZ'
        },
        billingAddress: {
          name: 'Lifecycle Mutation Smoke',
          street: 'Smoke Street 1',
          city: 'Praha',
          postalCode: '11000',
          country: 'CZ'
        },
        items: [{
          productId: input.catalogProductId,
          sku: 'codex-lifecycle-mutation',
          title: 'Lifecycle Mutation Smoke',
          quantity: 1,
          unitPrice: 1,
          totalPrice: 1,
          warehouseId: input.warehouseId
        }],
        totals: {
          subtotal: 1,
          shippingCost: 0,
          taxAmount: 0,
          total: 1,
          currency: 'CZK'
        },
        payment: {
          method: 'invoice',
          status: 'pending'
        },
        shipping: {
          method: 'codex-smoke'
        }
      };

      const created = await request(baseUrl, {
        method: 'POST',
        headers: serviceHeaders,
        body: JSON.stringify(createPayload)
      });
      const order = created.body?.data?.order || created.body?.data || {};
      const orderId = String(order.id || '').trim();
      const result = {
        createHttpStatus: created.status,
        orderIdPresent: Boolean(orderId),
        orderIdHash: hash(orderId),
        initialWarehouseReserved: order?.warehouseHandoff?.status === 'reserved',
        paymentHttpStatus: null,
        warehouseHttpStatus: null,
        customerLifecycleHttpStatus: null,
        adminLifecycleHttpStatus: null,
        customerSawWarehouseCollecting: false,
        adminSawWarehouseCollecting: false,
        customerScopedCountPositive: false,
        adminAggregateStageCountPositive: false,
        tokenValuesPrinted: false,
        rawOrderRowsPrinted: false
      };
      if (!orderId) {
        console.log(JSON.stringify(result));
        return;
      }

      const paid = await request(baseUrl + '/' + encodeURIComponent(orderId) + '/payment-status', {
        method: 'PUT',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'x-service-name': 'payments-microservice',
          'x-internal-service-token': paymentsToken
        },
        body: JSON.stringify({
          contractVersion: 'orders.payment-status.v1',
          paymentId: 'codex-payment-' + runRef,
          status: 'completed',
          applicationId: 'codex-lifecycle-mutation',
          paymentMethod: 'invoice',
          occurredAt: new Date().toISOString()
        })
      });
      result.paymentHttpStatus = paid.status;

      const warehouse = await request(baseUrl + '/' + encodeURIComponent(orderId) + '/warehouse-fulfillment-status', {
        method: 'PUT',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'x-service-name': 'warehouse-microservice',
          'x-internal-service-token': warehouseToken
        },
        body: JSON.stringify({
          status: 'collecting',
          reasonCode: 'CODEX_LIFECYCLE_MUTATION_SMOKE',
          actor: 'warehouse-microservice',
          reference: 'codex-lifecycle-mutation',
          occurredAt: new Date().toISOString()
        })
      });
      result.warehouseHttpStatus = warehouse.status;

      const query = '?channel=' + encodeURIComponent(input.channel) + '&lifecycleStage=warehouse_collecting&limit=10';
      const customer = await request(baseUrl + '/customer/lifecycle' + query, {
        headers: {
          accept: 'application/json',
          'x-service-name': input.serviceName,
          'x-internal-service-token': serviceToken
        }
      });
      result.customerLifecycleHttpStatus = customer.status;
      const customerData = customer.body?.data || {};
      const customerOrders = Array.isArray(customerData.orders) ? customerData.orders : [];
      result.customerScopedCountPositive = Number(customerData.count || 0) > 0;
      result.customerSawWarehouseCollecting = customerOrders.some((item) =>
        item && item.id === orderId && item.lifecycle && item.lifecycle.lifecycleStage === 'warehouse_collecting'
      );

      const admin = await request(baseUrl + '/admin/lifecycle' + query, {
        headers: {
          accept: 'application/json',
          'x-service-name': input.serviceName,
          'x-internal-service-token': serviceToken
        }
      });
      result.adminLifecycleHttpStatus = admin.status;
      const adminData = admin.body?.data || {};
      const adminOrders = Array.isArray(adminData.orders) ? adminData.orders : [];
      result.adminSawWarehouseCollecting = adminOrders.some((item) =>
        item && item.id === orderId && item.lifecycle && item.lifecycle.lifecycleStage === 'warehouse_collecting'
      );
      result.adminAggregateStageCountPositive = Number(adminData.aggregates?.byLifecycleStage?.warehouse_collecting || 0) > 0;

      console.log(JSON.stringify(result));
    })().catch((error) => {
      console.log(JSON.stringify({ error: String(error && error.message ? error.message : error).slice(0, 180) }));
      process.exit(1);
    });
  `));
}

function main() {
  const preflightResult = preflight();
  const blockers = [...preflightResult.blockers, ...approvalBlockers()];
  if (blockers.length) {
    const report = {
      ...sourceOnlyReport(blockers),
      preflight: preflightResult,
      next: 'Provide explicit live smoke gates only for one approved synthetic mutation run.',
    };
    writeReport(report);
    console.log(JSON.stringify(report, null, 2));
    process.exit(approved ? 2 : 3);
  }

  const result = runLiveSmoke();
  const ok =
    result.createHttpStatus === 201 &&
    result.orderIdPresent === true &&
    result.initialWarehouseReserved === true &&
    result.paymentHttpStatus === 200 &&
    result.warehouseHttpStatus === 200 &&
    result.customerLifecycleHttpStatus === 200 &&
    result.adminLifecycleHttpStatus === 200 &&
    result.customerSawWarehouseCollecting === true &&
    result.adminSawWarehouseCollecting === true &&
    result.customerScopedCountPositive === true &&
    result.adminAggregateStageCountPositive === true;

  const report = {
    ok,
    mode: 'live_synthetic_lifecycle_mutation',
    generatedAt: new Date().toISOString(),
    mutation: true,
    approvalIdPresent: Boolean(approvalId),
    confirmation: confirm,
    channel,
    serviceName,
    externalOrderIdHash: hash(externalOrderId),
    catalogProductIdHash: hash(catalogProductId),
    warehouseIdHash: hash(warehouseId),
    preflight: preflightResult,
    result,
    blockers: ok ? [] : ['[MISSING: lifecycle mutation propagation smoke did not satisfy all assertions]'],
  };
  writeReport(report);
  console.log(JSON.stringify(report, null, 2));
  process.exit(ok ? 0 : 1);
}

main();
