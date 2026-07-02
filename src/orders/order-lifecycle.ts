import { BadRequestException } from '@nestjs/common';
import { OrderItem } from '../items/order-item.entity';
import { WarehouseHandoffSummary } from '../warehouse/warehouse-reservation.client';
import { Order } from './order.entity';

export const ORDER_LIFECYCLE_STAGES = [
  'ordered_unpaid',
  'payment_failed',
  'paid_not_delivered',
  'warehouse_fulfillment_requested',
  'warehouse_collecting',
  'warehouse_forming',
  'warehouse_formed',
  'handed_to_delivery',
  'in_delivery',
  'received',
  'not_received',
  'returned',
  'cancelled',
] as const;

export type OrderLifecycleStage = typeof ORDER_LIFECYCLE_STAGES[number];
export type OrderLifecycleTransitionMode = 'strict' | 'coarse_projection';

export interface OrderLifecycleTransitionOptions {
  mode?: OrderLifecycleTransitionMode;
}

export interface OrderLifecycleState {
  lifecycleStage: OrderLifecycleStage;
  status: string;
  statusProjection: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  deliveryStatus: string;
  exceptionState: string | null;
}

export interface OrderLifecycleReadFilters {
  channel?: string;
  status?: string;
  lifecycleStage?: string;
  paymentStatus?: string;
  from?: string;
  to?: string;
  limit?: string;
}

export interface NormalizedOrderLifecycleReadFilters {
  channel?: string;
  status?: string;
  lifecycleStage?: OrderLifecycleStage;
  paymentStatus?: string;
  from?: Date;
  to?: Date;
  limit: number;
}

export interface OrderLifecycleEventItemSnapshot {
  productId: string;
  sku?: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
}

export interface OrderLifecycleChangedPayload {
  eventId?: string;
  occurredAt?: string;
  orderId: string;
  orderNumber: string;
  channel: string;
  channelAccountId: string | null;
  externalOrderId: string | null;
  previousLifecycleStage: OrderLifecycleStage | null;
  lifecycleStage: OrderLifecycleStage;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  deliveryStatus: string;
  total: number;
  currency: string;
  items: OrderLifecycleEventItemSnapshot[];
  warehouseHandoff: WarehouseHandoffSummary | null;
}

type OrderLifecycleTimelineEntry = {
  lifecycleStage: OrderLifecycleStage;
  status: string;
  occurredAt: string | null;
  source: string;
};

type OrderLifecycleReadModelOptions = {
  includeCustomer?: boolean;
  includeDeliveryAddress?: boolean;
  includeWarehouseHandoff?: boolean;
};

const STRICT_LIFECYCLE_TRANSITIONS: Record<OrderLifecycleStage, OrderLifecycleStage[]> = {
  ordered_unpaid: ['paid_not_delivered', 'payment_failed', 'cancelled'],
  payment_failed: [],
  paid_not_delivered: ['warehouse_fulfillment_requested', 'cancelled'],
  warehouse_fulfillment_requested: ['warehouse_collecting'],
  warehouse_collecting: ['warehouse_forming'],
  warehouse_forming: ['warehouse_formed'],
  warehouse_formed: ['handed_to_delivery'],
  handed_to_delivery: ['in_delivery'],
  in_delivery: ['received', 'not_received'],
  received: ['returned'],
  not_received: ['returned'],
  returned: [],
  cancelled: [],
};

const COARSE_PROJECTION_EXTRA_TRANSITIONS: Partial<Record<OrderLifecycleStage, OrderLifecycleStage[]>> = {
  ordered_unpaid: ['warehouse_fulfillment_requested'],
  warehouse_fulfillment_requested: ['handed_to_delivery', 'cancelled'],
  warehouse_collecting: ['handed_to_delivery', 'cancelled'],
  handed_to_delivery: ['received'],
};

const ORDER_LIFECYCLE_STAGE_SET = new Set<string>(ORDER_LIFECYCLE_STAGES);
const TERMINAL_ORDER_STATUSES = new Set(['cancelled', 'delivered']);
const FAILED_PAYMENT_STATUSES = new Set(['failed', 'cancelled']);

