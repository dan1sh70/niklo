import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { PaymentsModule } from '../payments/payments.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [PaymentsModule, WalletModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
