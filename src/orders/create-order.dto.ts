import { BadRequestException } from '@nestjs/common';
import { Order } from './order.entity';
import { OrderItem } from '../items/order-item.entity';

export const CREATE_ORDER_CONTRACT_VERSION = 'orders.create.v1';

export interface CreateOrderCustomerDto {
  authSubject?: string;
  authUserId?: string;
  subject?: string;
  sub?: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface CreateOrderAddressDto {
  name?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  companyName?: string;
  companyId?: string;
  taxId?: string;
  vatId?: string;
  email?: string;
}

export interface CreateOrderItemDto {
  productId: string;
  sku?: string;
  title: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
  warehouseId?: string;
}

export interface CreateOrderTotalsDto {
  subtotal: number;
  shippingCost?: number;
  taxAmount?: number;
  total: number;
  currency: string;
}

export interface CreateOrderPaymentDto {
  method?: string;
  status?: string;
}

export interface CreateOrderShippingDto {
  method?: string;
}

export interface CreateOrderNotesDto {
  customerNote?: string;
}

export interface CreateOrderLeadAttributionDto {
  leadId?: string;
  source?: string;
  campaignId?: string;
}

export interface CreateOrderRequestDto {
  contractVersion?: string;
  channel: string;
  externalOrderId: string;
  channelAccountId?: string;
  leadAttribution?: CreateOrderLeadAttributionDto;
  orderedAt?: string;
  status?: string;
  customer?: CreateOrderCustomerDto;
  shippingAddress?: CreateOrderAddressDto;
  billingAddress?: CreateOrderAddressDto;
  items?: CreateOrderItemDto[];
  totals?: CreateOrderTotalsDto;
  payment?: CreateOrderPaymentDto;
  shipping?: CreateOrderShippingDto;
  notes?: CreateOrderNotesDto;
  subtotal?: number;
  shippingCost?: number;
  taxAmount?: number;
  total?: number;
  currency?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  shippingMethod?: string;
  customerNote?: string;
}

export interface NormalizedCreateOrder {
  order: Partial<Order>;
  items: Array<Partial<OrderItem>>;
  leadAttribution?: CreateOrderLeadAttributionDto;
}

export interface CreateOrderIdempotencyKey {
  channel: string;
  externalOrderId: string;
  channelAccountId?: string;
}

const ALLOWED_CREATE_KEYS = new Set([
  'contractVersion',
  'channel',
  'externalOrderId',
  'channelAccountId',
  'leadAttribution',
  'orderedAt',
  'status',
  'customer',
  'shippingAddress',
  'billingAddress',
  'items',
  'totals',
  'payment',
  'shipping',
  'notes',
  'subtotal',
  'shippingCost',
  'taxAmount',
  'total',
  'currency',
  'paymentMethod',
  'paymentStatus',
  'shippingMethod',
  'customerNote',
]);

const ALLOWED_CHANNELS = new Set(['flipflop', 'allegro', 'aukro', 'bazos', 'heureka', 'cliplot']);
const ALLOWED_INITIAL_STATUSES = new Set(['pending', 'confirmed']);

export function normalizeCreateOrderRequest(input: CreateOrderRequestDto): NormalizedCreateOrder {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new BadRequestException('Create order request body must be an object');
  }

  const unknownKeys = Object.keys(input).filter((key) => !ALLOWED_CREATE_KEYS.has(key));
  if (unknownKeys.length) {
    throw new BadRequestException(`Unsupported create order fields: ${unknownKeys.join(', ')}`);
  }

  if (input.contractVersion && input.contractVersion !== CREATE_ORDER_CONTRACT_VERSION) {
    throw new BadRequestException(`Unsupported create order contractVersion: ${input.contractVersion}`);
  }

  const channel = normalizeString(input.channel, 'channel').toLowerCase();
  if (!ALLOWED_CHANNELS.has(channel)) {
    throw new BadRequestException(`Unsupported order channel: ${channel}`);
  }

  const externalOrderId = normalizeString(input.externalOrderId, 'externalOrderId');
  const status = normalizeOptionalString(input.status) || 'pending';
  if (!ALLOWED_INITIAL_STATUSES.has(status)) {
    throw new BadRequestException('Create order status must be pending or confirmed');
  }

  const totals = input.totals || {
    subtotal: input.subtotal,
    shippingCost: input.shippingCost,
    taxAmount: input.taxAmount,
    total: input.total,
    currency: input.currency,
  };

