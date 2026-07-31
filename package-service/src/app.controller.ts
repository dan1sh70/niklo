import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Liveness only. This must NOT be a bare `@Get()`: the global prefix is
   * `api/v1/packages`, so a bare route here answers `GET /api/v1/packages` —
   * the package list — and wins over PackagesController because AppModule's
   * own controllers are registered before its imports. The customer app read
   * that "Hello World!" as an empty list, fell back to mock packages, and then
   * sent a mock slug as `item_id` at checkout, which booking-service rejects
   * as a non-uuid.
   */
  @Get('health')
  getHello(): string {
    return this.appService.getHello();
  }
}
