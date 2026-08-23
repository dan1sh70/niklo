import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class PayWithWalletDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsOptional()
  booking_id?: string;

  @IsString()
  @IsOptional()
  booking_type?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
