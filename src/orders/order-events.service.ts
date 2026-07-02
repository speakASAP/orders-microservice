import { Injectable, OnModuleInit, OnModuleDestroy, Optional } from '@nestjs/common';
import * as amqp from 'amqplib';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { OrderEventOutbox } from './order-event-outbox.entity';
import { OrderStatusApprovalAudit } from './status-transitions';
import {
  buildOrderCancelledEvent,
  buildOrderCreatedEvent,
  buildOrderLifecycleChangedEvent,
  buildOrderPaidEvent,
  buildOrderShippedEvent,
  buildOrderUpdatedEvent,
  ORDER_EVENT_TYPES,
  ORDER_EVENT_VERSION,
  type OrderCreatedItemSnapshot,
  type OrderLeadAttribution,
} from './order-event-contracts';
import type { OrderLifecycleChangedPayload } from './order-lifecycle';

interface OrderUpdatedMetadata {
  previousStatus?: string;
  approval?: OrderStatusApprovalAudit;
}

type OutboxStatus = 'pending' | 'published' | 'failed';

export interface OrderEventsReadiness {
  status: 'ready' | 'degraded';
  brokerConnected: boolean;
  outboxRepositoryConfigured: boolean;
  retryLoopEnabled: boolean;
  pendingCount: number | null;
  failedCount: number | null;
  retryIntervalMs: number;
  retryBatchSize: number;
  maxAttempts: number;
  lastRetryError: string | null;
}

const ORDER_EVENT_OUTBOX_STATUS = {
  pending: 'pending',
  published: 'published',
  failed: 'failed',
} as const satisfies Record<OutboxStatus, OutboxStatus>;

function readPositiveIntEnv(name: string, defaultValue: number, minimum: number) {
  const parsed = Number.parseInt(process.env[name] || '', 10);
  if (!Number.isFinite(parsed)) return defaultValue;
  return Math.max(parsed, minimum);
}

