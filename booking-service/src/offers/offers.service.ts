import { Injectable, NotFoundException, BadRequestException, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Coupon } from './entities/coupon.entity';

@Injectable()
export class OffersService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepo: Repository<Coupon>,
  ) {}

  async onApplicationBootstrap() {
    const count = await this.couponRepo.count();
    if (count === 0) {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 90);

      const defaultCoupons = [
        this.couponRepo.create({
          code: 'NIKLOBUS',
          title: 'Flat 15% OFF on Bus Bookings',
          description: 'Save up to ₹200 on intercity bus bookings',
          discount_type: 'PERCENTAGE',
          discount_value: 15,
          min_order_amount: 500,
          max_discount_amount: 200,
          applicable_category: 'BUS',
          valid_until: validUntil,
        }),
        this.couponRepo.create({
          code: 'STAYNIKLO',
          title: 'Flat ₹500 OFF on Luxury Hotels',
          description: 'Flat ₹500 discount on hotel stays above ₹2000',
          discount_type: 'FLAT',
          discount_value: 500,
          min_order_amount: 2000,
          applicable_category: 'HOTEL',
          valid_until: validUntil,
        }),
        this.couponRepo.create({
          code: 'NIKLOFLY',
          title: 'Flat 10% OFF on Packages',
          description: 'Enjoy 10% discount on holiday packages',
          discount_type: 'PERCENTAGE',
          discount_value: 10,
          min_order_amount: 3000,
          applicable_category: 'PACKAGE',
          valid_until: validUntil,
        }),
        this.couponRepo.create({
          code: 'ROADTRIP',
          title: 'Flat 20% OFF on Outstation Cabs',
          description: 'Get 20% discount on outstation rides',
          discount_type: 'PERCENTAGE',
          discount_value: 20,
          min_order_amount: 800,
          applicable_category: 'CAR',
          valid_until: validUntil,
        })
      ];
      await this.couponRepo.save(defaultCoupons);
    }
  }

  async getOffers(category?: string) {
    const where: any = { is_active: true, valid_until: MoreThanOrEqual(new Date()) };
    if (category) {
      where.applicable_category = category;
    }
    
    const offers = await this.couponRepo.find({ where });
    return offers.map(o => ({
      code: o.code,
      title: o.title,
      discount_type: o.discount_type,
      discount_value: Number(o.discount_value),
      min_order_amount: Number(o.min_order_amount),
      max_discount_amount: o.max_discount_amount ? Number(o.max_discount_amount) : null,
      valid_until: o.valid_until,
    }));
  }

  async validateOffer(body: any) {
    const { code, category, order_amount } = body;
    const coupon = await this.couponRepo.findOne({ where: { code } });

    if (!coupon) throw new NotFoundException('Invalid coupon code');
    if (!coupon.is_active || new Date() > coupon.valid_until) {
      throw new BadRequestException('Coupon has expired or is inactive');
    }
    if (coupon.applicable_category !== 'ALL' && coupon.applicable_category !== category) {
      throw new BadRequestException(`Coupon is only applicable for ${coupon.applicable_category} bookings`);
    }
    if (order_amount < Number(coupon.min_order_amount)) {
      throw new BadRequestException(`Minimum order amount of ₹${coupon.min_order_amount} required`);
    }

    let discount_amount = 0;
    if (coupon.discount_type === 'FLAT') {
      discount_amount = Number(coupon.discount_value);
    } else {
      discount_amount = order_amount * (Number(coupon.discount_value) / 100);
      if (coupon.max_discount_amount) {
        discount_amount = Math.min(discount_amount, Number(coupon.max_discount_amount));
      }
    }

    // Update used count logic would typically happen on successful payment, not just validation
    
    return {
      valid: true,
      code: coupon.code,
      discount_amount,
      final_amount: order_amount - discount_amount,
      message: `Coupon ${coupon.code} applied successfully!`,
    };
  }
}
