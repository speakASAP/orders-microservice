import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqplib';
import { OrderStatusApprovalAudit } from './status-transitions';

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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to connect to RabbitMQ:', errorMessage);
    }
  }

  async publishOrderCreated(orderId: string, channel: string) {
    await this.publish(this.ordersExchangeName, 'order.created', {
      type: 'order.created',
      orderId,
      channel,
      timestamp: new Date().toISOString(),
    });
  }

  async publishOrderUpdated(orderId: string, status: string, metadata?: OrderUpdatedMetadata) {
    await this.publish(this.ordersExchangeName, 'order.updated', {
      type: 'order.updated',
      orderId,
      status,
      ...(metadata?.previousStatus ? { previousStatus: metadata.previousStatus } : {}),
      ...(metadata?.approval ? { approval: metadata.approval } : {}),
      timestamp: new Date().toISOString(),
    });
  }

  async publishOrderShipped(orderId: string, trackingNumber: string) {
    await this.publish(this.ordersExchangeName, 'order.shipped', {
      type: 'order.shipped',
      orderId,
      trackingNumber,
      timestamp: new Date().toISOString(),
    });
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
        },
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to publish event:', errorMessage);
    }
  }
}
