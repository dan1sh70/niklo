import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { PackagePartner } from './package_partner.entity';

@Entity('package_partner_documents')
@Unique(['partner_id', 'doc_type'])
export class PackagePartnerDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  partner_id: string;

  @Column({ type: 'varchar', length: 50 })
  doc_type: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255 })
  file_name: string;

  @Column({ type: 'text' })
  file_url: string;

  @Column({ type: 'bigint' })
  file_size_bytes: number;

  @Column({ type: 'varchar', length: 100 })
  mime_type: string;

  @Column({ type: 'boolean', default: true })
  is_required: boolean;

  @Column({ type: 'varchar', length: 30, default: 'UPLOADED' })
  status: string;

  @Column({ type: 'text', nullable: true })
  review_notes: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => PackagePartner, (p) => p.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partner_id' })
  partner: PackagePartner;
}
