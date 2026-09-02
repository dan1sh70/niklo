import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { AdventurePartner } from './adventure-partner.entity';

@Entity('adventure_partner_locations')
export class AdventurePartnerLocation {
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

  @OneToOne(() => AdventurePartner, (p) => p.location, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partner_id' })
  partner: AdventurePartner;
}
