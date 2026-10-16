import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Driver } from './driver.entity';

export enum PayoutStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('driver_payouts')
export class DriverPayout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  driver_id: string;

  @ManyToOne(() => Driver)
  @JoinColumn({ name: 'driver_id' })
  driver: Driver;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: PayoutStatus,
    default: PayoutStatus.SCHEDULED,
  })
  status: PayoutStatus;

  @Column({ type: 'varchar', nullable: true })
  payout_id: string;

  @Column({ type: 'text', nullable: true })
  failure_reason: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  bank_account_number: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  ifsc_code: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  scheduled_for: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
