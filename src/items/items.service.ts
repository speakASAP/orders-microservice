import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderItem } from './order-item.entity';
import { validateItemFulfillmentTransition } from '../orders/status-transitions';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(OrderItem)
    private readonly itemRepository: Repository<OrderItem>,
  ) {}

  async findByOrder(orderId: string): Promise<OrderItem[]> {
    return this.itemRepository.find({ where: { orderId } });
  }

  async addItem(orderId: string, data: Partial<OrderItem>): Promise<OrderItem> {
    const item = this.itemRepository.create({ ...data, orderId });
    return this.itemRepository.save(item);
  }

  async updateFulfillmentStatus(id: string, status: string): Promise<OrderItem> {
    const item = await this.itemRepository.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Order item ${id} not found`);

    let nextStatus: string;
    try {
      nextStatus = validateItemFulfillmentTransition(item.fulfillmentStatus, status);
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    item.fulfillmentStatus = nextStatus;
    return this.itemRepository.save(item);
  }
}
