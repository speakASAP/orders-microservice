import { randomUUID } from 'crypto';
import { OrderStatusApprovalAudit } from './status-transitions';

export const ORDER_EVENT_SOURCE = 'orders-microservice';
export const ORDER_EVENT_VERSION = 1;

export const ORDER_EVENT_TYPES = {
  created: 'orders.order.created.v1',
  updated: 'orders.order.updated.v1',
  paid: 'orders.order.paid.v1',
  shipped: 'orders.order.shipped.v1',
  cancelled: 'orders.order.cancelled.v1',
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

interface OrderCreatedPayload {
  orderId: string;
  channel: string;
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

export function buildOrderCreatedEvent(orderId: string, channel: string): OrderEventEnvelope<OrderCreatedPayload> {
  return createEnvelope(ORDER_EVENT_TYPES.created, { orderId, channel });
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
