import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Bus } from './bus.entity';

export enum SeatType {
  SEATER = 'SEATER',
  SLEEPER = 'SLEEPER',
  SEMI_SLEEPER = 'SEMI_SLEEPER',
}

@Entity('bus_seats')
export class SeatLayout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  bus_id: string;

  @ManyToOne(() => Bus, (bus) => bus.seats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bus_id' })
  bus: Bus;

  @Column({ type: 'varchar', length: 10 })
  seat_number: string;

  @Column({ type: 'boolean', default: false })
  is_upper_deck: boolean;

  @Column({ type: 'int' })
  row_num: number;

  @Column({ type: 'int' })
  col_num: number;

  @Column({ type: 'enum', enum: SeatType, default: SeatType.SLEEPER })
  seat_type: SeatType;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0.00 })
  price_offset: number;

  @Column({ type: 'boolean', default: true })
  is_available: boolean;

  @Column({ type: 'boolean', default: false })
  is_ladies_seat: boolean;

  @Column({ type: 'varchar', length: 5, nullable: true, default: null })
  booked_gender: string | null;
}
