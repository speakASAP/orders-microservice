import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { OrderItem } from '../items/order-item.entity';
import { LoggerService } from '../logger/logger.service';
import { Order } from './order.entity';

export type OrderFulfillmentHandoffStatus = 'disabled' | 'skipped' | 'requested' | 'failed';

export interface OrderFulfillmentHandoffSummary {
  status: OrderFulfillmentHandoffStatus;
  attemptedAt: string;
  completedAt?: string;
  itemCount: number;
  handedOffCount: number;
  reasonCode: 'PAYMENT_CONFIRMED';
  actor: 'orders-microservice';
  fulfillmentOrderId?: string;
  skipReason?:
    | 'reservation_disabled'
    | 'warehouse_fulfillment_not_completed'
    | 'missing_order_items'
    | 'missing_shipping_method'
    | 'missing_delivery_address'
    | 'missing_warehouse_id'
    | 'missing_reservation_id';
  failureCode?: 'warehouse_request_failed';
}

interface WarehouseReservationSnapshot {
  id?: string;
  productId?: string;
  warehouseId?: string;
  orderId?: string;
  quantity?: number;
  status?: string;
}

interface FulfillmentLinePayload {
  orderItemId: string;
  reservationId: string;
  productId: string;
  sku?: string;
  title: string;
  warehouseId: string;
  quantity: number;
}

interface FulfillmentOrderPayload {
  orderId: string;
  orderNumber?: string;
  channel?: string;
  shippingMethod: string;
  reasonCode: 'PAYMENT_CONFIRMED';
  reference?: string;
  deliveryAddress: {
    name?: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  customerContact?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  items: FulfillmentLinePayload[];
}

const PAYMENT_CONFIRMED_REASON = 'PAYMENT_CONFIRMED';

const COUNTRY_NAME_TO_ISO2: Record<string, string> = {
  CZECHIA: 'CZ',
  'CZECH REPUBLIC': 'CZ',
  CESKO: 'CZ',
  'CESKA REPUBLIKA': 'CZ',
};

@Injectable()
export class OrderFulfillmentHandoffClient {
  private readonly baseUrl: string;
  private readonly enabled: boolean;

  constructor(
    private readonly httpService: HttpService,
    private readonly logger: LoggerService,
  ) {
    this.baseUrl = (process.env.WAREHOUSE_SERVICE_URL || 'http://warehouse-microservice:3201').replace(/\/$/, '');
    this.enabled = process.env.WAREHOUSE_RESERVATION_ENABLED === 'true';
  }

  async createAfterPaymentFulfillment(order: Order): Promise<OrderFulfillmentHandoffSummary> {
    const attemptedAt = new Date().toISOString();
    const items = order.items || [];
    const base = {
      attemptedAt,
      itemCount: items.length,
      handedOffCount: 0,
      reasonCode: PAYMENT_CONFIRMED_REASON as 'PAYMENT_CONFIRMED',
      actor: 'orders-microservice' as const,
    };

    if (!this.enabled) {
      return { ...base, status: 'disabled', skipReason: 'reservation_disabled' };
    }
    if (order.warehouseHandoff?.status !== 'fulfilled') {
      return { ...base, status: 'skipped', skipReason: 'warehouse_fulfillment_not_completed' };
    }
    if (!items.length) {
      return { ...base, status: 'skipped', skipReason: 'missing_order_items' };
    }
    if (items.some((item) => !this.hasWarehouseId(item))) {
      return { ...base, status: 'skipped', skipReason: 'missing_warehouse_id' };
    }

    const shippingMethod = this.normalizeOptionalString(order.shippingMethod);
    if (!shippingMethod) {
      return { ...base, status: 'skipped', skipReason: 'missing_shipping_method' };
    }

    const deliveryAddress = this.normalizeDeliveryAddress(order.shippingAddress);
    if (!deliveryAddress) {
      return { ...base, status: 'skipped', skipReason: 'missing_delivery_address' };
    }

    try {
      const reservations = await this.fetchOrderReservations(order.id);
      const lines = this.buildFulfillmentLines(order, reservations);
      if (lines.length !== items.length) {
        return {
          ...base,
          status: 'skipped',
          completedAt: new Date().toISOString(),
          skipReason: 'missing_reservation_id',
        };
      }

      const response = await firstValueFrom(this.httpService.post(
        this.baseUrl + '/api/fulfillment-orders',
        this.buildPayload(order, shippingMethod, deliveryAddress, lines),
        this.buildRequestConfig(),
      ));

      return {
        ...base,
        status: 'requested',
        completedAt: new Date().toISOString(),
        handedOffCount: lines.length,
        fulfillmentOrderId: this.normalizeOptionalString(response?.data?.data?.id),
      };
    } catch {
      this.logger.warn('Warehouse fulfillment order handoff failed', 'OrderFulfillmentHandoffClient');
      return {
        ...base,
        status: 'failed',
        completedAt: new Date().toISOString(),
        failureCode: 'warehouse_request_failed',
      };
    }
  }

