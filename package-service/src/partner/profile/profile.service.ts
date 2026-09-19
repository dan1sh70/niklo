import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PackagePartner } from '../setup/entities/package_partner.entity';
import { PackagePartnerDocument } from '../setup/entities/package_partner-document.entity';
import { SupportTicket } from './entities/support-ticket.entity';
import { FaqArticle } from './entities/faq-article.entity';
import { PackagePartnerBank } from '../setup/entities/package_partner-bank.entity';
import { PartnerDeviceFcmToken } from '../notifications/entities/partner-device-fcm-token.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(PackagePartner)
    private readonly partnerRepository: Repository<PackagePartner>,
    @InjectRepository(PackagePartnerDocument)
    private readonly documentRepository: Repository<PackagePartnerDocument>,
    @InjectRepository(SupportTicket)
    private readonly ticketRepository: Repository<SupportTicket>,
    @InjectRepository(FaqArticle)
    private readonly faqRepository: Repository<FaqArticle>,
    @InjectRepository(PackagePartnerBank)
    private readonly bankAccountRepository: Repository<PackagePartnerBank>,
    @InjectRepository(PartnerDeviceFcmToken)
    private readonly fcmTokenRepository: Repository<PartnerDeviceFcmToken>,
  ) {}

  async getProfile(partnerId: string) {
    const partner = await this.partnerRepository.findOne({ 
      where: [{ id: partnerId }, { user_id: partnerId }] 
    });
    if (!partner) throw new NotFoundException('Profile not found');
    return {
      partnerId: partner.id,
      businessName: partner.business_name,
      tradeName: partner.trade_name || partner.business_name,
      ownerName: partner.owner_name || 'Owner',
      businessType: partner.business_type,
      panNumber: partner.pan_number,
      gstin: partner.gstin,
      logoUrl: partner.logo_url,
      email: partner.email,
      phone: partner.phone,
      address: partner.address_line1,
      city: partner.city,
      state: partner.state,
      pincode: partner.pincode,
      verificationStatus: partner.verification_status,
      isVerified: partner.verification_status === 'approved',
      createdAt: partner.created_at,
      stats: {
        activePackages: 0,
        monthlyBookings: 0,
        monthlyRevenue: 0,
        rating: 0
      }
    };
  }

  async updateBusinessDetails(partnerId: string, body: any) {
    const partner = await this.partnerRepository.findOne({ 
      where: [{ id: partnerId }, { user_id: partnerId }] 
    });
    if (!partner) throw new NotFoundException('Profile not found');
    
    await this.partnerRepository.update(
      { id: partner.id },
      {
        business_name: body.businessName,
        trade_name: body.tradeName,
        owner_name: body.ownerName,
        pan_number: body.panNumber,
        gstin: body.gstNumber,
        email: body.email,
        phone: body.phone,
        address_line1: body.address,
        city: body.city,
        state: body.state,
        pincode: body.pincode,
      }
    );
    return this.getProfile(partner.id);
  }

  async toggleNotifications(userId: string, body: { enabled: boolean }) {
    const partner = await this.partnerRepository.findOne({ where: { user_id: userId } });
    if (!partner) throw new NotFoundException('Partner not found');
    partner.notifications_enabled = body.enabled;
    await this.partnerRepository.save(partner);
    return { enabled: partner.notifications_enabled };
  }

  async getDocuments(partnerId: string) {
    const docs = await this.documentRepository.find({ where: { partner_id: partnerId } });
    return docs.map(doc => ({
      documentId: doc.id,
      documentType: doc.doc_type,
      fileName: doc.file_name,
      fileUrl: doc.file_url,
      verificationStatus: doc.status,
      uploadedAt: doc.created_at,
      rejectionReason: doc.review_notes
    }));
  }

  private async uploadToS3(file: any): Promise<string> {
    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    
    // Fallback if not configured
    if (!process.env.AWS_REGION || !process.env.AWS_S3_BUCKET) {
      return 'https://mock-s3-bucket.s3.amazonaws.com/' + (file ? file.originalname : 'mock_file.pdf');
    }

    const s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy'
      }
    });

    const key = `kyc_docs/${Date.now()}_${file.originalname}`;
    await s3.send(new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));

    return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }

  async uploadDocument(partnerId: string, file: any, body: any) {
    const fileUrl = file ? await this.uploadToS3(file) : 'https://mock.url/file.pdf';
    
    const doc = this.documentRepository.create({
      partner_id: partnerId,
      doc_type: body.documentType,
      title: body.documentType, // e.g. GST_CERTIFICATE
      file_name: file ? file.originalname : 'mock_file.pdf',
      file_url: fileUrl,
      file_size_bytes: file ? file.size : 1000,
      mime_type: file ? file.mimetype : 'application/pdf',
      status: 'PENDING'
    });
    
    await this.documentRepository.save(doc);

    return {
      documentId: doc.id,
      documentType: doc.doc_type,
      fileName: doc.file_name,
      fileUrl: doc.file_url,
      verificationStatus: doc.status,
      uploadedAt: doc.created_at
    };
  }

  async uploadLogo(partnerId: string, file: any) {
    const partner = await this.partnerRepository.findOne({ where: [{ id: partnerId }, { user_id: partnerId }] });
    if (!partner) throw new NotFoundException('Partner not found');
    
    const logoUrl = file ? await this.uploadToS3(file) : 'https://mock.url/logo.png';
    partner.logo_url = logoUrl;
    await this.partnerRepository.save(partner);
    return { logoUrl };
  }

  async renewDocument(partnerId: string, documentId: string, file: any, body: any) {
    const doc = await this.documentRepository.findOne({ where: { id: documentId, partner_id: partnerId } });
    if (!doc) throw new NotFoundException('Document not found');
    
    const fileUrl = file ? await this.uploadToS3(file) : doc.file_url;
    
    doc.file_name = file ? file.originalname : doc.file_name;
    doc.file_url = fileUrl;
    doc.file_size_bytes = file ? file.size : doc.file_size_bytes;
    doc.mime_type = file ? file.mimetype : doc.mime_type;
    doc.status = 'PENDING';
    doc.review_notes = '';

    await this.documentRepository.save(doc);
    
    return {
      documentId: doc.id,
      documentType: doc.doc_type,
      fileName: doc.file_name,
      fileUrl: doc.file_url,
      verificationStatus: doc.status,
      uploadedAt: doc.created_at
    };
  }

  async getBankDetails(partnerId: string) {
    const bank = await this.bankAccountRepository.findOne({ where: { partner_id: partnerId, is_primary: true } });
    if (!bank) return null;
    return {
      bankAccountId: bank.id,
      bankName: bank.bank_name,
      branchName: bank.branch_name,
      accountHolderName: bank.account_holder_name,
      accountMask: bank.account_number_mask,
      ifscCode: bank.ifsc_code,
      accountType: bank.account_type,
      isVerified: bank.is_verified,
      pennyDropStatus: bank.penny_drop_status
    };
  }

  async sendBankOtp(partnerId: string) {
    // Mock OTP dispatch
    return {
      success: true,
      message: "A 6-digit security OTP has been sent to your registered mobile number."
    };
  }

  private encryptAES(text: string): string {
    const crypto = require('crypto');
    const secretKey = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; // 32 bytes
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(secretKey), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  async addBankDetails(partnerId: string, body: any) {
    const { otp, accountHolderName, accountNumber, confirmAccountNumber, ifscCode, accountType } = body;
    
    if (accountNumber !== confirmAccountNumber) {
      throw new BadRequestException('Account numbers do not match');
    }
    
    // Hardcoded mock OTP verification
    if (otp !== '918274' && otp !== '123456') {
      throw new BadRequestException('Invalid OTP');
    }

    // Inactivate old primary banks
    await this.bankAccountRepository.update({ partner_id: partnerId }, { is_primary: false });

    // Create new bank account
    const encryptedAccount = this.encryptAES(accountNumber);
    
    const bankAccount = this.bankAccountRepository.create({
      partner_id: partnerId,
      account_holder_name: accountHolderName,
      account_number_encrypted: encryptedAccount,
      account_number_mask: '•••• •••• ' + accountNumber.slice(-4),
      ifsc_code: ifscCode,
      account_type: accountType || 'CURRENT',
      bank_name: 'Mock Bank', // Would normally resolve from IFSC
      branch_name: 'Mock Branch',
      is_primary: true,
      penny_drop_status: 'SUCCESS',
      is_verified: true
    });
    
    await this.bankAccountRepository.save(bankAccount);

    return {
      bankAccountId: bankAccount.id,
      bankName: bankAccount.bank_name,
      branch: bankAccount.branch_name,
      accountMask: bankAccount.account_number_mask,
      settlementHoldUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
  }

  async getSupportCategories() {
    return {
      success: true,
      data: {
        helplinePhone: "+91 1800-NIKLO-TOUR",
        whatsappChatUrl: "https://wa.me/919876500000?text=Hello%20Niklo%20Support",
        categories: [
          {
            id: "cat_bookings",
            title: "Bookings & Cancellations",
            description: "Managing guest requests, refund policies, and manifest changes",
            icon: "event_available",
            articleCount: 12
          },
          {
            id: "cat_payouts",
            title: "Payouts & Settlements",
            description: "Weekly Monday payout cycles, commission fees, and TDS certificates",
            icon: "account_balance_wallet",
            articleCount: 8
          },
          {
            id: "cat_packages",
            title: "Package Publishing",
            description: "Creating multi-day itineraries, calendar availability, and pricing",
            icon: "inventory_2",
            articleCount: 15
          },
          {
            id: "cat_kyc",
            title: "Account & KYC Verification",
            description: "GST, PAN, Tourism license compliance, and bank account changes",
            icon: "verified_user",
            articleCount: 6
          }
        ]
      }
    };
  }

  async getSupportTickets(partnerId: string) {
    const tickets = await this.ticketRepository.find({
      where: { partner_id: partnerId },
      order: { created_at: 'DESC' }
    });
    
    return {
      success: true,
      data: {
        totalTickets: tickets.length,
        tickets: tickets.map(t => ({
          id: t.id,
          ticketRef: t.ticket_ref,
          category: t.category,
          subject: t.subject,
          status: t.status,
          priority: t.priority,
          createdAt: t.created_at,
          lastUpdated: t.updated_at,
          latestResponse: t.latest_response || "We are reviewing your ticket."
        }))
      }
    };
  }

  async raiseSupportTicket(partnerId: string, body: any) {
    const ticket = this.ticketRepository.create({
      partner_id: partnerId,
      ticket_ref: 'TCK-' + Math.floor(Math.random() * 10000),
      category: body.category || 'OTHER',
      subject: body.subject,
      description: body.description,
      priority: body.priority || 'MEDIUM',
      status: 'OPEN',
      attachment_urls: body.attachmentUrls || []
    });
    
    await this.ticketRepository.save(ticket);
    
    return {
      success: true,
      message: "Support ticket raised successfully. Our team will respond within 4 business hours.",
      data: {
        ticketId: ticket.id,
        ticketRef: ticket.ticket_ref,
        status: ticket.status,
        createdAt: ticket.created_at
      }
    };
  }

  async getLegalDocument(documentType: string) {
    try {
      // Mock fetching from an external S3 CMS or raw githubusercontent link
      const response = await fetch(`https://mock-cms-url.com/legal/${documentType}.md`);
      const markdownContent = response.ok ? await response.text() : (documentType === 'terms' ? "# Niklo Package Partner Agreement\n\n1. **Commission & Fees**..." : "# Privacy Policy\n\nYour data is secure.");
      
      return {
        success: true,
        data: {
          documentType: documentType,
          title: documentType === 'terms' ? "Terms and Conditions" : "Privacy Policy",
          version: "v2.5",
          lastUpdated: "September 2026",
          markdownContent
        }
      };
    } catch (e) {
      return {
        success: true,
        data: {
          documentType,
          title: "Legal Document",
          markdownContent: "# Error loading document\n\nPlease try again later."
        }
      };
    }
  }

  async logout(partnerId: string, fcmToken: string) { return {}; }
}
