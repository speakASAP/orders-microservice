import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
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
import { OrderFulfillmentHandoffClient } from './order-fulfillment-handoff.client';
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
import {
  OrderLifecycleReadFilters,
  buildLifecycleAggregates,
  buildOrderLifecycleChangedPayload,
  deriveOrderLifecycleState,
  normalizeOrderLifecycleReadFilters,
  serializeOrderLifecycleReadModel,
  validateOrderLifecycleTransition,
  type OrderLifecycleStage,
} from './order-lifecycle';
import {
  WarehouseFulfillmentStatusUpdateRequestDto,
  normalizeWarehouseFulfillmentStatusUpdate,
} from './warehouse-fulfillment-status.dto';

const PRODUCT_SALES_DEFAULT_STATUSES = ['confirmed', 'processing', 'shipped', 'delivered'] as const;
const SELLABLE_ORDER_CHANNELS: Set<string> = new Set(['flipflop', 'allegro', 'aukro', 'bazos', 'heureka', 'cliplot']);
const PRODUCT_SALES_ALLOWED_STATUSES: Set<string> = new Set(['pending', ...PRODUCT_SALES_DEFAULT_STATUSES, 'cancelled']);
const PRODUCT_SALES_ALLOWED_CHANNELS: Set<string> = new Set(['flipflop', 'allegro', 'aukro', 'bazos', 'heureka', 'cliplot']);
const PRODUCT_SALES_HISTORY_LIMIT = 10;
const PRODUCT_SALES_LIFECYCLE_ORDER_LIMIT = 1000;
const ORDER_AFFINITY_REPLAY_DEFAULT_LIMIT = 100;
const ORDER_AFFINITY_REPLAY_MAX_LIMIT = 500;
const ORDER_AFFINITY_REPLAY_STATUSES = ['confirmed', 'processing', 'shipped', 'delivered'] as const;
const ORDER_AFFINITY_REPLAY_PAYMENT_STATUSES = ['paid'] as const;

export interface ProductSalesStatisticsFilters {
  from?: string;
  to?: string;
  channel?: string;
  status?: string;
}

export interface OrdersLifecycleActor {
  sub?: string;
  email?: string;
  roles?: string[];
}

export interface OrderAffinityReplayFilters {
  from?: string;
  to?: string;
  channel?: string;
  limit?: string;
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
    private readonly fulfillmentHandoff?: OrderFulfillmentHandoffClient,
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