  const subtotal = normalizeMoney(totals.subtotal, 'totals.subtotal');
  const shippingCost = normalizeMoney(totals.shippingCost ?? 0, 'totals.shippingCost');
  const taxAmount = normalizeMoney(totals.taxAmount ?? 0, 'totals.taxAmount');
  const total = normalizeMoney(totals.total, 'totals.total');
  const currency = normalizeString(totals.currency, 'totals.currency').toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new BadRequestException('totals.currency must be an ISO 4217 three-letter currency code');
  }

  const items = normalizeItems(input.items || []);
  if (!items.length) {
    throw new BadRequestException('items must contain at least one order line');
  }

  const orderedAt = input.orderedAt ? new Date(input.orderedAt) : undefined;
  if (orderedAt && Number.isNaN(orderedAt.valueOf())) {
    throw new BadRequestException('orderedAt must be a valid ISO timestamp');
  }

  return {
    order: {
      externalOrderId,
      channel,
      channelAccountId: normalizeOptionalString(input.channelAccountId),
      status,
      customer: normalizeCustomer(input.customer),
      shippingAddress: normalizeAddress(input.shippingAddress),
      billingAddress: normalizeAddress(input.billingAddress),
      subtotal,
      shippingCost,
      taxAmount,
      total,
      currency,
      paymentMethod: normalizeOptionalString(input.payment?.method || input.paymentMethod),
      paymentStatus: normalizeOptionalString(input.payment?.status || input.paymentStatus),
      shippingMethod: normalizeOptionalString(input.shipping?.method || input.shippingMethod),
      customerNote: normalizeOptionalString(input.notes?.customerNote || input.customerNote),
      orderedAt,
    },
    items,
    leadAttribution: normalizeLeadAttribution(input.leadAttribution),
  };
}

export function getCreateOrderIdempotencyKey(normalized: NormalizedCreateOrder): CreateOrderIdempotencyKey {
  return {
    channel: requireComparableString(normalized.order.channel, 'channel'),
    externalOrderId: requireComparableString(normalized.order.externalOrderId, 'externalOrderId'),
    channelAccountId: comparableOptionalString(normalized.order.channelAccountId),
  };
}

export function isMatchingCreateOrderReplay(existing: Order, normalized: NormalizedCreateOrder): boolean {
  const expected = normalized.order;
  const scalarFields: Array<keyof Order> = [
    'externalOrderId',
    'channel',
    'channelAccountId',
    'status',
    'currency',
    'paymentMethod',
    'paymentStatus',
    'shippingMethod',
    'customerNote',
  ];

  for (const field of scalarFields) {
    if (comparableOptionalString(existing[field]) !== comparableOptionalString(expected[field])) {
      return false;
    }
  }

  const moneyFields: Array<keyof Order> = ['subtotal', 'shippingCost', 'taxAmount', 'total'];
  for (const field of moneyFields) {
    if (comparableMoney(existing[field]) !== comparableMoney(expected[field])) {
      return false;
    }
  }

  if (comparableDate(existing.orderedAt) !== comparableDate(expected.orderedAt)) {
    return false;
  }

  if (!sameJsonShape(existing.customer, expected.customer)) return false;
  if (!sameJsonShape(existing.shippingAddress, expected.shippingAddress)) return false;
  if (!sameJsonShape(existing.billingAddress, expected.billingAddress)) return false;

  return sameOrderItems(existing.items || [], normalized.items);
}

function sameOrderItems(existing: OrderItem[], expected: Array<Partial<OrderItem>>): boolean {
  if (existing.length !== expected.length) return false;

  return existing.every((item, index) => {
    const expectedItem = expected[index];
    return comparableOptionalString(item.productId) === comparableOptionalString(expectedItem.productId)
      && comparableOptionalString(item.sku) === comparableOptionalString(expectedItem.sku)
      && comparableOptionalString(item.title) === comparableOptionalString(expectedItem.title)
      && comparableMoney(item.quantity) === comparableMoney(expectedItem.quantity)
      && comparableMoney(item.unitPrice) === comparableMoney(expectedItem.unitPrice)
      && comparableMoney(item.totalPrice) === comparableMoney(expectedItem.totalPrice)
      && comparableOptionalString(item.warehouseId) === comparableOptionalString(expectedItem.warehouseId)
      && comparableOptionalString(item.fulfillmentStatus) === comparableOptionalString(expectedItem.fulfillmentStatus);
  });
}

function sameJsonShape(left: unknown, right: unknown): boolean {
  return JSON.stringify(sortJson(left || {})) === JSON.stringify(sortJson(right || {}));
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (!value || typeof value !== 'object') return value;
  return Object.keys(value as Record<string, unknown>).sort().reduce((acc, key) => {
    const nested = (value as Record<string, unknown>)[key];
    if (nested !== undefined) acc[key] = sortJson(nested);
    return acc;
  }, {} as Record<string, unknown>);
}

function comparableOptionalString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return String(value).trim();
}

function requireComparableString(value: unknown, field: string): string {
  const normalized = comparableOptionalString(value);
  if (!normalized) throw new BadRequestException(`${field} is required for idempotency`);
  return normalized;
}

