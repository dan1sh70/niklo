import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Bus } from './bus.entity';

export enum Deck {
  LOWER = 'LOWER',
  UPPER = 'UPPER',
}

export enum SeatType {
  SEATER = 'SEATER',
  SLEEPER = 'SLEEPER',
  SEMI_SLEEPER = 'SEMI_SLEEPER',
}

@Entity('seat_layouts')
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

  @Column({ type: 'enum', enum: Deck })
  deck: Deck;

  @Column({ type: 'int' })
  row: number;

  @Column({ type: 'int', name: 'col' })
  column: number;

  @Column({ type: 'enum', enum: SeatType })
  seat_type: SeatType;

  @Column({ type: 'boolean', default: true })
  is_available: boolean;
}
