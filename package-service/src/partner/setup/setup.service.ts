import { Injectable, UnauthorizedException, NotFoundException, BadRequestException, ConflictException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PackagePartner, VerificationStatus } from './entities/package_partner.entity';
import { PackagePartnerCategory } from './entities/package_partner-category.entity';
import { PackagePartnerLocation } from './entities/package_partner-location.entity';
import { PackagePartnerDocument } from './entities/package_partner-document.entity';
import { PackagePartnerBank } from './entities/package_partner-bank.entity';

const VALID_PARTNER_TYPES = ['Sole Proprietorship', 'Partnership', 'Private Limited', 'LLP'];
const REQUIRED_DOC_TYPES = ['BUSINESS_REGISTRATION', 'PAN_CARD', 'GST_CERTIFICATE', 'CANCELLED_CHEQUE', 'SIGNATORY_ID'];

@Injectable()
export class SetupService {
  constructor(
    @InjectRepository(PackagePartner)
    private readonly partnerRepo: Repository<PackagePartner>,
    @InjectRepository(PackagePartnerCategory)
    private readonly categoryRepo: Repository<PackagePartnerCategory>,
    @InjectRepository(PackagePartnerLocation)
    private readonly locationRepo: Repository<PackagePartnerLocation>,
    @InjectRepository(PackagePartnerDocument)
    private readonly documentRepo: Repository<PackagePartnerDocument>,
    @InjectRepository(PackagePartnerBank)
    private readonly bankRepo: Repository<PackagePartnerBank>,
  ) {}

  async getOrCreatePartner(userId: string): Promise<PackagePartner> {
    let partner = await this.partnerRepo.findOne({ where: { user_id: userId } });
    if (!partner) {
      partner = this.partnerRepo.create({ user_id: userId });
      await this.partnerRepo.save(partner);
    }
    return partner;
  }

