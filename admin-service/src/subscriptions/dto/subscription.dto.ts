import { IsString, IsNotEmpty, IsNumber, IsInt, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class CreateSubscriptionPlanDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  price: number;

  @IsInt()
  duration_days: number;

  @IsArray()
  features: string[];

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class UpdateSubscriptionPlanDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsInt()
  @IsOptional()
  duration_days?: number;

  @IsArray()
  @IsOptional()
  features?: string[];

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
