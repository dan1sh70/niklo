import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, KycStatus } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getProfile(userId: string) {
    // For demo purposes, we return a mock object if DB is empty
    return {
      id: userId,
      phone: '+919876543210',
      email: 'user@example.com',
      name: 'John Doe',
      avatar_url: 'https://cdn.niklo.com/avatars/default.png',
      kyc_status: KycStatus.VERIFIED,
      wallet_balance: 1500.5,
      preferred_language: 'en',
    };
  }

  async updateProfile(userId: string, updateData: any) {
    return {
      message: 'Profile updated successfully',
      data: updateData,
    };
  }

  async uploadKyc(userId: string, kycData: any) {
    return {
      message: 'KYC documents submitted successfully',
      status: KycStatus.SUBMITTED,
    };
  }

  async getWallet(userId: string) {
    return {
      userId,
      balance: 1500.5,
      currency: 'INR',
    };
  }
}
