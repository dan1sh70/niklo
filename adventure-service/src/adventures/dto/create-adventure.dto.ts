import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsInt,
  IsArray,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateAdventureDto {
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
  duration_hours: number;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsArray()
  @IsOptional()
  requirements?: string[];

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
