import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PackagePartner } from '../setup/entities/package_partner.entity';
import { PackageBooking } from '../bookings/entities/package-booking.entity';

@Injectable()
export class HomeDashboardService {
  constructor(
    @InjectRepository(PackagePartner)
    private readonly partnerRepository: Repository<PackagePartner>,
    @InjectRepository(PackageBooking)
    private readonly bookingRepository: Repository<PackageBooking>,
  ) {}

  async resolvePartner(identifier: string): Promise<PackagePartner | null> {
    if (!identifier || identifier === 'mock-partner-profile-id') return null;
    return this.partnerRepository.findOne({
      where: [{ id: identifier }, { user_id: identifier }],
    });
  }

  async getDashboard(identifier: string) {
    const partner = await this.resolvePartner(identifier);
    if (!partner) {
      return {
        partnerProfile: {
          partnerId: '',
          businessName: 'Partner Hub',
          tradeName: '',
          verificationStatus: 'UNDER_REVIEW',
          isVerified: false,
        },
        stats: {
          activePackages: { value: '0', numericValue: 0, subtitle: '0 Active', isPositiveTrend: false },
          monthlyBookings: { value: '0', numericValue: 0, subtitle: '0 this month', isPositiveTrend: false },
          monthlyRevenue: { value: '₹0', numericValue: 0, subtitle: '₹0 this month', isPositiveTrend: false },
          rating: { value: 'New', numericValue: 0.0, subtitle: '0 reviews', isPositiveTrend: false },
        },
      };
    }

    const partnerId = partner.id;
    const totalBookings = await this.bookingRepository.count({ where: { partner_id: partnerId } });
    const pendingBookings = await this.bookingRepository.count({
      where: { partner_id: partnerId, status: 'PENDING_ACCEPTANCE' },
    });
    const activeBookings = await this.bookingRepository.count({
      where: { partner_id: partnerId, status: 'CONFIRMED' },
    });

    const isVerified = partner.verification_status === 'approved';

    return {
      partnerProfile: {
        partnerId: partner.id,
        businessName: partner.business_name || 'Tour Operator',
        tradeName: partner.trade_name || partner.business_name || 'Tour Operator',
        verificationStatus: partner.verification_status,
        isVerified,
      },
      stats: {
        activePackages: {
          value: isVerified ? '0' : '0',
          numericValue: 0,
          subtitle: isVerified ? '0 Active' : 'Under Review',
          isPositiveTrend: false,
        },
        monthlyBookings: {
          value: `${totalBookings}`,
          numericValue: totalBookings,
          subtitle: `${pendingBookings} pending`,
          isPositiveTrend: totalBookings > 0,
        },
        monthlyRevenue: {
          value: '₹0',
          numericValue: 0,
          subtitle: '₹0 this month',
          isPositiveTrend: false,
        },
        rating: {
          value: 'New',
          numericValue: 0.0,
          subtitle: '0 reviews',
          isPositiveTrend: false,
        },
      },
    };
  }
  
  async getChartData(identifier: string, period: string) {
    const partner = await this.resolvePartner(identifier);
    if (!partner) return [];
    return [];
  }

  async getVerificationBanner(identifier: string) {
    const partner = await this.resolvePartner(identifier);
    if (!partner) {
      return {
        showBanner: true,
        bannerType: 'WARNING',
        title: 'Complete Profile Setup',
        subtitle: 'Submit your business details and documents to start publishing packages.',
        actionRoute: '/package-partner/setup/business',
      };
    }

    switch (partner.verification_status) {
      case 'under_verification':
        return {
          showBanner: true,
          bannerType: 'INFO',
          title: 'Application Under Review',
          subtitle: 'Your profile and compliance documents are being verified (Est. 24-48 hrs).',
          actionRoute: '/package-partner/profile',
        };
      case 'action_required':
        return {
          showBanner: true,
          bannerType: 'ERROR',
          title: 'Action Required',
          subtitle: partner.rejection_reason || 'Some documents require re-upload.',
          actionRoute: '/package-partner/setup/documents',
        };
      case 'approved':
        return {
          showBanner: false,
          bannerType: 'SUCCESS',
          title: 'Account Verified',
          subtitle: 'Your partner account is active.',
          actionRoute: null,
        };
      default:
        return {
          showBanner: true,
          bannerType: 'WARNING',
          title: 'Setup Incomplete',
          subtitle: 'Please complete onboarding to publish packages.',
          actionRoute: '/package-partner/setup/business',
        };
    }
  }
}
