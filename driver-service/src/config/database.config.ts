import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Driver } from '../drivers/entities/driver.entity';
import { DriverKyc } from '../drivers/entities/driver-kyc.entity';
import { DriverEarning } from '../drivers/entities/driver-earning.entity';
import { DriverPayout } from '../drivers/entities/driver-payout.entity';

export const databaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'driver_db',
  entities: [Driver, DriverKyc, DriverEarning, DriverPayout],
  synchronize: process.env.DB_SYNCHRONIZE !== 'false', // Use migrations in production
});
