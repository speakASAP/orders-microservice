import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';
import { LoggerModule } from '../logger/logger.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [HttpModule, LoggerModule, OrdersModule],
  controllers: [PricingController],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}
