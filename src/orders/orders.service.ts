import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { Order } from './order.entity';
import { OrderEventsService } from './order-events.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly httpService: HttpService,
    private readonly orderEvents: OrderEventsService,
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

  async create(data: Partial<Order>): Promise<Order> {
    const order = this.orderRepository.create(data);
    const saved = await this.orderRepository.save(order);

    // Reserve stock via warehouse-microservice
    const warehouseUrl = process.env.WAREHOUSE_SERVICE_URL || 'http://warehouse-microservice:3201';
    // Stock reservation logic would go here

    // Publish event
    await this.orderEvents.publishOrderCreated(saved.id, saved.channel);

    return saved;
  }

  async updateStatus(id: string, status: string): Promise<Order> {
    const order = await this.findOne(id);
    order.status = status;
    const updated = await this.orderRepository.save(order);

    await this.orderEvents.publishOrderUpdated(id, status);

    return updated;
  }

  async findByExternalId(externalOrderId: string, channel: string): Promise<Order | null> {
    return this.orderRepository.findOne({
      where: { externalOrderId, channel },
      relations: ['items'],
    });
  }
}

