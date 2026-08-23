import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePopularRouteDto {
  @IsString()
  @IsNotEmpty()
  source: string;

  @IsString()
  @IsNotEmpty()
  destination: string;

  @IsString()
  @IsNotEmpty()
  duration: string;

  @IsNumber()
  @Min(0)
  start_price: number;

  @IsString()
  @IsOptional()
  tag?: string;

  @IsNumber()
  @IsOptional()
  priority?: number;
}
