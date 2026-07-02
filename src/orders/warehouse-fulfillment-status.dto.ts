import { BadRequestException } from '@nestjs/common';

export const WAREHOUSE_FULFILLMENT_STATUSES = [
  'requested',
  'collecting',
  'forming',
  'formed',
  'handed_to_delivery',
  'in_delivery',
  'delivered',
  'not_delivered',
  'cancelled',
  'returned',
] as const;

export type WarehouseFulfillmentStatus = typeof WAREHOUSE_FULFILLMENT_STATUSES[number];

export interface WarehouseFulfillmentStatusUpdateRequestDto {
  status: WarehouseFulfillmentStatus;
  reasonCode?: string;
  actor?: string;
  reference?: string;
  fulfillmentOrderId?: string;
  occurredAt?: string;
}

const STATUS_SET = new Set<string>(WAREHOUSE_FULFILLMENT_STATUSES);

export function normalizeWarehouseFulfillmentStatusUpdate(
  input: WarehouseFulfillmentStatusUpdateRequestDto,
): Required<Pick<WarehouseFulfillmentStatusUpdateRequestDto, 'status'>> & Omit<WarehouseFulfillmentStatusUpdateRequestDto, 'status'> {
  if (!input || typeof input !== 'object') {
    throw new BadRequestException('Warehouse fulfillment status payload is required');
  }
  const status = normalizeStatus(input.status);
  return {
    status,
    reasonCode: normalizeOptionalString(input.reasonCode, 'reasonCode'),
    actor: normalizeOptionalString(input.actor, 'actor'),
    reference: normalizeOptionalString(input.reference, 'reference'),
    fulfillmentOrderId: normalizeOptionalString(input.fulfillmentOrderId, 'fulfillmentOrderId'),
    occurredAt: normalizeOptionalTimestamp(input.occurredAt),
  };
}

function normalizeStatus(value: unknown): WarehouseFulfillmentStatus {
  if (typeof value !== 'string') {
    throw new BadRequestException('status is required');
  }
  const normalized = value.trim().toLowerCase();
  if (!STATUS_SET.has(normalized)) {
    throw new BadRequestException(`Unsupported warehouse fulfillment status: ${value}`);
  }
  return normalized as WarehouseFulfillmentStatus;
}

function normalizeOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') {
    throw new BadRequestException(`${field} must be a string`);
  }
  const normalized = value.trim();
  if (!normalized) return undefined;
  if (normalized.length > 200 || /[\r\n\t]/.test(normalized)) {
    throw new BadRequestException(`${field} is invalid`);
  }
  return normalized;
}

function normalizeOptionalTimestamp(value: unknown): string | undefined {
  const normalized = normalizeOptionalString(value, 'occurredAt');
  if (!normalized) return undefined;
  if (Number.isNaN(Date.parse(normalized))) {
    throw new BadRequestException('occurredAt must be an ISO timestamp');
  }
  return new Date(normalized).toISOString();
}
