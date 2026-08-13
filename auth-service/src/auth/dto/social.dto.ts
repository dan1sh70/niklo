import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';

export class SocialLoginDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['google', 'apple', 'facebook'])
  provider: 'google' | 'apple' | 'facebook';

  @IsString()
  @IsNotEmpty()
  idToken: string;

  @IsString()
  @IsOptional()
  role?: string;
}
