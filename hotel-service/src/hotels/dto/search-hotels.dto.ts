import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

/** Filter chips as the app labels them; unknown values are simply ignored. */
export class SearchFiltersDto {
  @IsOptional()
  @IsString()
  priceFilter?: string;

  @IsOptional()
  @IsString()
  ratingFilter?: string;

  @IsOptional()
  @IsString()
  amenityFilter?: string;

  @IsOptional()
  @IsString()
  selectedCategory?: string;
}

export class SearchHotelsDto {
  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsDateString()
  checkInDate?: string;

  @IsOptional()
  @IsDateString()
  checkOutDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  rooms?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  adults?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  children?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  childAges?: number[];

  @IsOptional()
  @IsBoolean()
  isHourly?: boolean;

  @IsOptional()
  @IsString()
  hourlyCheckInTime?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SearchFiltersDto)
  filters?: SearchFiltersDto;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}