  buildPayload(
    order: Order,
    shippingMethod: string,
    deliveryAddress: NonNullable<FulfillmentOrderPayload['deliveryAddress']>,
    lines: FulfillmentLinePayload[],
  ): FulfillmentOrderPayload {
    return {
      orderId: order.id,
      ...(order.externalOrderId ? { orderNumber: order.externalOrderId } : {}),
      ...(order.channel ? { channel: order.channel } : {}),
      shippingMethod,
      reasonCode: PAYMENT_CONFIRMED_REASON,
      ...(order.externalOrderId ? { reference: order.externalOrderId } : {}),
      deliveryAddress,
      ...(this.normalizeCustomerContact(order.customer) ? { customerContact: this.normalizeCustomerContact(order.customer) } : {}),
      items: lines,
    };
  }

  buildFulfillmentLines(order: Order, reservations: WarehouseReservationSnapshot[]): FulfillmentLinePayload[] {
    const usedReservationIds = new Set<string>();
    const lines: FulfillmentLinePayload[] = [];

    for (const item of order.items || []) {
      const reservation = reservations.find((candidate) => {
        if (!candidate.id || usedReservationIds.has(candidate.id)) return false;
        return candidate.status === 'fulfilled'
          && candidate.orderId === order.id
          && candidate.productId === item.productId
          && candidate.warehouseId === item.warehouseId
          && Number(candidate.quantity) === Number(item.quantity);
      });
      if (!reservation?.id) continue;
      usedReservationIds.add(reservation.id);
      lines.push({
        orderItemId: item.id,
        reservationId: reservation.id,
        productId: item.productId,
        ...(item.sku ? { sku: item.sku } : {}),
        title: item.title,
        warehouseId: item.warehouseId,
        quantity: Number(item.quantity),
      });
    }

    return lines;
  }

  async fetchOrderReservations(orderId: string): Promise<WarehouseReservationSnapshot[]> {
    const response = await firstValueFrom(this.httpService.get(
      this.baseUrl + '/api/reservations/order/' + encodeURIComponent(orderId),
      this.buildRequestConfig(),
    ));
    const data = response?.data?.data;
    return Array.isArray(data) ? data : [];
  }

  private normalizeDeliveryAddress(address: Order['shippingAddress'] | null | undefined): FulfillmentOrderPayload['deliveryAddress'] | null {
    const street = this.normalizeOptionalString(address?.street);
    const city = this.normalizeOptionalString(address?.city);
    const postalCode = this.normalizeOptionalString(address?.postalCode);
    const country = this.normalizeCountry(address?.country);
    if (!street || !city || !postalCode || !country) {
      return null;
    }
    return {
      ...(this.normalizeOptionalString(address?.name) ? { name: this.normalizeOptionalString(address?.name) } : {}),
      street,
      city,
      postalCode,
      country,
    };
  }

  private normalizeCountry(value?: string | null): string | undefined {
    const normalized = this.normalizeOptionalString(value);
    if (!normalized) return undefined;
    const upper = normalized.toUpperCase();
    if (/^[A-Z]{2}$/.test(upper)) return upper;

    return COUNTRY_NAME_TO_ISO2[upper.replace(/[^A-Z]/g, ' ').replace(/\s+/g, ' ').trim()];
  }

  private normalizeCustomerContact(customer: Order['customer'] | null | undefined): FulfillmentOrderPayload['customerContact'] | null {
    if (!customer) return null;
    const contact = {
      ...(this.normalizeOptionalString(customer.name) ? { name: this.normalizeOptionalString(customer.name) } : {}),
      ...(this.normalizeOptionalString(customer.email) ? { email: this.normalizeOptionalString(customer.email) } : {}),
      ...(this.normalizeOptionalString(customer.phone) ? { phone: this.normalizeOptionalString(customer.phone) } : {}),
    };
    return Object.keys(contact).length ? contact : null;
  }

  private buildRequestConfig(): { headers?: Record<string, string> } {
    const rawToken = process.env.WAREHOUSE_SERVICE_TOKEN || process.env.WAREHOUSE_INTERNAL_SERVICE_TOKEN;
    const token = rawToken?.trim();
    if (!token) return {};

    return {
      headers: {
        Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
      },
    };
  }

  private hasWarehouseId(item: OrderItem): boolean {
    return typeof item.warehouseId === 'string' && item.warehouseId.trim().length > 0;
  }

  private normalizeOptionalString(value?: string | null): string | undefined {
    if (typeof value !== 'string') return undefined;
    const normalized = value.trim();
    if (!normalized || /[\r\n\t]/.test(normalized)) return undefined;
    return normalized;
  }
}
