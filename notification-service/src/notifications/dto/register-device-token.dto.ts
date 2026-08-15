import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class RegisterDeviceTokenDto {
  @IsString()
  @IsNotEmpty()
  fcmToken: string;

  @IsString()
  @IsOptional()
  platform?: string;
}
