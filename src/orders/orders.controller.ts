import { Controller, Get, Post, Put, Body, Param, Query, ParseUUIDPipe, Req } from '@nestjs/common';
import { Request } from 'express';
import { OrdersService } from './orders.service';
import { OrderStatusApprovalInput } from './status-transitions';
import { CreateOrderRequestDto } from './create-order.dto';
import { PaymentStatusUpdateRequestDto } from '../payments/payment-status.dto';
import { Roles } from '../auth/roles.decorator';

interface OrderStatusUpdateBody {
  status: string;
  approval?: OrderStatusApprovalInput;
}

interface AuthenticatedRequest extends Request {
  user?: {
    sub?: string;
    email?: string;
    roles?: string[];
  };
}

export const CHANNEL_ORDER_CREATE_ROLES = [
  'global:superadmin',
  'internal:orders-microservice:admin',
  'internal:flipflop-service:service',
  'internal:allegro-service:service',
  'internal:aukro-service:service',
  'internal:bazos-service:service',
  'internal:heureka-service:service',
  'internal:cliplot-service:service',
] as const;

export const PRODUCT_SALES_STATISTICS_READ_ROLES = [
  'global:superadmin',
  'internal:orders-microservice:admin',
  'internal:orders-microservice:readonly',
  'internal:orders-microservice:operator',
  'internal:catalog-microservice:service',
] as const;

interface ProductSalesStatisticsQuery {
  from?: string;
  to?: string;
  channel?: string;
  status?: string;
}

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async findAll(@Query('channel') channel?: string, @Query('status') status?: string) {
    const orders = await this.ordersService.findAll(channel, status);
    return { success: true, data: orders };
  }

  @Get('statistics/products/:productId')
  @Roles(...PRODUCT_SALES_STATISTICS_READ_ROLES)
  async getProductSalesStatistics(
    @Param('productId') productId: string,
    @Query() query: ProductSalesStatisticsQuery,
  ) {
    const data = await this.ordersService.getProductSalesStatistics(productId, query);
    return { success: true, data };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const order = await this.ordersService.findOne(id);
    return { success: true, data: order };
  }

  @Post()
  @Roles(...CHANNEL_ORDER_CREATE_ROLES)
  async create(@Body() data: CreateOrderRequestDto) {
    const order = await this.ordersService.create(data);
    return { success: true, data: order };
  }

  @Put(':id/payment-status')
  @Roles('global:superadmin', 'internal:orders-microservice:admin', 'internal:payments-microservice:service')
  async updatePaymentStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: PaymentStatusUpdateRequestDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const order = await this.ordersService.applyPaymentStatus(id, body, request.user);
    return { success: true, data: order };
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: OrderStatusUpdateBody,
    @Req() request: AuthenticatedRequest,
  ) {
    const order = await this.ordersService.updateStatus(id, body.status, {
      approval: body.approval,
      actor: request.user,
    });
    return { success: true, data: order };
  }
}
