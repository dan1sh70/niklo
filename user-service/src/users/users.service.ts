import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, KycStatus } from './entities/user.entity';
import { EmergencyContact } from './entities/emergency-contact.entity';
import { MarketingBanner } from './entities/marketing-banner.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(EmergencyContact)
    private readonly emergencyContactRepository: Repository<EmergencyContact>,
    @InjectRepository(MarketingBanner)
    private readonly bannerRepository: Repository<MarketingBanner>,
  ) {}

  async getProfile(userId: string) {
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
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // Whitelist allowed fields for update
    const allowedFields = ['name', 'email', 'avatar_url', 'preferred_language'];
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        user[field] = updateData[field];
      }
    });

    const updatedUser = await this.userRepository.save(user);

    return {
      message: 'Profile updated successfully',
      data: updatedUser,
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

  async addSavedLocation(userId: string, locationData: any) {
    return {
      message: 'Location saved successfully',
      data: {
        userId,
        ...locationData,
      },
    };
  }

  async uploadAvatar(userId: string, fileData: any) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // In a real app, upload to S3/CDN and get URL. Mocking for now.
    const avatarUrl = `https://cdn.niklo.com/avatars/${userId}-${Date.now()}.png`;
    user.avatar_url = avatarUrl;
    await this.userRepository.save(user);

    return {
      message: 'Avatar uploaded successfully',
      avatar_url: avatarUrl,
    };
  }

  async getEmergencyContacts(userId: string) {
    return this.emergencyContactRepository.find({
      where: { user_id: userId },
    });
  }

  async addEmergencyContact(userId: string, contactData: any) {
    const contact = this.emergencyContactRepository.create({
      user_id: userId,
      ...contactData,
    });
    return this.emergencyContactRepository.save(contact);
  }

  async deleteEmergencyContact(userId: string, contactId: string) {
    const contact = await this.emergencyContactRepository.findOne({
      where: { id: contactId, user_id: userId },
    });
    if (!contact) {
      throw new NotFoundException('Emergency contact not found');
    }
    await this.emergencyContactRepository.remove(contact);
    return { message: 'Emergency contact deleted successfully' };
  }

  async triggerEmergencySos(userId: string, sosData: any) {
    // In a real app, this would trigger SMS/calls/Push via notification-service
    // to all emergency contacts and maybe authorities.
    const contacts = await this.getEmergencyContacts(userId);
    
    return {
      message: 'Emergency SOS triggered',
      notified_contacts: contacts.length,
      location_shared: sosData.location || null,
      timestamp: new Date(),
    };
  }

  // --- Phase 3: Home Screen Aggregator ---
  async getActiveTrip(userId: string) {
    // Mock data for the active trip (usually aggregated from booking-service)
    return {
      has_active_trip: true,
      trip: {
        id: 'trip-123',
        type: 'bus',
        title: 'Bangalore to Chennai',
        departure_time: new Date(Date.now() + 86400000), // tomorrow
        pnr: 'B123456',
        boarding_point: 'Majestic Bus Stand',
      }
    };
  }

  async getSmartSuggestions(userId: string) {
    // Mock recommendations (usually from AI/package-service)
    return {
      suggestions: [
        { id: 'sugg-1', title: 'Weekend Getaway to Coorg', type: 'package', price: 5999 },
        { id: 'sugg-2', title: 'Luxury Stay at Taj West End', type: 'hotel', price: 12000 },
      ]
    };
  }

  async getPromotionsBanners() {
    return this.bannerRepository.find({
      where: { is_active: true },
      order: { priority: 'ASC' }
    });
  }
}
