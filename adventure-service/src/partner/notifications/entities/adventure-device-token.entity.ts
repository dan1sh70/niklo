import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AdventurePartner } from '../../setup/entities/adventure-partner.entity';

@Entity('adventure_partner_device_tokens')
export class AdventureDeviceToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  partner_id: string;

  @Column({ type: 'text', unique: true })
  fcm_token: string;

  @Column({ type: 'varchar', length: 20 })
  device_os: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  device_model: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  app_version: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  last_active_at: Date;

  @ManyToOne(() => AdventurePartner, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partner_id' })
  partner: AdventurePartner;
}
