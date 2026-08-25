import { Controller, Get, Post, Put, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import { Shipment } from './shipment.entity';
import { Roles } from '../auth/roles.decorator';
import { ADMIN_READ_ROLES, ADMIN_ACTION_ROLES } from '../admin/admin.service';

@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Roles(...ADMIN_READ_ROLES)
  @Get('order/:orderId')
  async findByOrder(@Param('orderId', ParseUUIDPipe) orderId: string) {
    const shipments = await this.shipmentsService.findByOrder(orderId);
    return { success: true, data: shipments };
  }

  @Roles(...ADMIN_ACTION_ROLES)
  @Post()
  async create(@Body() data: Partial<Shipment>) {
    const shipment = await this.shipmentsService.create(data);
    return { success: true, data: shipment };
  }

  @Roles(...ADMIN_ACTION_ROLES)
  @Put(':id/tracking')
  async updateTracking(@Param('id', ParseUUIDPipe) id: string, @Body() body: { trackingNumber: string; trackingUrl?: string }) {
    const shipment = await this.shipmentsService.updateTracking(id, body.trackingNumber, body.trackingUrl);
    return { success: true, data: shipment };
  }

  @Roles(...ADMIN_ACTION_ROLES)
  @Put(':id/status')
  async updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() body: { status: string }) {
    const shipment = await this.shipmentsService.updateStatus(id, body.status);
    return { success: true, data: shipment };
  }
}

