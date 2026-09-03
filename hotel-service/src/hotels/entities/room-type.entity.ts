import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Hotel } from './hotel.entity';

@Entity('room_types')
export class RoomType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Hotel, (hotel) => hotel.roomTypes, { onDelete: 'CASCADE' })
  hotel: Hotel;

  @Column()
  title: string;

  @Column('numeric', { precision: 10, scale: 2, default: 0 })
  price_per_night: number;

  @Column('int', { default: 2 })
  max_guests: number;

  @Column('int', { default: 2 })
  max_adults: number;

  @Column('int', { default: 1 })
  max_children: number;

  @Column('int', { default: 5 })
  available_rooms_count: number;

  @Column('int', { default: 250 })
  room_size_sqft: number;

  @Column({ length: 50, default: 'King Bed' })
  bed_type: string;

  @Column({ type: 'jsonb', default: [] })
  amenities: any[];

  @Column({ type: 'jsonb', default: [] })
  images: any[];

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  meal_plan: string;

  @Column({ type: 'text', nullable: true })
  meal_plan_desc: string;

  @Column({ type: 'jsonb', default: [] })
  inclusions: any[];

  @Column({ type: 'jsonb', nullable: true })
  cancellation_policy: any;
}
