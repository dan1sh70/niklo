import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1/packages');
  app.enableCors();
  await app.listen(process.env.PORT || 3012);
}
bootstrap();
