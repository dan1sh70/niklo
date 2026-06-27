import { Test, TestingModule } from '@nestjs/testing';
import { RidesController } from './rides.controller';
import { RidesService } from './rides.service';

describe('RidesController', () => {
  let controller: RidesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RidesController],
      providers: [
        {
          provide: RidesService,
          useValue: {
            estimateRide: jest.fn(),
            requestRide: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<RidesController>(RidesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
