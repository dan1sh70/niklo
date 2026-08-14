import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController, HealthController } from './app.controller';
import { AppService } from './app.service';
import databaseConfig from './config/database.config';
import { AiJourneyPlan } from './entities/ai-journey-plan.entity';
import { UserSavedJourney } from './entities/user-saved-journey.entity';
import { JourneyAlert } from './entities/journey-alert.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
      load: [databaseConfig] 
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('database');
        if (!dbConfig) {
          throw new Error('Database configuration not found');
        }
        return dbConfig;
      },
    }),
    TypeOrmModule.forFeature([AiJourneyPlan, UserSavedJourney, JourneyAlert]),
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
