import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { HotelPaymentMethod } from '../entities/booking.entity';

export class BookingGuestDto {
  @IsString()
  @Length(2, 60)
  name: string;

  @IsInt()
  @Min(0)
  @Max(120)
  age: number;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  idType?: string;
}

/**
 * Fields a client is allowed to supply when booking.
 *
 * `userId` and `totalAmount` are deliberately absent: the guest comes from the
 * JWT and the price is recomputed server-side from the room's own rate, so a
 * tampered client cannot book in someone else's name or set its own price.
 */
export class CreateHotelBookingDto {
  @IsUUID()
  hotelId: string;

  @IsUUID()
  roomTypeId: string;

  @IsDateString()
  checkInDate: string;

  @IsDateString()
  checkOutDate: string;

  @IsInt()
  @Min(1)
  @Max(10)
  rooms: number;

  @IsInt()
  @Min(1)
  @Max(30)
  adults: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  children?: number = 0;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @ArrayMaxSize(20)
  childAges?: number[] = [];

  @IsOptional()
  @IsBoolean()
  isHourly?: boolean = false;

  @IsOptional()
  @IsString()
  hourlyCheckInTime?: string;

  @IsOptional()
  @IsInt()
  @IsIn([3, 6, 9])
  hourlyDurationHours?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingGuestDto)
  @ArrayMaxSize(30)
  guests?: BookingGuestDto[];

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsString()
  @Length(8, 15)
  contactPhone: string;

  /**
   * `cash` books the room to be settled at the property. Defaulted rather than
   * required so existing clients keep the online flow they already send.
   */
  @IsOptional()
  @IsEnum(HotelPaymentMethod)
  paymentMethod?: HotelPaymentMethod = HotelPaymentMethod.Online;
}

/** Same inputs as a booking, but priced without reserving anything. */
export class QuoteHotelBookingDto {
  @IsUUID()
  hotelId: string;

  @IsUUID()
  roomTypeId: string;

  @IsDateString()
  checkInDate: string;

  @IsDateString()
  checkOutDate: string;

  @IsInt()
  @Min(1)
  @Max(10)
  rooms: number;

  @IsInt()
  @Min(1)
  @Max(30)
  adults: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  children?: number = 0;

  @IsOptional()
  @IsBoolean()
  isHourly?: boolean = false;

  @IsOptional()
  @IsInt()
  @IsIn([3, 6, 9])
  hourlyDurationHours?: number;
}

export class ConfirmPaymentDto {
  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @IsOptional()
  @IsString()
  paymentGatewayOrderId?: string;
}

export class CancelBookingDto {
  @IsOptional()
  @IsString()
  @Length(0, 300)
  reason?: string;
}
