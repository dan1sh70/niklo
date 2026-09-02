import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';
import { AdventurePartner } from '../../setup/entities/adventure-partner.entity';
import { AdventureActivity } from '../../activities/entities/adventure-activity.entity';
import { AdventurePackageBenefit } from './adventure-package-benefit.entity';

@Entity('adventure_package_tiers')
@Index('idx_adv_packages_activity_id', ['activity_id'])
@Index('idx_adv_packages_partner_id', ['partner_id'])
export class AdventurePackageTier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  partner_id: string;

  @Column({ type: 'uuid' })
  activity_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.00 })
  discount_percent: number;

  @Column({ type: 'varchar', length: 50 })
  duration: string;

  @Column({ type: 'int' })
  max_participants: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'boolean', default: false })
  is_popular: boolean;

  @Column({ type: 'boolean', default: false })
  photo_video: boolean;

  @Column({ type: 'boolean', default: false })
  pickup_drop: boolean;

  @Column({ type: 'boolean', default: false })
  meals_refreshments: boolean;

  @Column({ type: 'boolean', default: false })
  equipment_upgrade: boolean;

  @Column({ type: 'varchar', length: 30, default: 'ACTIVE' })
  status: string;

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

  @OneToMany(() => AdventurePackageBenefit, (b) => b.package_tier, { cascade: true })
  benefits: AdventurePackageBenefit[];
}
