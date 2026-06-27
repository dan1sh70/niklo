import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WalletTransaction,
  TransactionType,
} from './entities/wallet-transaction.entity';
import { TopUpDto } from './dto/top-up.dto';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(WalletTransaction)
    private readonly walletRepo: Repository<WalletTransaction>,
    private readonly paymentsService: PaymentsService,
  ) {}

  async initiateTopUp(userId: string, dto: TopUpDto) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    // A top-up creates a Razorpay order
    const order = await this.paymentsService.createOrder(userId, {
      amount: dto.amount,
      currency: 'INR',
    });

    return order;
  }

  async processTopUpSuccess(
    userId: string,
    amount: number,
    referenceId: string,
  ) {
    const transaction = this.walletRepo.create({
      user_id: userId,
      amount,
      transaction_type: TransactionType.CREDIT,
      reference_id: referenceId,
      description: 'Wallet Top-up via Razorpay',
    });

    await this.walletRepo.save(transaction);

    // Note: Here we would typically emit a message to the message bus
    // to update the user's wallet_balance in the user-service.
    return transaction;
  }

  async getTransactions(userId: string) {
    return this.walletRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }
}
