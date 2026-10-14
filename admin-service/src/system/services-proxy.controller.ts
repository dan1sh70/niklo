import { Controller, All, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Controller('api/v1/admin/proxy')
@UseGuards(AuthGuard('jwt'))
export class ServicesProxyController {
  private serviceUrls: Record<string, string> = {
    adventure: process.env.ADVENTURE_SERVICE_URL || 'http://adventure-service:3013',
    hotel: process.env.HOTEL_SERVICE_URL || 'http://hotel-service:3004',
    package: process.env.PACKAGE_SERVICE_URL || 'http://package-service:3012',
    bus: process.env.BUS_SERVICE_URL || 'http://bus-service:3003',
    ride: process.env.RIDE_SERVICE_URL || 'http://ride-service:3005',
    driver: process.env.DRIVER_SERVICE_URL || 'http://driver-service:3011',
    user: process.env.USER_SERVICE_URL || 'http://user-service:3002',
    booking: process.env.BOOKING_SERVICE_URL || 'http://booking-service:3014',
    payment: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3007',
    notification: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3009',
    ai_planner: process.env.AI_PLANNER_SERVICE_URL || 'http://ai-planner-service:3015',
  };

  constructor(private readonly httpService: HttpService) {}

  @All(':service/*')
  async proxyRequest(@Req() req: Request, @Res() res: Response) {
    const rawService = req.params['service'];
    const serviceName = Array.isArray(rawService) ? rawService[0] : String(rawService);
    const targetBase = this.serviceUrls[serviceName];

    if (!targetBase) {
      return res.status(404).json({ error: `Service '${serviceName}' is not recognized in admin proxy.` });
    }

    // Path after /api/v1/admin/proxy/:service
    const pathPrefix = `/api/v1/admin/proxy/${serviceName}`;
    const subPath = req.originalUrl.substring(req.originalUrl.indexOf(pathPrefix) + pathPrefix.length);

    const targetUrl = `${targetBase}${subPath}`;

    try {
      const response = await lastValueFrom(
        this.httpService.request({
          method: req.method,
          url: targetUrl,
          data: req.body,
          params: req.query,
          headers: {
            'content-type': (req.headers['content-type'] as string) || 'application/json',
            'x-internal-secret': process.env.INTERNAL_API_SECRET || 'super-secret-internal-key',
            'x-admin-request': 'true',
          },
          validateStatus: () => true, // Forward all status codes cleanly
        }),
      );

      return res.status(response.status).json(response.data);
    } catch (err: any) {
      return res.status(502).json({
        error: `Failed to proxy request to ${serviceName} service`,
        message: err.message,
      });
    }
  }
}
