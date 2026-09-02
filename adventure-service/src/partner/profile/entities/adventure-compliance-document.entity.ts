import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AdventurePartner } from '../../setup/entities/adventure-partner.entity';

@Entity('adventure_partner_compliance_documents')
export class AdventureComplianceDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  partner_id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 50 })
  doc_type: string;

  @Column({ type: 'varchar', length: 100 })
  doc_number: string;

  @Column({ type: 'date', nullable: true })
  valid_until: string;

  @Column({ type: 'varchar', length: 30, default: 'PENDING_APPROVAL' })
  status: string;

  @Column({ type: 'text' })
  file_url: string;

  @Column({ type: 'varchar', length: 255 })
  file_name: string;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string;

  @Column({ type: 'timestamptz', nullable: true })
  verified_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => AdventurePartner, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partner_id' })
  partner: AdventurePartner;
}
