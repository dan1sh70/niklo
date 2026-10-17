import { Injectable, OnApplicationBootstrap, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TravelAdventure } from './entities/adventure.entity';
import { AdventureReview } from './entities/adventure-review.entity';
import { AdventureSlot } from './entities/adventure-slot.entity';
import { AdventureActivity } from '../partner/activities/entities/adventure-activity.entity';
import { AdventurePartner } from '../partner/setup/entities/adventure-partner.entity';
import { AdventureTimeSlot } from '../partner/availability/entities/adventure-time-slot.entity';
import { AdventureBooking } from '../partner/bookings/entities/adventure-booking.entity';
import { AdventureBookingParticipant } from '../partner/bookings/entities/adventure-booking-participant.entity';

@Injectable()
export class AdventuresService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(TravelAdventure)
    private readonly adventureRepository: Repository<TravelAdventure>,
    @InjectRepository(AdventureReview)
    private readonly reviewRepository: Repository<AdventureReview>,
    @InjectRepository(AdventureSlot)
    private readonly slotRepository: Repository<AdventureSlot>,
    @InjectRepository(AdventureActivity)
    private readonly activityRepo: Repository<AdventureActivity>,
    @InjectRepository(AdventurePartner)
    private readonly partnerRepo: Repository<AdventurePartner>,
    @InjectRepository(AdventureTimeSlot)
    private readonly timeSlotRepo: Repository<AdventureTimeSlot>,
    @InjectRepository(AdventureBooking)
    private readonly partnerBookingRepo: Repository<AdventureBooking>,
    @InjectRepository(AdventureBookingParticipant)
    private readonly participantRepo: Repository<AdventureBookingParticipant>,
  ) {}

  async createPartnerBookingFromCustomerOrder(data: any) {
    // 1. Locate activity to identify partner owner
    let partnerId: string | null = null;
    const activity = await this.activityRepo.findOne({ where: { id: data.adventure_id } });
    if (activity) {
      partnerId = activity.partner_id;
    } else {
      // Fallback: check legacy adventure table
      const adv = await this.adventureRepository.findOne({ where: { id: data.adventure_id } });
      partnerId = (adv as any)?.partner_id || (adv as any)?.operator_id || null;
    }

    if (!partnerId) {
      // If no partner assigned, query default approved partner or first available
      const defaultPartner = await this.partnerRepo.findOne({ where: { verification_status: 'APPROVED' } }) 
        || await this.partnerRepo.findOne({});
      partnerId = defaultPartner?.id || 'a0000000-0000-0000-0000-000000000001';
    }

    // 2. Increment booked count on slot if exists in partner availability
    try {
      await this.timeSlotRepo.createQueryBuilder()
        .update(AdventureTimeSlot)
        .set({ booked_count: () => `booked_count + ${data.participants_count || 1}` })
        .where('activity_id = :actId AND slot_date = :slotDate AND start_time = :timeSlot', {
          actId: data.adventure_id,
          slotDate: data.slot_date,
          timeSlot: data.time_slot,
        })
        .execute();
    } catch (e: any) {
      // Non-fatal if specific time slot row does not exist yet
    }

    // 3. Create AdventureBooking entity
    const booking = this.partnerBookingRepo.create({
      booking_number: data.booking_reference || `ADV-${Date.now().toString().slice(-6)}`,
      partner_id: partnerId,
      activity_id: data.adventure_id,
      user_id: data.user_id,
      booking_date: data.slot_date,
      time_slot: data.time_slot || '10:00 AM',
      participants_count: data.participants_count || 1,
      customer_name: data.customer_name || 'Adventurer',
      customer_phone: data.customer_phone || '',
      customer_email: data.customer_email || '',
      total_amount: Number(data.total_amount) || 0,
      payment_status: 'PAID',
      status: 'CONFIRMED',
    });
    const savedBooking = await this.partnerBookingRepo.save(booking);

    // 4. Save individual participants
    if (data.passenger_details && Array.isArray(data.passenger_details) && data.passenger_details.length > 0) {
      const participants = data.passenger_details.map((p: any) =>
        this.participantRepo.create({
          booking_id: savedBooking.id,
          full_name: p.name || p.full_name || 'Participant',
          age: Number(p.age) || 25,
          gender: p.gender || 'MALE',
        })
      );
      await this.participantRepo.save(participants);
    } else {
      const defaultParticipant = this.participantRepo.create({
        booking_id: savedBooking.id,
        full_name: data.customer_name || 'Participant',
        age: 25,
        gender: 'ADULT',
      });
      await this.participantRepo.save(defaultParticipant);
    }

    return { success: true, bookingId: savedBooking.id };
  }

  async onApplicationBootstrap() {
    const count = await this.adventureRepository.count();
    if (count === 0) {
      await this.adventureRepository.save([
        {
          id: 'e4d8a1c9-5b23-4f76-88a2-71c18e9d3a01',
          title: 'Grand Island Scuba Diving & Water Sports',
          category: 'Water Sports',
          location: 'Grand Island, Goa',
          city: 'Goa',
          price: 3500.0,
          original_price: 4500.0,
          discount_percent: 22,
          rating: 4.9,
          reviews_count: 284,
          duration_hours: 6,
          difficulty: 'Easy',
          group_size: 'Up to 15 People',
          image_url: 'https://cdn.niklo.com/experiences/scuba_goa.jpg',
          gallery_images: [
            'https://cdn.niklo.com/experiences/scuba_1.jpg',
            'https://cdn.niklo.com/experiences/scuba_2.jpg'
          ],
          description: 'Experience deep sea diving in pristine waters with certified PADI divers.',
          highlights: ['Underwater Photos Included', 'PADI Instructor', 'Boat Ride'],
          whats_included: ['Equipment', 'Snacks', 'Photos'],
          what_to_bring: ['Swimwear', 'Valid ID Proof'],
          meeting_point: 'Malim Jetty, Panaji, Goa',
          latitude: 15.5011,
          longitude: 73.8244,
          is_active: true,
        },
      ]);
      console.log('Seeded adventures mock data successfully.');
    }
  }

  private mapAdventureToDto(a: TravelAdventure) {
    return {
      id: a.id,
      title: a.title,
      category: a.category,
      location: a.location,
      city: a.city,
      price: Number(a.price),
      original_price: Number(a.original_price),
      discount_percent: a.discount_percent,
      rating: Number(a.rating),
      reviews_count: a.reviews_count,
      duration_hours: a.duration_hours,
      duration: `${a.duration_hours} Hours`,
      difficulty: a.difficulty,
      group_size: a.group_size,
      image_url: a.image_url,
      gallery_images: a.gallery_images,
      description: a.description,
      highlights: a.highlights,
      whats_included: a.whats_included,
      what_to_bring: a.what_to_bring,
      meeting_point: a.meeting_point,
      latitude: Number(a.latitude),
      longitude: Number(a.longitude),
    };
  }

  async create(createAdventureDto: any) {
    const adventure = this.adventureRepository.create(
      createAdventureDto as Partial<TravelAdventure>,
    );
    return await this.adventureRepository.save(adventure);
  }

  async findAll(query: any) {
    const { category, location, city, difficulty, is_trending, min_price, max_price, sort_by, page = 1, limit = 20 } = query;
    const qb = this.adventureRepository.createQueryBuilder('adv')
      .where('adv.is_active = :isActive', { isActive: true });

    if (category) {
      qb.andWhere('adv.category = :category', { category });
    }
    if (location) {
      qb.andWhere('adv.location ILIKE :loc', { loc: `%${location}%` });
    }
    if (city) {
      qb.andWhere('adv.city ILIKE :city', { city: `%${city}%` });
    }
    if (difficulty) {
      qb.andWhere('adv.difficulty = :difficulty', { difficulty });
    }
    if (is_trending === 'true') {
      qb.andWhere('adv.is_trending = :isTrending', { isTrending: true });
    }
    if (min_price) {
      qb.andWhere('adv.price >= :minPrice', { minPrice: min_price });
    }
    if (max_price) {
      qb.andWhere('adv.price <= :maxPrice', { maxPrice: max_price });
    }

    if (sort_by === 'price_asc') {
      qb.orderBy('adv.price', 'ASC');
    } else if (sort_by === 'price_desc') {
      qb.orderBy('adv.price', 'DESC');
    } else {
      qb.orderBy('adv.rating', 'DESC');
    }

    const adventures = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return adventures.map(a => this.mapAdventureToDto(a));
  }

  async getCategories() {
    const result = await this.adventureRepository
      .createQueryBuilder('adv')
      .select('adv.category', 'title')
      .addSelect('COUNT(adv.id)', 'count')
      .addSelect('MAX(adv.image_url)', 'imageUrl')
      .where('adv.is_active = :isActive', { isActive: true })
      .groupBy('adv.category')
      .orderBy('"count"', 'DESC')
      .getRawMany();

    return result.map((item, index) => ({
      id: `cat_${index}`,
      title: item.title,
      imageUrl: item.imageUrl,
      count: parseInt(item.count, 10),
    }));
  }

  async getReviews(id: string) {
    const reviews = await this.reviewRepository.find({
      where: { adventure_id: id },
      order: { created_at: 'DESC' },
    });
    
    let avgSafety = 5.0;
    let avgExp = 5.0;
    let avgValue = 5.0;
    let avgOverall = 5.0;
    
    if (reviews.length === 0) {
      const adventure = await this.adventureRepository.findOne({ where: { id } });
      return {
        overview: {
          averageRating: adventure ? Number(adventure.rating) : 5.0,
          totalReviews: adventure ? adventure.reviews_count : 0,
          breakdown: { safety: 5.0, experience: 5.0, value: 5.0 },
        },
        reviews: [],
      };
    }

    avgSafety = reviews.reduce((sum, r) => sum + Number(r.safety_rating), 0) / reviews.length;
    avgExp = reviews.reduce((sum, r) => sum + Number(r.experience_rating), 0) / reviews.length;
    avgValue = reviews.reduce((sum, r) => sum + Number(r.value_rating), 0) / reviews.length;
    avgOverall = reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length;

    return {
      overview: {
        averageRating: Number(avgOverall.toFixed(1)),
        totalReviews: reviews.length,
        breakdown: {
          safety: Number(avgSafety.toFixed(1)),
          experience: Number(avgExp.toFixed(1)),
          value: Number(avgValue.toFixed(1)),
        }
      },
      reviews: reviews.map(r => ({
        id: r.id,
        userName: r.user_name,
        userAvatar: r.user_avatar,
        rating: Number(r.rating),
        comment: r.comment,
        date: r.created_at,
      }))
    };
  }

  async checkAvailability(id: string, checkParams: any) {
    const adventure = await this.adventureRepository.findOne({ where: { id } });
    if (!adventure) {
      throw new NotFoundException(`Adventure with ID ${id} was not found.`);
    }
    
    const requestedDate = new Date(checkParams.date);
    const participants = checkParams.participants || 1;

    // In a real scenario we query adventure_slots for the specific date.
    // If no slot is explicitly generated for the date, we return mock availability based on the rule.
    let slots = await this.slotRepository.find({
      where: { adventure_id: id, slot_date: requestedDate }
    });
    
    if (slots.length === 0) {
      // Mock generated slots for the day if not in DB
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const isValidDate = requestedDate >= startOfToday;
      return {
        adventure_id: id,
        date: checkParams.date,
        available: isValidDate,
        remaining_slots: isValidDate ? 8 : 0,
        price_per_person: Number(adventure.price),
        total_price: Number(adventure.price) * participants,
        time_slots: ["07:30 AM", "10:30 AM", "01:30 PM"]
      };
    }

    const availableSlots = slots.filter(s => s.is_available && (s.total_capacity - s.booked_slots) >= participants);
    
    return {
      adventure_id: id,
      date: checkParams.date,
      available: availableSlots.length > 0,
      remaining_slots: availableSlots.length > 0 ? (availableSlots[0].total_capacity - availableSlots[0].booked_slots) : 0,
      price_per_person: Number(adventure.price),
      total_price: Number(adventure.price) * participants,
      time_slots: availableSlots.map(s => s.time_slot)
    };
  }

  async confirmSlots(id: string, params: { slot_date: string, time_slot: string, participants: number }) {
    const requestedDate = new Date(params.slot_date);
    let slot = await this.slotRepository.findOne({
      where: { adventure_id: id, slot_date: requestedDate, time_slot: params.time_slot }
    });
    
    if (slot) {
      slot.booked_slots += (params.participants || 1);
      if (slot.booked_slots >= slot.total_capacity) {
        slot.is_available = false;
      }
      await this.slotRepository.save(slot);
    }
    return { success: true };
  }

  async findOne(id: string) {
    const adventure = await this.adventureRepository.findOne({ where: { id, is_active: true } });
    if (!adventure) {
      throw new NotFoundException(`Adventure with ID ${id} was not found.`);
    }
    return this.mapAdventureToDto(adventure);
  }

  async createReview(adventureId: string, dto: any) {
    const adventure = await this.adventureRepository.findOne({ where: { id: adventureId } });
    if (!adventure) {
      throw new NotFoundException(`Adventure with ID ${adventureId} not found`);
    }

    const review = this.reviewRepository.create({
      adventure_id: adventureId,
      user_id: dto.user_id,
      user_name: dto.user_name || 'Verified Adventurer',
      user_avatar: dto.user_avatar,
      rating: Number(dto.rating),
      comment: dto.comment,
      safety_rating: dto.safety_rating ?? 5.0,
      experience_rating: dto.experience_rating ?? 5.0,
      value_rating: dto.value_rating ?? 5.0,
    });
    await this.reviewRepository.save(review);

    // Recalculate average rating & total reviews on parent adventure table
    const allReviews = await this.reviewRepository.find({ where: { adventure_id: adventureId } });
    const avg = allReviews.reduce((sum, r) => sum + Number(r.rating), 0) / allReviews.length;

    adventure.rating = Number(avg.toFixed(1));
    adventure.reviews_count = allReviews.length;
    await this.adventureRepository.save(adventure);

    return review;
  }

  async update(id: string, updateAdventureDto: any) {
    await this.adventureRepository.update(id, updateAdventureDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.adventureRepository.delete(id);
    return { message: 'Adventure deleted successfully' };
  }
}
