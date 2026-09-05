import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { HolidayPackage } from '../packages/entities/holiday-package.entity';
import { PackageGalleryMedia } from '../packages/entities/package-gallery-media.entity';
import { PackageItineraryDay } from '../packages/entities/package-itinerary-day.entity';

export const databaseConfig = (): TypeOrmModuleOptions => {
  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'niklo_package',
    entities: [
      HolidayPackage,
      PackageGalleryMedia,
      PackageItineraryDay,
      __dirname + '/../partner/**/*.entity{.ts,.js}',
    ],
    synchronize: true, // Use only in dev. In prod, use migrations.
    logging: process.env.NODE_ENV !== 'production',
  };
};
