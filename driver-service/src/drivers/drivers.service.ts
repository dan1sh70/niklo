import { Injectable, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver, DriverStatus } from './entities/driver.entity';
import { DriverKyc, KycStatus } from './entities/driver-kyc.entity';
import { DriverEarning, EarningType } from './entities/driver-earning.entity';
import { DriverPayout, PayoutStatus } from './entities/driver-payout.entity';
import { OnboardDriverDto, UploadKycDto } from './dto/create-driver.dto';

@Injectable()
export class DriversService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Driver)
    private readonly driverRepo: Repository<Driver>,
    @InjectRepository(DriverKyc)
    private readonly kycRepo: Repository<DriverKyc>,
    @InjectRepository(DriverEarning)
    private readonly earningRepo: Repository<DriverEarning>,
    @InjectRepository(DriverPayout)
    private readonly payoutRepo: Repository<DriverPayout>,
  ) {}

  async onApplicationBootstrap() {
    const count = await this.driverRepo.count();
    if (count === 0) {
      // 1. Seed Driver
      const driver = await this.driverRepo.save({
        id: 'd1111111-1111-1111-1111-111111111111',
        user_id: '33333333-3333-3333-3333-333333333333',
        vehicle_type: 'Sedan',
        vehicle_number: 'KA-01-MJ-1234',
        status: DriverStatus.APPROVED,
        is_online: true,
      });

      // 2. Seed KYC
      await this.kycRepo.save({
        driver_id: driver.id,
        document_type: 'Driving License',
        document_url: 'https://cdn.niklo.com/kyc/license.pdf',
        status: KycStatus.APPROVED,
      });

      // 3. Seed Earnings
      await this.earningRepo.save([
        {
          driver_id: driver.id,
          ride_id: 'r1111111-1111-1111-1111-111111111111',
          amount: 250.00,
          type: EarningType.RIDE_FARE,
        },
        {
          driver_id: driver.id,
          amount: 50.00,
          type: EarningType.INCENTIVE,
        }
      ]);

      // 4. Seed Payouts
      await this.payoutRepo.save({
        driver_id: driver.id,
        amount: 300.00,
        status: PayoutStatus.COMPLETED,
        scheduled_for: new Date(),
      });

      console.log('Seeded drivers mock data successfully.');
    }
  }

  async onboard(dto: OnboardDriverDto) {
    const newDriver = this.driverRepo.create(dto);
    return await this.driverRepo.save(newDriver);
  }

  async uploadKyc(dto: UploadKycDto) {
    const driver = await this.driverRepo.findOne({
      where: { id: dto.driver_id },
    });
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }
    const kycDoc = this.kycRepo.create(dto);
    return await this.kycRepo.save(kycDoc);
  }

  async getKycStatus(driverId: string) {
    return await this.kycRepo.find({ where: { driver_id: driverId } });
  }

  async getEarnings(driverId: string) {
    // Basic implementation: fetch all earnings
    return await this.earningRepo.find({
      where: { driver_id: driverId },
      order: { created_at: 'DESC' },
    });
  }

  async getPayouts(driverId: string) {
    return await this.payoutRepo.find({
      where: { driver_id: driverId },
      order: { scheduled_for: 'DESC' },
    });
  }
}
