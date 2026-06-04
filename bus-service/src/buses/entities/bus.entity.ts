import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Operator } from '../../operators/entities/operator.entity';
import { SeatLayout } from './seat-layout.entity';
import { Schedule } from '../../schedules/entities/schedule.entity';

export enum BusType {
  AC_SLEEPER = 'AC_SLEEPER',
  NON_AC_SLEEPER = 'NON_AC_SLEEPER',
  AC_SEATER = 'AC_SEATER',
  NON_AC_SEATER = 'NON_AC_SEATER',
  VOLVO_AC = 'VOLVO_AC',
}

@Entity('buses')
export class Bus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  operator_id: string;

  @ManyToOne(() => Operator, (operator) => operator.buses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'operator_id' })
  operator: Operator;

  @Column({ type: 'varchar', length: 20, unique: true })
  registration_number: string;

  @Column({ type: 'enum', enum: BusType })
  bus_type: BusType;

  @Column({ type: 'int' })
  total_seats: number;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  amenities: Record<string, boolean>;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @OneToMany(() => SeatLayout, (seat) => seat.bus, { cascade: true })
  seats: SeatLayout[];

  @OneToMany(() => Schedule, (schedule) => schedule.bus)
  schedules: Schedule[];
}
