import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsInt,
  IsArray,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreatePackageDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsInt()
  @IsNotEmpty()
  duration_days: number;

  @IsInt()
  @IsNotEmpty()
  duration_nights: number;

  @IsArray()
  @IsOptional()
  destinations?: string[];

  @IsArray()
  @IsOptional()
  inclusions?: string[];

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
