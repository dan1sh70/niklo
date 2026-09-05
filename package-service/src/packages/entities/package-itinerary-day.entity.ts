import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { HolidayPackage } from './holiday-package.entity';

@Entity('package_itinerary_days')
@Unique(['package_id', 'day_number'])
export class PackageItineraryDay {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  package_id: string;

  @ManyToOne(() => HolidayPackage, pkg => pkg.itinerary_days, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'package_id' })
  package: HolidayPackage;

  @Column({ type: 'int' })
  day_number: number;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'text', array: true, default: [] })
  meals_included: string[];

  @Column({ type: 'varchar', length: 150, nullable: true })
  hotel_stay_name: string;

  @CreateDateColumn()
  created_at: Date;
}
