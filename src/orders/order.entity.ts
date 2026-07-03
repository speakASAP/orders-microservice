import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { OrderItem } from '../items/order-item.entity';
import { WarehouseHandoffSummary } from '../warehouse/warehouse-reservation.client';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // External order ID from sales channel
  @Column({ length: 200, nullable: true })
  externalOrderId: string;

  // Sales channel: allegro, flipflop, aukro, heureka, bazos, cliplot
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
    authUserId?: string;
    subject?: string;
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
    companyId?: string;
    taxId?: string;
    vatId?: string;
    email?: string;
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

  @Column({ length: 200, nullable: true })
  paymentReferenceId: string;

  @Column({ length: 100, nullable: true })
  paymentApplicationId: string;

  @Column({ type: 'timestamp', nullable: true })
  paymentUpdatedAt: Date;

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

  @Column({ type: 'jsonb', nullable: true })
  warehouseHandoff: WarehouseHandoffSummary;

  @Column({ type: 'jsonb', nullable: true })
  statusTransitionAudit: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  bundleEvidence: Array<{
    contractVersion: 'catalog.bundle.v1';
    bundleId: string;
    productIds: string[];
    discountPolicyRef?: string;
    freeShippingPolicyRef?: string;
    serverTotalSource?: string;
  }>;

  @Column({ type: 'timestamp', nullable: true })
  orderedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
