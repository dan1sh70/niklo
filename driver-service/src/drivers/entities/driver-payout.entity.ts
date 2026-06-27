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
  SCHEDULED = 'scheduled',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
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

  @Column({ type: 'timestamp with time zone' })
  scheduled_for: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
