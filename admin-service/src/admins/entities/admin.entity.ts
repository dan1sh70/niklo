import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AdminRole } from '../../roles/entities/admin-role.entity';

@Entity('admin_users')
export class AdminUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  password_hash: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  totp_secret: string;

  @Column({ type: 'boolean', default: false })
  totp_enabled: boolean;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @ManyToOne(() => AdminRole)
  @JoinColumn({ name: 'role_id' })
  role: AdminRole;

  @Column({ type: 'uuid', nullable: true })
  role_id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
