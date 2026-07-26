import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'postgres' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'niklo_booking',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  // Keyed off an explicit flag rather than NODE_ENV, matching bus-service.
  // `start:prod` is a bare `node dist/main` and the Dockerfile sets no
  // NODE_ENV, so tying schema sync to NODE_ENV meant the platform silently
  // decided whether new columns got created — and a missing column only
  // surfaces as a 500 on the first booking. Set DB_SYNCHRONIZE=false once
  // real migrations exist.
  synchronize: process.env.DB_SYNCHRONIZE !== 'false',
}));
