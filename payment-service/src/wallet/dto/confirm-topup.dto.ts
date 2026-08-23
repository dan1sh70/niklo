import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ConfirmTopUpDto {
  @IsString()
  @IsNotEmpty()
  razorpay_order_id: string;

  @IsString()
  @IsNotEmpty()
  razorpay_payment_id: string;

  @IsString()
  @IsOptional()
  razorpay_signature?: string;
}
