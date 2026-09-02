import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AdventurePartner } from '../../setup/entities/adventure-partner.entity';
import { AdventureActivity } from '../../activities/entities/adventure-activity.entity';

@Entity('adventure_slot_recurrences')
export class AdventureSlotRecurrence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  partner_id: string;

  @Column({ type: 'uuid' })
  activity_id: string;

  @Column({ type: 'varchar', length: 30 })
  recurrence_interval: string; // DAILY | WEEKDAYS | WEEKENDS | CUSTOM

  @Column({ type: 'int', array: true, default: '{}' })
  custom_days: number[];

  @Column({ type: 'date' })
  start_date: string;

  @Column({ type: 'date', nullable: true })
  end_date: string;

  @Column({ type: 'varchar', length: 20 })
  start_time: string;

  @Column({ type: 'varchar', length: 20 })
  end_time: string;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price_per_person: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  instructor_name: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ManyToOne(() => AdventurePartner, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partner_id' })
  partner: AdventurePartner;

  @ManyToOne(() => AdventureActivity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activity_id' })
  activity: AdventureActivity;
}
