import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import {
  WalletTransaction,
  TransactionType,
} from './entities/wallet-transaction.entity';
import { TopUpDto } from './dto/top-up.dto';
import { ConfirmTopUpDto } from './dto/confirm-topup.dto';
import { PayWithWalletDto } from './dto/pay-with-wallet.dto';
import { PaymentsService } from '../payments/payments.service';
import { PaymentStatus } from '../payments/entities/payment.entity';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    @InjectRepository(WalletTransaction)
    private readonly walletRepo: Repository<WalletTransaction>,
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async initiateTopUp(userId: string, dto: TopUpDto) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    const order = await this.paymentsService.createOrder(userId, {
      amount: dto.amount,
      currency: 'INR',
    });

    return order;
  }

  async confirmTopUp(userId: string, dto: ConfirmTopUpDto) {
    const key_secret = this.configService.get<string>('razorpay.key_secret');

    // 1. Verify HMAC SHA256 signature if signature & secret exist
    if (dto.razorpay_signature && key_secret) {
      const generatedSignature = crypto
        .createHmac('sha256', key_secret)
        .update(`${dto.razorpay_order_id}|${dto.razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== dto.razorpay_signature) {
        throw new BadRequestException('Invalid Razorpay signature');
      }
    }

    // 2. Update Payment record to SUCCESS
    const payment = await this.paymentsService.updatePaymentStatus(
      dto.razorpay_order_id,
      PaymentStatus.SUCCESS,
      dto.razorpay_payment_id,
    );

    const amount = payment ? Number(payment.amount) : 0;

    // 3. Create CREDIT entry in wallet_transactions + sync user-service
    await this.processTopUpSuccess(userId, amount, dto.razorpay_payment_id);

    // 4. Return live recalculated balance
    return this.getBalance(userId);
  }

  async payWithWallet(userId: string, dto: PayWithWalletDto) {
    const currentBalance = await this.getBalance(userId);
    if (currentBalance.balance < dto.amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    // 1. Record DEBIT transaction
    const transaction = this.walletRepo.create({
      user_id: userId,
      amount: dto.amount,
      transaction_type: TransactionType.DEBIT,
      reference_id: dto.booking_id || `booking_${Date.now()}`,
      description:
        dto.description || `Payment for ${dto.booking_type || 'booking'}`,
    });

    await this.walletRepo.save(transaction);

    // 2. Synchronize user-service wallet_balance (decrease by amount)
    try {
      const userServiceUrl =
        process.env.USER_SERVICE_URL || 'http://user-service:3002';
      await lastValueFrom(
        this.httpService.post(
          `${userServiceUrl}/api/v1/user/${userId}/sync-wallet`,
          { amount: -Number(dto.amount) },
        ),
      );
    } catch (error) {
      this.logger.error(
        `Failed to sync debit wallet balance with user-service for user ${userId}: ${error.message}`,
      );
    }

    const updatedBalance = await this.getBalance(userId);

    return {
      success: true,
      transaction_id: transaction.id,
      debited_amount: dto.amount,
      remaining_balance: updatedBalance.balance,
      currency: 'INR',
    };
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

    // Synchronize wallet balance in user-service (increase by amount)
    try {
      const userServiceUrl =
        process.env.USER_SERVICE_URL || 'http://user-service:3002';
      await lastValueFrom(
        this.httpService.post(
          `${userServiceUrl}/api/v1/user/${userId}/sync-wallet`,
          { amount },
        ),
      );
    } catch (error) {
      this.logger.error(
        `Failed to sync wallet balance with user-service for user ${userId}: ${error.message}`,
      );
    }

    return transaction;
  }

  async getTransactions(userId: string) {
    return this.walletRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  async getBalance(userId: string) {
    const transactions = await this.walletRepo.find({
      where: { user_id: userId },
    });

    const balance = transactions.reduce((acc, tx) => {
      return tx.transaction_type === TransactionType.CREDIT
        ? acc + Number(tx.amount)
        : acc - Number(tx.amount);
    }, 0);

    return {
      userId,
      balance: parseFloat(balance.toFixed(2)),
      currency: 'INR',
    };
  }
}
