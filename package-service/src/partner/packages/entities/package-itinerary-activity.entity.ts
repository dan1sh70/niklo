import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('package_itinerary_activities')
export class PackageItineraryActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  day_id: string;

  @Column()
  time_slot: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 'explore' })
  activity_icon: string;

  @Column({ type: 'int', default: 0 })
  sort_order: number;
}
