import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type OrderEventOutboxStatus = 'pending' | 'published' | 'failed';

@Entity('order_event_outbox')
@Index('idx_order_event_outbox_status_created', ['status', 'createdAt'])
@Index('idx_order_event_outbox_event_id', ['eventId'], { unique: true })
@Index('idx_order_event_outbox_routing_key', ['routingKey'])
export class OrderEventOutbox {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  exchangeName: string;

  @Column({ length: 160 })
  routingKey: string;

  @Column({ length: 40 })
  eventType: string;

  @Column({ type: 'int', default: 1 })
  eventVersion: number;

  @Column({ type: 'uuid' })
  eventId: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ length: 20, default: 'pending' })
  status: OrderEventOutboxStatus;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'timestamp', nullable: true })
  lastAttemptAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date | null;

  @Column({ length: 120, nullable: true })
  lastErrorCode: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
