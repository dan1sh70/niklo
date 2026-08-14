import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { UserNotification } from '../notifications/entities/user-notification.entity';
import { DeviceToken } from '../notifications/entities/device-token.entity';

export const databaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'notification_db',
  entities: [UserNotification, DeviceToken],
  synchronize: process.env.DB_SYNCHRONIZE !== 'false', // Use migrations in production
});
