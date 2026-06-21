const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { BadRequestException } = require('@nestjs/common');
const { PricingController, PRICING_ADMIN_ROLES } = require('../dist/pricing/pricing.controller');
const { PricingService } = require('../dist/pricing/pricing.service');
const { ROLES_KEY } = require('../dist/auth/roles.decorator');

const PROJECT_ROOT = path.resolve(__dirname, '..');

function makeSuggestion(overrides = {}) {
  return {
    id: 'suggestion-1',
    productId: 'product-1',
    productName: 'Demo product',
    currentPrice: 100,
    suggestedPrice: 120,
    changePercent: 20,
    rationale: 'Bounded adjustment.',
    status: 'pending',
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectedBy: null,
    createdAt: new Date('2026-06-15T10:00:00.000Z'),
    updatedAt: new Date('2026-06-15T10:00:00.000Z'),
    ...overrides,
  };
}

function makeService(suggestion = makeSuggestion()) {
  const saved = [];
  const audits = [];
  const requests = [];
  const events = [];
  const service = new PricingService(
    {
      axiosRef: {
        async request(config) {
          requests.push(config);
        },
        async post() {
          throw new Error('not used');
        },
      },
    },
    {
      log() {},
      error() {},
      audit(metadata) {
        audits.push(metadata);
      },
    },
    {
      async publishPricingPriceChanged(event) {
        events.push(event);
      },
    },
    {
      async findOne() {
        return suggestion;
      },
      async save(entity) {
        saved.push({ ...entity });
        return entity;
      },
      async findAndCount() {
        return [[suggestion], 1];
      },
      async query() {
        return [];
      },
      create(entity) {
        return entity;
      },
    },
  );
  service.catalogServiceUrl = 'http://catalog-service';
  service.catalogInternalServiceToken = 'test-catalog-token';
  return { service, suggestion, saved, audits, requests, events };
}

(async () => {
  const controllerSource = fs.readFileSync(path.join(PROJECT_ROOT, 'src/pricing/pricing.controller.ts'), 'utf8');
  const entitySource = fs.readFileSync(path.join(PROJECT_ROOT, 'src/pricing/price-suggestion.entity.ts'), 'utf8');
  const migrationSource = fs.readFileSync(path.join(PROJECT_ROOT, 'migrations/006_add_price_suggestion_approval_metadata.sql'), 'utf8');

  assert.match(controllerSource, /@Roles\(\.\.\.PRICING_ADMIN_ROLES\)/);
  assert.deepEqual(
    Reflect.getMetadata(ROLES_KEY, PricingController),
    { roles: PRICING_ADMIN_ROLES },
  );
  assert.equal(PRICING_ADMIN_ROLES.includes('global:superadmin'), true);
  assert.equal(PRICING_ADMIN_ROLES.includes('internal:orders-microservice:admin'), true);
  assert.match(entitySource, /approvedAt/);
  assert.match(entitySource, /approvedBy/);
  assert.match(entitySource, /rejectedAt/);
  assert.match(entitySource, /rejectedBy/);
  assert.match(migrationSource, /ADD COLUMN IF NOT EXISTS "approvedAt"/);

  const approved = makeService();
  const result = await approved.service.approveSuggestion('suggestion-1', {
    sub: 'orders-admin-1',
    email: 'operator@example.invalid',
    roles: ['internal:orders-microservice:admin'],
  });
  assert.equal(result.success, true);
  assert.equal(result.newPrice, 120);
  assert.equal(approved.suggestion.status, 'approved');
  assert.equal(approved.suggestion.approvedBy, 'orders-admin-1');
  assert.ok(approved.suggestion.approvedAt instanceof Date);
  assert.equal(approved.requests.length, 1);
  assert.equal(approved.requests[0].method, 'post');
  assert.equal(approved.requests[0].url, 'http://catalog-service/api/pricing');
  assert.deepEqual(approved.requests[0].data, {
    productId: 'product-1',
    basePrice: 120,
    currency: 'CZK',
    priceType: 'regular',
    isActive: true,
  });
  assert.equal(approved.requests[0].headers['x-internal-service-token'], 'test-catalog-token');
  assert.equal(approved.requests[0].headers['x-service-name'], 'orders-microservice');
  assert.equal(approved.events.length, 1);
  assert.equal(approved.events[0].suggestionId, 'suggestion-1');
  assert.equal(approved.audits.some((entry) => entry.operation === 'pricing.suggestion.approve' && entry.actorId === 'orders-admin-1' && entry.outcome === 'success'), true);
  assert.equal(JSON.stringify(approved.audits).includes('operator@example.invalid'), false);

  const rejected = makeService(makeSuggestion({ id: 'suggestion-2' }));
  await rejected.service.rejectSuggestion('suggestion-2', { email: 'pricing.operator@example.invalid' });
  assert.equal(rejected.suggestion.status, 'rejected');
  assert.equal(rejected.suggestion.rejectedBy, 'pricing.operator@example.invalid');
  assert.ok(rejected.suggestion.rejectedAt instanceof Date);
  assert.equal(rejected.events.length, 0);
  assert.equal(rejected.requests.length, 0);

  const tooLarge = makeService(makeSuggestion({ changePercent: 31 }));
  await assert.rejects(
    () => tooLarge.service.approveSuggestion('suggestion-1', { sub: 'orders-admin-1' }),
    BadRequestException,
  );
  assert.equal(tooLarge.requests.length, 0);
  assert.equal(tooLarge.events.length, 0);
  assert.equal(tooLarge.suggestion.status, 'pending');

  const invalidPrice = makeService(makeSuggestion({ suggestedPrice: 0 }));
  await assert.rejects(
    () => invalidPrice.service.approveSuggestion('suggestion-1', { sub: 'orders-admin-1' }),
    BadRequestException,
  );
  assert.equal(invalidPrice.requests.length, 0);
  assert.equal(invalidPrice.events.length, 0);

  const alreadyApproved = makeService(makeSuggestion({ status: 'approved' }));
  await assert.rejects(
    () => alreadyApproved.service.approveSuggestion('suggestion-1', { sub: 'orders-admin-1' }),
    BadRequestException,
  );
  assert.equal(alreadyApproved.requests.length, 0);
  assert.equal(alreadyApproved.events.length, 0);

  const missingCatalogToken = makeService(makeSuggestion({ id: 'suggestion-missing-token' }));
  missingCatalogToken.service.catalogInternalServiceToken = '';
  await assert.rejects(
    () => missingCatalogToken.service.approveSuggestion('suggestion-missing-token', { sub: 'orders-admin-1' }),
    BadRequestException,
  );
  assert.equal(missingCatalogToken.requests.length, 0);
  assert.equal(missingCatalogToken.events.length, 0);

  const listed = await approved.service.listSuggestions('100', 'pending');
  assert.equal(listed.limit, 50);
  assert.equal(listed.items[0].approvedBy, 'orders-admin-1');
  assert.equal(JSON.stringify(listed).includes('Bearer '), false);
  assert.equal(JSON.stringify(listed).includes('test-catalog-token'), false);

  console.log('pricing safety verification ok');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
