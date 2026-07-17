import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Client } from 'pg';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotificationsModule } from './notifications/notifications.module';
import { databaseConfig } from './config/database.config';

async function ensureDatabaseExists() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT ?? '5432', 10);
  const targetUser = process.env.DB_USER || 'postgres';
  const targetPassword = process.env.DB_PASSWORD || 'postgres';
  const targetDb = process.env.DB_NAME || 'notification_db';
  const superuser = 'postgres';
  const superuserPassword = process.env.SUPERUSER_PASSWORD || 'niklo_postgres_password';

  const client = new Client({
    host,
    port,
    user: superuser,
    password: superuserPassword,
    database: 'postgres',
  });

  try {
    await client.connect();

    // 1. Check if user exists
    const userRes = await client.query(
      'SELECT 1 FROM pg_roles WHERE rolname = $1',
      [targetUser],
    );
    if (userRes.rowCount === 0 && targetUser !== 'postgres') {
      console.log(`Creating database user ${targetUser}...`);
      await client.query(
        `CREATE USER ${targetUser} WITH PASSWORD '${targetPassword}'`,
      );
    }

    // 2. Check if database exists
    const dbRes = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [targetDb],
    );
    if (dbRes.rowCount === 0) {
      console.log(`Creating database ${targetDb} owned by ${targetUser}...`);
      await client.query(
        `CREATE DATABASE ${targetDb} OWNER ${targetUser}`,
      );
    }
  } catch (err) {
    console.error('Error in ensureDatabaseExists helper:', err);
  } finally {
    try {
      await client.end();
    } catch (e) {}
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => ({ database: databaseConfig() })],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        // Run self-healing DB check/creation before TypeORM initializes
        await ensureDatabaseExists();

        const dbConfig = configService.get<TypeOrmModuleOptions>('database');
        if (!dbConfig) {
          throw new Error('Database configuration is missing');
        }
        return dbConfig;
      },
      inject: [ConfigService],
    }),
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
