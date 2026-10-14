import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { ServicesProxyController } from './services-proxy.controller';

@Module({
  imports: [HttpModule],
  controllers: [SystemController, ServicesProxyController],
  providers: [SystemService],
})
export class SystemModule {}
