import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

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

@Entity('car_rides')
export class Ride {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  passenger_id: string;

  @Column({ type: 'uuid', nullable: true })
  driver_id: string;

  @Column({ type: 'enum', enum: RideType })
  ride_type: RideType;

  // Ideally this would be 'geometry' / 'Point', but we'll use varchar to simplify initial scaffolding
  // since postgis is an external dependency
  @Column({ type: 'varchar', nullable: true })
  pickup_location: string; 

  @Column({ type: 'varchar', nullable: true })
  drop_location: string;

  @Column({ type: 'text' })
  pickup_address: string;

  @Column({ type: 'text', nullable: true })
  drop_address: string;

  @Column({ type: 'numeric', precision: 8, scale: 2, nullable: true })
  distance_km: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  fare_estimate: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  fare_final: number;

  @Column({ type: 'numeric', precision: 4, scale: 2, default: 1.0 })
  surge_multiplier: number;

  @Column({ type: 'enum', enum: RideStatus, default: RideStatus.REQUESTED })
  status: RideStatus;

  @Column({ type: 'timestamptz', nullable: true })
  scheduled_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  started_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  ended_at: Date;
}
