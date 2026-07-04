const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const readSibling = (repo, relativePath) => fs.readFileSync(path.join(root, '..', repo, relativePath), 'utf8');

const reportPath = 'reports/validation/VAL-GOAL-24-orders-paid-provider-bundle-readiness.md';
const createDto = read('src/orders/create-order.dto.ts');
const ordersService = read('src/orders/orders.service.ts');
const ordersController = read('src/orders/orders.controller.ts');
const orderEvents = read('src/orders/order-events.service.ts');
const warehouseClient = read('src/warehouse/warehouse-reservation.client.ts');
const fulfillmentHandoff = read('src/orders/order-fulfillment-handoff.client.ts');
const paymentDto = read('src/payments/payment-status.dto.ts');
const paymentBoundary = read('docs/orchestrator/PAYMENT_STATUS_BOUNDARY.md');
const warehouseBoundary = read('docs/orchestrator/WAREHOUSE_HANDOFF_CONTRACT.md');
const transitionBoundary = read('docs/orchestrator/ORDER_STATUS_TRANSITIONS.md');
const rollbackReadiness = read('docs/orchestrator/2026-07-03-goal24-orders-cancel-cleanup-rollback-readiness.md');
const createContract = read('docs/orchestrator/CHANNEL_ORDER_CREATE_CONTRACT.md');
const createVerifier = read('scripts/verify-create-order-contract.js');
const paymentVerifier = read('scripts/verify-payment-boundary.js');
const report = read(reportPath);
const currentHeadSync = read('reports/validation/VAL-GOAL-24-current-head-sync-2026-07-04.md');
const ordersTokenBindingConsumption = read('reports/validation/VAL-GOAL-24-orders-token-binding-proof-contract-consumption-2026-07-04.md');
const implementationState = read('docs/IMPLEMENTATION_STATE.md');
const orchestratorStatus = read('docs/orchestrator/STATUS.md');
const staleIdempotencyClaim = 'current status endpoint has no dedicated idempotency-key field';
assert.equal(report.includes(staleIdempotencyClaim), false, 'readiness report must not preserve stale idempotency endpoint wording');
requireIncludes(report, 'approval.idempotencyKey, which the current status endpoint accepts and persists in statusTransitionAudit', 'readiness report idempotency endpoint wording');
const flipflopOrdersService = readSibling('flipflop', 'services/order-service/src/orders/orders.service.ts');
const flipflopOrdersHubVerifier = readSibling('flipflop', 'scripts/verify-orders-hub-integration.js');
const paymentsCreateValidation = readSibling('payments-microservice', 'test/payment-create-validation.spec.ts');
const paymentsProviderContract = readSibling('payments-microservice', 'docs/orchestrator/PROVIDER_ROLLBACK_EVENT_CONTRACT.md');
const paymentsRollbackPacket = readSibling('payments-microservice', 'docs/orchestrator/2026-07-03-goal24-owner-approved-rollback-packet.md');
const warehouseStatus = readSibling('warehouse-microservice', 'docs/orchestrator/STATUS.md');
const catalogStatus = readSibling('catalog-microservice', 'docs/orchestrator/STATUS.md');
const catalogTokenBindingConsumption = readSibling('catalog-microservice', 'reports/validation/VAL-GOAL-24-flipflop-token-binding-proof-contract-consumption-2026-07-04.md');
const flipflopTokenBindingContract = readSibling('flipflop', 'reports/validation/VAL-GOAL-24-auth-admin-token-binding-proof-contract-2026-07-04.md');

function requireIncludes(source, needle, label) {
  assert.ok(source.includes(needle), `${label} missing: ${needle}`);
}

function requireMatch(source, pattern, label) {
  assert.match(source, pattern, `${label} missing pattern ${pattern}`);
}

for (const [source, label] of [
  [createContract, 'create contract'],
  [createVerifier, 'create verifier'],
  [report, 'readiness report'],
]) {
  requireIncludes(source, 'catalog.bundle.v1', label);
  requireIncludes(source, 'bundleEvidence', label);
}

