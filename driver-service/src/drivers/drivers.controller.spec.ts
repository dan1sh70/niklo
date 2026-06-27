import { Test, TestingModule } from '@nestjs/testing';
import { DriversController } from './drivers.controller';
import { DriversService } from './drivers.service';
import { OnboardDriverDto, UploadKycDto } from './dto/create-driver.dto';

describe('DriversController', () => {
  let controller: DriversController;
  let service: DriversService;

  beforeEach(async () => {
    const mockService = {
      onboard: jest
        .fn()
        .mockImplementation((dto: OnboardDriverDto) =>
          Promise.resolve({ id: '123', ...dto }),
        ),
      uploadKyc: jest
        .fn()
        .mockImplementation((dto: UploadKycDto) =>
          Promise.resolve({ id: 'doc-123', ...dto }),
        ),
      getKycStatus: jest
        .fn()
        .mockImplementation((id: string) =>
          Promise.resolve([
            { id: 'doc-123', driver_id: id, status: 'pending' },
          ]),
        ),
      getEarnings: jest
        .fn()
        .mockImplementation((id: string) =>
          Promise.resolve([{ id: 'earn-123', driver_id: id, amount: 100 }]),
        ),
      getPayouts: jest
        .fn()
        .mockImplementation((id: string) =>
          Promise.resolve([{ id: 'pay-123', driver_id: id, amount: 100 }]),
        ),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DriversController],
      providers: [
        {
          provide: DriversService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<DriversController>(DriversController);
    service = module.get<DriversService>(DriversService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should onboard a driver', async () => {
    const dto: OnboardDriverDto = { user_id: 'user-1' };
    const result = await controller.onboard(dto);
    expect(result.success).toBe(true);
    expect(result.data.id).toBe('123');
    expect(service.onboard).toHaveBeenCalledWith(dto);
  });

  it('should upload kyc', async () => {
    const dto: UploadKycDto = {
      driver_id: '123',
      document_type: 'license',
      document_url: 'http://example.com/doc',
    };
    const result = await controller.uploadKyc(dto);
    expect(result.success).toBe(true);
    expect(result.data.id).toBe('doc-123');
    expect(service.uploadKyc).toHaveBeenCalledWith(dto);
  });

  it('should get kyc status', async () => {
    const result = await controller.getKycStatus('123');
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
    expect(service.getKycStatus).toHaveBeenCalledWith('123');
  });

  it('should get earnings', async () => {
    const result = await controller.getEarnings('123');
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
    expect(service.getEarnings).toHaveBeenCalledWith('123');
  });

  it('should get payouts', async () => {
    const result = await controller.getPayouts('123');
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
    expect(service.getPayouts).toHaveBeenCalledWith('123');
  });
});
