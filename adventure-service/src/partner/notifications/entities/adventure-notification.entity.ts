import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AdventurePartner } from '../../setup/entities/adventure-partner.entity';

@Entity('adventure_partner_notifications')
@Index('idx_adv_notif_partner_unread', ['partner_id', 'is_unread'])
@Index('idx_adv_notif_category', ['category'])
@Index('idx_adv_notif_created_at', ['created_at'])
export class AdventureNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  partner_id: string;

  @Column({ type: 'varchar', length: 30 })
  category: string;

  @Column({ type: 'varchar', length: 50 })
  event_type: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'boolean', default: true })
  is_unread: boolean;

  @Column({ type: 'boolean', default: true })
  has_border_highlight: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  target_type: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  target_id: string;

  @Column({ type: 'text', nullable: true })
  deep_link_url: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ManyToOne(() => AdventurePartner, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partner_id' })
  partner: AdventurePartner;
}
