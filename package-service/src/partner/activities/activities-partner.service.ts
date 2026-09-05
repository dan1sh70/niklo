import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PackageActivity } from './entities/adventure-activity.entity';
import { PackageActivityMedia } from './entities/adventure-activity-media.entity';
import { PackageActivityRequirements } from './entities/adventure-activity-requirements.entity';
import { PackageActivityInclusion } from './entities/adventure-activity-inclusion.entity';
import { PackagePartner } from '../setup/entities/package_partner.entity';

const VALID_CATEGORIES = ['Paragliding', 'River Rafting', 'Trekking', 'Camping', 'Scuba Diving', 'Kayaking'];
const VALID_DIFFICULTIES = ['Easy', 'Moderate', 'Challenging', 'Extreme'];
const VALID_STATUSES = ['ACTIVE', 'PAUSED', 'DRAFT'];

@Injectable()
export class ActivitiesPartnerService {
  constructor(
    @InjectRepository(PackageActivity)
    private readonly activityRepo: Repository<PackageActivity>,
    @InjectRepository(PackageActivityMedia)
    private readonly mediaRepo: Repository<PackageActivityMedia>,
    @InjectRepository(PackageActivityRequirements)
    private readonly reqsRepo: Repository<PackageActivityRequirements>,
    @InjectRepository(PackageActivityInclusion)
    private readonly inclusionRepo: Repository<PackageActivityInclusion>,
    @InjectRepository(PackagePartner)
    private readonly partnerRepo: Repository<PackagePartner>,
  ) {}

  private async resolvePartnerId(userId: string): Promise<string> {
    const partner = await this.partnerRepo.findOne({ where: { user_id: userId } });
    if (!partner) throw new NotFoundException('Partner profile not found. Please complete onboarding.');
    return partner.id;
  }

