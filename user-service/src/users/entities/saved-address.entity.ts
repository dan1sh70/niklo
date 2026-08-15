import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_saved_addresses')
export class SavedAddress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'varchar', length: 20, default: 'other' })
  type: string; // 'home' | 'work' | 'other'

  @Column({ type: 'varchar', length: 50, default: 'Home' })
  label: string;

  @Column({ type: 'text' })
  full_address: string;

  @Column({ type: 'numeric', precision: 10, scale: 6, default: 0 })
  latitude: number;

  @Column({ type: 'numeric', precision: 10, scale: 6, default: 0 })
  longitude: number;

  @Column({ type: 'boolean', default: false })
  is_default: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}

