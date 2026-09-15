import { IsString, IsNotEmpty, IsOptional, IsUUID, IsNumber } from 'class-validator';

export class CreateReferralDto {
  @IsUUID()
  @IsNotEmpty()
  sales_executive_id: string;

  @IsString()
  @IsNotEmpty()
  referral_code: string;

  @IsUUID()
  @IsNotEmpty()
  referred_user_id: string;

  @IsNumber()
  @IsOptional()
  total_revenue_generated?: number;

  @IsNumber()
  @IsOptional()
  commission_earned?: number;
}

export class UpdateReferralDto {
  @IsNumber()
  @IsOptional()
  total_revenue_generated?: number;

  @IsNumber()
  @IsOptional()
  commission_earned?: number;
}
