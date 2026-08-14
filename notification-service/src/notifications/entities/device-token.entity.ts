import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('user_device_tokens')
export class DeviceToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'varchar', length: 255 })
  token: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  platform: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