@Injectable()
export class OrderEventsService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;
  private outboxRetryTimer: ReturnType<typeof setInterval> | null = null;
  private outboxRetryInProgress = false;
  private lastOutboxRetryError: string | null = null;
  private readonly ordersExchangeName = 'orders.events';
  private readonly pricingExchangeName = 'pricing.events';
  private readonly outboxRetryIntervalMs = readPositiveIntEnv('ORDER_EVENT_OUTBOX_RETRY_INTERVAL_MS', 30000, 5000);
  private readonly outboxRetryBatchSize = readPositiveIntEnv('ORDER_EVENT_OUTBOX_RETRY_BATCH_SIZE', 25, 1);
  private readonly outboxMaxAttempts = readPositiveIntEnv('ORDER_EVENT_OUTBOX_MAX_ATTEMPTS', 12, 1);

  constructor(
    @Optional()
    @InjectRepository(OrderEventOutbox)
    private readonly outboxRepository?: Repository<OrderEventOutbox>,
  ) {}

  async onModuleInit() {
    await this.connect();
    this.startOutboxRetryLoop();
    await this.retryPendingOutboxEvents();
  }

  async onModuleDestroy() {
    if (this.outboxRetryTimer) {
      clearInterval(this.outboxRetryTimer);
      this.outboxRetryTimer = null;
    }

    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
    } catch (error: unknown) {
      // Ignore errors during cleanup
    }
  }

  private async connect() {
    if (this.channel) return;

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
      this.channel = null;
      this.connection = null;
      console.error('Failed to connect to RabbitMQ');
    }
  }

  async publishOrderCreated(
    orderId: string,
    channel: string,
    leadAttribution?: OrderLeadAttribution,
    items?: OrderCreatedItemSnapshot[],
    currency?: string,
  ) {
    await this.publish(
      this.ordersExchangeName,
      ORDER_EVENT_TYPES.created,
      buildOrderCreatedEvent(orderId, channel, leadAttribution, items, currency),
    );
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

  async publishOrderLifecycleChanged(payload: Omit<OrderLifecycleChangedPayload, 'eventId' | 'occurredAt'>) {
    await this.publish(
      this.ordersExchangeName,
      ORDER_EVENT_TYPES.lifecycleChanged,
      buildOrderLifecycleChangedEvent(payload),
    );
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

  async getOutboxReadiness(): Promise<OrderEventsReadiness> {
    let pendingCount: number | null = null;
    let failedCount: number | null = null;

    if (this.outboxRepository) {
      try {
        [pendingCount, failedCount] = await Promise.all([
          this.outboxRepository.count({ where: { status: ORDER_EVENT_OUTBOX_STATUS.pending } }),
          this.outboxRepository.count({ where: { status: ORDER_EVENT_OUTBOX_STATUS.failed } }),
        ]);
      } catch {
        this.lastOutboxRetryError = 'outbox_readiness_count_failed';
      }
    }

    const status = this.channel && pendingCount === 0 && failedCount === 0 ? 'ready' : 'degraded';
    return {
      status,
      brokerConnected: Boolean(this.channel),
      outboxRepositoryConfigured: Boolean(this.outboxRepository),
      retryLoopEnabled: Boolean(this.outboxRetryTimer),
      pendingCount,
      failedCount,
      retryIntervalMs: this.outboxRetryIntervalMs,
      retryBatchSize: this.outboxRetryBatchSize,
      maxAttempts: this.outboxMaxAttempts,
      lastRetryError: this.lastOutboxRetryError,
    };
  }

  async flushPendingOutbox() {
    if (!this.outboxRepository || !this.channel) return 0;

    const rows = await this.outboxRepository.find({
      where: [
        { status: ORDER_EVENT_OUTBOX_STATUS.pending, attempts: LessThan(this.outboxMaxAttempts) },
        { status: ORDER_EVENT_OUTBOX_STATUS.failed, attempts: LessThan(this.outboxMaxAttempts) },
      ],
      order: { createdAt: 'ASC' },
      take: this.outboxRetryBatchSize,
    });

    for (const row of rows) {
      await this.publishStoredOutboxEvent(row);
    }

    return rows.length;
  }

  private async publish(exchangeName: string, routingKey: string, event: object) {
    const outbox = exchangeName === this.ordersExchangeName
      ? await this.recordOutboxEvent(exchangeName, routingKey, event)
      : null;

    if (!this.channel) {
      return;
    }

    try {
      const accepted = this.channel.publish(
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

      await this.markOutboxPublished(outbox, accepted);
    } catch {
      this.channel = null;
      await this.markOutboxFailed(outbox, 'publish_exception');
      console.error('Failed to publish event');
    }
  }

  private startOutboxRetryLoop() {
    if (!this.outboxRepository || this.outboxRetryTimer) return;

    this.outboxRetryTimer = setInterval(() => {
      void this.retryPendingOutboxEvents();
    }, this.outboxRetryIntervalMs);
  }

  private async retryPendingOutboxEvents() {
    if (this.outboxRetryInProgress || !this.outboxRepository) return;

    this.outboxRetryInProgress = true;
    try {
      if (!this.channel) {
        await this.connect();
      }
      await this.flushPendingOutbox();
      this.lastOutboxRetryError = null;
    } catch {
      this.lastOutboxRetryError = 'outbox_retry_failed';
    } finally {
      this.outboxRetryInProgress = false;
    }
  }

  private async publishStoredOutboxEvent(row: OrderEventOutbox) {
    if (!this.channel) return;

    try {
      const accepted = this.channel.publish(
        row.exchangeName,
        row.routingKey,
        Buffer.from(JSON.stringify(row.payload)),
        {
          persistent: true,
          contentType: 'application/json',
          headers: {
            eventType: row.routingKey,
            eventVersion: row.eventVersion,
          },
        },
      );
      await this.markOutboxPublished(row, accepted);
    } catch {
      this.channel = null;
      await this.markOutboxFailed(row, 'retry_publish_exception');
      console.error('Failed to publish stored order event');
    }
  }

  private async recordOutboxEvent(
    exchangeName: string,
    routingKey: string,
    event: object,
  ): Promise<OrderEventOutbox | null> {
    if (!this.outboxRepository) return null;
    const envelope = this.extractEventEnvelope(event, routingKey);
    try {
      const row = this.outboxRepository.create({
        exchangeName,
        routingKey,
        eventType: envelope.eventType,
        eventVersion: envelope.eventVersion,
        eventId: envelope.eventId,
        payload: event as Record<string, unknown>,
        status: ORDER_EVENT_OUTBOX_STATUS.pending,
        attempts: 0,
        lastAttemptAt: null,
        publishedAt: null,
        lastErrorCode: null,
      });
      return await this.outboxRepository.save(row);
    } catch {
      console.error('Failed to record order event outbox row');
      return null;
    }
  }

  private async markOutboxPublished(row: OrderEventOutbox | null, accepted: boolean) {
    if (!row || !this.outboxRepository) return;
    row.attempts += 1;
    row.lastAttemptAt = new Date();
    if (accepted) {
      row.status = ORDER_EVENT_OUTBOX_STATUS.published;
      row.publishedAt = row.lastAttemptAt;
      row.lastErrorCode = null;
    } else {
      row.status = ORDER_EVENT_OUTBOX_STATUS.failed;
      row.lastErrorCode = 'publish_not_accepted';
    }
    await this.saveOutboxUpdate(row);
  }

  private async markOutboxFailed(row: OrderEventOutbox | null, errorCode: string) {
    if (!row || !this.outboxRepository) return;
    row.attempts += 1;
    row.status = ORDER_EVENT_OUTBOX_STATUS.failed;
    row.lastAttemptAt = new Date();
    row.lastErrorCode = errorCode;
    await this.saveOutboxUpdate(row);
  }

  private async saveOutboxUpdate(row: OrderEventOutbox) {
    try {
      await this.outboxRepository?.save(row);
    } catch {
      console.error('Failed to update order event outbox row');
    }
  }

  private extractEventEnvelope(event: object, routingKey: string) {
    const candidate = event as Record<string, unknown>;
    const eventId = typeof candidate.eventId === 'string' ? candidate.eventId : undefined;
    const eventVersion = typeof candidate.eventVersion === 'number' ? candidate.eventVersion : ORDER_EVENT_VERSION;
    return {
      eventType: typeof candidate.type === 'string' ? candidate.type : routingKey,
      eventVersion,
      eventId: eventId || '00000000-0000-4000-8000-000000000000',
    };
  }
}
