import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DriversModule } from './drivers/drivers.module';
import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => ({ database: databaseConfig() })],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get<TypeOrmModuleOptions>('database');
        if (!dbConfig) {
          throw new Error('Database configuration is missing');
        }
        return dbConfig;
      },
      inject: [ConfigService],
    }),
    DriversModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
