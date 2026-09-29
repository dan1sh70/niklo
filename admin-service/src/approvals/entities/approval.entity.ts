import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AdminUser } from '../../admins/entities/admin.entity';

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('approvals')
export class Approval {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  entity_type: string; // e.g. 'PAYOUT', 'REFUND'

  @Column({ type: 'varchar', length: 100 })
  entity_id: string;

  @Column({ type: 'jsonb' })
  payload: any;

  @ManyToOne(() => AdminUser)
  @JoinColumn({ name: 'requested_by' })
  requester: AdminUser;

  @Column({ type: 'uuid' })
  requested_by: string;

  @ManyToOne(() => AdminUser, { nullable: true })
  @JoinColumn({ name: 'reviewed_by' })
  reviewer: AdminUser;

  @Column({ type: 'uuid', nullable: true })
  reviewed_by: string;

  @Column({ type: 'enum', enum: ApprovalStatus, default: ApprovalStatus.PENDING })
  status: ApprovalStatus;

  @Column({ type: 'text', nullable: true })
  comments: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
