import { IsString, IsNotEmpty, IsNumber, IsOptional, IsUUID, IsObject } from 'class-validator';

export class CreatePayoutDto {
  @IsUUID()
  @IsNotEmpty()
  vendor_id: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsNotEmpty()
  payment_method: string;

  @IsObject()
  @IsOptional()
  payment_details?: any;
}

export class ProcessPayoutDto {
  @IsString()
  @IsNotEmpty()
  status: string; // APPROVED or REJECTED

  @IsString()
  @IsOptional()
  transaction_ref?: string;

  @IsString()
  @IsOptional()
  rejection_reason?: string;
}
