import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderItem } from './order-item.entity';

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
    await this.itemRepository.update(id, { fulfillmentStatus: status });
    return this.itemRepository.findOne({ where: { id } });
  }
}