function comparableMoney(value: unknown): number {
  return Math.round(Number(value || 0) * 100) / 100;
}

function comparableDate(value: unknown): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.valueOf()) ? undefined : date.toISOString();
}

function normalizeItems(items: CreateOrderItemDto[]): Array<Partial<OrderItem>> {
  if (!Array.isArray(items)) {
    throw new BadRequestException('items must be an array');
  }

  return items.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new BadRequestException(`items[${index}] must be an object`);
    }
    const quantity = normalizeInteger(item.quantity, `items[${index}].quantity`);
    const unitPrice = normalizeMoney(item.unitPrice, `items[${index}].unitPrice`);
    const totalPrice = normalizeMoney(item.totalPrice ?? quantity * unitPrice, `items[${index}].totalPrice`);
    return {
      productId: normalizeString(item.productId, `items[${index}].productId`),
      sku: normalizeOptionalString(item.sku),
      title: normalizeString(item.title, `items[${index}].title`),
      quantity,
      unitPrice,
      totalPrice,
      warehouseId: normalizeOptionalString(item.warehouseId),
      fulfillmentStatus: 'pending',
    };
  });
}

function normalizeCustomer(value?: CreateOrderCustomerDto): Order['customer'] {
  if (!value) return undefined;
  const authUserId = normalizeCustomerAuthSubject(value);
  return {
    authUserId,
    subject: authUserId,
    name: normalizeOptionalString(value.name),
    email: normalizeOptionalString(value.email),
    phone: normalizeOptionalString(value.phone),
  };
}

function normalizeCustomerAuthSubject(value: CreateOrderCustomerDto): string | undefined {
  const candidates = [
    value.authSubject,
    value.authUserId,
    value.subject,
    value.sub,
  ].map((candidate) => normalizeOptionalString(candidate)).filter((candidate): candidate is string => Boolean(candidate));

  if (candidates.length === 0) return undefined;

  const unique = Array.from(new Set(candidates.map((candidate) => candidate.toLowerCase())));
  if (unique.length > 1) {
    throw new BadRequestException('customer Auth subject fields must match');
  }

  const authSubject = unique[0];
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(authSubject)) {
    throw new BadRequestException('customer.authSubject must be a UUID');
  }
  return authSubject;
}

function normalizeAddress(value?: CreateOrderAddressDto): Order['shippingAddress'] | Order['billingAddress'] {
  if (!value) return undefined;
  return {
    name: normalizeOptionalString(value.name),
    street: normalizeOptionalString(value.street),
    city: normalizeOptionalString(value.city),
    postalCode: normalizeOptionalString(value.postalCode),
    country: normalizeOptionalString(value.country),
    companyName: normalizeOptionalString(value.companyName),
    companyId: normalizeOptionalString(value.companyId),
    taxId: normalizeOptionalString(value.taxId),
    vatId: normalizeOptionalString(value.vatId),
    email: normalizeOptionalString(value.email),
  };
}

function normalizeLeadAttribution(value?: CreateOrderLeadAttributionDto): CreateOrderLeadAttributionDto | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException('leadAttribution must be an object');
  }

  const allowedKeys = new Set(['leadId', 'source', 'campaignId']);
  const unknownKeys = Object.keys(value).filter((key) => !allowedKeys.has(key));
  if (unknownKeys.length) {
    throw new BadRequestException(`Unsupported leadAttribution fields: ${unknownKeys.join(', ')}`);
  }

  const leadAttribution: CreateOrderLeadAttributionDto = {};
  const leadId = normalizeAttributionString(value.leadId, 'leadAttribution.leadId');
  const source = normalizeAttributionString(value.source, 'leadAttribution.source');
  const campaignId = normalizeAttributionString(value.campaignId, 'leadAttribution.campaignId');

  if (leadId) leadAttribution.leadId = leadId;
  if (source) leadAttribution.source = source;
  if (campaignId) leadAttribution.campaignId = campaignId;

  return Object.keys(leadAttribution).length ? leadAttribution : undefined;
}

function normalizeAttributionString(value: unknown, field: string): string | undefined {
  const normalized = normalizeOptionalString(value);
  if (!normalized) return undefined;
  if (normalized.length > 200) {
    throw new BadRequestException(`${field} is too long`);
  }
  return normalized;
}

function normalizeString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestException(`${field} is required`);
  }
  if (value.length > 500) {
    throw new BadRequestException(`${field} is too long`);
  }
  return value.trim();
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function normalizeInteger(value: unknown, field: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new BadRequestException(`${field} must be a positive integer`);
  }
  return parsed;
}

function normalizeMoney(value: unknown, field: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new BadRequestException(`${field} must be a non-negative number`);
  }
  return Math.round(parsed * 100) / 100;
}
