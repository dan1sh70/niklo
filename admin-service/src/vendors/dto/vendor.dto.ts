import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

export class CreateVendorDto {
  @IsString()
  @IsNotEmpty()
  company_name: string;

  @IsString()
  @IsNotEmpty()
  owner_name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  gst_number?: string;

  @IsString()
  @IsOptional()
  logo_url?: string;
}

export class UpdateVendorDto {
  @IsString()
  @IsOptional()
  company_name?: string;

  @IsString()
  @IsOptional()
  owner_name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  gst_number?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  plan?: string;

  @IsString()
  @IsOptional()
  logo_url?: string;
}
