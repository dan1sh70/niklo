import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { PackagePartner } from '../../setup/entities/package_partner.entity';

@Entity('package_partner_notification_preferences')
export class PackageNotificationPreferences {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  partner_id: string;

  @Column({ type: 'boolean', default: true })
  push_new_bookings: boolean;

  @Column({ type: 'boolean', default: true })
  push_payment_alerts: boolean;

  @Column({ type: 'boolean', default: true })
  push_low_capacity: boolean;

  @Column({ type: 'boolean', default: true })
  push_settlements: boolean;

  @Column({ type: 'boolean', default: true })
  email_daily_summary: boolean;

  @Column({ type: 'boolean', default: false })
  whatsapp_urgent: boolean;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToOne(() => PackagePartner, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partner_id' })
  partner: PackagePartner;
}
