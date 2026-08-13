import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class OnboardDriverDto {
  @IsUUID('all')
  @IsNotEmpty()
  user_id: string;

  @IsString()
  @IsOptional()
  vehicle_type?: string;

  @IsString()
  @IsOptional()
  vehicle_number?: string;

  @IsString()
  @IsOptional()
  aadhaar_number?: string;

  @IsString()
  @IsOptional()
  pan_number?: string;

  @IsString()
  @IsOptional()
  rc_number?: string;

  @IsOptional()
  is_owner?: boolean;

  @IsString()
  @IsOptional()
  date_of_birth?: string;

  @IsOptional()
  availability?: string[];
}

export class UploadKycDto {
  @IsUUID('all')
  @IsNotEmpty()
  driver_id: string;

  @IsString()
  @IsNotEmpty()
  document_type: string;

  @IsString()
  @IsNotEmpty()
  document_url: string;
}
