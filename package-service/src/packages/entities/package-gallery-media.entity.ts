import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { HolidayPackage } from './holiday-package.entity';

@Entity('package_gallery_media')
export class PackageGalleryMedia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  package_id: string;

  @ManyToOne(() => HolidayPackage, pkg => pkg.gallery_media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'package_id' })
  package: HolidayPackage;

  @Column({ type: 'varchar', length: 500 })
  media_url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnail_url: string;

  @Column({ type: 'varchar', length: 20, default: 'IMAGE' })
  media_type: string;

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @CreateDateColumn()
  created_at: Date;
}
