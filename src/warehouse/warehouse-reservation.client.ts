import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Order } from '../orders/order.entity';
import { OrderItem } from '../items/order-item.entity';
import { LoggerService } from '../logger/logger.service';

export type WarehouseHandoffStatus = 'disabled' | 'skipped' | 'reserved' | 'released' | 'fulfilled' | 'cancelled' | 'expired' | 'returned' | 'failed';
export type WarehouseReservationAction = 'release' | 'fulfill' | 'cancel' | 'expire' | 'return';

export interface WarehouseHandoffSummary {
  status: WarehouseHandoffStatus;
  attemptedAt: string;
  completedAt?: string;
  itemCount: number;
  reservedCount: number;
  failedCount: number;
  reasonCode: string;
  actor: 'orders-microservice';
  skipReason?: 'reservation_disabled' | 'missing_order_items' | 'missing_warehouse_id';
  failureCode?: 'warehouse_request_failed';
  compensatedCount?: number;
  compensationFailedCount?: number;
  fulfillmentOrderHandoff?: {
    status?: string;
    warehouseStatus?: string;
    updatedAt?: string;
    reasonCode?: string;
    actor?: string;
    reference?: string;
    fulfillmentOrderId?: string;
  };
}

interface ReservationLifecyclePayload {
  productId: string;
  warehouseId: string;
  orderId: string;
  channel: string;
  reasonCode: string;
  actor: 'orders-microservice';
  reference: string;
}

interface ReservePayload extends ReservationLifecyclePayload {
  quantity: number;
  expiresAt?: string;
}

interface ReleasePayload extends ReservationLifecyclePayload {
  quantity: number;
}

const RESERVE_REASON_CODE = 'ORDER_CREATE_RESERVATION';
const RESERVATION_COMPENSATION_REASON_CODE = 'ORDER_CREATE_RESERVATION_COMPENSATION';
const ACTION_STATUS: Record<WarehouseReservationAction, WarehouseHandoffStatus> = {
  release: 'released',
  fulfill: 'fulfilled',
  cancel: 'cancelled',
  expire: 'expired',
  return: 'returned',
};
const ACTION_REASON: Record<WarehouseReservationAction, string> = {
  release: 'PAYMENT_FAILED_RELEASE',
  fulfill: 'PAYMENT_CONFIRMED',
  cancel: 'ORDER_CANCELLED',
  expire: 'RESERVATION_EXPIRED',
  return: 'ORDER_RETURNED',
};
const DEFAULT_RESERVATION_TTL_MINUTES = 15;

