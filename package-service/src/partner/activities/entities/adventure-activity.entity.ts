import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, OneToOne, JoinColumn, Index,
} from 'typeorm';
import { PackagePartner } from '../../setup/entities/package_partner.entity';
import { PackageActivityMedia } from './adventure-activity-media.entity';
import { PackageActivityRequirements } from './adventure-activity-requirements.entity';
import { PackageActivityInclusion } from './adventure-activity-inclusion.entity';

@Entity('adventure_activities')
@Index('idx_adv_activities_partner_id', ['partner_id'])
@Index('idx_adv_activities_status', ['status'])
@Index('idx_adv_activities_category', ['category'])
export class PackageActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  partner_id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 50 })
  category: string;

  @Column({ type: 'varchar', length: 30, default: 'Moderate' })
  difficulty: string;

  @Column({ type: 'varchar', length: 255 })
  location: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 50 })
  duration: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price_per_person: number;

  @Column({ type: 'text' })
  cover_image_url: string;

  @Column({ type: 'text', nullable: true })
  video_url: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  reviews_count: number;

  @Column({ type: 'varchar', length: 30, default: 'DRAFT' })
  status: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => PackagePartner, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partner_id' })
  partner: PackagePartner;

  @OneToMany(() => PackageActivityMedia, (m) => m.activity, { cascade: true })
  media: PackageActivityMedia[];

  @OneToOne(() => PackageActivityRequirements, (r) => r.activity, { cascade: true })
  requirements: PackageActivityRequirements;

  @OneToMany(() => PackageActivityInclusion, (i) => i.activity, { cascade: true })
  inclusions: PackageActivityInclusion[];
}
