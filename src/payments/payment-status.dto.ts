import { BadRequestException } from '@nestjs/common';

export const PAYMENT_STATUS_CONTRACT_VERSION = 'orders.payment-status.v1';

export type OrdersPaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled';
export type PaymentsOwnedStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface PaymentStatusUpdateRequestDto {
  contractVersion?: string;
  paymentId: string;
  status: string;
  applicationId?: string;
  paymentMethod?: string;
  occurredAt?: string;
}

export interface NormalizedPaymentStatusUpdate {
  paymentReferenceId: string;
  paymentStatus: OrdersPaymentStatus;
  paymentApplicationId?: string;
  paymentMethod?: string;
  paymentUpdatedAt: Date;
}

const ALLOWED_PAYMENT_STATUS_KEYS = new Set([
  'contractVersion',
  'paymentId',
  'status',
  'applicationId',
  'paymentMethod',
  'occurredAt',
]);

const PAYMENT_STATUS_MAP: Record<PaymentsOwnedStatus, OrdersPaymentStatus> = {
  pending: 'pending',
  processing: 'processing',
  completed: 'paid',
  failed: 'failed',
  cancelled: 'cancelled',
};

const FORBIDDEN_PAYMENT_FIELDS = [
  'providerTransactionId',
  'variableSymbol',
  'providerResponse',
  'metadata',
  'refund',
  'refundId',
  'refundedAt',
  'amount',
  'currency',
  'customer',
  'card',
  'token',
  'secret',
];

export function normalizePaymentStatusUpdate(input: PaymentStatusUpdateRequestDto): NormalizedPaymentStatusUpdate {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new BadRequestException('Payment status request body must be an object');
  }

  const keys = Object.keys(input);
  const unknownKeys = keys.filter((key) => !ALLOWED_PAYMENT_STATUS_KEYS.has(key));
  if (unknownKeys.length) {
    throw new BadRequestException(`Unsupported payment status fields: ${unknownKeys.join(', ')}`);
  }

  const forbiddenKey = keys.find((key) => FORBIDDEN_PAYMENT_FIELDS.includes(key));
  if (forbiddenKey) {
    throw new BadRequestException(`Payments-owned field is not accepted by Orders: ${forbiddenKey}`);
  }

  if (input.contractVersion && input.contractVersion !== PAYMENT_STATUS_CONTRACT_VERSION) {
    throw new BadRequestException(`Unsupported payment status contractVersion: ${input.contractVersion}`);
  }

  const paymentStatus = normalizePaymentStatus(input.status);
  const paymentUpdatedAt = normalizeOccurredAt(input.occurredAt);

  return {
    paymentReferenceId: normalizeBoundedString(input.paymentId, 'paymentId', 200),
    paymentStatus,
    paymentApplicationId: normalizeOptionalBoundedString(input.applicationId, 100),
    paymentMethod: normalizeOptionalBoundedString(input.paymentMethod, 100),
    paymentUpdatedAt,
  };
}

function normalizePaymentStatus(status: string): OrdersPaymentStatus {
  const normalized = normalizeBoundedString(status, 'status', 50).toLowerCase();
  if (normalized === 'refunded' || normalized === 'refund' || normalized === 'partially_refunded') {
    throw new BadRequestException('Refund status is Payments-owned and is not accepted by Orders');
  }
  if (!Object.prototype.hasOwnProperty.call(PAYMENT_STATUS_MAP, normalized)) {
    throw new BadRequestException(`Unsupported payment status: ${status}`);
  }
  return PAYMENT_STATUS_MAP[normalized as PaymentsOwnedStatus];
}

function normalizeOccurredAt(value?: string): Date {
  if (!value) return new Date();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    throw new BadRequestException('occurredAt must be a valid ISO timestamp');
  }
  return parsed;
}

function normalizeBoundedString(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestException(`${field} is required`);
  }
  const normalized = value.trim();
  if (normalized.length > maxLength || /[\r\n\t]/.test(normalized)) {
    throw new BadRequestException(`${field} is invalid`);
  }
  return normalized;
}

function normalizeOptionalBoundedString(value: unknown, maxLength: number): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  if (!normalized) return undefined;
  if (normalized.length > maxLength || /[\r\n\t]/.test(normalized)) return undefined;
  return normalized;
}
