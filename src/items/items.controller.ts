import { Controller, Get, Post, Put, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ItemsService } from './items.service';
import { OrderItem } from './order-item.entity';
import { Roles } from '../auth/roles.decorator';
import { ADMIN_READ_ROLES, ADMIN_ACTION_ROLES } from '../admin/admin.service';

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Roles(...ADMIN_READ_ROLES)
  @Get('order/:orderId')
  async findByOrder(@Param('orderId', ParseUUIDPipe) orderId: string) {
    const items = await this.itemsService.findByOrder(orderId);
    return { success: true, data: items };
  }

  @Roles(...ADMIN_ACTION_ROLES)
  @Post('order/:orderId')
  async addItem(@Param('orderId', ParseUUIDPipe) orderId: string, @Body() data: Partial<OrderItem>) {
    const item = await this.itemsService.addItem(orderId, data);
    return { success: true, data: item };
  }

  @Roles(...ADMIN_ACTION_ROLES)
  @Put(':id/fulfillment')
  async updateFulfillment(@Param('id', ParseUUIDPipe) id: string, @Body() body: { status: string }) {
    const item = await this.itemsService.updateFulfillmentStatus(id, body.status);
    return { success: true, data: item };
  }
}