requireIncludes(createDto, "contractVersion !== 'catalog.bundle.v1'", 'create dto');
requireIncludes(createDto, "const allowedKeys = new Set(['contractVersion', 'bundleId', 'productIds', 'discountPolicyRef', 'freeShippingPolicyRef', 'serverTotalSource'])", 'bundle evidence allowlist');
requireIncludes(createDto, 'productIds must match submitted order item productIds', 'bundle evidence product-set check');
requireIncludes(createDto, 'Unsupported bundleEvidence', 'bundle evidence unknown field rejection');
requireIncludes(createVerifier, 'appliedSavings', 'create verifier pricing-claim rejection');
requireIncludes(createVerifier, 'paymentProviderMetadata', 'create verifier provider metadata rejection');
requireIncludes(createVerifier, 'validateCreate must not reserve warehouse stock', 'validate-create non-mutation guard');

requireIncludes(ordersService, 'mutation: false', 'validate-create response');
requireIncludes(ordersService, 'warehouseMutation: false', 'validate-create response');
requireIncludes(ordersService, 'eventPublished: false', 'validate-create response');
requireIncludes(ordersService, 'bundleEvidenceCount', 'validate-create bundle evidence count');
requireMatch(orderEvents, /publishOrderCreated\([\s\S]*items\?:/, 'order-created publisher signature');
assert.equal(orderEvents.includes('bundleEvidence'), false, 'orders.order.created publisher must not include bundleEvidence');

requireIncludes(paymentDto, "export type PaymentsOwnedStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';", 'payment status dto');
requireIncludes(paymentDto, "if (normalized === 'refunded' || normalized === 'refund' || normalized === 'partially_refunded')", 'refund rejection');
for (const forbidden of ['providerTransactionId', 'providerResponse', 'metadata', 'refund', 'amount', 'currency', 'customer', 'card', 'token', 'secret']) {
  requireIncludes(paymentDto, `'${forbidden}'`, `payment forbidden field ${forbidden}`);
}
requireIncludes(paymentBoundary, 'Orders does not receive raw provider webhooks', 'payment boundary provider webhook ownership');
requireIncludes(paymentBoundary, 'Refunds remain Payments-owned', 'payment boundary refund ownership');
requireIncludes(paymentBoundary, 'Manual payment-state bypass', 'payment boundary manual bypass rejection');
requireIncludes(paymentBoundary, 'orders.payment-status.v1', 'payment boundary status contract');
requireIncludes(warehouseBoundary, 'PAYMENT_CONFIRMED', 'warehouse paid fulfillment reason');
requireIncludes(warehouseBoundary, 'PAYMENT_FAILED_RELEASE', 'warehouse failed/cancelled release reason');
requireIncludes(warehouseBoundary, 'ORDER_CANCELLED', 'warehouse cancellation cleanup reason');
requireIncludes(warehouseBoundary, 'Orders must not edit stock truth', 'warehouse cleanup ownership');
requireIncludes(paymentBoundary, 'Fiobanka Goal 24 cleanup refinement', 'payment boundary Fiobanka cleanup refinement');
requireIncludes(paymentBoundary, 'GOAL24_PAID_PROVIDER_ROLLBACK', 'payment boundary Goal 24 rollback reason');
requireIncludes(warehouseBoundary, 'For Fiobanka Goal 24 cleanup', 'warehouse Fiobanka cleanup mapping');
requireIncludes(warehouseBoundary, 'unknown component state is no-op fail-closed', 'warehouse Fiobanka unknown-state fail closed');
requireIncludes(rollbackReadiness, 'delivered/customer-received or inventory-return evidence', 'rollback readiness return gate');
requireIncludes(rollbackReadiness, 'not a prerequisite for a non-delivered Fiobanka refund/reversal/correction cleanup packet', 'rollback readiness narrowed return prerequisite');
requireIncludes(transitionBoundary, 'side-effect acknowledgements for payment, warehouse, notification, CRM, and channel handling', 'order cancellation side-effect gate');
requireIncludes(rollbackReadiness, 'without manual payment-state bypass', 'rollback readiness no manual bypass');
requireIncludes(rollbackReadiness, 'provider refund or cancellation plus Orders/Warehouse cleanup', 'rollback readiness blocker');
requireIncludes(rollbackReadiness, 'must be proven by Payments first', 'rollback readiness provider proof first');
requireIncludes(rollbackReadiness, 'Orders Source-Verified Target State Matrix', 'rollback readiness target state matrix');
requireIncludes(rollbackReadiness, '`pending` before provider payment completion', 'rollback readiness pending target state');
requireIncludes(rollbackReadiness, '`confirmed` after provider completion but before shipment', 'rollback readiness confirmed target state');
requireIncludes(rollbackReadiness, '`processing` after fulfillment started but before shipment', 'rollback readiness processing target state');
requireIncludes(rollbackReadiness, '`shipped`', 'rollback readiness shipped fail closed');
requireIncludes(rollbackReadiness, '`delivered` / customer-received', 'rollback readiness delivered fail closed');
requireIncludes(rollbackReadiness, "CANCELLATION_SOURCES = ['pending', 'confirmed', 'processing']", 'rollback readiness source cancellation state matrix');
requireIncludes(rollbackReadiness, 'sideEffectsHandled.payment|warehouse|notification|crm|channel=true', 'rollback readiness source side-effect ack list');
requireIncludes(transitionBoundary, '`pending|confirmed|processing -> cancelled` requires `approval.approved=true`, `approval.approvalType=human`', 'status transition cancellation gate docs');
requireIncludes(transitionBoundary, 'side-effect acknowledgements for payment, warehouse, notification, CRM, and channel handling', 'status transition side-effect docs');
requireIncludes(transitionBoundary, 'terminal-state destructive corrections remain rejected', 'status transition terminal fail closed docs');
requireIncludes(ordersService, 'order.status.update.idempotency_key_replay', 'status update idempotency replay audit');
requireIncludes(ordersService, 'return order;', 'status update idempotency no-op return');
requireIncludes(ordersService, "transition.status === 'cancelled'", 'status update Warehouse cancel gate');
requireIncludes(ordersService, 'cancelOrderItems(updated)', 'status update Warehouse cancel handoff');
requireIncludes(ordersService, 'statusTransitionAudit = transition.approvalAudit', 'status transition audit persistence');
requireIncludes(ordersService, 'hasMatchingStatusIdempotencyKey(order, transition.approvalAudit.idempotencyKey, transition.status)', 'status transition idempotency key comparison');
requireIncludes(ordersService, 'audit?.idempotencyKey === idempotencyKey && audit?.resultingStatus === resultingStatus', 'status transition idempotency matching fields');
requireIncludes(ordersService, 'previousStatus,', 'status transition previous status audit');
requireIncludes(ordersService, 'reasonCode: transition.approvalAudit?.reasonCode', 'status transition reason code audit');
requireIncludes(ordersService, 'actorId: context.actor?.sub', 'status transition actor audit');
requireIncludes(ordersService, 'actorEmail: context.actor?.email', 'status transition actor email audit');
for (const required of [
  'Fiobanka Paid Provider Cleanup Approval Contract',
  'GOAL24_PAID_PROVIDER_ROLLBACK',
  'GOAL24_PROVIDER_UNPAID_CANCEL',
  '[MISSING: named Orders cancellation actor/approvedBy for Goal 24 paid/provider cleanup]',
  '[RESOLVED: migration/deploy approval executed for persisted Orders cleanup idempotency key; migration pre_column_count=0 post_column_count=1, deployed image localhost:5000/orders-microservice:adddafb, health healthy]',
  'payment=true',
  'warehouse=true',
  'notification=true',
  'crm=true',
  'channel=true',
  'Payments service identity is not an Orders cancellation actor',
  'Orders must not infer stock effects from Payments refund state',
  'Fiobanka QR created but unpaid',
  'PAYMENT_FAILED_RELEASE',
  'PAYMENT_CONFIRMED',
  'ORDER_CANCELLED',
  'ORDER_RETURNED',
  '[MISSING: owner-approved Orders return workflow for Goal 24 paid/provider cleanup when delivered/customer-received state exists]',
  'return` is not a default paid-provider refund cleanup path',
  'cancellation plus Warehouse `cancel` with `ORDER_CANCELLED`',
  'Unknown Warehouse component state',
  'Owner-Approved Future Runtime Packet Shape',
  'route`: `PUT /api/orders/:id/status` with `status=cancelled`',
  'targetOrderHash',
  'targetOrderState',
  '`pending`, `confirmed`, or `processing`',
  '`actor` or `approvedBy`',
  'Payments service identity, channel service identity, and Codex operator identity alone are not sufficient',
  '`approvalType`: `human`',
  '`reasonCode`: `GOAL24_PAID_PROVIDER_ROLLBACK`',
  '`GOAL24_PROVIDER_UNPAID_CANCEL` only for pre-completion unpaid cancellation',
  '`idempotencyKey`: sanitized 8-160 character key',
  '`sideEffectsHandled`: explicit `payment=true`, `warehouse=true`, `notification=true`, `crm=true`, and `channel=true`',
  'providerEvidenceHash',
  'warehouseDecision',
  'redactionPlanAccepted',
  '[RESOLVED/NARROWED: owner-approved Orders cancellation/refund correction packet shape is defined as route, targetOrderHash/state, actor/approvedBy, human approval, safe reason, sanitized idempotency key, all side-effect acknowledgements, provider evidence hash, Warehouse decision, and redaction acceptance]',
  '[MISSING: named runtime Orders cancellation actor/approvedBy and exact target order hash/state for the paid/provider packet]',
  '[MISSING: owner-approved payment/warehouse/notification/crm/channel sideEffectsHandled acknowledgements for the selected central order hash]',
  '[MISSING: Fiobanka provider-side completed-transfer refund/reversal/correction proof hash, or owner-approved unpaid no-provider-cancel acknowledgement]',
  '[MISSING: approved runtime route invocation evidence; do not call the route until all packet fields are present]',
]) {
  requireIncludes(rollbackReadiness, required, 'rollback readiness Fiobanka cleanup contract');
}
requireIncludes(paymentVerifier, 'cannot mark a cancelled order as paid', 'payment verifier cancelled paid rejection');
requireIncludes(paymentVerifier, 'refund or correction workflow', 'payment verifier paid downgrade rejection');
requireIncludes(paymentVerifier, 'provider-owned', 'payment verifier provider data rejection');
requireIncludes(ordersController, "internal:payments-microservice:service", 'payment-status route Payments service role');
requireIncludes(ordersController, "@Put(':id/payment-status')", 'payment-status route');
requireIncludes(ordersService, 'fulfillOrderItems(updated)', 'payment success Warehouse fulfill call');
requireIncludes(ordersService, 'releaseOrderItems(updated)', 'payment failed/cancelled Warehouse release call');
requireIncludes(ordersService, 'createAfterPaymentFulfillment(updated)', 'post-paid Warehouse fulfillment handoff');
requireIncludes(warehouseClient, "fulfill: 'PAYMENT_CONFIRMED'", 'Warehouse fulfill reason mapping');
requireIncludes(warehouseClient, "cancel: 'ORDER_CANCELLED'", 'Warehouse cancel reason mapping');
requireIncludes(warehouseClient, "return: 'ORDER_RETURNED'", 'Warehouse return reason mapping');
requireIncludes(fulfillmentHandoff, "reasonCode: 'PAYMENT_CONFIRMED'", 'Warehouse fulfillment handoff reason');
requireIncludes(ordersController, "@Put(':id/status')", 'status cancellation route');
requireIncludes(ordersController, 'approval: body.approval', 'status cancellation approval body');
requireIncludes(ordersController, 'actor: request.user', 'status cancellation actor context');
requireIncludes(ordersService, 'cancelOrderItems(updated)', 'status cancellation Warehouse cancel call');
requireIncludes(ordersService, 'statusTransitionAudit = transition.approvalAudit', 'status transition audit persistence');
requireIncludes(ordersService, 'hasMatchingStatusIdempotencyKey', 'status transition idempotency replay guard');
requireIncludes(transitionBoundary, 'pending|confirmed|processing -> cancelled', 'status transition documented source matrix');
requireIncludes(transitionBoundary, 'approvalType=human', 'status transition human approval');
requireIncludes(transitionBoundary, 'side-effect acknowledgements for payment, warehouse, notification, CRM, and channel handling', 'status transition side-effect acknowledgements');
requireIncludes(transitionBoundary, 'terminal-state destructive corrections remain rejected', 'status transition terminal-state fail closed');
requireIncludes(ordersService, "previousPaymentStatus === 'paid' && normalized.paymentStatus !== 'paid'", 'payment paid downgrade fail closed');

const ordersCheckoutSource = [ordersService, ordersController, paymentDto].join('\n');
assert.equal(
  /PAYMENTS_SERVICE_URL|payments\/create|\/payments\/create|CreatePayment|createPayment\(/.test(ordersCheckoutSource),
  false,
  'Orders source must not claim active Payments checkout creation proof',
);

requireIncludes(flipflopOrdersService, 'createCentralOrderBeforePayment', 'FlipFlop active checkout source');
requireIncludes(flipflopOrdersService, 'orderId: centralAcceptance.centralOrderId', 'FlipFlop active create/guest payment source');
requireIncludes(flipflopOrdersService, 'centralOrderId: centralAcceptance.centralOrderId', 'FlipFlop active create/guest payment source');
requireIncludes(flipflopOrdersService, 'metadata: this.buildPaymentMetadata(order, centralAcceptance.centralOrderId)', 'FlipFlop active create/guest payment metadata');
requireIncludes(flipflopOrdersService, 'let centralOrderId = this.getAcceptedCentralOrderId(order);', 'FlipFlop legacy create-payment central id lookup');
requireIncludes(flipflopOrdersService, 'orderId: centralOrderId', 'FlipFlop legacy create-payment source');
requireIncludes(flipflopOrdersService, 'centralOrderId,', 'FlipFlop legacy create-payment source');
assert.equal(
  flipflopOrdersService.includes('orderId: order.orderNumber,'),
  false,
  'FlipFlop payment creation must not send the local order number as Payments orderId',
);
requireIncludes(
  flipflopOrdersHubVerifier,
  'payment creation must use the central Orders UUID and local callback metadata, never the local order number',
  'FlipFlop source verifier central UUID assertion',
);
requireIncludes(paymentsCreateValidation, 'accepts FlipFlop central order correlation without persistence or provider calls', 'Payments create validation');
requireIncludes(paymentsCreateValidation, "orderId: '86487d81-967b-42e5-9961-7a0eb83b1fe0'", 'Payments central orderId fixture');
requireIncludes(paymentsCreateValidation, "centralOrderId: '86487d81-967b-42e5-9961-7a0eb83b1fe0'", 'Payments centralOrderId fixture');

requireIncludes(paymentsProviderContract, '[RESOLVED: runtime verification of Payments Orders service token/role for the current bridge mechanism]', 'Payments provider contract current service-token proof');
requireIncludes(paymentsRollbackPacket, '[MISSING: Fiobanka provider-side refund/reversal or unpaid cancel/void execution path with redacted evidence]', 'Payments rollback packet preserves Fiobanka execution blocker');
requireIncludes(paymentsProviderContract, 'FIO_BANKA_REFUND_UPLOAD_ENABLED', 'Payments provider contract refund upload gate');
requireIncludes(warehouseStatus, '[MISSING: renewed owner-approved execution window and Warehouse hold/release duration]', 'Warehouse current hold/release duration blocker');


for (const marker of [
  '[RESOLVED/NARROWED: Orders consumed Catalog 47b652c and FlipFlop f004fe5 token-binding proof contract as source governance only; runtime Orders route invocation remains blocked]',
  '[RESOLVED/NARROWED: Goal 24 token-binding proof may record only token-present, Auth validation status class, actor-hash match, required-role boolean, approval id, runner id, timestamps, and no-output booleans]',
  '[RESOLVED/NARROWED: Goal 24 approved token source shape is owner-approved on-host token file or in-memory handoff read only by the approved runner, never printed, never decoded into reports, never persisted, never committed, and removed or invalidated after the run]',
  '[RESOLVED/NARROWED: Goal 24 Auth token binding does not authorize Orders, Warehouse, Payments/provider, or channel side effects and does not prove stock effects]',
  '[MISSING: approved token source path, such as an on-host token file path or in-memory handoff, with explicit no-print/no-decode/no-persist handling]',
  '[MISSING: confirmation that the token belongs to actor hash 4215870ba488de17 and carries app:flipflop-service:admin or global:superadmin]',
  '[MISSING: exact Orders cleanup packet and sideEffectsHandled acknowledgements]',
  '[MISSING: named runtime Orders cancellation actor/approvedBy and exact target order hash/state for the paid/provider packet]',
  '[MISSING: owner-approved payment/warehouse/notification/crm/channel sideEffectsHandled acknowledgements for the selected central order hash]',
  '[MISSING: approved runtime route invocation evidence; do not call the route until all packet fields are present]',
  'tokenSourceType=on-host-token-file',
  'tokenSourceType=in-memory-handoff',
  'actorHashMatches=true',
  'requiredAdminRolePresent=true',
  'tokenOutput=false',
  'decodedJwtOutput=false',
  'rawUserOutput=false',
  'secretOutput=false',
  'tokenSourceDestroyedOrInvalidated=true',
  'Auth token-binding proof is not Warehouse stock evidence and is not Orders cleanup authorization',
]) {
  requireIncludes(ordersTokenBindingConsumption, marker, `Orders token-binding consumption report ${marker}`);
  assert.ok(report.includes(marker) || rollbackReadiness.includes(marker) || implementationState.includes(marker) || orchestratorStatus.includes(marker), `Orders docs missing token-binding marker ${marker}`);
}
requireIncludes(catalogTokenBindingConsumption, '[RESOLVED/NARROWED: Catalog consumed FlipFlop f004fe5 token-binding proof contract as source governance only; runtime Auth token source and token-to-actor proof remain blocked]', 'Catalog token-binding consumption source marker');
requireIncludes(flipflopTokenBindingContract, '[RESOLVED/NARROWED: Goal 24 token-binding proof may record only token-present, Auth validation status class, actor-hash match, required-role boolean, approval id, runner id, timestamps, and no-output booleans]', 'FlipFlop token-binding source marker');
for (const boundary of [
  'mutation: false',
  'orders_route_invocation: false',
  'live_auth_login: false',
  'token_issuance: false',
  'token_output: false',
  'decoded_jwt_output: false',
  'secret_output: false',
  'raw_user_output: false',
  'payment_creation: false',
  'provider_call: false',
  'refund_or_reversal: false',
  'warehouse_mutation: false',
  'channel_cleanup_mutation: false',
]) {
  requireIncludes(ordersTokenBindingConsumption, boundary, `Orders token-binding consumption boundary ${boundary}`);
}

const sourceWaveFreezeMarker = '[RESOLVED/NARROWED: Goal 24 frozen source-governance wave GOAL24-SOURCE-WAVE-2026-07-04A records Catalog `e379b54 merge goal24 current source head sync`, FlipFlop `e1f3e3a merge goal24 current source head sync`, Payments `eab6351 merge goal24 current source head sync`, Orders `d53de9f merge goal24 current source head sync`, and Warehouse `11df002 merge goal24 warehouse target facts reconcile` as input heads for runtime planning; post-merge self heads are validation evidence only; runtime Orders route invocation and cleanup side effects remain blocked]';
for (const [label, source] of [
  ['source-wave freeze report', currentHeadSync],
  ['readiness report', report],
  ['rollback readiness', rollbackReadiness],
  ['implementation state', implementationState],
  ['orchestrator status', orchestratorStatus],
]) {
  requireIncludes(source, sourceWaveFreezeMarker, `${label} source-wave freeze marker`);
  for (const marker of [
    'Catalog `e379b54 merge goal24 current source head sync`',
    'FlipFlop `e1f3e3a merge goal24 current source head sync`',
    'Payments `eab6351 merge goal24 current source head sync`',
    'Warehouse `11df002 merge goal24 warehouse target facts reconcile`',
    'Orders `d53de9f merge goal24 current source head sync`',
    '[MISSING: approved token source path, such as an on-host token file path or in-memory handoff, with explicit no-print/no-decode/no-persist handling]',
    '[MISSING: confirmation that the token belongs to actor hash 4215870ba488de17 and carries app:flipflop-service:admin or global:superadmin]',
    '[MISSING: named human Payments/provider rollback execution owner with bank/refund authority for runtime]',
    '[MISSING: future paymentId/orderId/variableSymbolHash/providerTransactionHash for exact smoke]',
    '[MISSING: concrete side-effectful rollback run id and cleanup idempotency keys]',
    '[MISSING: exact Orders cleanup packet and sideEffectsHandled acknowledgements]',
    '[MISSING: named runtime Orders cancellation actor/approvedBy and exact target order hash/state for the paid/provider packet]',
    '[MISSING: owner-approved payment/warehouse/notification/crm/channel sideEffectsHandled acknowledgements for the selected central order hash]',
    '[MISSING: renewed owner-approved execution window and Warehouse hold/release duration]',
    '[MISSING: final owner approval before any live Warehouse reservation/cleanup mutation]',
    '[MISSING: approved runtime route invocation evidence; do not call the route until all packet fields are present]',
    '[MISSING: final redacted evidence path for required provider, Orders, Warehouse, and channel cleanup proof]',
  ]) {
    requireIncludes(source, marker, `${label} missing source-wave freeze marker ${marker}`);
  }
}
for (const boundary of [
  'mutation: false',
  'orders_route_invocation: false',
  'payment_creation: false',
  'provider_call: false',
  'refund_or_reversal: false',
  'warehouse_mutation: false',
  'channel_cleanup_mutation: false',
  'deployment: false',
  'secret_output: false',
  'raw_customer_or_payment_evidence: false',
]) {
  requireIncludes(currentHeadSync, boundary, `current head sync boundary ${boundary}`);
}
requireIncludes(catalogStatus, '[RESOLVED/NARROWED: deployed FlipFlop bundle-preserving fixture gate and renewed runtime quote evidence passed before checkout]', 'Catalog current quote preflight evidence');
requireIncludes(report, 'Current dependency heads consumed: Catalog `906a31f merge goal24 flipflop channel supersession consumption`, FlipFlop `5202c15 merge goal24 channel cleanup owner supersession`, Payments `7822f2a merge goal24 cross-service head sync`, Warehouse `46a66dc docs: define goal24 warehouse cleanup packet`; Orders pre-change `6d5dced merge goal24 latest cleanup heads`.', 'readiness report historical dependency heads');
requireIncludes(rollbackReadiness, 'Orders consumed current pushed heads Catalog `906a31f merge goal24 flipflop channel supersession consumption`, FlipFlop `5202c15 merge goal24 channel cleanup owner supersession`, Payments `7822f2a merge goal24 cross-service head sync`, and Warehouse `46a66dc docs: define goal24 warehouse cleanup packet` as dependency evidence only.', 'rollback readiness historical dependency heads');
requireIncludes(report, '[RESOLVED/NARROWED: Codex Goal 24 integration thread supersedes earlier FlipFlop channel executor/runtime owner blockers; channel cleanup runtime remains blocked until bank/refund authority, exact provider proof, Orders side-effect acknowledgements, Warehouse target facts, Auth token source, and final redacted evidence path exist]', 'readiness report channel supersession marker');
requireIncludes(rollbackReadiness, '[RESOLVED/NARROWED: Codex Goal 24 integration thread supersedes earlier FlipFlop channel executor/runtime owner blockers; channel cleanup runtime remains blocked until bank/refund authority, exact provider proof, Orders side-effect acknowledgements, Warehouse target facts, Auth token source, and final redacted evidence path exist]', 'rollback readiness channel supersession marker');

for (const required of [
  '[RESOLVED: owner-approved Rung 1 non-mutating real checkout smoke passed',
  '[RESOLVED: owner-approved Rung 2 live pending-order smoke proved pending Orders create',
  '[MISSING: owner-approved paid/provider checkout smoke with stock and refund/cancel rollback plan]',
  '[MISSING: owner-approved refund/cancel rollback plan proving provider refund or cancellation plus Orders/Warehouse cleanup]',
  '[RESOLVED/NARROWED: Fiobanka QR side-effect-safe rollback is pre-completion only; completed-transfer refund/reversal/correction remains missing]',
  '[MISSING: owner-approved paid/provider payment provider source and callback contract]',
  '[RESOLVED/NARROWED: owner-approved Warehouse stock decrement/fulfillment rollback criteria for paid bundle smoke at source-policy level in Warehouse 3043cad; live stock window and max quantity remain missing]',
  '[RESOLVED/NARROWED: Warehouse cleanup operation selection for reserved-only, fulfilled/stock-decremented, return, partial, and unknown component-line states in Warehouse 3043cad]',
  '[MISSING: Fiobanka provider-side completed-transfer refund/reversal/correction proof with redacted evidence]',
  '[RESOLVED: FlipFlop active checkout payment creation passes central Orders UUIDs to Payments from source]',
  '[RESOLVED/PARTIAL: Orders/Payments provider-success, provider-cancel, and provider-failure event mapping before fulfillment]',
  '[MISSING: owner-approved refund/post-fulfillment cancellation workflow that maps to Orders/Warehouse without inferred stock effects]',
  '[RESOLVED/NARROWED: Orders return workflow is not required unless delivered/customer-received or inventory-return evidence exists]',
  'Warehouse 3043cad',
  'reserved-only active holds use `release`',
  'fulfilled cancellation rollback uses `cancel`',
  'approved returns use `return`',
  'partial failures are cleaned line-by-line',
  '[RESOLVED/NARROWED: target order state matrix for Orders normal cancellation is pending|confirmed|processing -> cancelled; shipped/delivered/cancelled fail closed through the normal endpoint]',
  '[RESOLVED/NARROWED: Orders source requires approvalType=human, named actor/approvedBy, safe Goal 24 reason code, optional sanitized approval.idempotencyKey, and sideEffectsHandled.payment|warehouse|notification|crm|channel=true before Warehouse cancel]',
  '[RESOLVED: runtime verification of Payments Orders service token/role for the current bridge mechanism]',
  '[RESOLVED/NARROWED: owner-approved Orders cancellation/refund correction packet shape is defined as route, targetOrderHash/state, actor/approvedBy, human approval, safe reason, sanitized idempotency key, all side-effect acknowledgements, provider evidence hash, Warehouse decision, and redaction acceptance]',
  '[MISSING: named runtime Orders cancellation actor/approvedBy and exact target order hash/state for the paid/provider packet]',
  '[MISSING: owner-approved payment/warehouse/notification/crm/channel sideEffectsHandled acknowledgements for the selected central order hash]',
  '[MISSING: approved runtime route invocation evidence; do not call the route until all packet fields are present]',
]) {
  requireIncludes(report, required, 'readiness report blocker/evidence');
}

console.log('goal24 paid/provider bundle readiness verification ok');
