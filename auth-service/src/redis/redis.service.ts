import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async setSession(userId: string, token: string): Promise<void> {
    await this.redis.set(`session:${userId}`, token, 'EX', 86400); // 86400s = 24h
  }

  async getSession(userId: string): Promise<string | null> {
    return this.redis.get(`session:${userId}`);
  }

  async deleteSession(userId: string): Promise<void> {
    await this.redis.del(`session:${userId}`);
  }

  async setOtp(phone: string, otp: string): Promise<void> {
    await this.redis.set(`otp:${phone}`, otp, 'EX', 300); // 300s = 5m
  }

  async getOtp(phone: string): Promise<string | null> {
    return this.redis.get(`otp:${phone}`);
  }

  async deleteOtp(phone: string): Promise<void> {
    await this.redis.del(`otp:${phone}`);
  }

  async incrementOtpAttempts(phone: string): Promise<number> {
    const key = `otp:attempts:${phone}`;
    const attempts = await this.redis.incr(key);
    if (attempts === 1) {
      await this.redis.expire(key, 300); // 5 minutes window
    }
    return attempts;
  }

  async lockOtp(phone: string, durationSeconds: number): Promise<void> {
    await this.redis.set(`otp:lockout:${phone}`, 'locked', 'EX', durationSeconds);
  }

  async checkOtpLockout(phone: string): Promise<boolean> {
    const locked = await this.redis.get(`otp:lockout:${phone}`);
    return !!locked;
  }

  async resetOtpAttempts(phone: string): Promise<void> {
    await this.redis.del(`otp:attempts:${phone}`);
  }
}
