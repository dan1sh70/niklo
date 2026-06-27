import { Test, TestingModule } from '@nestjs/testing';
import { RidesService } from './rides.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Ride } from './entities/ride.entity';
import { RedisService } from '../redis/redis.service';

describe('RidesService', () => {
  let service: RidesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RidesService,
        {
          provide: getRepositoryToken(Ride),
          useValue: {},
        },
        {
          provide: RedisService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<RidesService>(RidesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
