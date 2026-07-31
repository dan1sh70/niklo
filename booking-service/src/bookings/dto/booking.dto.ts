import { IsEnum, IsUUID, IsOptional, IsArray, IsNumber, IsString, IsDateString, ArrayNotEmpty } from 'class-validator';
import { BookingType } from '../entities/booking.entity';

export class CreateBookingDto {
  @IsEnum(BookingType)
  booking_type: BookingType;

  /**
   * Required for seated types (BUS, JOURNEY_LEG) only. Enforced in
   * BookingsService rather than here so the caller gets a message naming the
   * booking type, instead of a bare "schedule_id must be a UUID" on a package
   * booking that was never going to have one.
   */
  @IsOptional()
  @IsUUID('all')
  schedule_id?: string;

  /** The package or adventure being booked. Required for unseated types. */
  @IsOptional()
  @IsUUID('all')
  item_id?: string;

  @IsOptional()
  @IsUUID('all')
  journey_id?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  seat_numbers?: string[];

  @IsOptional()
  @IsString()
  boarding_point?: string;

  @IsOptional()
  @IsString()
  dropping_point?: string;

  @IsOptional()
  @IsArray()
  passenger_details?: any[];

  @IsOptional()
  @IsString()
  contact_email?: string;

  @IsOptional()
  @IsString()
  contact_phone?: string;

  fare_breakdown: any;

  @IsNumber()
  total_amount: number;

  @IsOptional()
  @IsDateString()
  travel_date?: string;
}

export class LockSeatsDto {
  @IsUUID('all')
  scheduleId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  seatIds: string[];
}

/**
 * Reported by the client after payment-service captures the money.
 * payment-service has no webhook into this service, so the app closes the loop.
 */
export class ConfirmPaymentDto {
  @IsOptional()
  @IsUUID('all')
  payment_id?: string;

  @IsOptional()
  @IsString()
  payment_gateway_order_id?: string;
}
