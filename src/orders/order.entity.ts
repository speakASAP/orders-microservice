import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { OrderItem } from '../items/order-item.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // External order ID from sales channel
  @Column({ length: 200, nullable: true })
  externalOrderId: string;

  // Sales channel: allegro, flipflop, aukro, heureka, bazos
  @Column({ length: 100 })
  channel: string;

  // Account ID within the channel
  @Column({ length: 200, nullable: true })
  channelAccountId: string;

  // Status: pending, confirmed, processing, shipped, delivered, cancelled
  @Column({ length: 50, default: 'pending' })
  status: string;

  // Customer info
  @Column({ type: 'jsonb', nullable: true })
  customer: {
    name?: string;
    email?: string;
    phone?: string;
  };

  // Shipping address
  @Column({ type: 'jsonb', nullable: true })
  shippingAddress: {
    name?: string;
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };

  // Billing address
  @Column({ type: 'jsonb', nullable: true })
  billingAddress: {
    name?: string;
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    companyName?: string;
    taxId?: string;
  };

  // Totals
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shippingCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ length: 3, default: 'CZK' })
  currency: string;

  // Payment
  @Column({ length: 100, nullable: true })
  paymentMethod: string;

  @Column({ length: 50, nullable: true })
  paymentStatus: string;

  // Shipping
  @Column({ length: 100, nullable: true })
  shippingMethod: string;

  // Notes
  @Column({ type: 'text', nullable: true })
  customerNote: string;

  @Column({ type: 'text', nullable: true })
  internalNote: string;

  // Items
  @OneToMany(() => OrderItem, (item) => item.order)
  items: OrderItem[];

  @Column({ type: 'timestamp', nullable: true })
  orderedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

