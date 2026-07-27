import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateRoomTypeDto } from './room-type.dto';

/**
 * Creating a property.
 *
 * Only the name and address are required. A partner signing up has a name and
 * an address long before they have coordinates, photos or a nightly rate —
 * demanding those up front would leave onboarding with nothing it could
 * actually submit. Everything else is filled in later from the rooms screen.
 */
export class CreateHotelDto {
  @IsString()
  @Length(2, 120)
  hotelName: string;

  /** Doubles as the property type on the partner onboarding form. */
  @IsOptional()
  @IsString()
  badgeText?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  imagePath?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  galleryImages?: string[];

  @IsOptional()
  @IsString()
  distanceText?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  ratingValue?: number;

  @IsOptional()
  @IsString()
  ratingText?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  reviewsCount?: number;

  @IsOptional()
  @IsBoolean()
  freeBreakfast?: boolean;

  @IsOptional()
  @IsBoolean()
  freeWifi?: boolean;

  @IsOptional()
  @IsBoolean()
  freeCancellation?: boolean;

  @IsOptional()
  @IsString()
  priceText?: string;

  /** Display "from" rate. Recomputed from the rooms once any exist. */
  @IsOptional()
  @IsInt()
  @Min(0)
  priceInt?: number;

  @IsOptional()
  @IsString()
  @Length(0, 4000)
  description?: string;

  @IsString()
  @Length(3, 300)
  address: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

  /** Accepts plain strings or `{ name, icon }` objects; both are normalized out. */
  @IsOptional()
  @IsArray()
  popularAmenities?: any[];

  @IsOptional()
  @IsArray()
  nearbyPlaces?: any[];

  @IsOptional()
  @IsArray()
  features?: any[];

  @IsOptional()
  rules?: any;

  @IsOptional()
  hourlyOptions?: any;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRoomTypeDto)
  roomTypes?: CreateRoomTypeDto[];
}

/** Every field optional — used for partial property edits by the owner. */
export class UpdateHotelDto {
  @IsOptional()
  @IsString()
  @Length(2, 120)
  hotelName?: string;

  @IsOptional()
  @IsString()
  badgeText?: string;

  @IsOptional()
  @IsString()
  imagePath?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  galleryImages?: string[];

  @IsOptional()
  @IsString()
  distanceText?: string;

  @IsOptional()
  @IsString()
  ratingText?: string;

  @IsOptional()
  @IsBoolean()
  freeBreakfast?: boolean;

  @IsOptional()
  @IsBoolean()
  freeWifi?: boolean;

  @IsOptional()
  @IsBoolean()
  freeCancellation?: boolean;

  @IsOptional()
  @IsString()
  priceText?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  priceInt?: number;

  @IsOptional()
  @IsString()
  @Length(10, 4000)
  description?: string;

  @IsOptional()
  @IsString()
  @Length(3, 300)
  address?: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsArray()
  popularAmenities?: any[];

  @IsOptional()
  @IsArray()
  nearbyPlaces?: any[];

  @IsOptional()
  @IsArray()
  features?: any[];

  @IsOptional()
  rules?: any;

  @IsOptional()
  hourlyOptions?: any;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
