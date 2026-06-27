import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { BoardingPoint } from './boarding-point.entity';
import { DroppingPoint } from './dropping-point.entity';
import { Schedule } from '../../schedules/entities/schedule.entity';

@Entity('routes')
export class Route {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  source_city: string;

  @Column({ type: 'varchar', length: 255 })
  destination_city: string;

  @Column({ type: 'numeric', precision: 8, scale: 2 })
  distance_km: number;

  @Column({ type: 'int' })
  estimated_duration_minutes: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @OneToMany(() => BoardingPoint, (bp) => bp.route, { cascade: true })
  boarding_points: BoardingPoint[];

  @OneToMany(() => DroppingPoint, (dp) => dp.route, { cascade: true })
  dropping_points: DroppingPoint[];

  @OneToMany(() => Schedule, (schedule) => schedule.route)
  schedules: Schedule[];
}
