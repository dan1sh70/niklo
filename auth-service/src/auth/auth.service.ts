import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async sendOtp(phone: string): Promise<{ success: boolean; message: string }> {
    // Generate 6-digit OTP
    const otp =
      phone === '+919999999999'
        ? '123456'
        : Math.floor(100000 + Math.random() * 900000).toString();

    // Save to Redis (5 mins expiry)
    await this.redisService.setOtp(phone, otp);

    // TODO: Integrate MSG91 / Twilio SDK here to actually send SMS
    console.log(`[MOCK SMS] OTP for ${phone} is ${otp}`);

    return { success: true, message: 'OTP sent successfully' };
  }

  async verifyOtp(phone: string, otp: string): Promise<any> {
    const storedOtp = await this.redisService.getOtp(phone);

    if (!storedOtp || storedOtp !== otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // OTP matched, delete it
    await this.redisService.deleteOtp(phone);

    // Find or create user
    let user = await this.userRepository.findOne({ where: { phone } });
    if (!user) {
      user = this.userRepository.create({ phone });
      await this.userRepository.save(user);
    }

    return this.generateTokens(user);
  }

  async refreshTokens(refreshToken: string): Promise<any> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });
      if (!user) {
        throw new UnauthorizedException();
      }

      // Verify that the user still has an active session in Redis
      const session = await this.redisService.getSession(user.id);
      if (!session) {
        throw new UnauthorizedException('Session expired');
      }

      return this.generateTokens(user);
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<{ success: boolean }> {
    await this.redisService.deleteSession(userId);
    return { success: true };
  }

  async socialLogin(provider: string, idToken: string): Promise<any> {
    // TODO: Verify idToken with Google/Apple/Facebook API
    console.log(
      `[MOCK SOCIAL LOGIN] Verifying ${provider} idToken: ${idToken}`,
    );

    // Mocking finding a user from social email
    const mockEmail = `mock_${provider}@example.com`;
    let user = await this.userRepository.findOne({
      where: { email: mockEmail },
    });
    if (!user) {
      // Mocking phone since it's required and unique. In reality, we'd ask for phone if not provided.
      const mockPhone = '+91000000000' + Math.floor(Math.random() * 10);
      user = this.userRepository.create({
        email: mockEmail,
        phone: mockPhone,
        name: 'Social User',
      });
      await this.userRepository.save(user);
    }

    return this.generateTokens(user);
  }

  private async generateTokens(user: User) {
    const payload = { sub: user.id, phone: user.phone };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.getOrThrow<string>(
        'JWT_REFRESH_EXPIRES_IN',
      ) as any,
    });

    // Store session in Redis
    await this.redisService.setSession(user.id, accessToken);

    return {
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          email: user.email,
        },
      },
    };
  }
}
