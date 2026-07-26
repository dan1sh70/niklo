import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Lifecycle of a hotel booking.
 *
 * `pendingPayment` is the only state a freshly created booking can be in; it
 * becomes `confirmed` once the payment service reports a successful capture.
 * Check-in/check-out are driven by the partner app.
 */
export enum HotelBookingStatus {
  PendingPayment = 'pending_payment',
  Confirmed = 'confirmed',
  CheckedIn = 'checked_in',
  CheckedOut = 'checked_out',
  Cancelled = 'cancelled',
}

/** Statuses that still hold inventory for their date range. */
export const OCCUPYING_STATUSES = [
  HotelBookingStatus.PendingPayment,
  HotelBookingStatus.Confirmed,
  HotelBookingStatus.CheckedIn,
];

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Not a unique index: rows created before ids were collision-free may repeat,
  // and failing the index build would stop the service from booting.
  @Index()
  @Column()
  bookingId: string;

  @Index()
  @Column()
  hotelId: string;

  @Column()
  roomTypeId: string;

  /**
   * Denormalized at creation so a cancelled or edited property never rewrites
   * what the guest actually booked.
   */
  @Column({ nullable: true })
  hotelName: string | null;

  @Column({ nullable: true })
  hotelAddress: string | null;

  @Column({ nullable: true })
  hotelImagePath: string | null;

  @Column({ nullable: true })
  roomTitle: string | null;

  /** Owner of the property at booking time — drives the partner-side feed. */
  @Index()
  @Column({ nullable: true })
  hotelOwnerId: string | null;

  @Column()
  checkInDate: string;

  @Column()
  checkOutDate: string;

  @Column('int', { default: 1 })
  nights: number;

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
  hourlyCheckInTime: string | null;

  @Column('int', { nullable: true })
  hourlyDurationHours: number | null;

  /** `[{ name, age, gender, idType }]` — captured on the guest details screen. */
  @Column({ type: 'jsonb', default: [] })
  guests: any[];

  @Column({ nullable: true })
  contactEmail: string | null;

  @Column({ nullable: true })
  contactPhone: string | null;

  /** Authoritative, server-computed total. Never taken from the client. */
  @Column('int')
  totalAmount: number;

  /** `{ roomStayCost, extraGuestCharges, taxes, discount, total }`. */
  @Column({ type: 'jsonb', default: {} })
  priceBreakdown: any;

  @Index()
  @Column()
  userId: string;

  /**
   * Kept as a varchar rather than a Postgres enum: the column already exists on
   * the live database, and switching its type would force a risky ALTER on
   * every deploy for no gain — the enum below is enforced in TypeScript.
   */
  @Index()
  @Column({ default: HotelBookingStatus.PendingPayment })
  status: HotelBookingStatus;

  @Column({ default: 'INR' })
  currency: string;

  @Column({ nullable: true })
  paymentGatewayOrderId: string | null;

  /** Set when the payment service confirms a successful capture. */
  @Column({ nullable: true })
  paymentId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  confirmedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @Column({ nullable: true })
  cancellationReason: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  checkedInAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  checkedOutAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
