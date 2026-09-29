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
import { AuthController } from './auth/auth.controller';
import { AdminsModule } from './admins/admins.module';
import { RolesModule } from './roles/roles.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { SchedulesModule } from './schedules/schedules.module';
import { BookingsModule } from './bookings/bookings.module';
import { UsersModule } from './users/users.module';
import { PaymentsModule } from './payments/payments.module';
import { ContentModule } from './content/content.module';
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
    AdminsModule,
    RolesModule,
    AuditLogsModule,
    ApprovalsModule,
    SchedulesModule,
    BookingsModule,
    UsersModule,
    PaymentsModule,
    ContentModule,
  ],
  controllers: [AppController, AuthController],
  providers: [AppService],
})
export class AppModule {}
