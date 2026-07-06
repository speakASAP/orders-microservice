import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/roles.decorator';
import { BusinessHealthService } from './business-health.service';
import { OrderReservationCorrelationBusinessHealthEnvelope } from './business-health.types';

@Controller('business-health')
export class BusinessHealthController {
  constructor(private readonly businessHealthService: BusinessHealthService) {}

  @Public()
  @Get('order-reservation-correlation')
  getOrderReservationCorrelation(): OrderReservationCorrelationBusinessHealthEnvelope {
    return this.businessHealthService.getOrderReservationCorrelationEnvelope();
  }
}
