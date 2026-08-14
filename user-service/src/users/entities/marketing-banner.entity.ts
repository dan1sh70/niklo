import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('marketing_banners')
export class MarketingBanner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  image_url: string;

  @Column({ type: 'text', nullable: true })
  deep_link: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ type: 'timestamptz', nullable: true })
  start_date: Date;

  @Column({ type: 'timestamptz', nullable: true })
  end_date: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