export function normalizeOrderLifecycleStage(stage: string | undefined, field = 'lifecycleStage'): OrderLifecycleStage | undefined {
  if (!stage) return undefined;
  const normalized = stage.trim().toLowerCase();
  if (!ORDER_LIFECYCLE_STAGE_SET.has(normalized)) {
    throw new BadRequestException(`Unsupported ${field}: ${stage}`);
  }
  return normalized as OrderLifecycleStage;
}

export function normalizeOrderLifecycleReadFilters(
  filters: OrderLifecycleReadFilters = {},
): NormalizedOrderLifecycleReadFilters {
  const from = normalizeOptionalDate(filters.from, 'from');
  const to = normalizeOptionalDate(filters.to, 'to');
  if (from && to && from.getTime() > to.getTime()) {
    throw new BadRequestException('from must be before or equal to to');
  }

  return {
    channel: normalizeOptionalKey(filters.channel),
    status: normalizeOptionalKey(filters.status),
    lifecycleStage: normalizeOrderLifecycleStage(filters.lifecycleStage),
    paymentStatus: normalizeOptionalKey(filters.paymentStatus),
    from,
    to,
    limit: normalizeLimit(filters.limit),
  };
}

export function validateOrderLifecycleTransition(
  previousLifecycleStage: OrderLifecycleStage | null,
  lifecycleStage: OrderLifecycleStage,
  options: OrderLifecycleTransitionOptions = {},
): OrderLifecycleStage {
  if (!previousLifecycleStage || previousLifecycleStage === lifecycleStage) {
    return lifecycleStage;
  }

  const allowedTargets = new Set(STRICT_LIFECYCLE_TRANSITIONS[previousLifecycleStage] || []);
  if (options.mode === 'coarse_projection') {
    for (const target of COARSE_PROJECTION_EXTRA_TRANSITIONS[previousLifecycleStage] || []) {
      allowedTargets.add(target);
    }
  }

  if (!allowedTargets.has(lifecycleStage)) {
    throw new BadRequestException(`Invalid order lifecycle transition: ${previousLifecycleStage} -> ${lifecycleStage}`);
  }

  return lifecycleStage;
}

export function isOrderLifecycleTransitionAllowed(
  previousLifecycleStage: OrderLifecycleStage | null,
  lifecycleStage: OrderLifecycleStage,
  options: OrderLifecycleTransitionOptions = {},
): boolean {
  try {
    validateOrderLifecycleTransition(previousLifecycleStage, lifecycleStage, options);
    return true;
  } catch {
    return false;
  }
}

export function deriveOrderLifecycleState(order: Order): OrderLifecycleState {
  const status = normalizeStoredStatus(order.status, 'pending');
  const paymentStatus = normalizeStoredStatus(order.paymentStatus, 'unpaid');
  const warehouseStatus = normalizeStoredStatus(order.warehouseHandoff?.status, 'not_requested');
  const itemStatuses = normalizeItemStatuses(order.items || []);
  const allItemsShipped = itemStatuses.length > 0 && itemStatuses.every((value) => value === 'shipped' || value === 'delivered');
  const allItemsDelivered = itemStatuses.length > 0 && itemStatuses.every((value) => value === 'delivered');

  let lifecycleStage: OrderLifecycleStage = 'ordered_unpaid';
  if (status === 'cancelled' || warehouseStatus === 'cancelled') {
    lifecycleStage = 'cancelled';
  } else if (warehouseStatus === 'returned') {
    lifecycleStage = 'returned';
  } else if (status === 'delivered' || allItemsDelivered) {
    lifecycleStage = 'received';
  } else if (status === 'shipped' || allItemsShipped) {
    lifecycleStage = 'handed_to_delivery';
  } else if (FAILED_PAYMENT_STATUSES.has(paymentStatus) && !TERMINAL_ORDER_STATUSES.has(status)) {
    lifecycleStage = 'payment_failed';
  } else if (paymentStatus === 'paid') {
    if (status === 'processing') {
      lifecycleStage = 'warehouse_collecting';
    } else if (warehouseStatus === 'fulfilled') {
      lifecycleStage = 'warehouse_fulfillment_requested';
    } else {
      lifecycleStage = 'paid_not_delivered';
    }
  }

  return {
    lifecycleStage,
    status,
    statusProjection: projectLifecycleStageToStatus(lifecycleStage),
    paymentStatus,
    fulfillmentStatus: deriveFulfillmentStatus(lifecycleStage, warehouseStatus, itemStatuses),
    deliveryStatus: deriveDeliveryStatus(lifecycleStage),
    exceptionState: deriveExceptionState(lifecycleStage, warehouseStatus),
  };
}

