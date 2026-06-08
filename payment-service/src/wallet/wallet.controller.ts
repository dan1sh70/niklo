import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { TopUpDto } from './dto/top-up.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('api/v1/payment/wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @UseGuards(JwtAuthGuard)
  @Post('topup')
  async initiateTopUp(@Request() req: any, @Body() dto: TopUpDto) {
    return this.walletService.initiateTopUp(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('transactions')
  async getTransactions(@Request() req: any) {
    return this.walletService.getTransactions(req.user.id);
  }
}
