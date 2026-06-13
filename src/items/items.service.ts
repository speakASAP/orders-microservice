import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoggerService } from '../logger/logger.service';
import { OrderItem } from './order-item.entity';
import { validateItemFulfillmentTransition } from '../orders/status-transitions';

@Injectable()
export class ItemsService {
  private static readonly CONTEXT = 'ItemsService';

  constructor(
    @InjectRepository(OrderItem)
    private readonly itemRepository: Repository<OrderItem>,
    private readonly logger: LoggerService,
  ) {}

  async findByOrder(orderId: string): Promise<OrderItem[]> {
    return this.itemRepository.find({ where: { orderId } });
  }

  async addItem(orderId: string, data: Partial<OrderItem>): Promise<OrderItem> {
    const startedAt = Date.now();
    let item: OrderItem | undefined;
    try {
      item = this.itemRepository.create({ ...data, orderId });
      const saved = await this.itemRepository.save(item);
      this.logger.audit(
        {
          operation: 'order_item.create',
          resourceType: 'order_item',
          resourceId: saved.id,
          parentResourceId: orderId,
          resultingStatus: saved.fulfillmentStatus,
          outcome: 'success',
          durationMs: Date.now() - startedAt,
        },
        ItemsService.CONTEXT,
      );
      return saved;
    } catch (error) {
      this.logger.audit(
        {
          operation: 'order_item.create',
          resourceType: 'order_item',
          resourceId: item?.id,
          parentResourceId: orderId,
          outcome: 'failure',
          durationMs: Date.now() - startedAt,
        },
        ItemsService.CONTEXT,
      );
      throw error;
    }
  }

  async updateFulfillmentStatus(id: string, status: string): Promise<OrderItem> {
    const startedAt = Date.now();
    const item = await this.itemRepository.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Order item ${id} not found`);

    const previousStatus = item.fulfillmentStatus;
    let nextStatus: string;
    try {
      nextStatus = validateItemFulfillmentTransition(previousStatus, status);
    } catch (error) {
      this.logger.audit(
        {
          operation: 'order_item.fulfillment.update',
          resourceType: 'order_item',
          resourceId: id,
          parentResourceId: item.orderId,
          previousStatus,
          requestedStatus: status,
          outcome: 'rejected',
          durationMs: Date.now() - startedAt,
        },
        ItemsService.CONTEXT,
      );
      throw new BadRequestException(error.message);
    }

    try {
      item.fulfillmentStatus = nextStatus;
      const saved = await this.itemRepository.save(item);
      this.logger.audit(
        {
          operation: 'order_item.fulfillment.update',
          resourceType: 'order_item',
          resourceId: id,
          parentResourceId: item.orderId,
          previousStatus,
          requestedStatus: status,
          resultingStatus: nextStatus,
          outcome: 'success',
          durationMs: Date.now() - startedAt,
        },
        ItemsService.CONTEXT,
      );
      return saved;
    } catch (error) {
      this.logger.audit(
        {
          operation: 'order_item.fulfillment.update',
          resourceType: 'order_item',
          resourceId: id,
          parentResourceId: item.orderId,
          previousStatus,
          requestedStatus: status,
          resultingStatus: nextStatus,
          outcome: 'failure',
          durationMs: Date.now() - startedAt,
        },
        ItemsService.CONTEXT,
      );
      throw error;
    }
  }
}