export function projectLifecycleStageToStatus(stage: OrderLifecycleStage): string {
  if (stage === 'ordered_unpaid') return 'pending';
  if (stage === 'paid_not_delivered' || stage === 'warehouse_fulfillment_requested') return 'confirmed';
  if (stage === 'warehouse_collecting' || stage === 'warehouse_forming' || stage === 'warehouse_formed') return 'processing';
  if (stage === 'handed_to_delivery' || stage === 'in_delivery' || stage === 'not_received') return 'shipped';
  if (stage === 'received') return 'delivered';
  return 'cancelled';
}

export function getOrderNumber(order: Order): string {
  return normalizeOptionalString(order.externalOrderId) || order.id;
}

export function buildOrderLifecycleChangedPayload(
  order: Order,
  previousLifecycleStage: OrderLifecycleStage | null,
): OrderLifecycleChangedPayload {
  const state = deriveOrderLifecycleState(order);
  return {
    orderId: order.id,
    orderNumber: getOrderNumber(order),
    channel: normalizeStoredStatus(order.channel, 'unknown'),
    channelAccountId: normalizeOptionalString(order.channelAccountId) || null,
    externalOrderId: normalizeOptionalString(order.externalOrderId) || null,
    previousLifecycleStage,
    lifecycleStage: state.lifecycleStage,
    status: state.status,
    paymentStatus: state.paymentStatus,
    fulfillmentStatus: state.fulfillmentStatus,
    deliveryStatus: state.deliveryStatus,
    total: toNumber(order.total),
    currency: normalizeStoredStatus(order.currency, 'CZK').toUpperCase(),
    items: buildLifecycleItemSnapshots(order.items || []),
    warehouseHandoff: sanitizeWarehouseHandoff(order.warehouseHandoff),
  };
}

export function serializeOrderLifecycleReadModel(order: Order, options: OrderLifecycleReadModelOptions = {}) {
  const state = deriveOrderLifecycleState(order);
  return {
    id: order.id,
    orderNumber: getOrderNumber(order),
    channel: normalizeStoredStatus(order.channel, 'unknown'),
    channelAccountId: normalizeOptionalString(order.channelAccountId) || null,
    externalOrderId: normalizeOptionalString(order.externalOrderId) || null,
    lifecycle: state,
    status: order.status,
    paymentStatus: order.paymentStatus || null,
    totals: {
      subtotal: toNumber(order.subtotal),
      shippingCost: toNumber(order.shippingCost),
      taxAmount: toNumber(order.taxAmount),
      total: toNumber(order.total),
      currency: normalizeStoredStatus(order.currency, 'CZK').toUpperCase(),
    },
    shipping: {
      method: order.shippingMethod || null,
      deliveryAddress: options.includeDeliveryAddress ? sanitizeAddress(order.shippingAddress) : undefined,
    },
    customer: options.includeCustomer ? sanitizeCustomer(order.customer) : undefined,
    items: (order.items || []).map((item) => ({
      id: item.id,
      productId: item.productId,
      sku: item.sku || null,
      title: item.title,
      quantity: toNumber(item.quantity),
      unitPrice: toNumber(item.unitPrice),
      totalPrice: toNumber(item.totalPrice),
      fulfillmentStatus: item.fulfillmentStatus,
      warehouseId: item.warehouseId || null,
    })),
    warehouseHandoff: options.includeWarehouseHandoff ? sanitizeWarehouseHandoff(order.warehouseHandoff) : undefined,
    timeline: buildLifecycleTimeline(order, state),
    createdAt: toIso(order.createdAt),
    updatedAt: toIso(order.updatedAt),
    orderedAt: toIso(order.orderedAt),
  };
}

