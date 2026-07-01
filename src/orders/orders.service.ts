import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoggerService } from '../logger/logger.service';
import { WarehouseHandoffSummary, WarehouseReservationClient } from '../warehouse/warehouse-reservation.client';
import { Order } from './order.entity';
import { OrderItem } from '../items/order-item.entity';
import {
  CreateOrderIdempotencyKey,
  CreateOrderRequestDto,
  getCreateOrderIdempotencyKey,
  isMatchingCreateOrderReplay,
  normalizeCreateOrderRequest,
} from './create-order.dto';
import { OrderEventsService } from './order-events.service';
import {
  NormalizedPaymentStatusUpdate,
  PaymentStatusUpdateRequestDto,
  normalizePaymentStatusUpdate,
} from '../payments/payment-status.dto';
import {
  OrderStatusActorContext,
  OrderStatusTransitionContext,
  validateOrderStatusTransitionWithAudit,
} from './status-transitions';

const PRODUCT_SALES_DEFAULT_STATUSES = ['confirmed', 'processing', 'shipped', 'delivered'] as const;
const SELLABLE_ORDER_CHANNELS: Set<string> = new Set(['flipflop', 'allegro', 'aukro', 'bazos', 'heureka', 'cliplot']);
const PRODUCT_SALES_ALLOWED_STATUSES: Set<string> = new Set(['pending', ...PRODUCT_SALES_DEFAULT_STATUSES, 'cancelled']);
const PRODUCT_SALES_ALLOWED_CHANNELS: Set<string> = new Set(['flipflop', 'allegro', 'aukro', 'bazos', 'heureka', 'cliplot']);
const PRODUCT_SALES_HISTORY_LIMIT = 10;

export interface ProductSalesStatisticsFilters {
  from?: string;
  to?: string;
  channel?: string;
  status?: string;
}

type NormalizedProductSalesStatisticsFilters = {
  productId: string;
  from?: Date;
  to?: Date;
  channel?: string;
  statuses: string[];
};

type ProductSalesAggregateRawRow = {
  currency?: string;
  channel?: string;
  status?: string;
  orderCount?: string | number;
  itemLineCount?: string | number;
  quantitySold?: string | number;
  grossItemRevenue?: string | number;
  lastOrderAt?: string | Date;
  lastorderat?: string | Date;
};

type ProductSalesHistoryRawRow = ProductSalesAggregateRawRow & {
  orderId?: string;
  orderid?: string;
  orderedAt?: string | Date;
  orderedat?: string | Date;
};

