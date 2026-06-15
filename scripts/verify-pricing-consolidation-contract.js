const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const contractPath = path.join(PROJECT_ROOT, 'docs/orchestrator/PRICING_CONSOLIDATION_AND_EVENT_CONTRACT.md');
const eventServicePath = path.join(PROJECT_ROOT, 'src/orders/order-events.service.ts');
const pricingServicePath = path.join(PROJECT_ROOT, 'src/pricing/pricing.service.ts');

const contract = fs.readFileSync(contractPath, 'utf8');
const eventService = fs.readFileSync(eventServicePath, 'utf8');
const pricingService = fs.readFileSync(pricingServicePath, 'utf8');

function mustInclude(source, value, label) {
  assert.equal(source.includes(value), true, `${label} must include ${value}`);
}

function mustNotMatch(source, pattern, label) {
  assert.equal(pattern.test(source), false, `${label} matched forbidden pattern ${pattern}`);
}

[
  'Goal 6.3',
  'Goal 6.4',
  'FlipFlop',
  'Catalog',
  'Payments',
  'pricing.events',
  'pricing.price_changed',
  'productId',
  'oldPrice',
  'newPrice',
  'changePercent',
  'approvedAt',
  'suggestionId',
  'POST /api/pricing',
  'GET /api/pricing/product/:productId/current',
  'G6-A Catalog Pricing Write Adapter',
  'G6-B Pricing Event Versioning',
  'G6-C FlipFlop Local Pricing Publisher Decommission',
].forEach((value) => mustInclude(contract, value, 'contract'));

[
  'provider sessions',
  'payment capture',
  'variable symbols',
  'provider webhooks',
  'refunds',
  'bearer tokens',
  'JWTs',
  'secrets',
  'raw AI responses',
].forEach((value) => mustInclude(contract, value, 'forbidden-boundary list'));

mustInclude(eventService, "private readonly pricingExchangeName = 'pricing.events'", 'OrderEventsService');
mustInclude(eventService, "'pricing.price_changed'", 'OrderEventsService');
mustInclude(eventService, 'publishPricingPriceChanged', 'OrderEventsService');

[
  'productId',
  'productName',
  'oldPrice',
  'newPrice',
  'changePercent',
  'approvedAt',
  'suggestionId',
].forEach((value) => mustInclude(eventService, value, 'pricing event source'));

mustInclude(pricingService, 'Math.abs(changePercent) > 30', 'pricing service safety guard');
mustInclude(pricingService, 'this.updateProductPrice', 'pricing service Catalog handoff');
mustInclude(pricingService, 'publishPricingPriceChanged', 'pricing service event publish');

mustNotMatch(contract, /Authorization: Bearer [A-Za-z0-9_./+=:-]{12,}/, 'contract');
mustNotMatch(contract, /(client[_-]?secret|private[_-]?key|jwt[_-]?secret|db[_-]?password)\s*[:=]\s*['"]?[A-Za-z0-9_./+=:-]{12,}/i, 'contract');
mustNotMatch(eventService, /providerTransactionId|variableSymbol|cardNumber|refund|customerAddress|shippingAddress/, 'pricing event source');
mustNotMatch(pricingService, /providerTransactionId|variableSymbol|cardNumber|refund/, 'pricing service');

console.log('pricing consolidation contract verification ok');
