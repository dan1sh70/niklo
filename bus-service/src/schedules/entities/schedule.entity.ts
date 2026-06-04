import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Route } from '../../routes/entities/route.entity';
import { Bus } from '../../buses/entities/bus.entity';
import { Operator } from '../../operators/entities/operator.entity';

export enum ScheduleStatus {
  SCHEDULED = 'SCHEDULED',
  IN_TRANSIT = 'IN_TRANSIT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  route_id: string;

  @ManyToOne(() => Route, (route) => route.schedules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'route_id' })
  route: Route;

  @Column({ type: 'uuid' })
  bus_id: string;

  @ManyToOne(() => Bus, (bus) => bus.schedules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bus_id' })
  bus: Bus;

  @Column({ type: 'uuid' })
  operator_id: string;

  @ManyToOne(() => Operator, (operator) => operator.schedules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'operator_id' })
  operator: Operator;

  @Column({ type: 'time' })
  departure_time: string;

  @Column({ type: 'time' })
  arrival_time: string;

  @Column({ type: 'date' })
  departure_date: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  base_fare: number;

  @Column({ type: 'int' })
  available_seats: number;

  @Column({ type: 'enum', enum: ScheduleStatus, default: ScheduleStatus.SCHEDULED })
  status: ScheduleStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