@Injectable()
export class OrdersService {
  private static readonly CONTEXT = 'OrdersService';

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly warehouseReservations: WarehouseReservationClient,
    private readonly orderEvents: OrderEventsService,
    private readonly logger: LoggerService,
  ) {}

  async findAll(channel?: string, status?: string): Promise<Order[]> {
    const where: any = {};
    if (channel) where.channel = channel;
    if (status) where.status = status;

    return this.orderRepository.find({
      where,
      relations: ['items'],
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  async getProductSalesStatistics(productId: string, filters: ProductSalesStatisticsFilters = {}) {
    const normalized = this.normalizeProductSalesStatisticsFilters(productId, filters);

    const currencyRows = await this.buildProductSalesBaseQuery(normalized)
      .select('orders.currency', 'currency')
      .addSelect('COUNT(DISTINCT orders.id)', 'orderCount')
      .addSelect('COUNT(item.id)', 'itemLineCount')
      .addSelect('COALESCE(SUM(item.quantity), 0)', 'quantitySold')
      .addSelect('COALESCE(SUM(item.totalPrice), 0)', 'grossItemRevenue')
      .addSelect('MAX(COALESCE(orders.orderedAt, orders.createdAt))', 'lastOrderAt')
      .groupBy('orders.currency')
      .orderBy('orders.currency', 'ASC')
      .getRawMany<ProductSalesAggregateRawRow>();

    const totalsByCurrency = currencyRows.map((row) => this.serializeProductSalesAggregate(row));
    const summary = this.buildProductSalesSummary(totalsByCurrency);

    const byChannelRows = await this.buildProductSalesBaseQuery(normalized)
      .select('orders.channel', 'channel')
      .addSelect('orders.currency', 'currency')
      .addSelect('COUNT(DISTINCT orders.id)', 'orderCount')
      .addSelect('COUNT(item.id)', 'itemLineCount')
      .addSelect('COALESCE(SUM(item.quantity), 0)', 'quantitySold')
      .addSelect('COALESCE(SUM(item.totalPrice), 0)', 'grossItemRevenue')
      .addSelect('MAX(COALESCE(orders.orderedAt, orders.createdAt))', 'lastOrderAt')
      .groupBy('orders.channel')
      .addGroupBy('orders.currency')
      .orderBy('orders.channel', 'ASC')
      .addOrderBy('orders.currency', 'ASC')
      .getRawMany<ProductSalesAggregateRawRow>();

    const byStatusRows = await this.buildProductSalesBaseQuery(normalized)
      .select('orders.status', 'status')
      .addSelect('orders.currency', 'currency')
      .addSelect('COUNT(DISTINCT orders.id)', 'orderCount')
      .addSelect('COUNT(item.id)', 'itemLineCount')
      .addSelect('COALESCE(SUM(item.quantity), 0)', 'quantitySold')
      .addSelect('COALESCE(SUM(item.totalPrice), 0)', 'grossItemRevenue')
      .addSelect('MAX(COALESCE(orders.orderedAt, orders.createdAt))', 'lastOrderAt')
      .groupBy('orders.status')
      .addGroupBy('orders.currency')
      .orderBy('orders.status', 'ASC')
      .addOrderBy('orders.currency', 'ASC')
      .getRawMany<ProductSalesAggregateRawRow>();

    const recentRows = await this.buildProductSalesBaseQuery(normalized)
      .select('orders.id', 'orderId')
      .addSelect('orders.channel', 'channel')
      .addSelect('orders.status', 'status')
      .addSelect('orders.currency', 'currency')
      .addSelect('COUNT(item.id)', 'itemLineCount')
      .addSelect('COALESCE(SUM(item.quantity), 0)', 'quantitySold')
      .addSelect('COALESCE(SUM(item.totalPrice), 0)', 'grossItemRevenue')
      .addSelect('MAX(COALESCE(orders.orderedAt, orders.createdAt))', 'orderedAt')
      .groupBy('orders.id')
      .addGroupBy('orders.channel')
      .addGroupBy('orders.status')
      .addGroupBy('orders.currency')
      .orderBy('MAX(COALESCE(orders.orderedAt, orders.createdAt))', 'DESC')
      .take(PRODUCT_SALES_HISTORY_LIMIT)
      .getRawMany<ProductSalesHistoryRawRow>();

    return {
      productId: normalized.productId,
      generatedAt: new Date().toISOString(),
      filters: {
        from: normalized.from?.toISOString() || null,
        to: normalized.to?.toISOString() || null,
        channel: normalized.channel || null,
        statuses: normalized.statuses,
      },
      summary,
      byChannel: byChannelRows.map((row) => ({
        channel: row.channel || 'unknown',
        ...this.serializeProductSalesAggregate(row),
      })),
      byStatus: byStatusRows.map((row) => ({
        status: row.status || 'unknown',
        ...this.serializeProductSalesAggregate(row),
      })),
      recentHistory: recentRows.map((row) => this.serializeProductSalesHistory(row)),
    };
  }

  async create(data: CreateOrderRequestDto): Promise<Order> {
    const startedAt = Date.now();
    let saved: Order | undefined;
    let normalizedChannel: string | undefined;
    try {
      const normalized = normalizeCreateOrderRequest(data);
      normalizedChannel = normalized.order.channel;
      const idempotencyKey = getCreateOrderIdempotencyKey(normalized);
      const existing = await this.findByCreateOrderIdempotencyKey(idempotencyKey);
      if (existing) {
        if (!isMatchingCreateOrderReplay(existing, normalized)) {
          this.logger.audit(
            {
              operation: 'order.create.idempotency_conflict',
              resourceType: 'order',
              resourceId: existing.id,
              channel: existing.channel,
              resultingStatus: existing.status,
              outcome: 'rejected',
              durationMs: Date.now() - startedAt,
            },
            OrdersService.CONTEXT,
          );
          throw new ConflictException(
            'Order already exists for this channel, externalOrderId, and channelAccountId with different payload',
          );
        }

        this.logger.audit(
          {
            operation: 'order.create.idempotent_replay',
            resourceType: 'order',
            resourceId: existing.id,
            channel: existing.channel,
            resultingStatus: existing.status,
            processed: existing.items?.length || 0,
            outcome: 'success',
            durationMs: Date.now() - startedAt,
          },
          OrdersService.CONTEXT,
        );
        return existing;
      }

      saved = await this.orderRepository.manager.transaction(async (manager) => {
        const order = manager.create(Order, normalized.order);
        const savedOrder = await manager.save(Order, order);
        const itemRows = normalized.items.map((item) => manager.create(OrderItem, { ...item, orderId: savedOrder.id }));
        const savedItems = await manager.save(OrderItem, itemRows);
        savedOrder.items = savedItems;
        const handoff = await this.warehouseReservations.reserveOrderItems(savedOrder);
        this.assertRequiredWarehouseReservation(savedOrder, handoff);
        savedOrder.warehouseHandoff = handoff;
        return manager.save(Order, savedOrder);
      });

      await this.orderEvents.publishOrderCreated(saved.id, saved.channel, normalized.leadAttribution);

      this.logger.audit(
        {
          operation: 'order.create',
          resourceType: 'order',
          resourceId: saved.id,
          channel: saved.channel,
          resultingStatus: saved.status,
          processed: saved.items?.length || 0,
          outcome: 'success',
          durationMs: Date.now() - startedAt,
        },
        OrdersService.CONTEXT,
      );

      return saved;
    } catch (error) {
      this.logger.audit(
        {
          operation: 'order.create',
          resourceType: 'order',
          resourceId: saved?.id,
          channel: saved?.channel || normalizedChannel,
          resultingStatus: saved?.status,
          outcome: 'failure',
          durationMs: Date.now() - startedAt,
        },
        OrdersService.CONTEXT,
      );
      throw error;
    }
  }

  private assertRequiredWarehouseReservation(order: Order, handoff: WarehouseHandoffSummary): void {
    if (!this.requiresWarehouseReservation(order.channel)) return;
    if (handoff.status === 'reserved') return;

    throw new BadRequestException(
      `Warehouse reservation is required for sellable channel orders; handoff status ${handoff.status}`,
    );
  }

  private requiresWarehouseReservation(channel?: string): boolean {
    if (typeof channel !== 'string') return false;
    return SELLABLE_ORDER_CHANNELS.has(channel.toLowerCase());
  }

  async updateStatus(id: string, status: string, context: OrderStatusTransitionContext = {}): Promise<Order> {
    const startedAt = Date.now();
    const order = await this.findOne(id);
    const previousStatus = order.status;
    let transition;

    try {
      transition = validateOrderStatusTransitionWithAudit(previousStatus, status, order.items || [], context);
    } catch (error) {
      this.logger.audit(
        {
          operation: 'order.status.update',
          resourceType: 'order',
          resourceId: id,
          actorId: context.actor?.sub,
          actorEmail: context.actor?.email,
          channel: order.channel,
          previousStatus,
          requestedStatus: status,
          outcome: 'rejected',
          durationMs: Date.now() - startedAt,
        },
        OrdersService.CONTEXT,
      );
      throw new BadRequestException(error.message);
    }

    try {
      order.status = transition.status;
      const updated = await this.orderRepository.save(order);

      if (transition.status === 'cancelled') {
        updated.warehouseHandoff = await this.warehouseReservations.cancelOrderItems(updated);
        await this.orderRepository.save(updated);
      }

      await this.orderEvents.publishOrderUpdated(
        id,
        transition.status,
        transition.approvalAudit
          ? {
              previousStatus,
              approval: transition.approvalAudit,
            }
          : undefined,
      );

      this.logger.audit(
        {
          operation: 'order.status.update',
          resourceType: 'order',
          resourceId: id,
          actorId: context.actor?.sub,
          actorEmail: context.actor?.email,
          channel: order.channel,
          previousStatus,
          requestedStatus: status,
          resultingStatus: transition.status,
          reasonCode: transition.approvalAudit?.reasonCode,
          outcome: 'success',
          durationMs: Date.now() - startedAt,
        },
        OrdersService.CONTEXT,
      );

      return updated;
    } catch (error) {
      this.logger.audit(
        {
          operation: 'order.status.update',
          resourceType: 'order',
          resourceId: id,
          actorId: context.actor?.sub,
          actorEmail: context.actor?.email,
          channel: order.channel,
          previousStatus,
          requestedStatus: status,
          resultingStatus: transition.status,
          outcome: 'failure',
          durationMs: Date.now() - startedAt,
        },
        OrdersService.CONTEXT,
      );
      throw error;
    }
  }

  async applyPaymentStatus(
    id: string,
    data: PaymentStatusUpdateRequestDto,
    actor: OrderStatusActorContext = {},
  ): Promise<Order> {
    const startedAt = Date.now();
    const order = await this.findOne(id);
    const previousStatus = order.status;
    const previousPaymentStatus = order.paymentStatus;
    let normalized: NormalizedPaymentStatusUpdate;

    try {
      normalized = normalizePaymentStatusUpdate(data);
      if (order.status === 'cancelled' && normalized.paymentStatus === 'paid') {
        throw new BadRequestException('Payments cannot mark a cancelled order as paid');
      }
      if (previousPaymentStatus === 'paid' && normalized.paymentStatus !== 'paid') {
        throw new BadRequestException('Paid orders require a separate owner-approved refund or correction workflow');
      }
      if (
        previousPaymentStatus === 'paid' &&
        normalized.paymentStatus === 'paid' &&
        order.paymentReferenceId &&
        order.paymentReferenceId !== normalized.paymentReferenceId
      ) {
        throw new BadRequestException('Paid payment reference cannot be replaced by Orders');
      }

      order.paymentReferenceId = normalized.paymentReferenceId;
      order.paymentApplicationId = normalized.paymentApplicationId || order.paymentApplicationId;
      order.paymentMethod = normalized.paymentMethod || order.paymentMethod;
      order.paymentStatus = normalized.paymentStatus;
      order.paymentUpdatedAt = normalized.paymentUpdatedAt;

      const shouldConfirmOrder = normalized.paymentStatus === 'paid' && order.status === 'pending';
      if (shouldConfirmOrder) {
        order.status = 'confirmed';
      }

      const updated = await this.orderRepository.save(order);

      const paymentStatusChanged = previousPaymentStatus !== normalized.paymentStatus;
      if (normalized.paymentStatus === 'paid' && paymentStatusChanged) {
        updated.warehouseHandoff = await this.warehouseReservations.fulfillOrderItems(updated);
        await this.orderRepository.save(updated);
      } else if (
        (normalized.paymentStatus === 'failed' || normalized.paymentStatus === 'cancelled') &&
        paymentStatusChanged
      ) {
        updated.warehouseHandoff = await this.warehouseReservations.releaseOrderItems(updated);
        await this.orderRepository.save(updated);
      }

      if (shouldConfirmOrder) {
        await this.orderEvents.publishOrderUpdated(id, 'confirmed', { previousStatus });
      }
      if (normalized.paymentStatus === 'paid' && previousPaymentStatus !== 'paid') {
        await this.orderEvents.publishOrderPaid(id, normalized.paymentReferenceId);
      }

      this.logger.audit(
        {
          operation: 'order.payment_status.update',
          resourceType: 'order',
          resourceId: id,
          actorId: actor?.sub,
          actorEmail: actor?.email,
          channel: order.channel,
          previousStatus: previousPaymentStatus,
          requestedStatus: normalized.paymentStatus,
          resultingStatus: updated.paymentStatus,
          outcome: 'success',
          durationMs: Date.now() - startedAt,
        },
        OrdersService.CONTEXT,
      );

      return updated;
    } catch (error) {
      this.logger.audit(
        {
          operation: 'order.payment_status.update',
          resourceType: 'order',
          resourceId: id,
          actorId: actor?.sub,
          actorEmail: actor?.email,
          channel: order.channel,
          previousStatus: previousPaymentStatus,
          outcome: 'rejected',
          durationMs: Date.now() - startedAt,
        },
        OrdersService.CONTEXT,
      );
      throw error;
    }
  }

  async findByExternalId(externalOrderId: string, channel: string): Promise<Order | null> {
    return this.orderRepository.findOne({
      where: { externalOrderId, channel },
      relations: ['items'],
    });
  }

  private normalizeProductSalesStatisticsFilters(
    productId: string,
    filters: ProductSalesStatisticsFilters,
  ): NormalizedProductSalesStatisticsFilters {
    const normalizedProductId = this.normalizeProductSalesString(productId, 'productId');
    const channel = filters.channel
      ? this.normalizeProductSalesString(filters.channel, 'channel').toLowerCase()
      : undefined;

    if (channel && !PRODUCT_SALES_ALLOWED_CHANNELS.has(channel)) {
      throw new BadRequestException(`Unsupported order channel filter: ${channel}`);
    }

    const statuses = filters.status
      ? filters.status.split(',').map((status) => this.normalizeProductSalesString(status, 'status').toLowerCase())
      : [...PRODUCT_SALES_DEFAULT_STATUSES];

    const unsupportedStatus = statuses.find((status) => !PRODUCT_SALES_ALLOWED_STATUSES.has(status));
    if (unsupportedStatus) {
      throw new BadRequestException(`Unsupported order status filter: ${unsupportedStatus}`);
    }

    const uniqueStatuses = Array.from(new Set(statuses));
    const from = this.normalizeProductSalesDate(filters.from, 'from');
    const to = this.normalizeProductSalesDate(filters.to, 'to');
    if (from && to && from.getTime() > to.getTime()) {
      throw new BadRequestException('from must be before or equal to to');
    }

    return {
      productId: normalizedProductId,
      from,
      to,
      channel,
      statuses: uniqueStatuses,
    };
  }

  private buildProductSalesBaseQuery(filters: NormalizedProductSalesStatisticsFilters) {
    const orderDateExpression = 'COALESCE(orders.orderedAt, orders.createdAt)';
    const query = this.orderRepository
      .createQueryBuilder('orders')
      .innerJoin('orders.items', 'item')
      .where('item.productId = :productId', { productId: filters.productId })
      .andWhere('orders.status IN (:...statuses)', { statuses: filters.statuses });

    if (filters.channel) {
      query.andWhere('orders.channel = :channel', { channel: filters.channel });
    }
    if (filters.from) {
      query.andWhere(`${orderDateExpression} >= :from`, { from: filters.from });
    }
    if (filters.to) {
      query.andWhere(`${orderDateExpression} <= :to`, { to: filters.to });
    }

    return query;
  }

  private serializeProductSalesAggregate(row: ProductSalesAggregateRawRow) {
    return {
      currency: row.currency || 'UNKNOWN',
      orderCount: this.toProductSalesInteger(row.orderCount),
      itemLineCount: this.toProductSalesInteger(row.itemLineCount),
      quantitySold: this.toProductSalesInteger(row.quantitySold),
      grossItemRevenue: this.toProductSalesNumber(row.grossItemRevenue),
      lastOrderAt: this.toProductSalesIso(row.lastOrderAt || row.lastorderat),
    };
  }

  private serializeProductSalesHistory(row: ProductSalesHistoryRawRow) {
    return {
      orderId: row.orderId || row.orderid || null,
      channel: row.channel || 'unknown',
      status: row.status || 'unknown',
      currency: row.currency || 'UNKNOWN',
      itemLineCount: this.toProductSalesInteger(row.itemLineCount),
      quantitySold: this.toProductSalesInteger(row.quantitySold),
      grossItemRevenue: this.toProductSalesNumber(row.grossItemRevenue),
      orderedAt: this.toProductSalesIso(row.orderedAt || row.orderedat),
    };
  }

  private buildProductSalesSummary(totalsByCurrency: ReturnType<OrdersService['serializeProductSalesAggregate']>[]) {
    const currencies = totalsByCurrency.map((row) => row.currency).sort();
    const singleCurrency = totalsByCurrency.length === 1 ? totalsByCurrency[0] : null;
    return {
      orderCount: totalsByCurrency.reduce((sum, row) => sum + row.orderCount, 0),
      itemLineCount: totalsByCurrency.reduce((sum, row) => sum + row.itemLineCount, 0),
      quantitySold: totalsByCurrency.reduce((sum, row) => sum + row.quantitySold, 0),
      grossItemRevenue: singleCurrency ? singleCurrency.grossItemRevenue : totalsByCurrency.length === 0 ? 0 : null,
      currency: singleCurrency ? singleCurrency.currency : null,
      currencies,
      mixedCurrency: totalsByCurrency.length > 1,
      totalsByCurrency,
      lastOrderAt: totalsByCurrency
        .map((row) => row.lastOrderAt)
        .filter(Boolean)
        .sort()
        .pop() || null,
    };
  }

  private normalizeProductSalesString(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${field} is required`);
    }
    const normalized = value.trim();
    if (normalized.length > 500) {
      throw new BadRequestException(`${field} is too long`);
    }
    return normalized;
  }

  private normalizeProductSalesDate(value: string | undefined, field: string): Date | undefined {
    if (!value) return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.valueOf())) {
      throw new BadRequestException(`${field} must be a valid ISO timestamp`);
    }
    return date;
  }

  private toProductSalesInteger(value: unknown): number {
    const parsed = Number(value || 0);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
  }

  private toProductSalesNumber(value: unknown): number {
    const parsed = Number(value || 0);
    return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
  }

  private toProductSalesIso(value: unknown): string | null {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(String(value));
    return Number.isNaN(date.valueOf()) ? null : date.toISOString();
  }

  private async findByCreateOrderIdempotencyKey(key: CreateOrderIdempotencyKey): Promise<Order | null> {
    const query = this.orderRepository
      .createQueryBuilder('orders')
      .leftJoinAndSelect('orders.items', 'items')
      .where('orders.channel = :channel', { channel: key.channel })
      .andWhere('orders.externalOrderId = :externalOrderId', { externalOrderId: key.externalOrderId });

    if (key.channelAccountId) {
      query.andWhere('orders.channelAccountId = :channelAccountId', { channelAccountId: key.channelAccountId });
    } else {
      query.andWhere('(orders.channelAccountId IS NULL OR orders.channelAccountId = :empty)', { empty: '' });
    }

    return query.getOne();
  }
}
