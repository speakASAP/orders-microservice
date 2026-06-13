export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type ItemFulfillmentStatus = 'pending' | 'reserved' | 'shipped' | 'delivered';
export type CancellationSideEffectKey = 'payment' | 'warehouse' | 'notification' | 'crm' | 'channel';

export interface OrderItemFulfillmentSnapshot {
  fulfillmentStatus?: string;
}

export interface OrderStatusApprovalInput {
  approved?: boolean;
  approvalType?: string;
  approvedBy?: string;
  reasonCode?: string;
  sideEffectsHandled?: Partial<Record<CancellationSideEffectKey, boolean>>;
}

export interface OrderStatusActorContext {
  sub?: string;
  email?: string;
}

export interface OrderStatusTransitionContext {
  approval?: OrderStatusApprovalInput;
  actor?: OrderStatusActorContext;
  now?: Date;
}

export interface OrderStatusApprovalAudit {
  approved: true;
  approvalType: 'human';
  approvedBy: string;
  actorId?: string;
  actorEmail?: string;
  reasonCode: string;
  sideEffectsHandled: Record<CancellationSideEffectKey, true>;
  previousStatus: OrderStatus;
  requestedStatus: OrderStatus;
  resultingStatus: OrderStatus;
  approvedAt: string;
}

export interface OrderStatusTransitionResult {
  status: OrderStatus;
  approvalAudit?: OrderStatusApprovalAudit;
}

const ORDER_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const ITEM_FULFILLMENT_STATUSES: ItemFulfillmentStatus[] = ['pending', 'reserved', 'shipped', 'delivered'];
const CANCELLATION_SOURCES: OrderStatus[] = ['pending', 'confirmed', 'processing'];
const REFUND_LIKE_ORDER_STATUSES = new Set(['refund', 'refunded', 'refund_pending', 'partially_refunded', 'returned', 'return_pending']);
const REFUND_LIKE_ITEM_STATUSES = new Set(['cancelled', 'refund', 'refunded', 'returned', 'return_pending']);
const REQUIRED_CANCELLATION_SIDE_EFFECTS: CancellationSideEffectKey[] = ['payment', 'warehouse', 'notification', 'crm', 'channel'];
const SAFE_REASON_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{2,79}$/;

