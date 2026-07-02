import { Controller, Get, Optional } from '@nestjs/common';
import { Public } from '../auth/roles.decorator';
import { OrderEventsService } from '../orders/order-events.service';

@Controller()
export class HealthController {
  private readonly startTime = Date.now();

  constructor(
    @Optional()
    private readonly orderEventsService?: OrderEventsService,
  ) {}

  @Public()
  @Get('health')
  getHealth() {
    return {
      status: 'healthy',
      service: process.env.SERVICE_NAME || 'orders-microservice',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('health/order-events')
  async getOrderEventsHealth() {
    const events = this.orderEventsService
      ? await this.orderEventsService.getOutboxReadiness()
      : null;

    return {
      status: events?.status || 'degraded',
      service: process.env.SERVICE_NAME || 'orders-microservice',
      component: 'order-events',
      events,
      timestamp: new Date().toISOString(),
    };
  }
}
