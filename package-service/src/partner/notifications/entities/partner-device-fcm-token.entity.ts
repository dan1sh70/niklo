import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('partner_device_fcm_tokens')
export class PartnerDeviceFcmToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @Column()
  partner_id: string;

  @Column({ unique: true })
  fcm_token: string;

  @Column()
  device_os: string;

  @Column({ nullable: true })
  device_model: string;

  @Column({ nullable: true })
  app_version: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  last_active_at: Date;
}
