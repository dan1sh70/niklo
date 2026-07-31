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

  /**
   * A seed that throws must not take the service down with it: Nest propagates
   * a rejected bootstrap hook out of `app.listen()`, the process exits, and the
   * container restart-loops. Starting without demo data is the lesser failure.
   */
  async onApplicationBootstrap() {
    try {
      await this.seed();
    } catch (err) {
      console.error(
        'driver-service seeding failed; starting without demo data.',
        err,
      );
    }
  }

  private async seed() {
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
    // The partner app knows the driver by the id on their profile, which is an
    // auth user id — querying the earnings table with it directly matched
    // nothing and read as "no earnings" rather than "wrong id".
    const driver = await this.findByIdOrUserId(driverId);

    return await this.earningRepo.find({
      where: { driver_id: driver.id },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Credits a completed ride to a driver.
   *
   * Idempotent on `ride_id`: ride-service completes a trip on both the socket
   * and the REST route, so this is called twice for every ride and must pay
   * out once. Called service-to-service, never by an app.
   */
  async recordRideEarning(input: {
    driverId: string;
    rideId: string;
    amount: number;
  }) {
    const driver = await this.findByIdOrUserId(input.driverId);

    const existing = await this.earningRepo.findOne({
      where: { ride_id: input.rideId, type: EarningType.RIDE_FARE },
    });
    if (existing) return existing;

    return await this.earningRepo.save({
      driver_id: driver.id,
      ride_id: input.rideId,
      amount: input.amount,
      type: EarningType.RIDE_FARE,
    });
  }

  async getPayouts(driverId: string) {
    return await this.payoutRepo.find({
      where: { driver_id: driverId },
      order: { scheduled_for: 'DESC' },
    });
  }

  /**
   * Looks a driver up by driver id, falling back to user id.
   *
   * The partner app identifies the driver by the id it gets from
   * `GET /users/profile` (an auth user id), while rides created before that
   * may carry a drivers-table id. Accepting both keeps ride-service from
   * having to know which one it is holding.
   */
  async findByIdOrUserId(id: string) {
    const driver =
      (await this.driverRepo.findOne({ where: { id } })) ??
      (await this.driverRepo.findOne({ where: { user_id: id } }));

    if (!driver) {
      throw new NotFoundException(`Driver ${id} not found`);
    }
    return driver;
  }
}
