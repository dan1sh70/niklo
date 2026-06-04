import { IsString, IsNotEmpty, IsOptional, IsEmail, Matches } from 'class-validator';

export class CreateOperatorDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  logo_url?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'Phone must be E.164 format' })
  contact_phone?: string;

  @IsOptional()
  @IsEmail()
  contact_email?: string;

  @IsOptional()
  @IsString()
  gst_number?: string;
}
