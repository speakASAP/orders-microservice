import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';
import { LoggerModule } from '../logger/logger.module';
import { OrdersModule } from '../orders/orders.module';
import { PriceSuggestion } from './price-suggestion.entity';

@Module({
  imports: [HttpModule, LoggerModule, OrdersModule, TypeOrmModule.forFeature([PriceSuggestion])],
  controllers: [PricingController],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}
