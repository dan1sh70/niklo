import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController, HealthController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
