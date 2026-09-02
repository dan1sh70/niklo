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
          await client.connect();
          // Check if both tables exist before attempting cleanup
          const tableCheck = await client.query(
            `SELECT COUNT(*) as cnt FROM information_schema.tables 
             WHERE table_name IN ('ride_ratings', 'rides') AND table_schema = 'public'`,
          );
          if (parseInt(tableCheck.rows[0].cnt) === 2) {
            const result = await client.query(
              `DELETE FROM ride_ratings rr
               WHERE NOT EXISTS (SELECT 1 FROM rides r WHERE r.id = rr.ride_id)`,
            );
            if (result.rowCount > 0) {
              console.log(`[ride-service] Cleaned up ${result.rowCount} orphaned ride_ratings.`);
            }
          }
        } catch (err) {
          console.warn('[ride-service] Pre-sync cleanup warning:', err.message);
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
