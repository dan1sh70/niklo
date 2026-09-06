import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('package_partner_notifications')
export class PackagePartnerNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  partner_id: string;

  @Column()
  category: string;

  @Column()
  title: string;

  @Column('text')
  body: string;

  @Column({ nullable: true })
  action_label: string;

  @Column({ nullable: true })
  action_route: string;

  @Column({ type: 'jsonb', default: {} })
  metadata_json: Record<string, any>;

  @Column({ default: false })
  is_read: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  read_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
