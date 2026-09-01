import { Controller, Get, Post, Put, Body, Param, Query, ParseUUIDPipe, Req } from '@nestjs/common';
import { Request } from 'express';
import { OrdersService } from './orders.service';
import { OrderStatusApprovalInput } from './status-transitions';
import { CreateOrderRequestDto } from './create-order.dto';
import { PaymentStatusUpdateRequestDto } from '../payments/payment-status.dto';
import { WarehouseFulfillmentStatusUpdateRequestDto } from './warehouse-fulfillment-status.dto';
import { Roles } from '../auth/roles.decorator';
import { ADMIN_READ_ROLES } from '../admin/admin.service';

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
  'internal:cliplot:service',
  'internal:cliplot-service:service',
] as const;

export const PRODUCT_SALES_STATISTICS_READ_ROLES = [
  'global:superadmin',
  'internal:orders-microservice:admin',
  'internal:orders-microservice:readonly',
  'internal:orders-microservice:operator',
  'internal:catalog-microservice:service',
] as const;

export const ORDER_CHANNEL_LIFECYCLE_READ_ROLES = [
  'internal:flipflop-service:service',
  'internal:allegro-service:service',
  'internal:aukro-service:service',
  'internal:bazos-service:service',
  'internal:heureka-service:service',
] as const;

export const ORDER_ADMIN_LIFECYCLE_READ_ROLES = [
  'global:superadmin',
  'internal:orders-microservice:admin',
  'internal:orders-microservice:readonly',
  'internal:orders-microservice:operator',
  ...ORDER_CHANNEL_LIFECYCLE_READ_ROLES,
] as const;

export const ORDER_CUSTOMER_LIFECYCLE_READ_ROLES = [
  'authenticated:user',
  ...ORDER_ADMIN_LIFECYCLE_READ_ROLES,
] as const;

// cliplot is listed here rather than in ORDER_CHANNEL_LIFECYCLE_READ_ROLES on purpose.
// It reads back its own order after a status change (cliplot/src/integrations.js
// readOrderWithStatusToken) and calls no lifecycle endpoint at all, so adding it to the
// shared channel list would also grant admin/lifecycle and customer/lifecycle -- listings
// that span every channel's orders. Detail read is the whole requirement; the wider grant
// would be over-privilege of exactly the kind the RS256 migration exists to remove.
export const ORDER_DETAIL_READ_ROLES = [
  'global:superadmin',
  'internal:orders-microservice:admin',
  'internal:invoices-microservice:service',
  'internal:cliplot:service',
  ...ORDER_CHANNEL_LIFECYCLE_READ_ROLES,
] as const;

export const ORDER_WAREHOUSE_FULFILLMENT_UPDATE_ROLES = [
  'global:superadmin',
  'internal:orders-microservice:admin',
  'internal:warehouse-microservice:service',
] as const;

export const ORDER_STATUS_UPDATE_ROLES = [
  'global:superadmin',
  'internal:orders-microservice:action-admin',
] as const;

export const ORDER_AFFINITY_REPLAY_READ_ROLES = [
  'global:superadmin',
  'internal:orders-microservice:admin',
  'internal:orders-microservice:readonly',
  'internal:marketing-microservice:service',
] as const;

interface ProductSalesStatisticsQuery {
  from?: string;
  to?: string;
  channel?: string;
  status?: string;
}

interface OrderLifecycleQuery {
  channel?: string;
  status?: string;
  lifecycleStage?: string;
  paymentStatus?: string;
  from?: string;
  to?: string;
  limit?: string;
}

interface OrderAffinityReplayQuery {
  channel?: string;
  from?: string;
  to?: string;
  limit?: string;
}

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @Roles(...ADMIN_READ_ROLES)
  async findAll(@Query('channel') channel?: string, @Query('status') status?: string) {
    const orders = await this.ordersService.findAll(channel, status);
    return { success: true, data: orders };
  }

  @Get('internal/order-affinity/replay-candidates')
  @Roles(...ORDER_AFFINITY_REPLAY_READ_ROLES)
  async getOrderAffinityReplayCandidates(@Query() query: OrderAffinityReplayQuery) {
    const data = await this.ordersService.getOrderAffinityReplayCandidates(query);
    return { success: true, data };
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

  @Get('customer/lifecycle')
  @Roles(...ORDER_CUSTOMER_LIFECYCLE_READ_ROLES)
  async getCustomerLifecycle(@Query() query: OrderLifecycleQuery, @Req() request: AuthenticatedRequest) {
    const data = await this.ordersService.getCustomerLifecycleOrders(request.user, query);
    return { success: true, data };
  }

  @Get('admin/lifecycle')
  @Roles(...ORDER_ADMIN_LIFECYCLE_READ_ROLES)
  async getAdminLifecycle(@Query() query: OrderLifecycleQuery) {
    const data = await this.ordersService.getAdminLifecycleOrders(query);
    return { success: true, data };
  }

  @Post('validate-create')
  @Roles(...CHANNEL_ORDER_CREATE_ROLES)
  async validateCreate(@Body() data: CreateOrderRequestDto) {
    const validation = await this.ordersService.validateCreate(data);
    return { success: true, data: validation };
  }

  @Get(':id/lifecycle')
  @Roles(...ORDER_DETAIL_READ_ROLES)
  async getLifecycleReadModel(@Param('id', ParseUUIDPipe) id: string) {
    const order = await this.ordersService.getLifecycleReadModel(id);
    return { success: true, data: order };
  }

  @Get(':id')
  @Roles(...ORDER_DETAIL_READ_ROLES)
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

  @Put(':id/warehouse-fulfillment-status')
  @Roles(...ORDER_WAREHOUSE_FULFILLMENT_UPDATE_ROLES)
  async updateWarehouseFulfillmentStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: WarehouseFulfillmentStatusUpdateRequestDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const order = await this.ordersService.applyWarehouseFulfillmentStatus(id, body, request.user);
    return { success: true, data: order };
  }

  @Put(':id/status')
  @Roles(...ORDER_STATUS_UPDATE_ROLES)
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