export function buildLifecycleAggregates(models: ReturnType<typeof serializeOrderLifecycleReadModel>[]) {
  return {
    totalOrders: models.length,
    byLifecycleStage: countBy(models, (model) => model.lifecycle.lifecycleStage),
    byPaymentStatus: countBy(models, (model) => model.lifecycle.paymentStatus),
    byChannel: countBy(models, (model) => model.channel),
    byDeliveryStatus: countBy(models, (model) => model.lifecycle.deliveryStatus),
    exceptionCounts: {
      paymentFailed: models.filter((model) => model.lifecycle.lifecycleStage === 'payment_failed').length,
      notReceived: models.filter((model) => model.lifecycle.lifecycleStage === 'not_received').length,
      returned: models.filter((model) => model.lifecycle.lifecycleStage === 'returned').length,
      cancelled: models.filter((model) => model.lifecycle.lifecycleStage === 'cancelled').length,
    },
    totalsByCurrency: buildTotalsByCurrency(models),
  };
}

function buildLifecycleTimeline(order: Order, state: OrderLifecycleState): OrderLifecycleTimelineEntry[] {
  const entries: OrderLifecycleTimelineEntry[] = [
    {
      lifecycleStage: 'ordered_unpaid',
      status: 'pending',
      occurredAt: toIso(order.orderedAt) || toIso(order.createdAt),
      source: 'orders.create.v1',
    },
  ];

  if (order.paymentStatus === 'paid') {
    entries.push({
      lifecycleStage: 'paid_not_delivered',
      status: 'confirmed',
      occurredAt: toIso(order.paymentUpdatedAt) || toIso(order.updatedAt),
      source: 'orders.payment-status.v1',
    });
  }

  if (order.warehouseHandoff?.status === 'fulfilled') {
    entries.push({
      lifecycleStage: 'warehouse_fulfillment_requested',
      status: 'confirmed',
      occurredAt: toIso((order.warehouseHandoff as unknown as Record<string, unknown>).completedAt) || toIso(order.updatedAt),
      source: 'warehouse.fulfill',
    });
  }

  if (!entries.some((entry) => entry.lifecycleStage === state.lifecycleStage)) {
    entries.push({
      lifecycleStage: state.lifecycleStage,
      status: state.status,
      occurredAt: toIso(order.updatedAt),
      source: 'orders.lifecycle.derived',
    });
  }

  return entries;
}

function deriveFulfillmentStatus(stage: OrderLifecycleStage, warehouseStatus: string, itemStatuses: string[]): string {
  if (stage === 'warehouse_fulfillment_requested') return 'fulfillment_requested';
  if (stage === 'warehouse_collecting') return 'collecting';
  if (stage === 'warehouse_forming') return 'forming';
  if (stage === 'warehouse_formed') return 'formed';
  if (stage === 'handed_to_delivery' || stage === 'in_delivery' || stage === 'received') return 'fulfilled';
  if (stage === 'returned') return 'returned';
  if (stage === 'cancelled') return 'cancelled';
  if (warehouseStatus === 'reserved') return 'reserved_waiting_for_payment';
  if (itemStatuses.length && itemStatuses.every((value) => value === 'reserved')) return 'reserved_waiting_for_payment';
  return 'not_requested';
}

function deriveDeliveryStatus(stage: OrderLifecycleStage): string {
  if (stage === 'handed_to_delivery') return 'handed_to_delivery';
  if (stage === 'in_delivery') return 'in_delivery';
  if (stage === 'received') return 'received';
  if (stage === 'not_received') return 'not_received';
  if (stage === 'returned') return 'returned';
  return 'not_started';
}

