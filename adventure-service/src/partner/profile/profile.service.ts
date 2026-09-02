import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdventureComplianceDocument } from './entities/adventure-compliance-document.entity';
import { AdventurePartner } from '../setup/entities/adventure-partner.entity';
import { AdventurePartnerLocation } from '../setup/entities/adventure-partner-location.entity';
import { AdventureBankAccount } from '../earnings/entities/adventure-bank-account.entity';
import { AdventureDeviceToken } from '../notifications/entities/adventure-device-token.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(AdventureComplianceDocument)
    private readonly docRepo: Repository<AdventureComplianceDocument>,
    @InjectRepository(AdventurePartner)
    private readonly partnerRepo: Repository<AdventurePartner>,
    @InjectRepository(AdventurePartnerLocation)
    private readonly locationRepo: Repository<AdventurePartnerLocation>,
    @InjectRepository(AdventureBankAccount)
    private readonly bankRepo: Repository<AdventureBankAccount>,
    @InjectRepository(AdventureDeviceToken)
    private readonly tokenRepo: Repository<AdventureDeviceToken>,
  ) {}

  private async resolvePartnerId(userId: string): Promise<string> {
    const partner = await this.partnerRepo.findOne({ where: { user_id: userId } });
    if (!partner) throw new NotFoundException('Partner profile not found.');
    return partner.id;
  }

  async getProfile(userId: string) {
    const partnerId = await this.resolvePartnerId(userId);
    const partner = await this.partnerRepo.findOneBy({ id: partnerId });
    const location = await this.locationRepo.findOneBy({ partner_id: partnerId });

    return {
      id: partner!.id,
      partnerType: partner!.partner_type,
      businessName: partner!.business_name,
      ownerName: partner!.owner_name,
      email: partner!.email,
      phone: partner!.phone,
      rating: Number(partner!.rating),
      reviewsCount: partner!.total_reviews,
      logoUrl: partner!.logo_url,
      verificationStatus: partner!.verification_status,
      address: {
        fullAddress: partner!.address,
        city: partner!.city,
        state: partner!.state,
        pincode: partner!.pincode,
      },
      operatingLocation: location ? {
        searchLocation: location.search_location,
        meetingPointAddress: location.meeting_point_address,
        latitude: Number(location.latitude),
        longitude: Number(location.longitude),
      } : null,
      joinedAt: partner!.created_at,
    };
  }

  async updateBusinessDetails(userId: string, dto: any) {
    const partnerId = await this.resolvePartnerId(userId);
    const update: any = {};
    if (dto.businessName) update.business_name = dto.businessName;
    if (dto.ownerName) update.owner_name = dto.ownerName;
    if (dto.phone) update.phone = dto.phone;
    if (dto.logoUrl) update.logo_url = dto.logoUrl;
    
    if (Object.keys(update).length) {
      await this.partnerRepo.update(partnerId, update);
    }
    
    return { id: partnerId, message: 'Profile updated successfully' };
  }

  async getDocuments(userId: string) {
    const partnerId = await this.resolvePartnerId(userId);
    const docs = await this.docRepo.find({ where: { partner_id: partnerId } });
    return docs.map(d => ({
      id: d.id,
      title: d.title,
      docType: d.doc_type,
      docNumber: d.doc_number,
      validUntil: d.valid_until,
      status: d.status,
      fileUrl: d.file_url,
      rejectionReason: d.rejection_reason,
      isExpired: d.valid_until ? new Date(d.valid_until) < new Date() : false,
    }));
  }

  async uploadDocument(userId: string, file: Express.Multer.File, dto: any) {
    const partnerId = await this.resolvePartnerId(userId);
    const fileUrl = `https://storage.niklo.com/adventure/compliance/${file.originalname}`;
    
    const doc = this.docRepo.create({
      partner_id: partnerId,
      title: dto.title,
      doc_type: dto.docType,
      doc_number: dto.docNumber,
      valid_until: dto.validUntil,
      file_url: fileUrl,
      file_name: file.originalname,
      status: 'PENDING_APPROVAL',
    });
    
    const saved = await this.docRepo.save(doc);
    return {
      id: saved.id,
      docType: saved.doc_type,
      status: saved.status,
      fileUrl: saved.file_url,
    };
  }

  async renewDocument(userId: string, id: string, file: Express.Multer.File, dto: any) {
    const partnerId = await this.resolvePartnerId(userId);
    const doc = await this.docRepo.findOneBy({ id, partner_id: partnerId });
    if (!doc) throw new NotFoundException('Document not found');

    const fileUrl = `https://storage.niklo.com/adventure/compliance/${file.originalname}`;
    await this.docRepo.update(id, {
      file_url: fileUrl,
      file_name: file.originalname,
      valid_until: dto.validUntil || doc.valid_until,
      status: 'PENDING_APPROVAL',
      updated_at: new Date(),
    });

    return { id, status: 'PENDING_APPROVAL', message: 'Document submitted for renewal review' };
  }

  async getBankDetails(userId: string) {
    const partnerId = await this.resolvePartnerId(userId);
    const banks = await this.bankRepo.find({ where: { partner_id: partnerId } });
    return banks.map(b => ({
      id: b.id,
      accountHolderName: b.account_holder_name,
      accountNumberMask: b.account_number_mask,
      bankName: b.bank_name,
      ifscCode: b.ifsc_code,
      isPrimary: b.is_primary,
      isVerified: b.is_verified,
    }));
  }

  async addBankDetails(userId: string, dto: any) {
    const partnerId = await this.resolvePartnerId(userId);
    const mask = `XXXX-XXXX-${dto.accountNumber.slice(-4)}`;
    
    const bank = this.bankRepo.create({
      partner_id: partnerId,
      account_holder_name: dto.accountHolderName,
      account_number_enc: dto.accountNumber, // Should be encrypted in real life
      account_number_mask: mask,
      bank_name: dto.bankName,
      ifsc_code: dto.ifscCode,
      is_primary: true, // Assuming first one is primary
    });
    
    const saved = await this.bankRepo.save(bank);
    return { id: saved.id, accountNumberMask: mask, isVerified: false };
  }

  async logout(userId: string, fcmToken?: string) {
    const partnerId = await this.resolvePartnerId(userId);
    if (fcmToken) {
      await this.tokenRepo.delete({ partner_id: partnerId, fcm_token: fcmToken });
    }
    // We rely on the client to discard the JWT.
  }
}
