import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OperatorsModule } from './operators/operators.module';
import { BusesModule } from './buses/buses.module';
import { RoutesModule } from './routes/routes.module';
import { SchedulesModule } from './schedules/schedules.module';
import { JwtStrategy } from './common/strategies/jwt.strategy';
import databaseConfig from './config/database.config';

import { Operator } from './operators/entities/operator.entity';
import { Bus } from './buses/entities/bus.entity';
import { SeatLayout, Deck, SeatType } from './buses/entities/seat-layout.entity';
import { Route } from './routes/entities/route.entity';
import { Schedule, ScheduleStatus } from './schedules/entities/schedule.entity';

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
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
    }),
    OperatorsModule,
    BusesModule,
    RoutesModule,
    SchedulesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap() {
    const operatorRepo = this.dataSource.getRepository(Operator);
    const busRepo = this.dataSource.getRepository(Bus);
    const routeRepo = this.dataSource.getRepository(Route);
    const scheduleRepo = this.dataSource.getRepository(Schedule);
    const seatRepo = this.dataSource.getRepository(SeatLayout);

    const count = await operatorRepo.count();
    if (count === 0) {
      // 1. Seed Operator
      const op = await operatorRepo.save({
        id: 'op111111-1111-1111-1111-111111111111',
        name: 'National Travels',
        logo_url: 'https://cdn.niklo.com/operators/national.png',
        contact_phone: '+919999988888',
        contact_email: 'info@nationaltravels.com',
        gst_number: '29AAAAA0000A1Z5',
        is_active: true,
      });

      // 2. Seed Bus
      const bus = await busRepo.save({
        id: 'bs111111-1111-1111-1111-111111111111',
        operator_id: op.id,
        registration_number: 'KA-01-F-1234',
        bus_type: 'AC_SLEEPER' as any,
        total_seats: 36,
        amenities: { wifi: true, charging: true, blanket: true },
        is_active: true,
      });

      // 3. Seed Seat Layout (36 seats: 9 rows x 4 cols)
      const seats: Partial<SeatLayout>[] = [];
      for (let row = 1; row <= 9; row++) {
        for (let col = 1; col <= 4; col++) {
          seats.push({
            bus_id: bus.id,
            seat_number: `${row}${String.fromCharCode(64 + col)}`,
            row,
            column: col,
            deck: Deck.LOWER,
            seat_type: SeatType.SLEEPER,
            is_available: true,
          });
        }
      }
      await seatRepo.save(seats);

      // 4. Seed Route
      const route = await routeRepo.save({
        id: 'rt222222-2222-2222-2222-222222222222',
        source_city: 'Bangalore',
        destination_city: 'Chennai',
        distance_km: 350.00,
        estimated_duration_minutes: 360,
        is_active: true,
        boarding_points: [
          { name: 'Majestic', landmark: 'Near Railway Station', address: 'Majestic bus stand', order_index: 1 },
          { name: 'Silk Board', landmark: 'Near Flyover', address: 'Silk Board junction', order_index: 2 }
        ],
        dropping_points: [
          { name: 'Koyambedu', landmark: 'Omni Bus Terminus', address: 'Koyambedu bus terminal', order_index: 1 },
          { name: 'Guindy', landmark: 'Near Metro', address: 'Guindy junction', order_index: 2 }
        ]
      });

      // 5. Seed Schedule
      await scheduleRepo.save({
        id: 'sc111111-1111-1111-1111-111111111111',
        route_id: route.id,
        bus_id: bus.id,
        operator_id: op.id,
        departure_date: '2026-07-15',
        departure_time: '22:00:00',
        arrival_time: '04:30:00',
        base_fare: 850.00,
        available_seats: 36,
        status: ScheduleStatus.SCHEDULED,
      });

      console.log('Seeded bus-service mock data successfully.');
    }
  }
}
