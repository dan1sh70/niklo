import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Referral } from './entities/referral.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ReferralsService {
  constructor(
    @InjectRepository(Referral)
    private readonly referralRepo: Repository<Referral>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getReferralStats(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    // Auto-generate and persist referral code if not already set
    if (!user.referral_code) {
      const namePrefix = (user.name || 'NIKLO')
        .replace(/[^a-zA-Z]/g, '')
        .toUpperCase()
        .slice(0, 5) || 'NIKLO';
      const suffix = user.phone
        ? user.phone.slice(-4)
        : Math.floor(1000 + Math.random() * 9000).toString();
      user.referral_code = `${namePrefix}${suffix}`;
      await this.userRepo.save(user);
    }

    const referralCode = user.referral_code;
    const rewardPerReferral = 100.0;
    const shareLink = `https://niklotravel.app/join?ref=${referralCode}`;
    const shareTitle = `Join Niklo Travel & Earn ₹${Math.round(rewardPerReferral)}!`;
    const shareMessage =
      `Plan trips, book hotels, buses & adventure experiences on Niklo Travel!\n` +
      `Use my referral code *${referralCode}* to get ₹${Math.round(rewardPerReferral)} bonus in your Niklo Wallet on your first booking.\n` +
      `Download the app: ${shareLink}`;

    const referrals = await this.referralRepo.find({
      where: { referrer_id: userId },
      relations: { referee: true },
      order: { created_at: 'DESC' },
    });

    const completed = referrals.filter((r) => r.status === 'COMPLETED');
    const totalEarned = completed.reduce(
      (sum, r) => sum + Number(r.reward_amount),
      0,
    );

    const recentReferrals = referrals.map((r) => ({
      id: r.id,
      name: r.referee?.name || 'Friend',
      avatar_url: r.referee?.avatar_url || null,
      joined_at: r.created_at,
      status: r.status,
      reward_amount: Number(r.reward_amount),
    }));

    return {
      referral_code: referralCode,
      reward_per_referral: rewardPerReferral,
      share_title: shareTitle,
      share_message: shareMessage,
      share_link: shareLink,
      total_earned: totalEarned,
      completed_referrals: completed.length,
      pending_referrals: referrals.length - completed.length,
      recent_referrals: recentReferrals,
    };
  }

  async applyReferralCode(refereeId: string, referralCode: string) {
    const trimmedCode = referralCode.trim().toUpperCase();
    const referrer = await this.userRepo.findOne({
      where: { referral_code: trimmedCode },
    });

    if (!referrer || referrer.id === refereeId) {
      throw new BadRequestException('Invalid or expired referral code');
    }

    const existing = await this.referralRepo.findOne({
      where: { referee_id: refereeId },
    });
    if (existing) {
      throw new BadRequestException(
        'Referral code already applied on this account',
      );
    }

    const referral = this.referralRepo.create({
      referrer_id: referrer.id,
      referee_id: refereeId,
      referral_code: trimmedCode,
      status: 'PENDING',
      reward_amount: 100.0,
    });

    return this.referralRepo.save(referral);
  }
}