function deriveExceptionState(stage: OrderLifecycleStage, warehouseStatus: string): string | null {
  if (stage === 'payment_failed') return 'payment_failed';
  if (stage === 'not_received') return 'delivery_not_received';
  if (stage === 'returned') return 'returned';
  if (stage === 'cancelled') return 'cancelled';
  if (warehouseStatus === 'failed') return 'warehouse_handoff_failed';
  return null;
}

function buildLifecycleItemSnapshots(items: OrderItem[]): OrderLifecycleEventItemSnapshot[] {
  return items
    .map((item) => ({
      productId: normalizeOptionalString(item.productId) || '',
      ...(item.sku ? { sku: item.sku } : {}),
      quantity: toNumber(item.quantity),
      unitPrice: toNumber(item.unitPrice),
      totalPrice: toNumber(item.totalPrice),
    }))
    .filter((item) => item.productId && item.quantity > 0);
}

function normalizeItemStatuses(items: OrderItem[]): string[] {
  return items.map((item) => normalizeStoredStatus(item.fulfillmentStatus, 'pending'));
}

function sanitizeAddress(address: Order['shippingAddress'] | undefined | null) {
  if (!address) return null;
  return {
    name: normalizeOptionalString(address.name) || null,
    street: normalizeOptionalString(address.street) || null,
    city: normalizeOptionalString(address.city) || null,
    postalCode: normalizeOptionalString(address.postalCode) || null,
    country: normalizeOptionalString(address.country) || null,
  };
}

function sanitizeCustomer(customer: Order['customer'] | undefined | null) {
  if (!customer) return null;
  return {
    name: normalizeOptionalString(customer.name) || null,
    email: normalizeOptionalString(customer.email) || null,
    phone: normalizeOptionalString(customer.phone) || null,
  };
}

function sanitizeWarehouseHandoff(handoff: WarehouseHandoffSummary | null | undefined): WarehouseHandoffSummary | null {
  if (!handoff || typeof handoff !== 'object') return null;
  return {
    ...handoff,
    status: handoff.status,
    failureCode: handoff.failureCode,
    skipReason: handoff.skipReason,
  };
}

function normalizeStoredStatus(value: unknown, fallback: string): string {
  const normalized = normalizeOptionalString(value)?.toLowerCase();
  return normalized || fallback;
}

function normalizeOptionalKey(value: string | undefined): string | undefined {
  return normalizeOptionalString(value)?.toLowerCase();
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function normalizeOptionalDate(value: string | undefined, field: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    throw new BadRequestException(`${field} must be a valid ISO timestamp`);
  }
  return date;
}

function normalizeLimit(value: string | undefined): number {
  if (!value) return 100;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 250) {
    throw new BadRequestException('limit must be an integer from 1 to 250');
  }
  return parsed;
}

function toNumber(value: unknown): number {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
}

function toIso(value: unknown): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

function countBy<T>(items: T[], selector: (item: T) => string): Record<string, number> {
  return items.reduce((acc, item) => {
    const key = selector(item) || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function buildTotalsByCurrency(models: ReturnType<typeof serializeOrderLifecycleReadModel>[]) {
  return models.reduce((acc, model) => {
    const currency = model.totals.currency || 'UNKNOWN';
    if (!acc[currency]) acc[currency] = { orderCount: 0, total: 0, shippingCost: 0, taxAmount: 0 };
    acc[currency].orderCount += 1;
    acc[currency].total = Math.round((acc[currency].total + model.totals.total) * 100) / 100;
    acc[currency].shippingCost = Math.round((acc[currency].shippingCost + model.totals.shippingCost) * 100) / 100;
    acc[currency].taxAmount = Math.round((acc[currency].taxAmount + model.totals.taxAmount) * 100) / 100;
    return acc;
  }, {} as Record<string, { orderCount: number; total: number; shippingCost: number; taxAmount: number }>);
}
