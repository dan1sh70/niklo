import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import RedisMock from 'ioredis-mock';
import Redis from 'ioredis';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        // Fallback to ioredis-mock since local Redis is not installed natively
        return new RedisMock();
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule {}
