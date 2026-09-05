import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { PackagePartner } from './package_partner.entity';

@Entity('package_partner_locations')
export class PackagePartnerLocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  partner_id: string;

  @Column({ type: 'varchar', length: 255 })
  search_location: string;

  @Column({ type: 'text' })
  meeting_point_address: string;

  @Column({ type: 'text' })
  activity_start_area: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToOne(() => PackagePartner, (p) => p.location, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partner_id' })
  partner: PackagePartner;
}
