import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { LoggerService } from '../logger/logger.service';
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
  OrderStatusTransitionContext,
  validateOrderStatusTransitionWithAudit,
} from './status-transitions';

@Injectable()
export class OrdersService {
  private static readonly CONTEXT = 'OrdersService';

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly httpService: HttpService,
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
        return savedOrder;
      });

      // Reserve stock via warehouse-microservice
      const warehouseUrl = process.env.WAREHOUSE_SERVICE_URL || 'http://warehouse-microservice:3201';
      void warehouseUrl;
      // Stock reservation logic would go here

      // Publish event
      await this.orderEvents.publishOrderCreated(saved.id, saved.channel);

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

  async findByExternalId(externalOrderId: string, channel: string): Promise<Order | null> {
    return this.orderRepository.findOne({
      where: { externalOrderId, channel },
      relations: ['items'],
    });
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