  async listActivities(userId: string, query: any) {
    const partnerId = await this.resolvePartnerId(userId);
    const { status, search, category, page = 1, limit = 20 } = query;

    const qb = this.activityRepo.createQueryBuilder('a')
      .where('a.partner_id = :partnerId', { partnerId });

    if (status && status !== 'ALL') {
      qb.andWhere('a.status = :status', { status });
    }
    if (search) {
      qb.andWhere('(LOWER(a.title) LIKE :search OR LOWER(a.location) LIKE :search)', { search: `%${search.toLowerCase()}%` });
    }
    if (category) {
      qb.andWhere('a.category = :category', { category });
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, totalItems] = await qb.skip(skip).take(Number(limit)).orderBy('a.created_at', 'DESC').getManyAndCount();

    return {
      activities: items.map((a) => ({
        id: a.id,
        title: a.title,
        location: a.location,
        rating: Number(a.rating),
        reviewsCount: a.reviews_count,
        duration: a.duration,
        pricePerPerson: Number(a.price_per_person),
        imageUrl: a.cover_image_url,
        status: a.status,
        category: a.category,
        difficulty: a.difficulty,
        createdAt: a.created_at,
      })),
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / Number(limit)),
        currentPage: Number(page),
        limit: Number(limit),
      },
    };
  }

  async getActivity(userId: string, id: string) {
    const partnerId = await this.resolvePartnerId(userId);
    const activity = await this.activityRepo.findOne({
      where: { id },
      relations: { media: true, requirements: true, inclusions: true },
    });
    if (!activity) throw new NotFoundException('Activity not found');
    if (activity.partner_id !== partnerId) throw new ForbiddenException('ACTIVITY_NOT_OWNED');

    const gallery = activity.media?.filter((m) => !m.is_cover && m.media_type === 'IMAGE').map((m) => m.media_url) || [];
    const inclusions = activity.inclusions?.filter((i) => i.item_type === 'INCLUSION').map((i) => i.item_name) || [];
    const equipment = activity.inclusions?.filter((i) => i.item_type === 'EQUIPMENT_PROVIDED').map((i) => i.item_name) || [];

    return {
      id: activity.id,
      partnerId: activity.partner_id,
      title: activity.title,
      category: activity.category,
      difficulty: activity.difficulty,
      location: activity.location,
      description: activity.description,
      duration: activity.duration,
      pricePerPerson: Number(activity.price_per_person),
      rating: Number(activity.rating),
      reviewsCount: activity.reviews_count,
      status: activity.status,
      media: {
        coverImageUrl: activity.cover_image_url,
        videoUrl: activity.video_url,
        gallery,
      },
      requirements: activity.requirements ? {
        isAgeRestrictionEnabled: activity.requirements.is_age_restriction_enabled,
        minAge: activity.requirements.min_age,
        maxAge: activity.requirements.max_age,
        isWeightRestrictionEnabled: activity.requirements.is_weight_restriction_enabled,
        minWeightKg: activity.requirements.min_weight_kg,
        maxWeightKg: activity.requirements.max_weight_kg,
        isHeightRestrictionEnabled: activity.requirements.is_height_restriction_enabled,
        minHeightCm: activity.requirements.min_height_cm,
        maxHeightCm: activity.requirements.max_height_cm,
        minGroupSize: activity.requirements.min_group_size,
        maxGroupSize: activity.requirements.max_group_size,
        medicalRestrictions: activity.requirements.medical_restrictions,
        whatToBring: activity.requirements.what_to_bring,
        safetyGuidelines: activity.requirements.safety_guidelines,
      } : null,
      inclusions,
      equipmentProvided: equipment,
      createdAt: activity.created_at,
      updatedAt: activity.updated_at,
    };
  }

  async createActivity(userId: string, dto: any) {
    const partnerId = await this.resolvePartnerId(userId);

    if (!VALID_CATEGORIES.includes(dto.category)) throw new BadRequestException({ errorCode: 'INVALID_CATEGORY', message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` });
    if (dto.difficulty && !VALID_DIFFICULTIES.includes(dto.difficulty)) throw new BadRequestException('Invalid difficulty level');

    const activity = this.activityRepo.create({
      partner_id: partnerId,
      title: dto.title,
      category: dto.category,
      difficulty: dto.difficulty || 'Moderate',
      location: dto.location,
      description: dto.description,
      duration: dto.duration,
      price_per_person: dto.pricePerPerson,
      cover_image_url: dto.coverImageUrl,
      video_url: dto.videoUrl || null,
      status: dto.status || 'DRAFT',
    });
    const saved = await this.activityRepo.save(activity);

    // Gallery media
    if (dto.galleryPhotos?.length) {
      const mediaEntities = dto.galleryPhotos.map((url: string, idx: number) =>
        this.mediaRepo.create({ activity_id: saved.id, media_url: url, media_type: 'IMAGE', display_order: idx }),
      );
      await this.mediaRepo.save(mediaEntities);
    }

    // Requirements
    if (dto.requirements) {
      const reqs = this.reqsRepo.create({ activity_id: saved.id, ...this.mapRequirementsDto(dto.requirements) });
      await this.reqsRepo.save(reqs);
    }

    // Inclusions
    const inclusionEntities: any[] = [];
    (dto.inclusions || []).forEach((item: string) => {
      inclusionEntities.push(this.inclusionRepo.create({ activity_id: saved.id, item_name: item, item_type: 'INCLUSION' }));
    });
    (dto.equipmentProvided || []).forEach((item: string) => {
      inclusionEntities.push(this.inclusionRepo.create({ activity_id: saved.id, item_name: item, item_type: 'EQUIPMENT_PROVIDED' }));
    });
    if (inclusionEntities.length) await this.inclusionRepo.save(inclusionEntities);

    return { id: saved.id, title: saved.title, status: saved.status, createdAt: saved.created_at };
  }

  async updateActivity(userId: string, id: string, dto: any) {
    const partnerId = await this.resolvePartnerId(userId);
    const activity = await this.activityRepo.findOneBy({ id });
    if (!activity) throw new NotFoundException('Activity not found');
    if (activity.partner_id !== partnerId) throw new ForbiddenException('ACTIVITY_NOT_OWNED');

    const updateFields: any = {};
    const fieldMap: Record<string, string> = {
      title: 'title', category: 'category', difficulty: 'difficulty', location: 'location',
      description: 'description', duration: 'duration', pricePerPerson: 'price_per_person',
      coverImageUrl: 'cover_image_url', videoUrl: 'video_url',
    };
    Object.entries(fieldMap).forEach(([dtoKey, dbKey]) => {
      if (dto[dtoKey] !== undefined) updateFields[dbKey] = dto[dtoKey];
    });

    if (Object.keys(updateFields).length) await this.activityRepo.update(id, updateFields);

    if (dto.requirements) {
      const existing = await this.reqsRepo.findOneBy({ activity_id: id });
      if (existing) {
        await this.reqsRepo.update(existing.id, this.mapRequirementsDto(dto.requirements));
      } else {
        await this.reqsRepo.save(this.reqsRepo.create({ activity_id: id, ...this.mapRequirementsDto(dto.requirements) }));
      }
    }

    return { id, updatedAt: new Date().toISOString() };
  }

  async toggleStatus(userId: string, id: string, status: string) {
    if (!VALID_STATUSES.includes(status)) throw new BadRequestException(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
    const partnerId = await this.resolvePartnerId(userId);
    const activity = await this.activityRepo.findOneBy({ id });
    if (!activity) throw new NotFoundException('Activity not found');
    if (activity.partner_id !== partnerId) throw new ForbiddenException('ACTIVITY_NOT_OWNED');
    await this.activityRepo.update(id, { status });
    return { id, status };
  }

  async archiveActivity(userId: string, id: string) {
    const partnerId = await this.resolvePartnerId(userId);
    const activity = await this.activityRepo.findOneBy({ id });
    if (!activity) throw new NotFoundException('Activity not found');
    if (activity.partner_id !== partnerId) throw new ForbiddenException('ACTIVITY_NOT_OWNED');
    await this.activityRepo.update(id, { status: 'ARCHIVED' });
  }

  async uploadMedia(file: Express.Multer.File, isCover: boolean) {
    const url = `https://storage.niklo.com/package-partner/activities/${file.originalname}`;
    return { url, fileSizeBytes: file.size, mimeType: file.mimetype };
  }

  private mapRequirementsDto(dto: any) {
    return {
      is_age_restriction_enabled: dto.isAgeRestrictionEnabled ?? false,
      min_age: dto.minAge ?? null,
      max_age: dto.maxAge ?? null,
      is_weight_restriction_enabled: dto.isWeightRestrictionEnabled ?? false,
      min_weight_kg: dto.minWeightKg ?? null,
      max_weight_kg: dto.maxWeightKg ?? null,
      is_height_restriction_enabled: dto.isHeightRestrictionEnabled ?? false,
      min_height_cm: dto.minHeightCm ?? null,
      max_height_cm: dto.maxHeightCm ?? null,
      min_group_size: dto.minGroupSize ?? 1,
      max_group_size: dto.maxGroupSize ?? 20,
      medical_restrictions: dto.medicalRestrictions ?? [],
      what_to_bring: dto.whatToBring ?? [],
      safety_guidelines: dto.safetyGuidelines ?? null,
    };
  }
}
