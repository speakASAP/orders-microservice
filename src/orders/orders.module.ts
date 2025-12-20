import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Order } from './order.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrderEventsService } from './order-events.service';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order]), HttpModule, LoggerModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderEventsService],
  exports: [OrdersService, OrderEventsService],
})
export class OrdersModule {}

