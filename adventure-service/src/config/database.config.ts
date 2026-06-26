import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { TravelAdventure } from '../adventures/entities/adventure.entity';

export const databaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'adventure_db',
  entities: [TravelAdventure],
  synchronize: process.env.NODE_ENV !== 'production', // Use migrations in production
});
