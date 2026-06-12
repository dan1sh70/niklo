import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class SocialLoginDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['google', 'apple', 'facebook'])
  provider: 'google' | 'apple' | 'facebook';

  @IsString()
  @IsNotEmpty()
  idToken: string;
}
