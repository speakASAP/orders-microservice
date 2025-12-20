import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class OrderEventsService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private readonly exchangeName = 'orders.events';

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
  }

  private async connect() {
    try {
      const url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange(this.exchangeName, 'topic', { durable: true });
      console.log('Connected to RabbitMQ');
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error.message);
    }
  }

  async publishOrderCreated(orderId: string, channel: string) {
    await this.publish('order.created', { type: 'order.created', orderId, channel, timestamp: new Date().toISOString() });
  }

  async publishOrderUpdated(orderId: string, status: string) {
    await this.publish('order.updated', { type: 'order.updated', orderId, status, timestamp: new Date().toISOString() });
  }

  async publishOrderShipped(orderId: string, trackingNumber: string) {
    await this.publish('order.shipped', { type: 'order.shipped', orderId, trackingNumber, timestamp: new Date().toISOString() });
  }

  private async publish(routingKey: string, event: object) {
    if (!this.channel) return;
    try {
      this.channel.publish(this.exchangeName, routingKey, Buffer.from(JSON.stringify(event)), {
        persistent: true,
        contentType: 'application/json',
      });
    } catch (error) {
      console.error('Failed to publish event:', error.message);
    }
  }
}

