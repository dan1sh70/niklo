import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { TopUpDto } from './dto/top-up.dto';
import { ConfirmTopUpDto } from './dto/confirm-topup.dto';
import { PayWithWalletDto } from './dto/pay-with-wallet.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('api/v1/payment/wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @UseGuards(JwtAuthGuard)
  @Get('balance')
  async getBalance(@Request() req: any) {
    const data = await this.walletService.getBalance(req.user.id);
    return { success: true, statusCode: 200, data };
  }

  @UseGuards(JwtAuthGuard)
  @Post('topup')
  async initiateTopUp(@Request() req: any, @Body() dto: TopUpDto) {
    const data = await this.walletService.initiateTopUp(req.user.id, dto);
    return { success: true, statusCode: 200, data };
  }

  @UseGuards(JwtAuthGuard)
  @Post('confirm')
  async confirmTopUp(@Request() req: any, @Body() dto: ConfirmTopUpDto) {
    const data = await this.walletService.confirmTopUp(req.user.id, dto);
    return { success: true, statusCode: 200, data };
  }

  @UseGuards(JwtAuthGuard)
  @Post('pay')
  async payWithWallet(@Request() req: any, @Body() dto: PayWithWalletDto) {
    const data = await this.walletService.payWithWallet(req.user.id, dto);
    return { success: true, statusCode: 200, data };
  }

  @UseGuards(JwtAuthGuard)
  @Get('transactions')
  async getTransactions(@Request() req: any) {
    const data = await this.walletService.getTransactions(req.user.id);
    return { success: true, statusCode: 200, data };
  }
}
