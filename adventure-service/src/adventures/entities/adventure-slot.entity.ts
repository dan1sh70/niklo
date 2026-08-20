import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { TravelAdventure } from './adventure.entity';

@Entity('adventure_slots')
@Unique(['adventure_id', 'slot_date', 'time_slot'])
export class AdventureSlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  adventure_id: string;

  @Column({ type: 'date' })
  slot_date: Date;

  @Column({ type: 'varchar', length: 50 })
  time_slot: string;

  @Column({ type: 'int', default: 15 })
  total_capacity: number;

  @Column({ type: 'int', default: 0 })
  booked_slots: number;

  @Column({ type: 'boolean', default: true })
  is_available: boolean;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => TravelAdventure, (adventure) => adventure.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'adventure_id' })
  adventure: TravelAdventure;
}
