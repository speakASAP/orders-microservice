import { Controller, Get, Post, Put, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ItemsService } from './items.service';
import { OrderItem } from './order-item.entity';

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get('order/:orderId')
  async findByOrder(@Param('orderId', ParseUUIDPipe) orderId: string) {
    const items = await this.itemsService.findByOrder(orderId);
    return { success: true, data: items };
  }

  @Post('order/:orderId')
  async addItem(@Param('orderId', ParseUUIDPipe) orderId: string, @Body() data: Partial<OrderItem>) {
    const item = await this.itemsService.addItem(orderId, data);
    return { success: true, data: item };
  }

  @Put(':id/fulfillment')
  async updateFulfillment(@Param('id', ParseUUIDPipe) id: string, @Body() body: { status: string }) {
    const item = await this.itemsService.updateFulfillmentStatus(id, body.status);
    return { success: true, data: item };
  }
}

