import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { AdventurePartner } from '../../setup/entities/adventure-partner.entity';
import { AdventureActivity } from '../../activities/entities/adventure-activity.entity';

@Entity('adventure_time_slots')
@Index('idx_adv_slots_partner_date', ['partner_id', 'slot_date'])
@Index('idx_adv_slots_activity_date', ['activity_id', 'slot_date'])
@Index('idx_adv_slots_recurrence', ['recurrence_id'])
export class AdventureTimeSlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  partner_id: string;

  @Column({ type: 'uuid' })
  activity_id: string;

  @Column({ type: 'date' })
  slot_date: string;

  @Column({ type: 'varchar', length: 20 })
  start_time: string;

  @Column({ type: 'varchar', length: 20 })
  end_time: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  slot_title: string;

  @Column({ type: 'int' })
  total_capacity: number;

  @Column({ type: 'int', default: 0 })
  booked_count: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price_per_person: number;

  @Column({ type: 'varchar', length: 100, default: 'Not Assigned' })
  instructor_name: string;

  @Column({ type: 'boolean', default: false })
  is_closed: boolean;

  @Column({ type: 'boolean', default: false })
  is_recurring: boolean;

  @Column({ type: 'uuid', nullable: true })
  recurrence_id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => AdventurePartner, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partner_id' })
  partner: AdventurePartner;

  @ManyToOne(() => AdventureActivity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activity_id' })
  activity: AdventureActivity;
}