  getSetupMeta() {
    return {
      partnerTypes: [
        { id: 'Sole Proprietorship', title: 'Sole Proprietorship', subtitle: 'Single owner business', icon: 'person' },
        { id: 'Partnership', title: 'Partnership', subtitle: 'Two or more partners', icon: 'group' },
        { id: 'Private Limited', title: 'Private Limited', subtitle: 'Registered Private Company', icon: 'business' },
        { id: 'LLP', title: 'LLP', subtitle: 'Limited Liability Partnership', icon: 'business_center' },
      ],
      categories: [
        { id: 'heritage', title: 'Heritage & Culture', imageUrl: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=600&q=80' },
        { id: 'wildlife', title: 'Wildlife Safari', imageUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=600&q=80' },
        { id: 'honeymoon', title: 'Honeymoon Special', imageUrl: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=600&q=80' },
        { id: 'adventure', title: 'Adventure Trips', imageUrl: 'https://images.unsplash.com/photo-1533088493863-71a7d667fb5a?auto=format&fit=crop&w=600&q=80' },
        { id: 'pilgrimage', title: 'Pilgrimage', imageUrl: 'https://images.unsplash.com/photo-1558455799-a681c2017c67?auto=format&fit=crop&w=600&q=80' },
      ],
      documentRules: {
        maxFileSizeBytes: 10485760,
        allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'],
        requiredDocumentTypes: REQUIRED_DOC_TYPES,
        optionalDocumentTypes: ['TOURISM_LICENSE'],
      },
    };
  }

  async getProgress(userId: string) {
    const partner = await this.getOrCreatePartner(userId);
    const categories = await this.categoryRepo.find({ where: { partner_id: partner.id } });
    const location = await this.locationRepo.findOne({ where: { partner_id: partner.id } });
    const uploadedDocs = await this.documentRepo.find({ where: { partner_id: partner.id } });

    const docTypes = ['BUSINESS_REGISTRATION', 'PAN_CARD', 'GST_CERTIFICATE', 'TOURISM_LICENSE', 'CANCELLED_CHEQUE', 'SIGNATORY_ID'];
    const docTitles: Record<string, { title: string; required: boolean }> = {
      BUSINESS_REGISTRATION: { title: 'Business Registration Document', required: true },
      PAN_CARD: { title: 'Business PAN Card', required: true },
      GST_CERTIFICATE: { title: 'GST Certificate', required: true },
      TOURISM_LICENSE: { title: 'Tourism License', required: false },
      CANCELLED_CHEQUE: { title: 'Cancelled Cheque', required: true },
      SIGNATORY_ID: { title: 'Authorized Signatory ID', required: true },
    };

    const documents = docTypes.map((dt, idx) => {
      const doc = uploadedDocs.find((d) => d.doc_type === dt);
      return {
        id: doc?.id || `doc_placeholder_${idx + 1}`,
        docType: dt,
        title: docTitles[dt].title,
        isRequired: docTitles[dt].required,
        status: doc ? doc.status : 'NOT_UPLOADED',
        fileName: doc?.file_name || null,
        fileUrl: doc?.file_url || null,
      };
    });

    return {
      partnerId: partner.id,
      onboardingStep: partner.onboarding_step,
      verificationStatus: partner.verification_status,
      businessType: partner.business_type,
      businessDetails: {
        businessName: partner.business_name,
        email: partner.email,
        phone: partner.phone,
        address: partner.address_line1,
        city: partner.city,
        state: partner.state,
        pincode: partner.pincode,
      },
      selectedCategories: categories.map((c) => c.category_id),
      location: location
        ? {
            searchLocation: location.search_location,
            meetingPointAddress: location.meeting_point_address,
            activityStartArea: location.activity_start_area,
            latitude: Number(location.latitude),
            longitude: Number(location.longitude),
          }
        : null,
      documents,
    };
  }

  async savePartnerType(userId: string, partnerType: string) {
    if (!VALID_PARTNER_TYPES.includes(partnerType)) {
      throw new BadRequestException(`Invalid partner type: ${partnerType}`);
    }
    const partner = await this.getOrCreatePartner(userId);
    partner.business_type = partnerType;
    partner.onboarding_step = 'CATEGORIES';
    await this.partnerRepo.save(partner);
    return { partnerType, nextStep: 2 };
  }

  async saveBusinessDetails(userId: string, dto: any) {
    const partner = await this.getOrCreatePartner(userId);
    Object.assign(partner, {
      business_name: dto.businessName,
      email: dto.email,
      phone: dto.phone,
      address_line1: dto.address,
      city: dto.city,
      state: dto.state,
      pincode: dto.pincode,
    });
    partner.onboarding_step = 'DOCUMENTS';
    await this.partnerRepo.save(partner);
    return { businessName: dto.businessName, nextStep: 3 };
  }

  async saveCategories(userId: string, categoryIds: string[]) {
    const partner = await this.getOrCreatePartner(userId);
    await this.categoryRepo.delete({ partner_id: partner.id });
    const cats = categoryIds.map((cid) => this.categoryRepo.create({ partner_id: partner.id, category_id: cid }));
    await this.categoryRepo.save(cats);
    partner.onboarding_step = 'BANK_DETAILS';
    await this.partnerRepo.save(partner);
    return { selectedCategories: categoryIds, nextStep: 4 };
  }

  async saveLocation(userId: string, dto: any) {
    const partner = await this.getOrCreatePartner(userId);
    let location = await this.locationRepo.findOne({ where: { partner_id: partner.id } });
    if (!location) {
      location = this.locationRepo.create({ partner_id: partner.id });
    }
    Object.assign(location, {
      search_location: dto.searchLocation,
      meeting_point_address: dto.meetingPointAddress,
      activity_start_area: dto.activityStartArea,
      latitude: dto.latitude,
      longitude: dto.longitude,
    });
    await this.locationRepo.save(location);
    partner.onboarding_step = 'SUBMITTED';
    await this.partnerRepo.save(partner);
    return { nextStep: 5 };
  }

  async uploadDocument(userId: string, docType: string, title: string, file: Express.Multer.File) {
    const partner = await this.getOrCreatePartner(userId);
    const REQUIRED_TYPES = ['BUSINESS_REGISTRATION', 'PAN_CARD', 'GST_CERTIFICATE', 'CANCELLED_CHEQUE', 'SIGNATORY_ID'];
    let doc = await this.documentRepo.findOne({ where: { partner_id: partner.id, doc_type: docType } });

    const fileUrl = `https://storage.niklo.com/package-partner/docs/${file.originalname}`;
    const fileName = `${file.originalname} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`;

    if (!doc) {
      doc = this.documentRepo.create({ partner_id: partner.id, doc_type: docType });
    }
    Object.assign(doc, {
      title,
      file_name: fileName,
      file_url: fileUrl,
      file_size_bytes: file.size,
      mime_type: file.mimetype,
      is_required: REQUIRED_TYPES.includes(docType),
      status: 'UPLOADED',
    });
    await this.documentRepo.save(doc);
    return doc;
  }

  async getDocuments(userId: string) {
    const partner = await this.getOrCreatePartner(userId);
    const uploadedDocs = await this.documentRepo.find({ where: { partner_id: partner.id } });

    const docTypes = ['BUSINESS_REGISTRATION', 'PAN_CARD', 'GST_CERTIFICATE', 'TOURISM_LICENSE', 'CANCELLED_CHEQUE', 'SIGNATORY_ID'];
    const docTitles: Record<string, { title: string; required: boolean }> = {
      BUSINESS_REGISTRATION: { title: 'Business Registration Document', required: true },
      PAN_CARD: { title: 'Business PAN Card', required: true },
      GST_CERTIFICATE: { title: 'GST Certificate', required: true },
      TOURISM_LICENSE: { title: 'Tourism License', required: false },
      CANCELLED_CHEQUE: { title: 'Cancelled Cheque', required: true },
      SIGNATORY_ID: { title: 'Authorized Signatory ID', required: true },
    };

    const documents = docTypes.map((dt, idx) => {
      const doc = uploadedDocs.find((d) => d.doc_type === dt);
      return {
        id: doc?.id || `doc_placeholder_${idx + 1}`,
        documentType: dt,
        title: docTitles[dt].title,
        isRequired: docTitles[dt].required,
        status: doc ? doc.status : 'NOT_UPLOADED',
        fileName: doc?.file_name || null,
        fileUrl: doc?.file_url || null,
      };
    });

    return documents;
  }

  async deleteDocument(userId: string, docType: string) {
    const partner = await this.getOrCreatePartner(userId);
    await this.documentRepo.delete({ partner_id: partner.id, doc_type: docType });
  }

  async verifyBankDetails(userId: string, dto: { accountHolderName: string; accountNumber: string; confirmAccountNumber: string; ifscCode: string; accountType: string }) {
    const partner = await this.getOrCreatePartner(userId);
    
    if (dto.accountNumber !== dto.confirmAccountNumber) {
       throw new BadRequestException('Account numbers do not match');
    }

    // Check if bank details already exist
    let bank = await this.bankRepo.findOne({ where: { partner_id: partner.id } });
    if (!bank) {
      bank = this.bankRepo.create({ partner_id: partner.id });
    }
    
    bank.account_holder_name = dto.accountHolderName;
    bank.account_number_encrypted = 'ENCRYPTED_' + dto.accountNumber;
    bank.account_number_mask = '•••• •••• ' + dto.accountNumber.slice(-4);
    bank.ifsc_code = dto.ifscCode;
    bank.bank_name = 'Mock Bank (Penny Drop)';
    bank.is_verified = true; // Mock penny drop success
    bank.penny_drop_status = 'SUCCESS';
    bank.penny_drop_ref = 'mock_fund_acc_' + Math.floor(Math.random() * 1000000);
    
    await this.bankRepo.save(bank);
    
    partner.onboarding_step = 'SUBMITTED';
    await this.partnerRepo.save(partner);
    
    return { verified: true, verificationId: bank.penny_drop_ref, nextStep: 'SUBMITTED' };
  }

  async submitForVerification(userId: string) {
    const partner = await this.getOrCreatePartner(userId);
    const blockedStatuses = [VerificationStatus.APPROVED, VerificationStatus.UNDER_VERIFICATION];
    if (blockedStatuses.includes(partner.verification_status as VerificationStatus)) {
      throw new ConflictException('Cannot submit: profile is already approved or under review');
    }

    const docs = await this.documentRepo.find({ where: { partner_id: partner.id } });
    const uploadedTypes = docs.map((d) => d.doc_type);
    const missingDocTypes = REQUIRED_DOC_TYPES.filter((t) => !uploadedTypes.includes(t));

    if (missingDocTypes.length > 0) {
      throw new UnprocessableEntityException({
        success: false,
        errorCode: 'MISSING_REQUIRED_DOCUMENTS',
        message: 'Cannot submit onboarding application. Mandatory documents are missing.',
        missingDocTypes,
      });
    }

    partner.verification_status = VerificationStatus.UNDER_VERIFICATION;    await this.partnerRepo.save(partner);

    return {
      verificationStatus: 'UNDER_REVIEW',
      submittedAt: new Date().toISOString(),
      estimatedCompletionHours: 48,
    };
  }

  async getVerificationStatus(userId: string) {
    const partner = await this.getOrCreatePartner(userId);
    const status = partner.verification_status;

    const titleMap: Record<string, string> = {
      DRAFT: 'Application Draft',
      SUBMITTED: 'Submitted',
      UNDER_REVIEW: 'Under Review',
      ACTION_REQUIRED: 'Action Required',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
      SUSPENDED: 'Suspended',
    };

    const getStepStatus = (step: number) => {
      if (['APPROVED', 'UNDER_REVIEW', 'ACTION_REQUIRED', 'SUBMITTED'].includes(status)) {
        if (step <= 2) return 'COMPLETED';
        if (step === 3) return status === 'APPROVED' ? 'COMPLETED' : 'ACTIVE';
        return status === 'APPROVED' ? 'COMPLETED' : 'PENDING';
      }
      return step === 1 ? 'ACTIVE' : 'PENDING';
    };

    return {
      verificationStatus: status,
      statusTitle: titleMap[status] || status,
      statusSubtitle: status === 'UNDER_REVIEW' ? 'Estimated time: 24-48 hours' : null,
      rejectionReason: partner.rejection_reason || null,
      progressSteps: [
        { step: 1, title: 'Business Details', subtitle: 'Basic business info provided', status: getStepStatus(1) },
        { step: 2, title: 'Documents Submitted', subtitle: 'Operator credentials uploaded', status: getStepStatus(2) },
        { step: 3, title: 'Verification in Progress', subtitle: 'Our team is reviewing your profile', status: getStepStatus(3) },
        { step: 4, title: 'Partner Approval', subtitle: 'Access full dashboard features', status: getStepStatus(4) },
      ],
    };
  }
}
