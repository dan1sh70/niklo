import { IsNumber, IsString } from 'class-validator';

export class TopUpDto {
  @IsNumber()
  amount: number;

  @IsString()
  description?: string = 'Wallet Top-up';
}
