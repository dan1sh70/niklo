import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { PackagePartner } from '../../partner/setup/entities/package_partner.entity';
import { PackageGalleryMedia } from './package-gallery-media.entity';
import { PackageItineraryDay } from './package-itinerary-day.entity';

@Entity('holiday_packages')
export class HolidayPackage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  partner_id: string;

  @ManyToOne(() => PackagePartner, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partner_id' })
  partner: PackagePartner;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  tagline: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 80 })
  category: string;

  @Column({ type: 'int' })
  duration_days: number;

  @Column({ type: 'int' })
  duration_nights: number;

  @Column({ type: 'varchar', length: 100 })
  destination_city: string;

  @Column({ type: 'varchar', length: 100 })
  destination_state: string;

  @Column({ type: 'varchar', length: 200 })
  starting_location: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  dropoff_location: string;

  @Column({ type: 'int', default: 1 })
  min_travelers: number;

  @Column({ type: 'int', default: 30 })
  max_travelers: number;

  @Column({ type: 'varchar', length: 30, default: 'PER_PERSON' })
  pricing_mode: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  base_price: number;

  @Column({ type: 'boolean', default: false })
  has_discount: boolean;

  @Column({ type: 'varchar', length: 20, default: 'PERCENTAGE', nullable: true })
  discount_type: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0, nullable: true })
  discount_value: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  final_price: number;

  @Column({ type: 'boolean', default: true })
  is_gst_included: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  cover_image_url: string;

  @Column({ type: 'varchar', length: 30, default: 'DRAFT' })
  status: string;

  @Column({ type: 'int', default: 1 })
  current_creation_step: number;

  @Column({ type: 'int', default: 0 })
  total_bookings_count: number;

  @Column({ type: 'numeric', precision: 3, scale: 2, default: 5.0, nullable: true })
  average_rating: number;

  @Column({ type: 'int', default: 0 })
  total_reviews_count: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => PackageGalleryMedia, media => media.package, { cascade: true })
  gallery_media: PackageGalleryMedia[];

  @OneToMany(() => PackageItineraryDay, day => day.package, { cascade: true })
  itinerary_days: PackageItineraryDay[];
}
