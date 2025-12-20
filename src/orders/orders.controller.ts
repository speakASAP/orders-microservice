import { Controller, Get, Post, Put, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Order } from './order.entity';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async findAll(@Query('channel') channel?: string, @Query('status') status?: string) {
    const orders = await this.ordersService.findAll(channel, status);
    return { success: true, data: orders };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const order = await this.ordersService.findOne(id);
    return { success: true, data: order };
  }

  @Post()
  async create(@Body() data: Partial<Order>) {
    const order = await this.ordersService.create(data);
    return { success: true, data: order };
  }

  @Put(':id/status')
  async updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() body: { status: string }) {
    const order = await this.ordersService.updateStatus(id, body.status);
    return { success: true, data: order };
  }
}

