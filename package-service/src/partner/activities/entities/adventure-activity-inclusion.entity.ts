import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PackageActivity } from './adventure-activity.entity';

@Entity('adventure_activity_inclusions')
export class PackageActivityInclusion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  activity_id: string;

  @Column({ type: 'varchar', length: 255 })
  item_name: string;

  @Column({ type: 'varchar', length: 30 })
  item_type: string; // 'INCLUSION' | 'EQUIPMENT_PROVIDED'

  @Column({ type: 'boolean', default: false })
  is_custom: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ManyToOne(() => PackageActivity, (a) => a.inclusions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activity_id' })
  activity: PackageActivity;
}
