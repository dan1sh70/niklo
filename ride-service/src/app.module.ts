import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RidesModule } from './rides/rides.module';
import { RedisModule } from './redis/redis.module';
import { GatewaysModule } from './gateways/gateways.module';
import databaseConfig from './config/database.config';
import { Client } from 'pg';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const dbConfig = configService.get('database');
        if (!dbConfig) {
          throw new Error('Database configuration not found');
        }

        // Pre-sync cleanup: delete orphaned ride_ratings before TypeORM creates FK
        const client = new Client({
          host: dbConfig.host,
          port: dbConfig.port,
          user: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.database,
        });
        try {
          let connected = false;
          for (let i = 0; i < 5; i++) {
            try {
              await client.connect();
              connected = true;
              break;
            } catch (e) {
              await new Promise(res => setTimeout(res, 2000));
            }
          }
          if (connected) {
            const result = await client.query(
              `DELETE FROM ride_ratings 
               WHERE NOT EXISTS (SELECT 1 FROM rides WHERE rides.id = ride_ratings.ride_id)`
            );
            if (result && result.rowCount > 0) {
              console.log(`[ride-service] Cleaned up ${result.rowCount} orphaned ride_ratings.`);
            }
          }
        } catch (err) {
          console.log('[ride-service] Pre-sync cleanup skipped:', err.message);
        } finally {
          try { await client.end(); } catch (_) {}
        }

        return dbConfig;
      },
    }),
    RidesModule,
    RedisModule,
    GatewaysModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