  async getOrderAffinityReplayCandidates(filters: OrderAffinityReplayFilters = {}) {
    const normalized = this.normalizeOrderAffinityReplayFilters(filters);
    const orderDateExpression = 'COALESCE(orders.orderedAt, orders.createdAt)';
    const query = this.orderRepository
      .createQueryBuilder('orders')
      .leftJoinAndSelect('orders.items', 'items')
      .where('LOWER(orders.status) IN (:...statuses)', { statuses: ORDER_AFFINITY_REPLAY_STATUSES })
      .andWhere('LOWER(orders.paymentStatus) IN (:...paymentStatuses)', { paymentStatuses: ORDER_AFFINITY_REPLAY_PAYMENT_STATUSES })
      .orderBy('orders.createdAt', 'ASC')
      .addOrderBy('orders.id', 'ASC')
      .take(normalized.limit);

    if (normalized.channel) {
      query.andWhere('LOWER(orders.channel) = :channel', { channel: normalized.channel });
    }
    if (normalized.from) {
      query.andWhere(`${orderDateExpression} >= :from`, { from: normalized.from });
    }
    if (normalized.to) {
      query.andWhere(`${orderDateExpression} <= :to`, { to: normalized.to });
    }

    const orders = await query.getMany();
    const events = orders
      .map((order) => this.toOrderAffinityReplayEvent(order))
      .filter((event): event is NonNullable<ReturnType<OrdersService['toOrderAffinityReplayEvent']>> => Boolean(event));

    return {
      sourceOwner: 'orders-microservice',
      consumerOwner: 'marketing-microservice',
      contract: 'orders.order_affinity_replay_candidates.v1',
      filters: {
        channel: normalized.channel ?? null,
        from: normalized.from ? normalized.from.toISOString() : null,
        to: normalized.to ? normalized.to.toISOString() : null,
        limit: normalized.limit,
        statuses: [...ORDER_AFFINITY_REPLAY_STATUSES],
        paymentStatuses: [...ORDER_AFFINITY_REPLAY_PAYMENT_STATUSES],
      },
      count: events.length,
      events,
    };
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

    const lifecycleOrders = await this.buildProductSalesLifecycleQuery(normalized).getMany();
    const lifecycleStatistics = this.buildProductSalesLifecycleStatistics(lifecycleOrders);

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
      lifecycleStatistics,
      orderDeliveryStatistics: lifecycleStatistics,
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

      await this.orderEvents.publishOrderCreated(
        saved.id,
        saved.channel,
        normalized.leadAttribution,
        saved.items?.map((item) => ({
          productId: item.productId,
          sku: item.sku || undefined,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
        })),
        saved.currency,
      );
      await this.publishLifecycleChangedIfNeeded(saved, null);

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

  async validateCreate(data: CreateOrderRequestDto) {
    const normalized = normalizeCreateOrderRequest(data);
    const idempotencyKey = getCreateOrderIdempotencyKey(normalized);
    const existing = await this.findByCreateOrderIdempotencyKey(idempotencyKey);
    const idempotencyStatus = existing
      ? (isMatchingCreateOrderReplay(existing, normalized) ? 'existing_matching_order' : 'existing_conflicting_order')
      : 'available';

    if (idempotencyStatus === 'existing_conflicting_order') {
      throw new ConflictException(
        'Order already exists for this channel, externalOrderId, and channelAccountId with different payload',
      );
    }

    return {
      valid: true,
      mutation: false,
      orderCreated: false,
      warehouseMutation: false,
      eventPublished: false,
      channel: idempotencyKey.channel,
      externalOrderId: idempotencyKey.externalOrderId,
      channelAccountId: idempotencyKey.channelAccountId || null,
      itemCount: normalized.items.length,
      total: normalized.order.total,
      currency: normalized.order.currency,
      paymentMethod: normalized.order.paymentMethod || null,
      shippingMethod: normalized.order.shippingMethod || null,
      bundleEvidenceCount: normalized.order.bundleEvidence?.length || 0,
      idempotencyStatus,
      existingOrderId: existing?.id || null,
    };
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

  async getCustomerLifecycleOrders(actor: OrdersLifecycleActor = {}, filters: OrderLifecycleReadFilters = {}) {
    const subject = this.normalizeActorSubject(actor);
    if (!subject) {
      throw new ForbiddenException('Authenticated customer Auth subject is required for customer order lifecycle reads');
    }

    const normalized = normalizeOrderLifecycleReadFilters(filters);
    const query = this.buildLifecycleQuery(normalized);
    this.applyCustomerIdentityScope(query, subject);
    const orders = await query.getMany();
    const models = this.filterLifecycleModels(
      orders.map((order) => serializeOrderLifecycleReadModel(order, {
        includeDeliveryAddress: true,
        includeWarehouseHandoff: true,
      })),
      normalized.lifecycleStage,
      normalized.limit,
    );

    return {
      generatedAt: new Date().toISOString(),
      actor: { subject },
      filters: this.serializeLifecycleFilters(normalized),
      count: models.length,
      orders: models,
    };
  }

  async getAdminLifecycleOrders(filters: OrderLifecycleReadFilters = {}) {
    const normalized = normalizeOrderLifecycleReadFilters(filters);
    const query = this.buildLifecycleQuery(normalized);
    const orders = await query.getMany();
    const models = this.filterLifecycleModels(
      orders.map((order) => serializeOrderLifecycleReadModel(order, {
        includeCustomer: true,
        includeDeliveryAddress: true,
        includeWarehouseHandoff: true,
      })),
      normalized.lifecycleStage,
      normalized.limit,
    );

    return {
      generatedAt: new Date().toISOString(),
      filters: this.serializeLifecycleFilters(normalized),
      count: models.length,
      aggregates: buildLifecycleAggregates(models),
      orders: models,
    };
  }

  async getLifecycleReadModel(id: string) {
    const order = await this.findOne(id);
    const model = serializeOrderLifecycleReadModel(order, {
      includeCustomer: true,
      includeDeliveryAddress: true,
      includeWarehouseHandoff: true,
    });

    return {
      ...model,
      lifecycle: {
        ...model.lifecycle,
        stage: model.lifecycle.lifecycleStage,
        status: model.lifecycle.lifecycleStage,
        rawStatus: model.lifecycle.status,
      },
      lifecycleStage: model.lifecycle.lifecycleStage,
      status: model.lifecycle.lifecycleStage,
      rawStatus: model.status,
      statusProjection: model.lifecycle.statusProjection,
      paymentStatus: model.lifecycle.paymentStatus,
      fulfillmentStatus: model.lifecycle.fulfillmentStatus,
      deliveryStatus: model.lifecycle.deliveryStatus,
      exceptionStatus: model.lifecycle.exceptionState,
      currency: model.totals.currency,
      subtotal: model.totals.subtotal,
      shippingCost: model.totals.shippingCost,
      tax: model.totals.taxAmount,
      total: model.totals.total,
      deliveryAddress: model.shipping.deliveryAddress,
    };
  }

  async updateStatus(id: string, status: string, context: OrderStatusTransitionContext = {}): Promise<Order> {
    const startedAt = Date.now();
    const order = await this.findOne(id);
    const previousStatus = order.status;
    const previousLifecycleStage = deriveOrderLifecycleState(order).lifecycleStage;
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

    if (transition.approvalAudit?.idempotencyKey && this.hasMatchingStatusIdempotencyKey(order, transition.approvalAudit.idempotencyKey, transition.status)) {
      this.logger.audit(
        {
          operation: 'order.status.update.idempotency_key_replay',
          resourceType: 'order',
          resourceId: id,
          actorId: context.actor?.sub,
          actorEmail: context.actor?.email,
          channel: order.channel,
          previousStatus,
          requestedStatus: status,
          resultingStatus: previousStatus,
          outcome: 'success',
          durationMs: Date.now() - startedAt,
        },
        OrdersService.CONTEXT,
      );
      return order;
    }

    if (transition.status === previousStatus) {
      this.logger.audit(
        {
          operation: 'order.status.update.idempotent_replay',
          resourceType: 'order',
          resourceId: id,
          actorId: context.actor?.sub,
          actorEmail: context.actor?.email,
          channel: order.channel,
          previousStatus,
          requestedStatus: status,
          resultingStatus: previousStatus,
          outcome: 'success',
          durationMs: Date.now() - startedAt,
        },
        OrdersService.CONTEXT,
      );
      return order;
    }

    try {
      order.status = transition.status;
      if (transition.approvalAudit) {
        order.statusTransitionAudit = transition.approvalAudit;
      }
      const updated = await this.orderRepository.save(order);

      if (transition.status === 'cancelled') {
        updated.warehouseHandoff = await this.warehouseReservations.cancelOrderItems(updated);
        await this.orderRepository.save(updated);
      }

      await this.publishLifecycleChangedIfNeeded(updated, previousLifecycleStage);

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

  private hasMatchingStatusIdempotencyKey(order: Order, idempotencyKey: string, resultingStatus: string): boolean {
    const audit = order.statusTransitionAudit as { idempotencyKey?: unknown; resultingStatus?: unknown } | undefined;
    return audit?.idempotencyKey === idempotencyKey && audit?.resultingStatus === resultingStatus;
  }

  async applyWarehouseFulfillmentStatus(
    id: string,
    data: WarehouseFulfillmentStatusUpdateRequestDto,
    actor: OrdersLifecycleActor = {},
  ): Promise<Order> {
    const order = await this.findOne(id);
    const previousLifecycleStage = deriveOrderLifecycleState(order).lifecycleStage;
    const normalized = normalizeWarehouseFulfillmentStatusUpdate(data);
    const { skipReason: _previousSkipReason, ...previousFulfillmentOrderHandoff } =
      (order.warehouseHandoff?.fulfillmentOrderHandoff || {}) as Record<string, unknown>;
    const fulfillmentOrderHandoff = {
      ...previousFulfillmentOrderHandoff,
      status: 'updated',
      warehouseStatus: normalized.status,
      updatedAt: normalized.occurredAt || new Date().toISOString(),
      reasonCode: normalized.reasonCode || 'WAREHOUSE_FULFILLMENT_STATUS',
      actor: normalized.actor || 'warehouse-microservice',
      ...(normalized.reference ? { reference: normalized.reference } : {}),
      ...(normalized.fulfillmentOrderId ? { fulfillmentOrderId: normalized.fulfillmentOrderId } : {}),
    };

    const updatedWarehouseHandoff = {
      ...(order.warehouseHandoff || {
        attemptedAt: new Date().toISOString(),
        itemCount: order.items?.length || 0,
        reservedCount: 0,
        failedCount: 0,
        reasonCode: 'WAREHOUSE_FULFILLMENT_STATUS',
        actor: 'orders-microservice',
      }),
      fulfillmentOrderHandoff,
    } as WarehouseHandoffSummary;

    order.warehouseHandoff = updatedWarehouseHandoff;
    const projected = deriveOrderLifecycleState(order).statusProjection;
    order.status = projected;
    const saved = await this.orderRepository.save(order);
    await this.publishLifecycleChangedIfNeeded(saved, previousLifecycleStage);
    this.logger.audit(
      {
        operation: 'order.warehouse_fulfillment_status.update',
        resourceType: 'order',
        resourceId: id,
        actorId: actor?.sub,
        actorEmail: actor?.email,
        previousStatus: previousLifecycleStage,
        requestedStatus: normalized.status,
        resultingStatus: deriveOrderLifecycleState(saved).lifecycleStage,
        outcome: 'success',
      },
      OrdersService.CONTEXT,
    );
    return saved;
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
    const previousLifecycleStage = deriveOrderLifecycleState(order).lifecycleStage;
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
        if (this.fulfillmentHandoff) {
          const fulfillmentOrderHandoff = await this.fulfillmentHandoff.createAfterPaymentFulfillment(updated);
          updated.warehouseHandoff = {
            ...updated.warehouseHandoff,
            fulfillmentOrderHandoff,
          } as WarehouseHandoffSummary;
        }
        await this.orderRepository.save(updated);
      } else if (
        (normalized.paymentStatus === 'failed' || normalized.paymentStatus === 'cancelled') &&
        paymentStatusChanged
      ) {
        updated.warehouseHandoff = await this.warehouseReservations.releaseOrderItems(updated);
        await this.orderRepository.save(updated);
      }

      await this.publishLifecycleChangedIfNeeded(updated, previousLifecycleStage);

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


  private buildProductSalesLifecycleQuery(filters: NormalizedProductSalesStatisticsFilters) {
    const orderDateExpression = 'COALESCE(orders.orderedAt, orders.createdAt)';
    const query = this.orderRepository
      .createQueryBuilder('orders')
      .innerJoinAndSelect('orders.items', 'item')
      .where('item.productId = :productId', { productId: filters.productId })
      .andWhere('orders.status IN (:...statuses)', { statuses: filters.statuses })
      .orderBy(orderDateExpression, 'DESC')
      .take(PRODUCT_SALES_LIFECYCLE_ORDER_LIMIT);

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

  private buildProductSalesLifecycleStatistics(orders: Order[]) {
    const byLifecycleStage: Record<string, number> = {};
    const byPaymentStatus: Record<string, number> = {};
    const byDeliveryStatus: Record<string, number> = {};
    const channelLifecycle = new Map<string, {
      byLifecycleStage: Record<string, number>;
      exceptionCounts: Record<string, number>;
    }>();
    const exceptionCounts = {
      paymentFailed: 0,
      notReceived: 0,
      returned: 0,
      cancelled: 0,
      delayed: 0,
      unfulfilled: 0,
    };

    for (const order of orders) {
      const state = deriveOrderLifecycleState(order);
      const channel = this.normalizeProductSalesAggregateKey(order.channel, 'unknown');
      this.incrementProductSalesCount(byLifecycleStage, state.lifecycleStage);
      this.incrementProductSalesCount(byPaymentStatus, state.paymentStatus);
      this.incrementProductSalesCount(byDeliveryStatus, state.deliveryStatus);

      const channelRow = this.getProductSalesChannelLifecycle(channelLifecycle, channel);
      this.incrementProductSalesCount(channelRow.byLifecycleStage, state.lifecycleStage);

      if (state.lifecycleStage === 'payment_failed') exceptionCounts.paymentFailed += 1;
      if (state.lifecycleStage === 'not_received') {
        exceptionCounts.notReceived += 1;
        channelRow.exceptionCounts.notReceived += 1;
      }
      if (state.lifecycleStage === 'returned') {
        exceptionCounts.returned += 1;
        channelRow.exceptionCounts.returned += 1;
      }
      if (state.lifecycleStage === 'cancelled') exceptionCounts.cancelled += 1;
      if (this.isProductSalesUnfulfilledStage(state.lifecycleStage)) {
        exceptionCounts.unfulfilled += 1;
        channelRow.exceptionCounts.unfulfilled += 1;
      }
    }

    return {
      source: 'orders',
      sourceStatus: 'available',
      orderCount: orders.length,
      sampledOrderLimit: PRODUCT_SALES_LIFECYCLE_ORDER_LIMIT,
      byLifecycleStage,
      byPaymentStatus,
      byDeliveryStatus,
      exceptionCounts,
      channelLifecycle: Array.from(channelLifecycle.entries())
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([channel, value]) => ({
          channel,
          byLifecycleStage: value.byLifecycleStage,
          exceptionCounts: value.exceptionCounts,
        })),
    };
  }

  private getProductSalesChannelLifecycle(
    rows: Map<string, { byLifecycleStage: Record<string, number>; exceptionCounts: Record<string, number> }>,
    channel: string,
  ) {
    const existing = rows.get(channel);
    if (existing) return existing;
    const created = {
      byLifecycleStage: {} as Record<string, number>,
      exceptionCounts: { notReceived: 0, returned: 0, delayed: 0, unfulfilled: 0 },
    };
    rows.set(channel, created);
    return created;
  }

  private incrementProductSalesCount(target: Record<string, number>, rawKey: unknown): void {
    const key = this.normalizeProductSalesAggregateKey(rawKey, 'unknown');
    target[key] = (target[key] || 0) + 1;
  }

  private normalizeProductSalesAggregateKey(value: unknown, fallback: string): string {
    if (typeof value !== 'string') return fallback;
    const normalized = value.trim().toLowerCase();
    return normalized || fallback;
  }

  private isProductSalesUnfulfilledStage(stage: OrderLifecycleStage): boolean {
    return [
      'paid_not_delivered',
      'warehouse_fulfillment_requested',
      'warehouse_collecting',
      'warehouse_forming',
      'warehouse_formed',
    ].includes(stage);
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


  private normalizeOrderAffinityReplayFilters(filters: OrderAffinityReplayFilters) {
    const channel = filters.channel ? String(filters.channel).trim().toLowerCase() : undefined;
    if (channel && !PRODUCT_SALES_ALLOWED_CHANNELS.has(channel)) {
      throw new BadRequestException(`channel must be one of: ${Array.from(PRODUCT_SALES_ALLOWED_CHANNELS).join(', ')}`);
    }
    const from = this.parseOptionalDate(filters.from, 'from');
    const to = this.parseOptionalDate(filters.to, 'to');
    if (from && to && from.getTime() > to.getTime()) {
      throw new BadRequestException('from must be before or equal to to');
    }
    const parsedLimit = Number.parseInt(String(filters.limit || ''), 10);
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), ORDER_AFFINITY_REPLAY_MAX_LIMIT)
      : ORDER_AFFINITY_REPLAY_DEFAULT_LIMIT;
    return { channel, from, to, limit };
  }

  private toOrderAffinityReplayEvent(order: Order) {
    const items = (order.items || [])
      .map((item) => ({
        productId: String(item.productId || '').trim(),
        ...(item.sku ? { sku: String(item.sku).trim() } : {}),
        quantity: this.toProductSalesInteger(item.quantity),
        ...(item.unitPrice != null ? { unitPrice: this.toProductSalesNumber(item.unitPrice) } : {}),
        ...(item.totalPrice != null ? { totalPrice: this.toProductSalesNumber(item.totalPrice) } : {}),
      }))
      .filter((item) => item.productId && item.quantity > 0);
    const uniqueProductIds = new Set(items.map((item) => item.productId));
    if (uniqueProductIds.size < 2) return null;
    const occurredAt = (order.orderedAt || order.createdAt || new Date()).toISOString();
    return {
      type: 'orders.order.created.v1',
      eventVersion: 1,
      eventId: `orders.order.created.v1:historical:${order.id}`,
      occurredAt,
      source: 'orders-microservice',
      payload: {
        orderId: `historical:${order.id}`,
        channel: String(order.channel || '').toLowerCase(),
        items,
        ...(order.currency ? { currency: order.currency } : {}),
      },
    };
  }

  private parseOptionalDate(value: string | undefined, field: string): Date | undefined {
    if (!value) return undefined;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.valueOf())) {
      throw new BadRequestException(`${field} must be an ISO timestamp`);
    }
    return parsed;
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

  private buildLifecycleQuery(filters: ReturnType<typeof normalizeOrderLifecycleReadFilters>): SelectQueryBuilder<Order> {
    const orderDateExpression = 'COALESCE(orders.orderedAt, orders.createdAt)';
    const query = this.orderRepository
      .createQueryBuilder('orders')
      .leftJoinAndSelect('orders.items', 'items')
      .addSelect(orderDateExpression, 'order_sort_at')
      .orderBy('order_sort_at', 'DESC')
      .take(filters.limit * (filters.lifecycleStage ? 3 : 1));

    if (filters.channel) {
      query.andWhere('LOWER(orders.channel) = :channel', { channel: filters.channel });
    }
    if (filters.status) {
      query.andWhere('LOWER(orders.status) = :status', { status: filters.status });
    }
    if (filters.paymentStatus) {
      query.andWhere('LOWER(orders.paymentStatus) = :paymentStatus', { paymentStatus: filters.paymentStatus });
    }
    if (filters.from) {
      query.andWhere(`${orderDateExpression} >= :from`, { from: filters.from });
    }
    if (filters.to) {
      query.andWhere(`${orderDateExpression} <= :to`, { to: filters.to });
    }

    return query;
  }

  private filterLifecycleModels(
    models: ReturnType<typeof serializeOrderLifecycleReadModel>[],
    lifecycleStage: OrderLifecycleStage | undefined,
    limit: number,
  ) {
    const filtered = lifecycleStage
      ? models.filter((model) => model.lifecycle.lifecycleStage === lifecycleStage)
      : models;
    return filtered.slice(0, limit);
  }

  private serializeLifecycleFilters(filters: ReturnType<typeof normalizeOrderLifecycleReadFilters>) {
    return {
      channel: filters.channel || null,
      status: filters.status || null,
      lifecycleStage: filters.lifecycleStage || null,
      paymentStatus: filters.paymentStatus || null,
      from: filters.from?.toISOString() || null,
      to: filters.to?.toISOString() || null,
      limit: filters.limit,
    };
  }

  private applyCustomerIdentityScope(
    query: SelectQueryBuilder<Order>,
    subject: string,
  ): void {
    query.andWhere(
      `(LOWER(orders.customer ->> 'authUserId') = :customerSubject OR LOWER(orders.customer ->> 'subject') = :customerSubject)`,
      { customerSubject: subject },
    );
  }

  private normalizeActorSubject(actor: OrdersLifecycleActor): string | null {
    if (!actor.sub || typeof actor.sub !== 'string') return null;
    const normalized = actor.sub.trim().toLowerCase();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(normalized)) return null;
    return normalized;
  }

  private async publishLifecycleChangedIfNeeded(
    order: Order,
    previousLifecycleStage: OrderLifecycleStage | null,
  ): Promise<void> {
    const payload = buildOrderLifecycleChangedPayload(order, previousLifecycleStage);
    if (previousLifecycleStage === payload.lifecycleStage) return;
    validateOrderLifecycleTransition(previousLifecycleStage, payload.lifecycleStage, { mode: 'coarse_projection' });
    await this.orderEvents.publishOrderLifecycleChanged(payload);
  }
}
