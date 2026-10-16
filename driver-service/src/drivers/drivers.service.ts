import { Injectable, NotFoundException, OnApplicationBootstrap, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import axios from 'axios';
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
  private readonly logger = new Logger(DriversService.name);

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
    const shouldSeed = this.configService.get<string>('SEED_DRIVER_DATA') === 'true';
    const count = await this.driverRepo.count();
    if (count === 0 && shouldSeed) {
      // Seed Driver
      const driver = await this.driverRepo.save({
        id: 'd1111111-1111-1111-1111-111111111111',
        user_id: '33333333-3333-3333-3333-333333333333',
        vehicle_type: 'Sedan',
        vehicle_number: 'KA-01-MJ-1234',
        status: DriverStatus.APPROVED,
        is_online: true,
      });

      await this.kycRepo.save({
        driver_id: driver.id,
        document_type: 'Driving License',
        document_url: 'https://cdn.niklo.com/kyc/license.pdf',
        status: KycStatus.APPROVED,
      });

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

      await this.payoutRepo.save({
        driver_id: driver.id,
        amount: 300.00,
        status: PayoutStatus.COMPLETED,
        scheduled_for: new Date(),
      });

      this.logger.log('Seeded drivers mock data successfully.');
    }
  }

  // Universal helper with auto-provisioning (GAP-02, GAP-25)
  async resolveDriver(driverIdOrUserId: string): Promise<Driver | null> {
    if (!driverIdOrUserId) return null;
    let driver = await this.driverRepo.findOne({
      where: [{ id: driverIdOrUserId }, { user_id: driverIdOrUserId }],
    });

    if (!driver) {
      try {
        driver = this.driverRepo.create({
          user_id: driverIdOrUserId,
          status: DriverStatus.PENDING,
          is_online: false,
        });
        driver = await this.driverRepo.save(driver);
        this.logger.log(`Auto-provisioned driver record ${driver.id} for user ${driverIdOrUserId}`);
      } catch (err: any) {
        this.logger.error(`Failed to auto-provision driver for user ${driverIdOrUserId}: ${err.message}`);
        return null;
      }
    }

    return driver;
  }

  async onboard(dto: OnboardDriverDto) {
    let driver = await this.driverRepo.findOne({ where: { user_id: dto.user_id } });
    if (driver) {
      Object.assign(driver, dto);
      return await this.driverRepo.save(driver);
    }
    const newDriver = this.driverRepo.create(dto);
    return await this.driverRepo.save(newDriver);
  }

  async uploadKyc(dto: UploadKycDto) {
    const driver = await this.resolveDriver(dto.driver_id);
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }
    const kycDoc = this.kycRepo.create({
      ...dto,
      driver_id: driver.id,
    });
    return await this.kycRepo.save(kycDoc);
  }

  async uploadKycDocument(driverIdentifier: string, documentType: string, file: any) {
    const driver = await this.resolveDriver(driverIdentifier);
    if (!driver) throw new NotFoundException('Driver not found');

    const documentUrl = `https://storage.niklotravel.com/kyc/${driver.id}/${Date.now()}-${file.originalname || 'document.jpg'}`;

    const kycDoc = this.kycRepo.create({
      driver_id: driver.id,
      document_type: documentType,
      document_url: documentUrl,
      status: KycStatus.PENDING,
    });
    return await this.kycRepo.save(kycDoc);
  }

  async getKycStatus(driverId: string) {
    const driver = await this.resolveDriver(driverId);
    if (!driver) throw new NotFoundException('Driver not found');
    return await this.kycRepo.find({ where: { driver_id: driver.id } });
  }

  async getEarnings(driverId: string) {
    const driver = await this.resolveDriver(driverId);
    if (!driver) throw new NotFoundException('Driver not found');
    return await this.earningRepo.find({
      where: { driver_id: driver.id },
      order: { created_at: 'DESC' },
    });
  }

  async getPayouts(driverId: string) {
    const driver = await this.resolveDriver(driverId);
    if (!driver) throw new NotFoundException('Driver not found');
    return await this.payoutRepo.find({
      where: { driver_id: driver.id },
      order: { created_at: 'DESC' },
    });
  }

  async saveBankDetails(dto: BankDetailsDto) {
    const driver = await this.resolveDriver(dto.driverId);
    if (!driver) throw new NotFoundException('Driver not found');

    let bankDetail = await this.bankRepo.findOne({
      where: { driver_id: driver.id },
    });

    if (bankDetail) {
      bankDetail.account_holder_name = dto.accountHolderName;
      bankDetail.bank_name = dto.bankName;
      bankDetail.account_number = dto.accountNumber;
      bankDetail.ifsc_code = dto.ifscCode;
      bankDetail.account_type = dto.accountType;
    } else {
      bankDetail = this.bankRepo.create({
        driver_id: driver.id,
        account_holder_name: dto.accountHolderName,
        bank_name: dto.bankName,
        account_number: dto.accountNumber,
        ifsc_code: dto.ifscCode,
        account_type: dto.accountType,
      });
    }

    return await this.bankRepo.save(bankDetail);
  }

  async getBankDetails(driverIdentifier: string) {
    const driver = await this.resolveDriver(driverIdentifier);
    if (!driver) throw new NotFoundException('Driver not found');

    const bank = await this.bankRepo.findOne({ where: { driver_id: driver.id } });
    if (!bank) return null;

    return {
      id: bank.id,
      driverId: bank.driver_id,
      accountHolderName: bank.account_holder_name,
      bankName: bank.bank_name,
      accountNumber: bank.account_number,
      accountNumberMasked: `•••• ${bank.account_number.slice(-4)}`,
      ifscCode: bank.ifsc_code,
      accountType: bank.account_type,
      updatedAt: bank.updated_at,
    };
  }

  async startSession(driverId: string) {
    const driver = await this.resolveDriver(driverId);
    if (!driver) throw new NotFoundException('Driver not found');

    const session = this.sessionRepo.create({
      driver_id: driver.id,
      login_time: new Date(),
    });
    return await this.sessionRepo.save(session);
  }

  async endSession(driverId: string) {
    const driver = await this.resolveDriver(driverId);
    if (!driver) throw new NotFoundException('Driver not found');

    const session = await this.sessionRepo.findOne({
      where: { driver_id: driver.id, logout_time: IsNull() },
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
    const driver = await this.resolveDriver(driverId);
    if (!driver) throw new NotFoundException('Driver not found');

    const bankDetail = await this.bankRepo.findOne({ where: { driver_id: driver.id } });
    if (!bankDetail) {
      throw new BadRequestException('No bank details registered. Please add a bank account before requesting a withdrawal.');
    }

    // 1. Calculate Gross Earnings
    const earnings = await this.earningRepo.find({ where: { driver_id: driver.id } });
    const totalEarned = earnings.reduce((sum, item) => sum + Number(item.amount), 0);

    // 2. Calculate Active & Completed Payouts
    const activePayouts = await this.payoutRepo.find({
      where: {
        driver_id: driver.id,
        status: Not(PayoutStatus.FAILED),
      },
    });
    const totalWithdrawn = activePayouts.reduce((sum, item) => sum + Number(item.amount), 0);

    // 3. Compute Net Available Balance
    const availableBalance = Math.round((totalEarned - totalWithdrawn) * 100) / 100;
    const minWithdrawal = Number(this.configService.get<string>('MIN_WITHDRAWAL_AMOUNT') ?? 100);

    if (amount < minWithdrawal) {
      throw new BadRequestException(`Minimum withdrawal amount is ₹${minWithdrawal}.`);
    }
    if (amount > availableBalance) {
      throw new BadRequestException(
        `Requested withdrawal of ₹${amount} exceeds available wallet balance of ₹${availableBalance.toFixed(2)}.`,
      );
    }

    // 4. Create PENDING Payout Record
    const payout = this.payoutRepo.create({
      driver_id: driver.id,
      amount,
      status: PayoutStatus.PENDING,
      scheduled_for: new Date(),
      bank_account_number: bankDetail.account_number,
      ifsc_code: bankDetail.ifsc_code,
    });
    const savedPayout = await this.payoutRepo.save(payout);

    // 5. Trigger RazorpayX Payout if credentials present
    const rzpKey = this.configService.get<string>('RAZORPAY_KEY_ID');
    const rzpSecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    const accountNumber = this.configService.get<string>('RAZORPAYX_ACCOUNT_NUMBER');

    if (rzpKey && rzpSecret && accountNumber) {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${rzpKey}:${rzpSecret}`).toString('base64');
        const contactRes = await axios.post(
          'https://api.razorpay.com/v1/contacts',
          {
            name: bankDetail.account_holder_name,
            type: 'vendor',
            reference_id: `drv_${bankDetail.driver_id}`,
          },
          { headers: { Authorization: authHeader } },
        );
        const contactId = contactRes.data.id;

        const fundRes = await axios.post(
          'https://api.razorpay.com/v1/fund_accounts',
          {
            contact_id: contactId,
            account_type: 'bank_account',
            bank_account: {
              name: bankDetail.account_holder_name,
              ifsc: bankDetail.ifsc_code,
              account_number: bankDetail.account_number,
            },
          },
          { headers: { Authorization: authHeader } },
        );
        const fundAccountId = fundRes.data.id;

        const payoutRes = await axios.post(
          'https://api.razorpay.com/v1/payouts',
          {
            account_number: accountNumber,
            fund_account_id: fundAccountId,
            amount: Math.round(Number(amount) * 100),
            currency: 'INR',
            mode: 'IMPS',
            purpose: 'payout',
            queue_if_low_balance: true,
            reference_id: savedPayout.id,
          },
          { headers: { Authorization: authHeader } },
        );

        savedPayout.status = payoutRes.data.status === 'processed' ? PayoutStatus.COMPLETED : PayoutStatus.PROCESSING;
        savedPayout.payout_id = payoutRes.data.id;
        await this.payoutRepo.save(savedPayout);
      } catch (err: any) {
        this.logger.error(`[RAZORPAYX ERROR] Payout failed for ${savedPayout.id}: ${err.response?.data?.error?.description || err.message}`);
        savedPayout.status = PayoutStatus.FAILED;
        savedPayout.failure_reason = err.response?.data?.error?.description || err.message;
        await this.payoutRepo.save(savedPayout);
        throw new BadRequestException(err.response?.data?.error?.description || 'Payout initiation failed');
      }
    } else {
      this.logger.log(`[PAYOUT QUEUED] Payout for ${driver.id} marked as PROCESSING (queued for manual or batch transfer)`);
      savedPayout.status = PayoutStatus.PROCESSING;
      await this.payoutRepo.save(savedPayout);
    }

    return savedPayout;
  }

  async getProfile(driverId: string) {
    const driver = await this.resolveDriver(driverId);
    if (!driver) {
      throw new NotFoundException(`Driver profile not found for identifier: ${driverId}`);
    }
    return driver;
  }

  async recordEarnings(driverId: string, amount: number, type: EarningType, rideId?: string) {
    const driver = await this.resolveDriver(driverId);
    const resolvedId = driver ? driver.id : driverId;

    const earning = this.earningRepo.create({
      driver_id: resolvedId,
      amount,
      type,
      ride_id: rideId,
    });
    return await this.earningRepo.save(earning);
  }

  async recordRating(driverId: string, rating: number) {
    const driver = await this.resolveDriver(driverId);
    if (!driver) return;

    // Running average calculation or update
    const currentRating = Number(driver.rating || 5.0);
    const updatedRating = Math.round(((currentRating * 4 + rating) / 5) * 100) / 100;
    driver.rating = updatedRating;
    await this.driverRepo.save(driver);
    return { driverId: driver.id, rating: updatedRating };
  }

  async getWalletSummary(driverIdentifier: string) {
    const driver = await this.resolveDriver(driverIdentifier);
    if (!driver) throw new NotFoundException('Driver not found');

    const resolvedId = driver.id;
    const earnings = await this.earningRepo.find({
      where: { driver_id: resolvedId },
      order: { created_at: 'DESC' },
    });
    const totalEarnings = earnings.reduce((sum, item) => sum + Number(item.amount), 0);

    const payouts = await this.payoutRepo.find({
      where: { driver_id: resolvedId },
      order: { created_at: 'DESC' },
    });
    const completedPayouts = payouts
      .filter((p) => p.status === PayoutStatus.COMPLETED)
      .reduce((sum, item) => sum + Number(item.amount), 0);

    const pendingPayouts = payouts
      .filter((p) => p.status === PayoutStatus.PENDING || p.status === PayoutStatus.PROCESSING)
      .reduce((sum, item) => sum + Number(item.amount), 0);

    const availableBalance = Math.max(
      0,
      Math.round((totalEarnings - completedPayouts - pendingPayouts) * 100) / 100,
    );

    const bankDetail = await this.bankRepo.findOne({ where: { driver_id: resolvedId } });

    const transactions = [
      ...earnings.map(e => ({
        id: e.id,
        title: e.type === EarningType.RIDE_FARE ? 'Ride Fare' : 'Incentive / Bonus',
        subtitle: e.ride_id ? `Ride Ref: ${e.ride_id.substring(0, 8)}` : 'Incentive Credit',
        amount: Number(e.amount),
        transaction_type: 'CREDIT',
        reference_id: e.ride_id || e.id,
        created_at: e.created_at,
      })),
      ...payouts.map(p => ({
        id: p.id,
        title: 'Bank Withdrawal',
        subtitle: `Transfer • ${p.status.toUpperCase()}`,
        amount: Number(p.amount),
        transaction_type: 'DEBIT',
        reference_id: p.id,
        created_at: p.created_at,
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return {
      availableBalance,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      totalWithdrawn: Math.round(completedPayouts * 100) / 100,
      pendingPayouts: Math.round(pendingPayouts * 100) / 100,
      lastPayout: payouts[0] || null,
      bankDetails: bankDetail ? {
        accountHolderName: bankDetail.account_holder_name,
        bankName: bankDetail.bank_name,
        accountNumberMasked: `•••• ${bankDetail.account_number.slice(-4)}`,
        ifscCode: bankDetail.ifsc_code,
        accountType: bankDetail.account_type,
      } : null,
      transactions,
    };
  }

  async getDriverStats(driverIdentifier: string) {
    const driver = await this.resolveDriver(driverIdentifier);
    if (!driver) throw new NotFoundException('Driver not found');
    const resolvedId = driver.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const earnings = await this.earningRepo
      .createQueryBuilder('e')
      .where('e.driver_id = :id AND e.created_at >= :today', { id: resolvedId, today })
      .select('SUM(e.amount)', 'total')
      .addSelect('COUNT(e.id)', 'trips')
      .getRawOne();

    const allEarnings = await this.earningRepo.find({ where: { driver_id: resolvedId } });
    const gross = allEarnings.reduce((acc, curr) => acc + Number(curr.amount), 0);

    const allPayouts = await this.payoutRepo.find({
      where: { driver_id: resolvedId, status: Not(PayoutStatus.FAILED) },
    });
    const withdrawn = allPayouts.reduce((acc, curr) => acc + Number(curr.amount), 0);

    return {
      driverId: resolvedId,
      rating: driver.rating ? Number(driver.rating) : 5.0,
      acceptanceRate: 98.5,
      completionRate: 99.1,
      availableBalance: Math.max(0, Math.round((gross - withdrawn) * 100) / 100),
      todayEarnings: parseFloat(earnings?.total || '0'),
      todayTrips: parseInt(earnings?.trips || '0', 10),
      isOnline: driver.is_online ?? false,
      status: driver.status ?? DriverStatus.PENDING,
    };
  }

  async updateDriverProfile(driverIdentifier: string, dto: { name?: string; email?: string; preferred_language?: string }) {
    const driver = await this.resolveDriver(driverIdentifier);
    if (!driver) throw new NotFoundException('Driver not found');

    if (dto.name) driver.name = dto.name;
    if (dto.email) driver.email = dto.email;
    if (dto.preferred_language) driver.preferred_language = dto.preferred_language;

    return await this.driverRepo.save(driver);
  }

  async updateDriverVehicle(driverIdentifier: string, dto: { vehicle_type?: string; vehicle_number?: string; rc_number?: string }) {
    const driver = await this.resolveDriver(driverIdentifier);
    if (!driver) throw new NotFoundException('Driver not found');

    if (dto.vehicle_type) driver.vehicle_type = dto.vehicle_type;
    if (dto.vehicle_number) driver.vehicle_number = dto.vehicle_number;
    if (dto.rc_number) driver.rc_number = dto.rc_number;

    return await this.driverRepo.save(driver);
  }
}
