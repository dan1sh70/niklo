import { IsEnum, IsUUID, IsOptional, IsArray, IsNumber, IsString, IsDateString } from 'class-validator';
import { BookingType } from '../entities/booking.entity';

export class CreateBookingDto {
  @IsEnum(BookingType)
  booking_type: BookingType;

  @IsUUID('all')
  schedule_id: string;

  @IsOptional()
  @IsUUID('all')
  journey_id?: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  seat_numbers?: number[];

  @IsOptional()
  @IsString()
  boarding_point?: string;

  @IsOptional()
  @IsString()
  dropping_point?: string;

  @IsOptional()
  @IsArray()
  passenger_details?: any[];

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
  @IsNumber({}, { each: true })
  seatIds: number[];
}
