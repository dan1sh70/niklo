import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreateRoomTypeDto {
  @IsString()
  @Length(2, 120)
  title: string;

  @IsString()
  @Length(1, 40)
  guestCount: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  imageCount?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsString()
  mealPlan?: string;

  @IsOptional()
  @IsString()
  mealPlanDesc?: string;

  @IsInt()
  @Min(0)
  price: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  oldPrice?: number;

  /** Free text such as `"₹1,710 taxes & fees"`; the rupee value is parsed out. */
  @IsOptional()
  @IsString()
  taxes?: string;

  @IsOptional()
  @IsArray()
  amenities?: any[];

  @IsOptional()
  cancellationPolicy?: any;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  inclusions?: string[];

  /** Physical room count — this is what availability is measured against. */
  @IsOptional()
  @IsInt()
  @Min(1)
  totalRooms?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateRoomTypeDto {
  @IsOptional()
  @IsString()
  @Length(2, 120)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(1, 40)
  guestCount?: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  imageCount?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsString()
  mealPlan?: string;

  @IsOptional()
  @IsString()
  mealPlanDesc?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  oldPrice?: number;

  @IsOptional()
  @IsString()
  taxes?: string;

  @IsOptional()
  @IsArray()
  amenities?: any[];

  @IsOptional()
  cancellationPolicy?: any;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  inclusions?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  totalRooms?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
