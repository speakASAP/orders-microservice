import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('price_suggestion')
export class PriceSuggestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  productId: string;

  @Column({ type: 'varchar', length: 500 })
  productName: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  currentPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  suggestedPrice: number;

  @Column({ type: 'float' })
  changePercent: number;

  @Column({ type: 'text', nullable: true })
  rationale: string | null;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  approvedBy: string | null;

  @Column({ type: 'timestamp', nullable: true })
  rejectedAt: Date | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  rejectedBy: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
