import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('shipments')
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @Column({ length: 100 })
  carrier: string;

  @Column({ length: 200, nullable: true })
  trackingNumber: string;

  @Column({ length: 500, nullable: true })
  trackingUrl: string;

  // Status: created, picked_up, in_transit, delivered, returned
  @Column({ length: 50, default: 'created' })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  shippedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

