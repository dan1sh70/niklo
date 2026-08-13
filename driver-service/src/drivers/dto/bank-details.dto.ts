import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class BankDetailsDto {
  @IsUUID('all')
  @IsNotEmpty()
  driverId: string;

  @IsString()
  @IsNotEmpty()
  accountHolderName: string;

  @IsString()
  @IsNotEmpty()
  bankName: string;

  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @IsString()
  @IsNotEmpty()
  ifscCode: string;

  @IsString()
  @IsNotEmpty()
  accountType: string;
}
