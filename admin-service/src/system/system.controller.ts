import { Controller, Get, Post, Param, Body, Res } from '@nestjs/common';
import { SystemService } from './system.service';
import { discoverProject } from '../discovery';
import { listContainers, containerAction } from '../docker';

@Controller('api/v1/admin')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('discovery')
  getDiscovery() {
    return discoverProject();
  }

  @Get('docker/containers')
  async getContainers() {
    return await listContainers();
  }

  @Post('docker/:service/action')
  async performAction(
    @Param('service') service: string,
    @Body('action') action: string,
  ) {
    if (!['start', 'stop', 'restart'].includes(action)) {
      throw new Error('Invalid action. Must be start, stop or restart.');
    }
    const success = await containerAction(service, action as 'start' | 'stop' | 'restart');
    return { success };
  }
}
