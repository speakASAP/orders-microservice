import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Order } from '../orders/order.entity';
import { OrderItem } from '../items/order-item.entity';
import { LoggerService } from '../logger/logger.service';

export type WarehouseHandoffStatus = 'disabled' | 'skipped' | 'reserved' | 'failed';
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
    this.baseUrl = process.env.WAREHOUSE_SERVICE_URL || 'http://warehouse-microservice:3201';
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
    let reservedCount = 0;
    try {
      for (const item of items) {
        await this.reserveItem(order, item, expiresAt);
        reservedCount += 1;
      }

      return {
        ...base,
        status: 'reserved',
        completedAt: new Date().toISOString(),
        reservedCount,
      };
    } catch {
      this.logger.warn('Warehouse reservation handoff failed', 'WarehouseReservationClient');
      return {
        ...base,
        status: 'failed',
        completedAt: new Date().toISOString(),
        reservedCount,
        failedCount: items.length - reservedCount,
        failureCode: 'warehouse_request_failed',
      };
    }
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
    await firstValueFrom(this.httpService.post(this.baseUrl + '/api/reservations/' + action, payload));
  }

  private async reserveItem(order: Order, item: OrderItem, expiresAt: string): Promise<void> {
    const payload = this.buildReservePayload(order, item, expiresAt);
    await firstValueFrom(this.httpService.post(this.baseUrl + '/api/reservations/reserve', payload));
  }

  private hasWarehouseId(item: OrderItem): boolean {
    return typeof item.warehouseId === 'string' && item.warehouseId.trim().length > 0;
  }

  private resolveTtlMinutes(value?: string): number {
    const parsed = Number(value || DEFAULT_RESERVATION_TTL_MINUTES);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_RESERVATION_TTL_MINUTES;
  }
}
