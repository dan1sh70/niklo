import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class OnboardDriverDto {
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @IsString()
  @IsOptional()
  vehicle_type?: string;

  @IsString()
  @IsOptional()
  vehicle_number?: string;
}

export class UploadKycDto {
  @IsUUID()
  @IsNotEmpty()
  driver_id: string;

  @IsString()
  @IsNotEmpty()
  document_type: string;

  @IsString()
  @IsNotEmpty()
  document_url: string;
}
