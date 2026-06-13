import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoggerService } from '../logger/logger.service';
import { Shipment } from './shipment.entity';

@Injectable()
export class ShipmentsService {
  private static readonly CONTEXT = 'ShipmentsService';

  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentRepository: Repository<Shipment>,
    private readonly logger: LoggerService,
  ) {}

  async findByOrder(orderId: string): Promise<Shipment[]> {
    return this.shipmentRepository.find({ where: { orderId } });
  }

  async create(data: Partial<Shipment>): Promise<Shipment> {
    const startedAt = Date.now();
    let shipment: Shipment | undefined;
    try {
      shipment = this.shipmentRepository.create(data);
      const saved = await this.shipmentRepository.save(shipment);
      this.logger.audit(
        {
          operation: 'shipment.create',
          resourceType: 'shipment',
          resourceId: saved.id,
          parentResourceId: saved.orderId,
          resultingStatus: saved.status,
          outcome: 'success',
          durationMs: Date.now() - startedAt,
        },
        ShipmentsService.CONTEXT,
      );
      return saved;
    } catch (error) {
      this.logger.audit(
        {
          operation: 'shipment.create',
          resourceType: 'shipment',
          resourceId: shipment?.id,
          parentResourceId: data.orderId,
          outcome: 'failure',
          durationMs: Date.now() - startedAt,
        },
        ShipmentsService.CONTEXT,
      );
      throw error;
    }
  }

  async updateTracking(id: string, trackingNumber: string, trackingUrl?: string): Promise<Shipment> {
    const startedAt = Date.now();
    const shipment = await this.shipmentRepository.findOne({ where: { id } });
    if (!shipment) throw new NotFoundException(`Shipment ${id} not found`);

    const previousStatus = shipment.status;
    try {
      shipment.trackingNumber = trackingNumber;
      if (trackingUrl) shipment.trackingUrl = trackingUrl;
      shipment.status = 'picked_up';
      shipment.shippedAt = new Date();

      const saved = await this.shipmentRepository.save(shipment);
      this.logger.audit(
        {
          operation: 'shipment.tracking.update',
          resourceType: 'shipment',
          resourceId: id,
          parentResourceId: shipment.orderId,
          previousStatus,
          resultingStatus: shipment.status,
          outcome: 'success',
          durationMs: Date.now() - startedAt,
        },
        ShipmentsService.CONTEXT,
      );
      return saved;
    } catch (error) {
      this.logger.audit(
        {
          operation: 'shipment.tracking.update',
          resourceType: 'shipment',
          resourceId: id,
          parentResourceId: shipment.orderId,
          previousStatus,
          resultingStatus: shipment.status,
          outcome: 'failure',
          durationMs: Date.now() - startedAt,
        },
        ShipmentsService.CONTEXT,
      );
      throw error;
    }
  }

  async updateStatus(id: string, status: string): Promise<Shipment> {
    const startedAt = Date.now();
    const shipment = await this.shipmentRepository.findOne({ where: { id } });
    if (!shipment) throw new NotFoundException(`Shipment ${id} not found`);

    const previousStatus = shipment.status;
    try {
      shipment.status = status;
      if (status === 'delivered') shipment.deliveredAt = new Date();

      const saved = await this.shipmentRepository.save(shipment);
      this.logger.audit(
        {
          operation: 'shipment.status.update',
          resourceType: 'shipment',
          resourceId: id,
          parentResourceId: shipment.orderId,
          previousStatus,
          requestedStatus: status,
          resultingStatus: shipment.status,
          outcome: 'success',
          durationMs: Date.now() - startedAt,
        },
        ShipmentsService.CONTEXT,
      );
      return saved;
    } catch (error) {
      this.logger.audit(
        {
          operation: 'shipment.status.update',
          resourceType: 'shipment',
          resourceId: id,
          parentResourceId: shipment.orderId,
          previousStatus,
          requestedStatus: status,
          resultingStatus: shipment.status,
          outcome: 'failure',
          durationMs: Date.now() - startedAt,
        },
        ShipmentsService.CONTEXT,
      );
      throw error;
    }
  }
}
