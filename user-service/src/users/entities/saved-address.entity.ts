import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
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

  @Column({ type: 'varchar', length: 50, default: 'Home' })
  label: string;

  @Column({ type: 'text' })
  address_line: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'numeric', precision: 10, scale: 6 })
  latitude: number;

  @Column({ type: 'numeric', precision: 10, scale: 6 })
  longitude: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
