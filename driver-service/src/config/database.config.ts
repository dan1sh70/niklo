import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Driver } from '../drivers/entities/driver.entity';
import { DriverKyc } from '../drivers/entities/driver-kyc.entity';
import { DriverEarning } from '../drivers/entities/driver-earning.entity';
import { DriverPayout } from '../drivers/entities/driver-payout.entity';
import { DriverBankDetail } from '../drivers/entities/driver-bank-detail.entity';
import { DriverSession } from '../drivers/entities/driver-session.entity';
export const databaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'driver_db',
  entities: [Driver, DriverKyc, DriverEarning, DriverPayout, DriverBankDetail, DriverSession],
  synchronize: process.env.DB_SYNCHRONIZE !== 'false', // Use migrations in production
});
