import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  provider_name: string; // e.g. 'MSG91', 'Twilio', 'SRDV'

  @Column()
  api_key: string;

  @Column({ nullable: true })
  api_secret: string;

  @Column({ nullable: true })
  sender_id: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
