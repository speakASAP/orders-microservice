import { Controller, Get, Header, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { Public } from '../auth/roles.decorator';
import { AdminService } from './admin.service';
import { ADMIN_ORDERS_HTML } from './admin-ui';

@Controller()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Public()
  @Get(['admin', 'admin/orders'])
  @Header('Content-Type', 'text/html; charset=utf-8')
  getOrdersAdmin() {
    return ADMIN_ORDERS_HTML;
  }

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

  @Get('admin/orders/:id')
  getOrderDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getOrderDetail(id);
  }
}
