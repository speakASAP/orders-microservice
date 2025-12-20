import { Controller, Get, Post, Put, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import { Shipment } from './shipment.entity';

@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Get('order/:orderId')
  async findByOrder(@Param('orderId', ParseUUIDPipe) orderId: string) {
    const shipments = await this.shipmentsService.findByOrder(orderId);
    return { success: true, data: shipments };
  }

  @Post()
  async create(@Body() data: Partial<Shipment>) {
    const shipment = await this.shipmentsService.create(data);
    return { success: true, data: shipment };
  }

  @Put(':id/tracking')
  async updateTracking(@Param('id', ParseUUIDPipe) id: string, @Body() body: { trackingNumber: string; trackingUrl?: string }) {
    const shipment = await this.shipmentsService.updateTracking(id, body.trackingNumber, body.trackingUrl);
    return { success: true, data: shipment };
  }

  @Put(':id/status')
  async updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() body: { status: string }) {
    const shipment = await this.shipmentsService.updateStatus(id, body.status);
    return { success: true, data: shipment };
  }
}

