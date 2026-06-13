import { Body, Controller, Get, Header, Param, ParseUUIDPipe, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { OrderStatusApprovalInput } from '../orders/status-transitions';
import { Public, Roles } from '../auth/roles.decorator';
import { ADMIN_ACTION_ROLES, ADMIN_READ_ROLES, AdminService } from './admin.service';
import { ADMIN_ORDERS_HTML } from './admin-ui';

interface AuthenticatedRequest extends Request {
  user?: {
    sub?: string;
    email?: string;
    roles?: string[];
  };
}

interface AdminOrderStatusActionBody {
  orderId: string;
  status: string;
  approval?: OrderStatusApprovalInput;
}

@Controller()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Public()
  @Get(['admin', 'admin/orders'])
  @Header('Content-Type', 'text/html; charset=utf-8')
  getOrdersAdmin() {
    return ADMIN_ORDERS_HTML;
  }

  @Roles(...ADMIN_READ_ROLES)
  @Get('admin/orders/dashboard')
  getOrdersDashboard(
    @Query('application') application?: string,
    @Query('service') service?: string,
    @Query('state') state?: string,
    @Query('status') status?: string,
    @Query('channel') channel?: string,
    @Query('search') search?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getDashboard({ application, service, state, status, channel, search, from, to, limit });
  }

  @Roles(...ADMIN_READ_ROLES)
  @Get('admin/operations/overview')
  getOperationsOverview(@Req() request: AuthenticatedRequest) {
    return this.adminService.getOperationsOverview(request.user);
  }

  @Roles(...ADMIN_READ_ROLES)
  @Get('admin/operations/idempotency')
  getIdempotencyDiagnostics(
    @Query('contractVersion') contractVersion?: string,
    @Query('channel') channel?: string,
    @Query('channelAccountId') channelAccountId?: string,
    @Query('externalOrderId') externalOrderId?: string,
  ) {
    return this.adminService.getIdempotencyDiagnostics({ contractVersion, channel, channelAccountId, externalOrderId });
  }

  @Roles(...ADMIN_READ_ROLES)
  @Get('admin/operations/actions')
  getActionCatalog(@Req() request: AuthenticatedRequest) {
    return this.adminService.getActionCatalog(request.user);
  }

  @Roles(...ADMIN_ACTION_ROLES)
  @Post('admin/operations/actions/order-status')
  applyOrderStatusAction(
    @Body() body: AdminOrderStatusActionBody,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.applyOrderStatusAction(body, request.user);
  }

  @Roles(...ADMIN_READ_ROLES)
  @Get('admin/orders/:id')
  getOrderDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getOrderDetail(id);
  }
}
