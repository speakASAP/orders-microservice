import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Order } from './order.entity';
import { OrderItem } from '../items/order-item.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrderEventsService } from './order-events.service';
import { OrderEventOutbox } from './order-event-outbox.entity';
import { OrderFulfillmentHandoffClient } from './order-fulfillment-handoff.client';
import { LoggerModule } from '../logger/logger.module';
import { WarehouseReservationClient } from '../warehouse/warehouse-reservation.client';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, OrderEventOutbox]), HttpModule, LoggerModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderEventsService, WarehouseReservationClient, OrderFulfillmentHandoffClient],
  exports: [OrdersService, OrderEventsService],
})
export class OrdersModule {}

