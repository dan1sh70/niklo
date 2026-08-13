import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Driver } from './driver.entity';

@Entity('driver_sessions')
export class DriverSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  driver_id: string;

  @Column({ type: 'timestamptz' })
  login_time: Date;

  @Column({ type: 'timestamptz', nullable: true })
  logout_time: Date;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  duration_hours: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ManyToOne(() => Driver)
  @JoinColumn({ name: 'driver_id' })
  driver: Driver;
}
