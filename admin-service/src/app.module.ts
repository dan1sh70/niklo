import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SystemModule } from './system/system.module';
import { VendorsModule } from './vendors/vendors.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { PayoutsModule } from './payouts/payouts.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { SeoModule } from './seo/seo.module';
import { SalesModule } from './sales/sales.module';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'),
      }),
    }),
    SystemModule,
    VendorsModule,
    SubscriptionsModule,
    PayoutsModule,
    ApiKeysModule,
    SeoModule,
    SalesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
