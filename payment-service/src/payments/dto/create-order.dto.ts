import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string = 'INR';

  @IsUUID('all')
  @IsOptional()
  booking_id?: string;
}
