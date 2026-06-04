import { IsString, IsNotEmpty, IsNumber, IsInt, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class BoardingPointDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  landmark?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  contact_phone?: string;

  @IsOptional()
  @IsInt()
  order_index?: number;
}

export class DroppingPointDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  landmark?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  contact_phone?: string;

  @IsOptional()
  @IsInt()
  order_index?: number;
}

export class CreateRouteDto {
  @IsString()
  @IsNotEmpty()
  source_city: string;

  @IsString()
  @IsNotEmpty()
  destination_city: string;

  @IsNumber()
  distance_km: number;

  @IsInt()
  estimated_duration_minutes: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BoardingPointDto)
  boarding_points?: BoardingPointDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DroppingPointDto)
  dropping_points?: DroppingPointDto[];
}