@Injectable()
export class WarehouseReservationClient {
  private readonly baseUrl: string;
  private readonly enabled: boolean;
  private readonly ttlMinutes: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly logger: LoggerService,
  ) {
    this.baseUrl = (process.env.WAREHOUSE_SERVICE_URL || 'http://warehouse-microservice:3201').replace(/\/$/, '');
    this.enabled = process.env.WAREHOUSE_RESERVATION_ENABLED === 'true';
    this.ttlMinutes = this.resolveTtlMinutes(process.env.WAREHOUSE_RESERVATION_TTL_MINUTES);
  }

  async reserveOrderItems(order: Order): Promise<WarehouseHandoffSummary> {
    const attemptedAt = new Date();
    const items = order.items || [];
    const base = {
      attemptedAt: attemptedAt.toISOString(),
      itemCount: items.length,
      reservedCount: 0,
      failedCount: 0,
      reasonCode: RESERVE_REASON_CODE,
      actor: 'orders-microservice' as const,
    };

    if (!this.enabled) {
      return { ...base, status: 'disabled', skipReason: 'reservation_disabled' };
    }

    if (!items.length) {
      return { ...base, status: 'skipped', skipReason: 'missing_order_items' };
    }

    if (items.some((item) => !this.hasWarehouseId(item))) {
      return { ...base, status: 'skipped', skipReason: 'missing_warehouse_id' };
    }

    const expiresAt = new Date(attemptedAt.getTime() + this.ttlMinutes * 60 * 1000).toISOString();
    const reservedItems: OrderItem[] = [];
    try {
      for (const item of items) {
        await this.reserveItem(order, item, expiresAt);
        reservedItems.push(item);
      }

      return {
        ...base,
        status: 'reserved',
        completedAt: new Date().toISOString(),
        reservedCount: reservedItems.length,
      };
    } catch (error: any) {
      this.logger.error(
        `Warehouse reservation handoff failed (orderId=${order.id}, url=${this.baseUrl}/api/reservations/reserve, ` +
          `items=${items.length}, reserved=${reservedItems.length}, ${this.describeError(error)})`,
        error?.stack,
        'WarehouseReservationClient',
      );
      const compensation = await this.releaseReservedItems(
        order,
        reservedItems,
        RESERVATION_COMPENSATION_REASON_CODE,
      );
      return {
        ...base,
        status: 'failed',
        completedAt: new Date().toISOString(),
        reservedCount: reservedItems.length,
        failedCount: items.length - reservedItems.length,
        failureCode: 'warehouse_request_failed',
        compensatedCount: compensation.succeeded,
        compensationFailedCount: compensation.failed,
      };
    }
  }

  async releaseOrderItems(order: Order, reasonCode = ACTION_REASON.release): Promise<WarehouseHandoffSummary> {
    return this.applyReservationAction('release', order, reasonCode);
  }

  async fulfillOrderItems(order: Order, reasonCode = ACTION_REASON.fulfill): Promise<WarehouseHandoffSummary> {
    return this.applyReservationAction('fulfill', order, reasonCode);
  }

  async cancelOrderItems(order: Order, reasonCode = ACTION_REASON.cancel): Promise<WarehouseHandoffSummary> {
    return this.applyReservationAction('cancel', order, reasonCode);
  }

  buildReservePayload(order: Order, item: OrderItem, expiresAt: string): ReservePayload {
    return {
      ...this.buildLifecyclePayload(order, item, RESERVE_REASON_CODE),
      quantity: item.quantity,
      expiresAt,
    };
  }

  buildReleasePayload(order: Order, item: OrderItem, reasonCode = 'PAYMENT_FAILED_RELEASE'): ReleasePayload {
    return {
      ...this.buildLifecyclePayload(order, item, reasonCode),
      quantity: item.quantity,
    };
  }

  buildLifecyclePayload(order: Order, item: OrderItem, reasonCode: string): ReservationLifecyclePayload {
    return {
      productId: item.productId,
      warehouseId: item.warehouseId,
      orderId: order.id,
      channel: order.channel,
      reasonCode,
      actor: 'orders-microservice',
      reference: order.externalOrderId || order.id,
    };
  }

  async postReservationAction(
    action: WarehouseReservationAction,
    payload: ReservationLifecyclePayload | ReleasePayload,
  ): Promise<void> {
    await firstValueFrom(this.httpService.post(this.baseUrl + '/api/reservations/' + action, payload, this.buildRequestConfig()));
  }

  private async applyReservationAction(
    action: WarehouseReservationAction,
    order: Order,
    reasonCode: string,
  ): Promise<WarehouseHandoffSummary> {
    const attemptedAt = new Date();
    const items = order.items || [];
    const base = {
      attemptedAt: attemptedAt.toISOString(),
      itemCount: items.length,
      reservedCount: 0,
      failedCount: 0,
      reasonCode,
      actor: 'orders-microservice' as const,
    };

    if (!this.enabled) {
      return { ...base, status: 'disabled', skipReason: 'reservation_disabled' };
    }

    if (!items.length) {
      return { ...base, status: 'skipped', skipReason: 'missing_order_items' };
    }

    if (items.some((item) => !this.hasWarehouseId(item))) {
      return { ...base, status: 'skipped', skipReason: 'missing_warehouse_id' };
    }

    let succeeded = 0;
    try {
      for (const item of items) {
        const payload = action === 'release'
          ? this.buildReleasePayload(order, item, reasonCode)
          : this.buildLifecyclePayload(order, item, reasonCode);
        await this.postReservationAction(action, payload);
        succeeded += 1;
      }

      return {
        ...base,
        status: ACTION_STATUS[action],
        completedAt: new Date().toISOString(),
        reservedCount: succeeded,
      };
    } catch (error: any) {
      this.logger.error(
        `Warehouse reservation lifecycle handoff failed (orderId=${order.id}, action=${action}, ` +
          `url=${this.baseUrl}/api/reservations/${action}, items=${items.length}, succeeded=${succeeded}, ` +
          `${this.describeError(error)})`,
        error?.stack,
        'WarehouseReservationClient',
      );
      return {
        ...base,
        status: 'failed',
        completedAt: new Date().toISOString(),
        reservedCount: succeeded,
        failedCount: items.length - succeeded,
        failureCode: 'warehouse_request_failed',
      };
    }
  }

  private async reserveItem(order: Order, item: OrderItem, expiresAt: string): Promise<void> {
    const payload = this.buildReservePayload(order, item, expiresAt);
    await firstValueFrom(this.httpService.post(this.baseUrl + '/api/reservations/reserve', payload, this.buildRequestConfig()));
  }

  private async releaseReservedItems(
    order: Order,
    items: OrderItem[],
    reasonCode: string,
  ): Promise<{ succeeded: number; failed: number }> {
    let succeeded = 0;
    let failed = 0;

    for (const item of items) {
      try {
        await this.postReservationAction('release', this.buildReleasePayload(order, item, reasonCode));
        succeeded += 1;
      } catch (error: any) {
        failed += 1;
        this.logger.error(
          `Warehouse reservation compensation release failed (orderId=${order.id}, ` +
            `warehouseId=${item.warehouseId}, url=${this.baseUrl}/api/reservations/release, ` +
            `${this.describeError(error)})`,
          error?.stack,
          'WarehouseReservationClient',
        );
      }
    }

    return { succeeded, failed };
  }

  private buildRequestConfig(): { headers?: Record<string, string> } {
    const rawToken = process.env.WAREHOUSE_SERVICE_TOKEN;
    const token = rawToken?.trim();
    if (!token) return {};

    return {
      headers: {
        Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
      },
    };
  }

private describeError(error: any): string {
    const status = error?.response?.status ?? error?.status;
    const body = error?.response?.data;
    const rendered = typeof body === 'string' ? body : body ? JSON.stringify(body) : undefined;
    return [
      `message=${error?.message || 'unknown error'}`,
      `httpStatus=${status ?? 'n/a'}`,
      rendered ? `body=${rendered.slice(0, 300)}` : undefined,
    ]
      .filter(Boolean)
      .join(' ');
  }

  private hasWarehouseId(item: OrderItem): boolean {
    return typeof item.warehouseId === 'string' && item.warehouseId.trim().length > 0;
  }

  private resolveTtlMinutes(value?: string): number {
    const parsed = Number(value || DEFAULT_RESERVATION_TTL_MINUTES);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_RESERVATION_TTL_MINUTES;
  }
}
