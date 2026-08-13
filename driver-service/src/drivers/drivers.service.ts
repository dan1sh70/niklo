import { Injectable, NotFoundException, OnApplicationBootstrap, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import { Driver, DriverStatus } from './entities/driver.entity';
import { DriverKyc, KycStatus } from './entities/driver-kyc.entity';
import { DriverEarning, EarningType } from './entities/driver-earning.entity';
import { DriverPayout, PayoutStatus } from './entities/driver-payout.entity';
import { DriverBankDetail } from './entities/driver-bank-detail.entity';
import { DriverSession } from './entities/driver-session.entity';
import { OnboardDriverDto, UploadKycDto } from './dto/create-driver.dto';
import { BankDetailsDto } from './dto/bank-details.dto';

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
    @InjectRepository(DriverBankDetail)
    private readonly bankRepo: Repository<DriverBankDetail>,
    @InjectRepository(DriverSession)
    private readonly sessionRepo: Repository<DriverSession>,
    private readonly configService: ConfigService,
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

  async saveBankDetails(dto: BankDetailsDto) {
    let bankDetail = await this.bankRepo.findOne({
      where: { driver_id: dto.driverId },
    });

    if (bankDetail) {
      bankDetail.account_holder_name = dto.accountHolderName;
      bankDetail.bank_name = dto.bankName;
      bankDetail.account_number = dto.accountNumber;
      bankDetail.ifsc_code = dto.ifscCode;
      bankDetail.account_type = dto.accountType;
    } else {
      bankDetail = this.bankRepo.create({
        driver_id: dto.driverId,
        account_holder_name: dto.accountHolderName,
        bank_name: dto.bankName,
        account_number: dto.accountNumber,
        ifsc_code: dto.ifscCode,
        account_type: dto.accountType,
      });
    }

    return await this.bankRepo.save(bankDetail);
  }

  async startSession(driverId: string) {
    const session = this.sessionRepo.create({
      driver_id: driverId,
      login_time: new Date(),
    });
    return await this.sessionRepo.save(session);
  }

  async endSession(driverId: string) {
    const session = await this.sessionRepo.findOne({
      where: { driver_id: driverId, logout_time: IsNull() },
      order: { login_time: 'DESC' },
    });
    if (session) {
      session.logout_time = new Date();
      session.duration_hours = (session.logout_time.getTime() - session.login_time.getTime()) / (1000 * 60 * 60);
      return await this.sessionRepo.save(session);
    }
    return null;
  }

  async withdraw(driverId: string, amount: number) {
    const bankDetail = await this.bankRepo.findOne({ where: { driver_id: driverId } });
    if (!bankDetail) {
      throw new BadRequestException('Bank details not found for driver');
    }

    const payout = this.payoutRepo.create({
      driver_id: driverId,
      amount,
      status: PayoutStatus.PENDING,
      scheduled_for: new Date(),
    });
    await this.payoutRepo.save(payout);

    const rzpId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const rzpSecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

    if (rzpId && rzpSecret) {
      try {
        const razorpay = new Razorpay({ key_id: rzpId, key_secret: rzpSecret });
        
        // Mock payout API call according to Razorpay Fund Account & Payouts docs
        // In real code, we'd create a fund account first, then initiate a payout
        // For demonstration, we simply log the intention
        console.log(`[RAZORPAY] Initiating payout for driver ${driverId}, amount: ${amount}`);
        
        // Simulate success update
        payout.status = PayoutStatus.COMPLETED;
        await this.payoutRepo.save(payout);
      } catch (err) {
        console.error(`[RAZORPAY ERROR] Failed to process payout for ${driverId}`, err);
        payout.status = PayoutStatus.FAILED;
        await this.payoutRepo.save(payout);
      }
    } else {
      console.log(`[MOCK PAYOUT] Payout for ${driverId} marked as PENDING (no razorpay keys)`);
    }

    return payout;
  }
}
