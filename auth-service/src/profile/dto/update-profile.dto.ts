import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/// Every field is optional: a screen that edits one thing must not blank out
/// the rest. The global ValidationPipe runs with `whitelist: true`, so anything
/// not declared here is dropped before it reaches the service.
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(trim)
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid address' })
  @MaxLength(255)
  @Transform(trim)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Transform(trim)
  dob?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Transform(trim)
  gender?: string;
}
