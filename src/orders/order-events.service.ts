import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqplib';
import { OrderStatusApprovalAudit } from './status-transitions';
import {
  buildOrderCancelledEvent,
  buildOrderCreatedEvent,
  buildOrderPaidEvent,
  buildOrderShippedEvent,
  buildOrderUpdatedEvent,
  ORDER_EVENT_TYPES,
  ORDER_EVENT_VERSION,
} from './order-event-contracts';

interface OrderUpdatedMetadata {
  previousStatus?: string;
  approval?: OrderStatusApprovalAudit;
}

@Injectable()
export class OrderEventsService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;
  private readonly ordersExchangeName = 'orders.events';
  private readonly pricingExchangeName = 'pricing.events';

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
    } catch (error: unknown) {
      // Ignore errors during cleanup
    }
  }

  private async connect() {
    try {
      const url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
      const conn = await amqp.connect(url);
      this.connection = conn;
      const ch = await this.connection.createChannel();
      this.channel = ch;
      await this.channel.assertExchange(this.ordersExchangeName, 'topic', {
        durable: true,
      });
      await this.channel.assertExchange(this.pricingExchangeName, 'topic', {
        durable: true,
      });
      console.log('Connected to RabbitMQ');
    } catch {
      console.error('Failed to connect to RabbitMQ');
    }
  }

  async publishOrderCreated(orderId: string, channel: string) {
    await this.publish(this.ordersExchangeName, ORDER_EVENT_TYPES.created, buildOrderCreatedEvent(orderId, channel));
  }

  async publishOrderUpdated(orderId: string, status: string, metadata?: OrderUpdatedMetadata) {
    const event = buildOrderUpdatedEvent(orderId, status, metadata?.previousStatus, metadata?.approval);
    await this.publish(this.ordersExchangeName, ORDER_EVENT_TYPES.updated, event);

    if (status === 'cancelled') {
      await this.publish(
        this.ordersExchangeName,
        ORDER_EVENT_TYPES.cancelled,
        buildOrderCancelledEvent(orderId, metadata?.previousStatus, metadata?.approval),
      );
    }
  }

  async publishOrderPaid(orderId: string, paymentReferenceId?: string) {
    await this.publish(this.ordersExchangeName, ORDER_EVENT_TYPES.paid, buildOrderPaidEvent(orderId, paymentReferenceId));
  }

  async publishOrderShipped(orderId: string, _trackingNumber?: string) {
    await this.publish(this.ordersExchangeName, ORDER_EVENT_TYPES.shipped, buildOrderShippedEvent(orderId));
  }

  async publishPricingPriceChanged(event: {
    productId: string;
    productName: string;
    oldPrice: number;
    newPrice: number;
    changePercent: number;
    approvedAt: string;
    suggestionId: string;
  }) {
    await this.publish(
      this.pricingExchangeName,
      'pricing.price_changed',
      event,
    );
  }

  private async publish(exchangeName: string, routingKey: string, event: object) {
    if (!this.channel) return;
    try {
      this.channel.publish(
        exchangeName,
        routingKey,
        Buffer.from(JSON.stringify(event)),
        {
          persistent: true,
          contentType: 'application/json',
          headers: {
            eventType: routingKey,
            eventVersion: ORDER_EVENT_VERSION,
          },
        },
      );
    } catch {
      console.error('Failed to publish event');
    }
  }
}
