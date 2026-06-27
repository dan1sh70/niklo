import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver } from './entities/driver.entity';
import { DriverKyc } from './entities/driver-kyc.entity';
import { DriverEarning } from './entities/driver-earning.entity';
import { DriverPayout } from './entities/driver-payout.entity';
import { OnboardDriverDto, UploadKycDto } from './dto/create-driver.dto';

@Injectable()
export class DriversService {
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
