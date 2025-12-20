import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Order } from '../orders/order.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'order_id' })
  orderId: string;

  // Product ID from catalog-microservice
  @Column()
  productId: string;

  @Column({ length: 100, nullable: true })
  sku: string;

  @Column({ length: 500 })
  title: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  // Fulfillment status: pending, reserved, shipped, delivered
  @Column({ length: 50, default: 'pending' })
  fulfillmentStatus: string;

  // Warehouse ID where item will ship from
  @Column({ nullable: true })
  warehouseId: string;

  @CreateDateColumn()
  createdAt: Date;
}

