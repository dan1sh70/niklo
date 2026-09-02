import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { AdventureActivity } from './adventure-activity.entity';

@Entity('adventure_activity_requirements')
export class AdventureActivityRequirements {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  activity_id: string;

  @Column({ type: 'boolean', default: false })
  is_age_restriction_enabled: boolean;

  @Column({ type: 'int', nullable: true })
  min_age: number;

  @Column({ type: 'int', nullable: true })
  max_age: number;

  @Column({ type: 'boolean', default: false })
  is_weight_restriction_enabled: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  min_weight_kg: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  max_weight_kg: number;

  @Column({ type: 'boolean', default: false })
  is_height_restriction_enabled: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  min_height_cm: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  max_height_cm: number;

  @Column({ type: 'int', default: 1 })
  min_group_size: number;

  @Column({ type: 'int', default: 20 })
  max_group_size: number;

  @Column({ type: 'text', array: true, default: '{}' })
  medical_restrictions: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  what_to_bring: string[];

  @Column({ type: 'text', nullable: true })
  safety_guidelines: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToOne(() => AdventureActivity, (a) => a.requirements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activity_id' })
  activity: AdventureActivity;
}
