import { randomUUID } from 'crypto';
import { OrderStatusApprovalAudit } from './status-transitions';
import type { OrderLifecycleChangedPayload } from './order-lifecycle';

export const ORDER_EVENT_SOURCE = 'orders-microservice';
export const ORDER_EVENT_VERSION = 1;

export const ORDER_EVENT_TYPES = {
  created: 'orders.order.created.v1',
  updated: 'orders.order.updated.v1',
  paid: 'orders.order.paid.v1',
  shipped: 'orders.order.shipped.v1',
  cancelled: 'orders.order.cancelled.v1',
  lifecycleChanged: 'orders.order.lifecycle_changed.v1',
} as const;

export type OrderEventType = typeof ORDER_EVENT_TYPES[keyof typeof ORDER_EVENT_TYPES];

export interface OrderEventEnvelope<TPayload extends object> {
  type: OrderEventType;
  eventVersion: 1;
  eventId: string;
  occurredAt: string;
  source: typeof ORDER_EVENT_SOURCE;
  payload: TPayload;
}

export interface OrderLeadAttribution {
  leadId?: string;
  source?: string;
  campaignId?: string;
}

export interface OrderCreatedItemSnapshot {
  productId: string;
  sku?: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
}

interface OrderCreatedPayload {
  orderId: string;
  channel: string;
  items?: OrderCreatedItemSnapshot[];
  currency?: string;
  leadAttribution?: OrderLeadAttribution;
}

interface OrderUpdatedPayload {
  orderId: string;
  status: string;
  previousStatus?: string;
  approval?: SafeApprovalMetadata;
}

interface OrderPaidPayload {
  orderId: string;
  paymentStatus: 'paid';
  paymentReferenceId?: string;
}

interface OrderShippedPayload {
  orderId: string;
  shipmentStatus: 'shipped';
  shipmentLookupRequired: true;
}

interface OrderCancelledPayload {
  orderId: string;
  previousStatus?: string;
  approval?: SafeApprovalMetadata;
}

export interface SafeApprovalMetadata {
  approvalType: 'human';
  reasonCode: string;
  sideEffectsHandled: Record<string, true>;
  approvedAt: string;
}

function createEnvelope<TPayload extends object>(
  type: OrderEventType,
  payload: TPayload,
  occurredAt = new Date(),
): OrderEventEnvelope<TPayload> {
  return {
    type,
    eventVersion: ORDER_EVENT_VERSION,
    eventId: randomUUID(),
    occurredAt: occurredAt.toISOString(),
    source: ORDER_EVENT_SOURCE,
    payload,
  };
}

export function toSafeApprovalMetadata(approval?: OrderStatusApprovalAudit): SafeApprovalMetadata | undefined {
  if (!approval) return undefined;
  return {
    approvalType: approval.approvalType,
    reasonCode: approval.reasonCode,
    sideEffectsHandled: approval.sideEffectsHandled,
    approvedAt: approval.approvedAt,
  };
}

export function buildOrderCreatedEvent(
  orderId: string,
  channel: string,
  leadAttribution?: OrderLeadAttribution,
  items?: OrderCreatedItemSnapshot[],
  currency?: string,
): OrderEventEnvelope<OrderCreatedPayload> {
  const safeItems = normalizeCreatedItemSnapshots(items);
  return createEnvelope(ORDER_EVENT_TYPES.created, {
    orderId,
    channel,
    ...(safeItems.length ? { items: safeItems } : {}),
    ...(currency ? { currency } : {}),
    ...(leadAttribution ? { leadAttribution } : {}),
  });
}

function normalizeCreatedItemSnapshots(items?: OrderCreatedItemSnapshot[]): OrderCreatedItemSnapshot[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      productId: String(item.productId || '').trim(),
      ...(item.sku ? { sku: String(item.sku).trim() } : {}),
      quantity: Number(item.quantity),
      ...(item.unitPrice != null ? { unitPrice: Number(item.unitPrice) } : {}),
      ...(item.totalPrice != null ? { totalPrice: Number(item.totalPrice) } : {}),
    }))
    .filter((item) => item.productId && Number.isFinite(item.quantity) && item.quantity > 0);
}

export function buildOrderUpdatedEvent(
  orderId: string,
  status: string,
  previousStatus?: string,
  approval?: OrderStatusApprovalAudit,
): OrderEventEnvelope<OrderUpdatedPayload> {
  return createEnvelope(ORDER_EVENT_TYPES.updated, {
    orderId,
    status,
    ...(previousStatus ? { previousStatus } : {}),
    ...(approval ? { approval: toSafeApprovalMetadata(approval) } : {}),
  });
}

export function buildOrderPaidEvent(
  orderId: string,
  paymentReferenceId?: string,
): OrderEventEnvelope<OrderPaidPayload> {
  return createEnvelope(ORDER_EVENT_TYPES.paid, {
    orderId,
    paymentStatus: 'paid',
    ...(paymentReferenceId ? { paymentReferenceId } : {}),
  });
}

export function buildOrderShippedEvent(orderId: string): OrderEventEnvelope<OrderShippedPayload> {
  return createEnvelope(ORDER_EVENT_TYPES.shipped, {
    orderId,
    shipmentStatus: 'shipped',
    shipmentLookupRequired: true,
  });
}

export function buildOrderCancelledEvent(
  orderId: string,
  previousStatus?: string,
  approval?: OrderStatusApprovalAudit,
): OrderEventEnvelope<OrderCancelledPayload> {
  return createEnvelope(ORDER_EVENT_TYPES.cancelled, {
    orderId,
    ...(previousStatus ? { previousStatus } : {}),
    ...(approval ? { approval: toSafeApprovalMetadata(approval) } : {}),
  });
}


export function buildOrderLifecycleChangedEvent(
  payload: Omit<OrderLifecycleChangedPayload, 'eventId' | 'occurredAt'>,
): OrderEventEnvelope<OrderLifecycleChangedPayload> {
  const envelope = createEnvelope(ORDER_EVENT_TYPES.lifecycleChanged, payload as OrderLifecycleChangedPayload);
  envelope.payload.eventId = envelope.eventId;
  envelope.payload.occurredAt = envelope.occurredAt;
  return envelope;
}
