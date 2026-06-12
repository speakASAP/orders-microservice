export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type ItemFulfillmentStatus = 'pending' | 'reserved' | 'shipped' | 'delivered';

export interface OrderItemFulfillmentSnapshot {
  fulfillmentStatus?: string;
}

const ORDER_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const ITEM_FULFILLMENT_STATUSES: ItemFulfillmentStatus[] = ['pending', 'reserved', 'shipped', 'delivered'];

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
): OrderStatus {
  const current = normalizeOrderStatus(currentStatus);
  const requested = normalizeOrderStatus(requestedStatus);

  if (!requested) {
    throw new Error(`Unrecognized order status: ${requestedStatus}`);
  }

  if (!current) {
    throw new Error(`Current order status is unrecognized: ${currentStatus}`);
  }

  if (requested === current) {
    return requested;
  }

  if (requested === 'cancelled') {
    throw new Error('Order cancellation requires explicit owner approval and is not supported by this endpoint yet');
  }

  if (current === 'delivered' || current === 'cancelled') {
    throw new Error(`Order status ${current} is terminal and cannot transition to ${requested}`);
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

  return requested;
}

export function validateItemFulfillmentTransition(
  currentStatus: string,
  requestedStatus: string,
): ItemFulfillmentStatus {
  const current = normalizeItemFulfillmentStatus(currentStatus);
  const requested = normalizeItemFulfillmentStatus(requestedStatus);

  if (!requested) {
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
