import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { OffersService } from './offers.service';

@Controller('api/v1/offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Get()
  async getOffers(@Query('category') category: string) {
    const data = await this.offersService.getOffers(category);
    return { success: true, statusCode: 200, data };
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async validateOffer(@Body() body: any) {
    const data = await this.offersService.validateOffer(body);
    return { success: true, statusCode: 200, data };
  }
}
