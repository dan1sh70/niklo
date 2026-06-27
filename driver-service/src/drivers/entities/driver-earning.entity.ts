import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Driver } from './driver.entity';

export enum EarningType {
  RIDE_FARE = 'ride_fare',
  INCENTIVE = 'incentive',
}

@Entity('driver_earnings')
export class DriverEarning {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  driver_id: string;

  @ManyToOne(() => Driver)
  @JoinColumn({ name: 'driver_id' })
  driver: Driver;

  @Column({ type: 'uuid', nullable: true })
  ride_id: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: EarningType,
    default: EarningType.RIDE_FARE,
  })
  type: EarningType;

  @CreateDateColumn()
  created_at: Date;
}
