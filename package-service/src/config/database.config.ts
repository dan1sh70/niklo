import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { TravelPackage } from '../packages/entities/package.entity';

export const databaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'package_db',
  entities: [TravelPackage],
  synchronize: process.env.NODE_ENV !== 'production', // Use migrations in production
});
