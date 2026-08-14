import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'niklo_ai_planner',
  password: process.env.DB_PASSWORD || 'niklo_ai_planner_password',
  database: process.env.DB_NAME || 'niklo_ai_planner',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true, // Use carefully in production! Good for this prototyping stage.
}));
