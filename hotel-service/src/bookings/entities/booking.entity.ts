import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  bookingId: string;

  @Column()
  hotelId: string;

  @Column()
  roomTypeId: string;

  @Column()
  checkInDate: string;

  @Column()
  checkOutDate: string;

  @Column('int')
  rooms: number;

  @Column('int')
  adults: number;

  @Column('int')
  children: number;

  @Column('int', { array: true, default: [] })
  childAges: number[];

  @Column({ default: false })
  isHourly: boolean;

  @Column({ nullable: true })
  hourlyCheckInTime: string;

  @Column('int', { nullable: true })
  hourlyDurationHours: number;

  @Column('int')
  totalAmount: number;

  @Column()
  userId: string;

  @Column({ default: 'pending_payment' })
  status: string;

  @Column({ default: 'INR' })
  currency: string;

  @Column({ nullable: true })
  paymentGatewayOrderId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
