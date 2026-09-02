import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdventurePackageTier } from './entities/adventure-package-tier.entity';
import { AdventurePackageBenefit } from './entities/adventure-package-benefit.entity';
import { AdventurePartner } from '../setup/entities/adventure-partner.entity';

@Injectable()
export class PackagesPartnerService {
  constructor(
    @InjectRepository(AdventurePackageTier)
    private readonly packageRepo: Repository<AdventurePackageTier>,
    @InjectRepository(AdventurePackageBenefit)
    private readonly benefitRepo: Repository<AdventurePackageBenefit>,
    @InjectRepository(AdventurePartner)
    private readonly partnerRepo: Repository<AdventurePartner>,
  ) {}

  private async resolvePartnerId(userId: string): Promise<string> {
    const partner = await this.partnerRepo.findOne({ where: { user_id: userId } });
    if (!partner) throw new NotFoundException('Partner profile not found.');
    return partner.id;
  }

  async listPackages(userId: string, activityId: string) {
    const partnerId = await this.resolvePartnerId(userId);
    const packages = await this.packageRepo.find({
      where: { partner_id: partnerId, activity_id: activityId, status: 'ACTIVE' },
      relations: { benefits: true },
      order: { price: 'ASC' },
    });

    return packages.map(p => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      discountPercent: Number(p.discount_percent),
      duration: p.duration,
      maxParticipants: p.max_participants,
      description: p.description,
      isPopular: p.is_popular,
      features: {
        photoVideo: p.photo_video,
        pickupDrop: p.pickup_drop,
        mealsRefreshments: p.meals_refreshments,
        equipmentUpgrade: p.equipment_upgrade,
      },
      customBenefits: p.benefits?.map(b => b.benefit_text) || [],
    }));
  }

  async createPackage(userId: string, activityId: string, dto: any) {
    const partnerId = await this.resolvePartnerId(userId);

    const pkg = this.packageRepo.create({
      partner_id: partnerId,
      activity_id: activityId,
      name: dto.name,
      price: dto.price,
      discount_percent: dto.discountPercent || 0,
      duration: dto.duration,
      max_participants: dto.maxParticipants,
      description: dto.description,
      is_popular: dto.isPopular || false,
      photo_video: dto.features?.photoVideo || false,
      pickup_drop: dto.features?.pickupDrop || false,
      meals_refreshments: dto.features?.mealsRefreshments || false,
      equipment_upgrade: dto.features?.equipmentUpgrade || false,
      status: 'ACTIVE',
    });

    const saved = await this.packageRepo.save(pkg);

    if (dto.customBenefits && dto.customBenefits.length > 0) {
      const benefits = dto.customBenefits.map((text: string, index: number) => 
        this.benefitRepo.create({
          package_tier_id: saved.id,
          benefit_text: text,
          display_order: index,
        })
      );
      await this.benefitRepo.save(benefits);
    }

    return { id: saved.id, name: saved.name };
  }

  async updatePackage(userId: string, id: string, dto: any) {
    const partnerId = await this.resolvePartnerId(userId);
    const pkg = await this.packageRepo.findOneBy({ id });
    if (!pkg) throw new NotFoundException('Package not found');
    if (pkg.partner_id !== partnerId) throw new ForbiddenException('PACKAGE_NOT_OWNED');

    const update: any = {};
    if (dto.name) update.name = dto.name;
    if (dto.price !== undefined) update.price = dto.price;
    if (dto.discountPercent !== undefined) update.discount_percent = dto.discountPercent;
    if (dto.duration) update.duration = dto.duration;
    if (dto.maxParticipants !== undefined) update.max_participants = dto.maxParticipants;
    if (dto.description) update.description = dto.description;
    if (dto.isPopular !== undefined) update.is_popular = dto.isPopular;
    
    if (dto.features) {
      if (dto.features.photoVideo !== undefined) update.photo_video = dto.features.photoVideo;
      if (dto.features.pickupDrop !== undefined) update.pickup_drop = dto.features.pickupDrop;
      if (dto.features.mealsRefreshments !== undefined) update.meals_refreshments = dto.features.mealsRefreshments;
      if (dto.features.equipmentUpgrade !== undefined) update.equipment_upgrade = dto.features.equipmentUpgrade;
    }

    await this.packageRepo.update(id, update);

    if (dto.customBenefits) {
      await this.benefitRepo.delete({ package_tier_id: id });
      const benefits = dto.customBenefits.map((text: string, index: number) => 
        this.benefitRepo.create({
          package_tier_id: id,
          benefit_text: text,
          display_order: index,
        })
      );
      await this.benefitRepo.save(benefits);
    }

    return { id, message: 'Package updated successfully' };
  }

  async toggleStatus(userId: string, id: string, status: string) {
    const partnerId = await this.resolvePartnerId(userId);
    const pkg = await this.packageRepo.findOneBy({ id });
    if (!pkg) throw new NotFoundException('Package not found');
    if (pkg.partner_id !== partnerId) throw new ForbiddenException('PACKAGE_NOT_OWNED');

    await this.packageRepo.update(id, { status });
    return { id, status };
  }

  async archivePackage(userId: string, id: string) {
    const partnerId = await this.resolvePartnerId(userId);
    const pkg = await this.packageRepo.findOneBy({ id });
    if (!pkg) throw new NotFoundException('Package not found');
    if (pkg.partner_id !== partnerId) throw new ForbiddenException('PACKAGE_NOT_OWNED');

    await this.packageRepo.update(id, { status: 'ARCHIVED' });
  }
}
