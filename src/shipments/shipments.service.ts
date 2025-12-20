import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment } from './shipment.entity';

@Injectable()
export class ShipmentsService {
  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentRepository: Repository<Shipment>,
  ) {}

  async findByOrder(orderId: string): Promise<Shipment[]> {
    return this.shipmentRepository.find({ where: { orderId } });
  }

  async create(data: Partial<Shipment>): Promise<Shipment> {
    const shipment = this.shipmentRepository.create(data);
    return this.shipmentRepository.save(shipment);
  }

  async updateTracking(id: string, trackingNumber: string, trackingUrl?: string): Promise<Shipment> {
    const shipment = await this.shipmentRepository.findOne({ where: { id } });
    if (!shipment) throw new NotFoundException(`Shipment ${id} not found`);

    shipment.trackingNumber = trackingNumber;
    if (trackingUrl) shipment.trackingUrl = trackingUrl;
    shipment.status = 'picked_up';
    shipment.shippedAt = new Date();

    return this.shipmentRepository.save(shipment);
  }

  async updateStatus(id: string, status: string): Promise<Shipment> {
    const shipment = await this.shipmentRepository.findOne({ where: { id } });
    if (!shipment) throw new NotFoundException(`Shipment ${id} not found`);

    shipment.status = status;
    if (status === 'delivered') shipment.deliveredAt = new Date();

    return this.shipmentRepository.save(shipment);
  }
}

