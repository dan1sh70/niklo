import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  @IsNotEmpty()
  provider_name: string;

  @IsString()
  @IsNotEmpty()
  api_key: string;

  @IsString()
  @IsOptional()
  api_secret?: string;

  @IsString()
  @IsOptional()
  sender_id?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class UpdateApiKeyDto {
  @IsString()
  @IsOptional()
  provider_name?: string;

  @IsString()
  @IsOptional()
  api_key?: string;

  @IsString()
  @IsOptional()
  api_secret?: string;

  @IsString()
  @IsOptional()
  sender_id?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
