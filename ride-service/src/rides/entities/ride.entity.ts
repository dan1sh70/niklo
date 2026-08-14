import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RideType {
  MINI = 'MINI',
  SEDAN = 'SEDAN',
  SUV = 'SUV',
  PREMIUM = 'PREMIUM',
  OUTSTATION = 'OUTSTATION',
  HOURLY = 'HOURLY',
}

export enum RideStatus {
  REQUESTED = 'REQUESTED',
  ACCEPTED = 'ACCEPTED',
  ARRIVED = 'ARRIVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('rides')
export class Ride {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'uuid', nullable: true })
  driver_id: string;

  @Column({ type: 'enum', enum: RideType, default: RideType.SEDAN })
  ride_type: RideType;

  @Column({ type: 'text' })
  pickup_address: string;

  @Column({ type: 'text' })
  dropoff_address: string;

  @Column({ type: 'numeric', precision: 10, scale: 6 })
  pickup_latitude: number;

  @Column({ type: 'numeric', precision: 10, scale: 6 })
  pickup_longitude: number;

  @Column({ type: 'numeric', precision: 10, scale: 6 })
  dropoff_latitude: number;

  @Column({ type: 'numeric', precision: 10, scale: 6 })
  dropoff_longitude: number;

  @Column({ type: 'varchar', length: 6, default: '1234' })
  otp: string;

  @Column({ type: 'numeric', precision: 6, scale: 2 })
  distance_km: number;

  @Column({ type: 'int' })
  estimated_time_mins: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  fare_amount: number;

  @Column({ type: 'numeric', precision: 3, scale: 2, default: 1.0 })
  surge_multiplier: number;

  @Column({ type: 'enum', enum: RideStatus, default: RideStatus.REQUESTED })
  status: RideStatus;

  @Column({ type: 'timestamptz', nullable: true })
  scheduled_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
