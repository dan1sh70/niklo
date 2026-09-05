import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PackageActivity } from './adventure-activity.entity';

@Entity('adventure_activity_media')
export class PackageActivityMedia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  activity_id: string;

  @Column({ type: 'text' })
  media_url: string;

  @Column({ type: 'varchar', length: 20, default: 'IMAGE' })
  media_type: string;

  @Column({ type: 'int', default: 0 })
  display_order: number;

  @Column({ type: 'boolean', default: false })
  is_cover: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ManyToOne(() => PackageActivity, (a) => a.media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activity_id' })
  activity: PackageActivity;
}