const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed'],
  confirmed: ['processing'],
  processing: ['shipped'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

const ITEM_FULFILLMENT_TRANSITIONS: Record<ItemFulfillmentStatus, ItemFulfillmentStatus[]> = {
  pending: ['reserved'],
  reserved: ['shipped'],
  shipped: ['delivered'],
  delivered: [],
};

const ITEM_FULFILLMENT_RANK: Record<ItemFulfillmentStatus, number> = {
  pending: 0,
  reserved: 1,
  shipped: 2,
  delivered: 3,
};

export function normalizeOrderStatus(status: string): OrderStatus | null {
  if (!status) return null;
  const normalized = status.trim().toLowerCase();
  return ORDER_STATUSES.includes(normalized as OrderStatus) ? (normalized as OrderStatus) : null;
}

export function normalizeItemFulfillmentStatus(status: string): ItemFulfillmentStatus | null {
  if (!status) return null;
  const normalized = status.trim().toLowerCase();
  return ITEM_FULFILLMENT_STATUSES.includes(normalized as ItemFulfillmentStatus)
    ? (normalized as ItemFulfillmentStatus)
    : null;
}

export function validateOrderStatusTransition(
  currentStatus: string,
  requestedStatus: string,
  items: OrderItemFulfillmentSnapshot[] = [],
  context: OrderStatusTransitionContext = {},
): OrderStatus {
  return validateOrderStatusTransitionWithAudit(currentStatus, requestedStatus, items, context).status;
}

export function validateOrderStatusTransitionWithAudit(
  currentStatus: string,
  requestedStatus: string,
  items: OrderItemFulfillmentSnapshot[] = [],
  context: OrderStatusTransitionContext = {},
): OrderStatusTransitionResult {
  const current = normalizeOrderStatus(currentStatus);
  const requested = normalizeOrderStatus(requestedStatus);
  const normalizedRequested = requestedStatus ? requestedStatus.trim().toLowerCase() : '';

  if (!requested) {
    if (REFUND_LIKE_ORDER_STATUSES.has(normalizedRequested)) {
      throw new Error('Refund-like order transitions are Payments-owned and require a separate owner-approved workflow');
    }
    throw new Error(`Unrecognized order status: ${requestedStatus}`);
  }

  if (!current) {
    throw new Error(`Current order status is unrecognized: ${currentStatus}`);
  }

  if (requested === current) {
    return { status: requested };
  }

  if (current === 'delivered' || current === 'cancelled') {
    throw new Error('Destructive terminal-state corrections require a separate owner-approved correction workflow');
  }

  if (requested === 'cancelled') {
    if (!CANCELLATION_SOURCES.includes(current)) {
      throw new Error(`Invalid order status transition: ${current} -> ${requested}`);
    }

    return {
      status: requested,
      approvalAudit: validateCancellationApproval(current, requested, context),
    };
  }

  const allowedTargets = ORDER_TRANSITIONS[current];
  if (!allowedTargets.includes(requested)) {
    throw new Error(`Invalid order status transition: ${current} -> ${requested}`);
  }

  if (requested === 'shipped') {
    validateItemsAtLeastShipped(items);
  }

  if (requested === 'delivered') {
    validateItemsDelivered(items);
  }

  return { status: requested };
}

export function validateItemFulfillmentTransition(
  currentStatus: string,
  requestedStatus: string,
): ItemFulfillmentStatus {
  const current = normalizeItemFulfillmentStatus(currentStatus);
  const requested = normalizeItemFulfillmentStatus(requestedStatus);
  const normalizedRequested = requestedStatus ? requestedStatus.trim().toLowerCase() : '';

  if (!requested) {
    if (REFUND_LIKE_ITEM_STATUSES.has(normalizedRequested)) {
      throw new Error('Synthetic item cancellation, refund, or return statuses require an owner-approved schema and API workflow');
    }
    throw new Error(`Unrecognized item fulfillment status: ${requestedStatus}`);
  }

  if (!current) {
    throw new Error(`Current item fulfillment status is unrecognized: ${currentStatus}`);
  }

  if (requested === current) {
    return requested;
  }

  if (current === 'delivered') {
    throw new Error(`Item fulfillment status ${current} is terminal and cannot transition to ${requested}`);
  }

  const allowedTargets = ITEM_FULFILLMENT_TRANSITIONS[current];
  if (!allowedTargets.includes(requested)) {
    throw new Error(`Invalid item fulfillment transition: ${current} -> ${requested}`);
  }

  return requested;
}

function validateCancellationApproval(
  current: OrderStatus,
  requested: OrderStatus,
  context: OrderStatusTransitionContext,
): OrderStatusApprovalAudit {
  const approval = context.approval;
  if (!approval || approval.approved !== true) {
    throw new Error('Order cancellation requires approval.approved=true');
  }

  if (approval.approvalType !== 'human') {
    throw new Error('Order cancellation requires approval.approvalType=human');
  }

  const actorId = sanitizeActorValue(context.actor?.sub);
  const actorEmail = sanitizeActorValue(context.actor?.email);
  const approvedBy = sanitizeActorValue(actorEmail || actorId || approval.approvedBy);
  if (!approvedBy) {
    throw new Error('Order cancellation requires an Auth actor identity or approval.approvedBy');
  }

  const reasonCode = normalizeReasonCode(approval.reasonCode);
  const sideEffectsHandled = validateCancellationSideEffects(approval.sideEffectsHandled);
  const approvedAt = (context.now || new Date()).toISOString();

  return {
    approved: true,
    approvalType: 'human',
    approvedBy,
    actorId,
    actorEmail,
    reasonCode,
    sideEffectsHandled,
    previousStatus: current,
    requestedStatus: requested,
    resultingStatus: requested,
    approvedAt,
  };
}

function normalizeReasonCode(reasonCode?: string): string {
  if (!reasonCode) {
    throw new Error('Order cancellation requires approval.reasonCode');
  }

  const normalized = reasonCode.trim().toUpperCase();
  if (!SAFE_REASON_CODE_PATTERN.test(normalized)) {
    throw new Error('Order cancellation approval.reasonCode must be 3-80 safe uppercase letters, numbers, underscores, or hyphens');
  }

  return normalized;
}

function sanitizeActorValue(value?: string): string | undefined {
  if (!value) return undefined;
  const sanitized = value.trim();
  if (!sanitized || sanitized.length > 200 || /[\r\n\t]/.test(sanitized) || /bearer\s+/i.test(sanitized)) {
    return undefined;
  }
  return sanitized;
}

function validateCancellationSideEffects(
  sideEffects?: Partial<Record<CancellationSideEffectKey, boolean>>,
): Record<CancellationSideEffectKey, true> {
  const missing = REQUIRED_CANCELLATION_SIDE_EFFECTS.filter((key) => sideEffects?.[key] !== true);
  if (missing.length) {
    throw new Error(`Order cancellation requires side-effect acknowledgements for: ${missing.join(', ')}`);
  }

  return {
    payment: true,
    warehouse: true,
    notification: true,
    crm: true,
    channel: true,
  };
}

function validateItemsAtLeastShipped(items: OrderItemFulfillmentSnapshot[]): void {
  const blockingItem = items.find((item) => {
    const status = normalizeItemFulfillmentStatus(item.fulfillmentStatus || '');
    return !status || ITEM_FULFILLMENT_RANK[status] < ITEM_FULFILLMENT_RANK.shipped;
  });

  if (blockingItem) {
    throw new Error('Order cannot transition to shipped until every item is shipped or delivered');
  }
}

function validateItemsDelivered(items: OrderItemFulfillmentSnapshot[]): void {
  const blockingItem = items.find((item) => normalizeItemFulfillmentStatus(item.fulfillmentStatus || '') !== 'delivered');

  if (blockingItem) {
    throw new Error('Order cannot transition to delivered until every item is delivered');
  }
}
