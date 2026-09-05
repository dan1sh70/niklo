import { Injectable, UnauthorizedException, NotFoundException, BadRequestException, ConflictException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PackagePartner, VerificationStatus } from './entities/package_partner.entity';
import { PackagePartnerCategory } from './entities/package_partner-category.entity';
import { PackagePartnerLocation } from './entities/package_partner-location.entity';
import { PackagePartnerDocument } from './entities/package_partner-document.entity';
import { PackagePartnerBank } from './entities/package_partner-bank.entity';

const VALID_PARTNER_TYPES = ['activity_provider', 'tour_operator', 'adventure_resort', 'camping_provider', 'water_sports', 'equipment_provider'];
const REQUIRED_DOC_TYPES = ['business_reg', 'govt_id', 'adventure_license', 'safety_cert'];

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
        { id: 'activity_provider', title: 'Adventure Activity Provider', subtitle: 'For direct single/multi-activity hosts', icon: 'explore' },
        { id: 'tour_operator', title: 'Tour Operator', subtitle: 'For customized package tours & guides', icon: 'near_me' },
        { id: 'adventure_resort', title: 'Adventure Resort', subtitle: 'For properties offering stay + sports', icon: 'holiday_village' },
        { id: 'camping_provider', title: 'Camping Provider', subtitle: 'For outdoor tent/glamping sites', icon: 'cabin' },
        { id: 'water_sports', title: 'Water Sports Provider', subtitle: 'For river, sea, and lake operations', icon: 'sailing' },
        { id: 'equipment_provider', title: 'Equipment Provider', subtitle: 'For rental gear & apparel businesses', icon: 'backpack' },
      ],
      categories: [
        { id: 'river_rafting', title: 'River Rafting', imageUrl: 'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=600&q=80' },
        { id: 'paragliding', title: 'Paragliding', imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=600&q=80' },
        { id: 'trekking', title: 'Trekking', imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80' },
        { id: 'camping', title: 'Camping', imageUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&q=80' },
        { id: 'scuba_diving', title: 'Scuba Diving', imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80' },
        { id: 'kayaking', title: 'Kayaking', imageUrl: 'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?auto=format&fit=crop&w=600&q=80' },
      ],
      documentRules: {
        maxFileSizeBytes: 10485760,
        allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'],
        requiredDocumentTypes: REQUIRED_DOC_TYPES,
        optionalDocumentTypes: ['insurance'],
      },
    };
  }

  async getProgress(userId: string) {
    const partner = await this.getOrCreatePartner(userId);
    const categories = await this.categoryRepo.find({ where: { partner_id: partner.id } });
    const location = await this.locationRepo.findOne({ where: { partner_id: partner.id } });
    const uploadedDocs = await this.documentRepo.find({ where: { partner_id: partner.id } });

    const docTypes = ['business_reg', 'govt_id', 'adventure_license', 'safety_cert', 'insurance'];
    const docTitles: Record<string, { title: string; required: boolean }> = {
      business_reg: { title: 'Business Registration', required: true },
      govt_id: { title: 'Government Authorized ID', required: true },
      adventure_license: { title: 'Adventure Operator License', required: true },
      safety_cert: { title: 'Equipment Safety Certificate', required: true },
      insurance: { title: 'Insurance Coverage Proof', required: false },
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
    const REQUIRED_TYPES = ['business_reg', 'govt_id', 'adventure_license', 'safety_cert'];
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

  async deleteDocument(userId: string, docType: string) {
    const partner = await this.getOrCreatePartner(userId);
    await this.documentRepo.delete({ partner_id: partner.id, doc_type: docType });
  }

  async verifyBankDetails(userId: string, dto: { accountName: string; accountNumber: string; ifsc: string }) {
    const partner = await this.getOrCreatePartner(userId);
    
    // Check if bank details already exist
    let bank = await this.bankRepo.findOne({ where: { partner_id: partner.id } });
    if (!bank) {
      bank = this.bankRepo.create({ partner_id: partner.id });
    }
    
    bank.account_holder_name = dto.accountName;
    bank.account_number = dto.accountNumber;
    bank.ifsc_code = dto.ifsc;
    bank.bank_name = 'Mock Bank (Penny Drop)';
    bank.is_verified = true; // Mock penny drop success
    bank.verification_id = 'mock_fund_acc_' + Math.floor(Math.random() * 1000000);
    
    await this.bankRepo.save(bank);
    
    partner.onboarding_step = 'SUBMITTED';
    await this.partnerRepo.save(partner);
    
    return { verified: true, verificationId: bank.verification_id, nextStep: 'SUBMITTED' };
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
