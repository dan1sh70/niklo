import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Hotel } from './hotel.entity';
import { RoomType } from './room-type.entity';

@Entity('partner_calendars')
export class PartnerCalendar {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  hotel_id: string;

  @Column({ type: 'uuid' })
  room_type_id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'int', default: 0 })
  total_available: number;

  @Column({ type: 'int', default: 0 })
  booked: number;

  @Column({ type: 'int', default: 0 })
  blocked: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Hotel)
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @ManyToOne(() => RoomType)
  @JoinColumn({ name: 'room_type_id' })
  room_type: RoomType;
}
