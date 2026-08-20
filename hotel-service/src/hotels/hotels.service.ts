import { Injectable, NotFoundException, OnApplicationBootstrap, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hotel, StayType } from './entities/hotel.entity';
import { Review } from './entities/review.entity';
import { RoomType } from './entities/room-type.entity';
import { PartnerOffer } from './entities/partner-offer.entity';
import { PartnerReviewReply } from './entities/partner-review-reply.entity';
import { Booking } from '../bookings/entities/booking.entity';

@Injectable()
export class HotelsService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Hotel)
    private readonly hotelRepository: Repository<Hotel>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(RoomType)
    private readonly roomRepository: Repository<RoomType>,
    @InjectRepository(PartnerOffer)
    private readonly offerRepository: Repository<PartnerOffer>,
    @InjectRepository(PartnerReviewReply)
    private readonly replyRepository: Repository<PartnerReviewReply>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  async onApplicationBootstrap() {
    const count = await this.hotelRepository.count();
    if (count === 0) {
      const seedHotels = [
        {
          id: 'htl_kolkata_001', title: 'The Lalit Great Eastern Kolkata',
          stay_type: StayType.HOTEL,
          city: 'Kolkata', address: '1-2 Old Court House St, Dalhousie, Kolkata',
          latitude: 22.5694, longitude: 88.3522, star_rating: 5, user_rating: 4.6,
          rating_text: 'Excellent', reviews_count: 1234,
          price_per_night: 6500, original_price_per_night: 8000, discount_percent: 18,
          badge_text: 'Bestseller', distance_text: '1.2 km from city center',
          free_breakfast: true, free_wifi: true, free_cancellation: true,
          image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop',
          gallery_images: [
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop',
          ],
          amenities: [
            { name: 'Free Wi-Fi', icon: 'wifi' }, { name: 'Free Breakfast', icon: 'free_breakfast' },
            { name: 'Swimming Pool', icon: 'pool' }, { name: 'Spa', icon: 'spa' },
            { name: 'Parking', icon: 'local_parking' }, { name: 'Gym', icon: 'fitness_center' },
          ],
          nearby_places: [
            { title: 'Victoria Memorial', distance: '1.8 km' },
            { title: 'Park Street', distance: '2.2 km' },
          ],
          features: [{ title: 'Excellent Location', ratingText: 'Guests rated 4.7/5', description: '1.2 km from city center', icon: 'location_on' }],
          house_rules: ['Check-in: 2:00 PM', 'Check-out: 11:00 AM', 'Govt ID Required'],
          rating_breakdown: { cleanliness: 4.7, location: 4.8, service: 4.6, value: 4.5 },
          description: 'The Lalit Great Eastern Kolkata blends heritage charm with modern luxury...',
          is_active: true,
          roomTypes: [{
            id: 'rm_deluxe_01', title: 'Deluxe Ocean View Room', price_per_night: 6500,
            max_guests: 2, max_adults: 2, max_children: 1, available_rooms_count: 5,
            room_size_sqft: 450, bed_type: 'King Bed', amenities: ['AC', 'TV'], images: []
          }]
        },
        {
          id: 'htl_goa_002', title: 'Taj Exotica Resort & Spa, Goa',
          stay_type: StayType.RESORT,
          city: 'Goa', address: 'Benaulim Beach, South Goa',
          latitude: 15.2559, longitude: 73.9216, star_rating: 5, user_rating: 4.8,
          rating_text: 'Exceptional', reviews_count: 312,
          price_per_night: 8500, original_price_per_night: 10000, discount_percent: 15,
          badge_text: 'Top Rated', distance_text: '500m from Benaulim Beach',
          free_breakfast: true, free_wifi: true, free_cancellation: false,
          image_url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&auto=format&fit=crop',
          gallery_images: [
            'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=600&auto=format&fit=crop',
          ],
          amenities: [{ name: 'Free Wi-Fi', icon: 'wifi' }, { name: 'Pool', icon: 'pool' }],
          nearby_places: [{ title: 'Benaulim Beach', distance: '500m' }],
          features: [], house_rules: ['Check-in: 3:00 PM', 'No pets'],
          rating_breakdown: { cleanliness: 4.9, location: 4.9, service: 4.8, value: 4.5 },
          description: 'Luxury five-star resort on the shores of Goa.',
          is_active: true,
          roomTypes: [{
            id: 'rm_deluxe_02', title: 'Luxury Villa', price_per_night: 8500,
            max_guests: 2, max_adults: 2, max_children: 1, available_rooms_count: 2,
            room_size_sqft: 600, bed_type: 'King Bed', amenities: ['AC', 'Pool'], images: []
          }]
        }
      ];
      for (const h of seedHotels) {
        await this.hotelRepository.save(this.hotelRepository.create(h));
      }
      console.log('Seeded hotels mock data successfully.');
    }
  }

  // Mapper to transform database entity to Flutter expected DTO
  private mapHotelToDto(h: Hotel) {
    return {
      id: h.id,
      hotelName: h.title,
      title: h.title,
      stay_type: h.stay_type,
      city: h.city,
      address: h.address,
      latitude: h.latitude,
      longitude: h.longitude,
      star_rating: h.star_rating,
      ratingValue: Number(h.user_rating),
      ratingText: h.rating_text,
      reviewsCount: h.reviews_count,
      priceInt: Number(h.price_per_night),
      price_per_night: Number(h.price_per_night),
      priceText: `₹${Number(h.price_per_night).toLocaleString()}/night`,
      badgeText: h.badge_text,
      distanceText: h.distance_text,
      freeBreakfast: h.free_breakfast,
      freeWifi: h.free_wifi,
      freeCancellation: h.free_cancellation,
      imagePath: h.image_url,
      galleryImages: h.gallery_images,
      popularAmenities: h.amenities,
      nearbyPlaces: h.nearby_places,
      features: h.features,
      rules: h.house_rules,
      ratingBreakdown: h.rating_breakdown,
      description: h.description,
    };
  }

  async getPopularDestinations() {
    const imageMap: Record<string, string> = {
      'Goa':     'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop',
      'Manali':  'https://images.unsplash.com/photo-1593181629936-11c609b8db9b?w=500&auto=format&fit=crop',
      'Andaman': 'https://images.unsplash.com/photo-1586359716568-3e1907e4cf9f?w=500&auto=format&fit=crop',
      'Kashmir': 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=500&auto=format&fit=crop',
      'Kolkata': 'https://images.unsplash.com/photo-1558431382-27e303142255?w=500&auto=format&fit=crop',
      'Jaipur':  'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=500&auto=format&fit=crop',
      'Delhi':   'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=500&auto=format&fit=crop',
      'Mumbai':  'https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=500&auto=format&fit=crop',
    };
    const cities = await this.hotelRepository.createQueryBuilder('hotel')
      .select('DISTINCT hotel.city', 'city').where('hotel.is_active = true')
      .limit(8).getRawMany();
    return {
      destinations: cities.map((c, i) => ({
        id: `dest_${i+1}`, name: c.city, label: 'Explore',
        imagePath: imageMap[c.city] || 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=500&auto=format&fit=crop',
      })),
    };
  }

  async getStayTypes() {
    return {
      stayTypes: [
        { id: 'type_001', label: 'Hotels',     imagePath: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&auto=format&fit=crop' },
        { id: 'type_002', label: 'Resorts',    imagePath: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=300&auto=format&fit=crop' },
        { id: 'type_003', label: 'Villas',     imagePath: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=300&auto=format&fit=crop' },
        { id: 'type_004', label: 'Apartments', imagePath: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300&auto=format&fit=crop' },
        { id: 'type_005', label: 'Homestays',  imagePath: 'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=300&auto=format&fit=crop' },
      ],
    };
  }

  async getTrendingHotels(limit: number) {
    const hotels = await this.hotelRepository.find({
      take: limit,
      order: { user_rating: 'DESC' },
    });
    return hotels.map((h) => this.mapHotelToDto(h));
  }

  async getActivePromotions() {
    return {
      offer: {
        id: 'promo_001',
        title: 'Exclusive Members Offer',
        description: 'Save up to 30% on select hotels this weekend!',
        cta: 'Grab Deal',
        imagePath: 'https://cdn.niklo.com/promos/exclusive_banner.jpg',
        expiresAt: '2025-12-31T23:59:59Z',
      },
    };
  }

  async getPopularCities() {
    return {
      cities: ['Bangalore', 'Mumbai', 'Delhi', 'Goa', 'Kolkata'],
    };
  }

  async searchHotels(params: any) {
    const { location, city, filters = {}, limit = 20, page = 1 } = params;
    const loc = location || city || '';
    const query = this.hotelRepository.createQueryBuilder('hotel')
      .where('hotel.is_active = true');

    if (loc) {
      query.andWhere('(hotel.city ILIKE :loc OR hotel.title ILIKE :loc OR hotel.address ILIKE :loc)', { loc: `%${loc}%` });
    }

    const category = filters.selectedCategory;
    if (category === 'Budget')    query.andWhere('hotel.price_per_night < :max', { max: 5000 });
    if (category === 'Luxury')    query.andWhere('hotel.price_per_night >= :min', { min: 7000 });
    if (category === 'Mid-Range') query.andWhere('hotel.price_per_night BETWEEN :a AND :b', { a: 3000, b: 7000 });

    if (filters.isHourly === 'true' || filters.isHourly === true) {
      query.andWhere('hotel.is_hourly = true');
    }
    
    if (filters.isTrending === 'true' || filters.isTrending === true) {
      query.andWhere('hotel.is_trending = true');
    }

    const ratingF = filters.ratingFilter;
    if (ratingF === '5 Star')         query.andWhere('hotel.user_rating >= :r', { r: 4.7 });
    if (ratingF === '4 Star & above') query.andWhere('hotel.user_rating >= :r', { r: 4.0 });
    if (ratingF === '3 Star & above') query.andWhere('hotel.user_rating >= :r', { r: 3.0 });

    const amenityF = filters.amenityFilter;
    if (amenityF === 'Free WiFi')           query.andWhere('hotel.free_wifi = true');
    if (amenityF === 'Breakfast Included')  query.andWhere('hotel.free_breakfast = true');
    if (amenityF === 'Free Cancellation')   query.andWhere('hotel.free_cancellation = true');

    const priceF = filters.priceFilter;
    if (priceF === 'Low to High')  query.orderBy('hotel.price_per_night', 'ASC');
    else if (priceF === 'High to Low') query.orderBy('hotel.price_per_night', 'DESC');
    else query.orderBy('hotel.user_rating', 'DESC');

    const [hotels, total] = await query.skip((page-1)*limit).take(Math.min(limit,50)).getManyAndCount();
    return { total, page, limit, hotels: hotels.map(h => this.mapHotelToDto(h)) };
  }

  async checkAvailability(hotelId: string, checkParams: any) {
    const hotel = await this.hotelRepository.findOne({
      where: { id: hotelId },
      relations: { roomTypes: true },
    });

    if (!hotel) {
      throw new NotFoundException(`Hotel with ID ${hotelId} was not found.`);
    }

    // Determine the room type to check, or default to the first one
    const roomType = checkParams.room_type_id
      ? hotel.roomTypes.find(rt => rt.id === checkParams.room_type_id)
      : hotel.roomTypes[0];

    if (!roomType) {
      throw new NotFoundException(`Room type not found in hotel ${hotelId}.`);
    }

    // Calculate nights or hours
    let nightsCount = 1;
    let isHourly = checkParams.is_hourly === true || checkParams.is_hourly === 'true';
    let hoursCount = checkParams.hours ? parseInt(checkParams.hours, 10) : 3;

    if (!isHourly && checkParams.check_in && checkParams.check_out) {
      const start = new Date(checkParams.check_in);
      const end = new Date(checkParams.check_out);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      nightsCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    }

    const existingBookings = await this.bookingRepository
      .createQueryBuilder('b')
      .where('b.hotelId = :hotelId', { hotelId })
      .andWhere('b.roomTypeId = :rtId', { rtId: roomType.id })
      .andWhere('b.status NOT IN (:...statuses)', { statuses: ['cancelled', 'pending_payment'] })
      .andWhere('b.checkInDate < :checkOut', { checkOut: checkParams.check_out || checkParams.check_in })
      .andWhere('b.checkOutDate > :checkIn',  { checkIn:  checkParams.check_in })
      .getCount();

    const availableCount = Math.max(0, roomType.available_rooms_count - existingBookings);
    const requestedRooms = checkParams.rooms_count || 1;
    const available = availableCount >= requestedRooms;

    let baseRate = Number(roomType.price_per_night);
    // Rough estimate for hourly rates: 35% of nightly rate for short stays
    if (isHourly) {
        baseRate = Math.round(baseRate * 0.35);
    }
    
    const totalRoomPrice = isHourly ? baseRate * requestedRooms : baseRate * nightsCount * requestedRooms;
    const taxesAndFees = Math.round(totalRoomPrice * 0.12); // 12% tax mock
    const grandTotal = totalRoomPrice + taxesAndFees;

    return {
      hotel_id: hotel.id,
      room_type_id: roomType.id,
      room_title: roomType.title,
      available,
      remaining_rooms: roomType.available_rooms_count,
      nights_count: isHourly ? 0 : nightsCount,
      hours_count: isHourly ? hoursCount : 0,
      price_per_night: baseRate,
      total_room_price: totalRoomPrice,
      taxes_and_fees: taxesAndFees,
      grand_total: grandTotal,
    };
  }

  async confirmRooms(hotelId: string, params: { check_in: string, rooms_count: number, room_type_id?: string }) {
    const hotel = await this.hotelRepository.findOne({
      where: { id: hotelId },
      relations: { roomTypes: true },
    });
    
    if (!hotel) return { success: false, message: 'Hotel not found' };
    
    const roomType = params.room_type_id
      ? hotel.roomTypes.find(rt => rt.id === params.room_type_id)
      : hotel.roomTypes[0];
      
    if (roomType) {
      // In a real system, we'd log the dates in `hotel_availability` or create a booking record in hotel-service
      // For this implementation, the `booking-service` handles the record and checkAvailability counts bookings.
      // So no hard decrement of total inventory is needed here unless it's a permanent reduction.
    }
    return { success: true };
  }

  async getHotelDetails(hotelId: string) {
    const hotel = await this.hotelRepository.findOne({
      where: { id: hotelId },
      relations: { roomTypes: true, reviews: true },
    });

    if (!hotel) {
      throw new NotFoundException(`Hotel with ID ${hotelId} was not found.`);
    }

    const topReviews = hotel.reviews ? hotel.reviews.slice(0, 3) : [];

    return {
      ...this.mapHotelToDto(hotel),
      topReviews,
      guestPhotoCount: hotel.gallery_images ? hotel.gallery_images.length : 0,
      roomTypes: hotel.roomTypes.map(rt => ({
        id: rt.id,
        title: rt.title,
        price_per_night: Number(rt.price_per_night),
        max_guests: rt.max_guests,
        max_adults: rt.max_adults,
        max_children: rt.max_children,
        available_rooms_count: rt.available_rooms_count,
        room_size_sqft: rt.room_size_sqft,
        bed_type: rt.bed_type,
        amenities: rt.amenities,
        images: rt.images,
        meal_plan: rt.meal_plan,
        meal_plan_desc: rt.meal_plan_desc,
        inclusions: rt.inclusions,
        cancellation_policy: rt.cancellation_policy,
      }))
    };
  }

  async getHotelReviews(
    hotelId: string,
    sort: string,
    page: number,
    limit: number,
  ) {
    const [reviews, totalReviews] = await this.reviewRepository.findAndCount({
      where: { hotel: { id: hotelId } },
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    });

    const hotel = await this.hotelRepository.findOne({ where: { id: hotelId } });

    return {
      hotelId,
      ratingBreakdown: hotel?.rating_breakdown || {},
      totalReviews,
      page,
      limit,
      reviews: reviews.map((r) => ({
        id: r.id,
        reviewerName: r.reviewer_name || r.user_name,
        reviewerAvatar: r.user_avatar,
        rating: Number(r.rating),
        title: r.title,
        comment: r.comment,
        propertyReply: r.property_reply,
        date: r.created_at,
      })),
    };
  }

  async submitReview(userId: string, hotelId: string, body: any) {
    const hotel = await this.hotelRepository.findOne({ where: { id: hotelId } });
    if (!hotel) throw new NotFoundException('Hotel not found');

    const review = this.reviewRepository.create({
      hotel,
      user_id: userId,
      user_name: body.reviewerName || 'Anonymous',
      reviewer_name: body.reviewerName || null,
      title: body.title || '',
      rating: body.rating,
      comment: body.comment || '',
    });
    
    await this.reviewRepository.save(review);
    
    // Update hotel average rating and counts
    const newCount = (hotel.reviews_count || 0) + 1;
    const oldTotal = (Number(hotel.user_rating) || 0) * (hotel.reviews_count || 0);
    const newAvg = (oldTotal + body.rating) / newCount;
    
    hotel.reviews_count = newCount;
    hotel.user_rating = Math.round(newAvg * 10) / 10;
    await this.hotelRepository.save(hotel);
    
    return { success: true, message: 'Review submitted successfully' };
  }

  async getHotelPhotos(hotelId: string, page: number, limit: number) {
    const hotel = await this.hotelRepository.findOne({
      where: { id: hotelId },
    });
    if (!hotel) {
      throw new NotFoundException(`Hotel with ID ${hotelId} was not found.`);
    }
    const allPhotos = hotel.gallery_images || [];
    const photos = allPhotos.slice((page - 1) * limit, page * limit);
    return {
      hotelId,
      totalPhotos: allPhotos.length,
      page,
      limit,
      photos,
    };
  }

  async createHotel(createHotelDto: any) {
    const hotel = this.hotelRepository.create(createHotelDto);
    return await this.hotelRepository.save(hotel);
  }

  // --- HOTEL PARTNER PROPERTY MANAGEMENT METHODS --- //

  async getPartnerProperties(partnerId: string) {
    return this.hotelRepository.find({ where: { partnerId } });
  }

  async getHotelRooms(hotelId: string) {
    return this.roomRepository.find({ where: { hotel: { id: hotelId } } });
  }

  async addHotelRoom(hotelId: string, partnerId: string, roomData: any) {
    const hotel = await this.hotelRepository.findOne({ where: { id: hotelId, partnerId } });
    if (!hotel) throw new ForbiddenException('Access denied or hotel not found');

    const room = this.roomRepository.create({ ...roomData, hotel });
    return this.roomRepository.save(room);
  }

  async updateHotelRoom(hotelId: string, roomId: string, partnerId: string, roomData: any) {
    const hotel = await this.hotelRepository.findOne({ where: { id: hotelId, partnerId } });
    if (!hotel) throw new ForbiddenException('Access denied or hotel not found');

    const room = await this.roomRepository.findOne({ where: { id: roomId, hotel: { id: hotelId } } });
    if (!room) throw new NotFoundException('Room not found');

    Object.assign(room, roomData);
    return this.roomRepository.save(room);
  }

  async deleteHotelRoom(hotelId: string, roomId: string, partnerId: string) {
    const hotel = await this.hotelRepository.findOne({ where: { id: hotelId, partnerId } });
    if (!hotel) throw new ForbiddenException('Access denied or hotel not found');

    const room = await this.roomRepository.findOne({ where: { id: roomId, hotel: { id: hotelId } } });
    if (!room) throw new NotFoundException('Room not found');

    await this.roomRepository.remove(room);
    return { success: true, message: 'Room deleted' };
  }

  async getHotelOffers(hotelId: string) {
    return this.offerRepository.find({ where: { hotel: { id: hotelId } } });
  }

  async addHotelOffer(hotelId: string, partnerId: string, offerData: any) {
    const hotel = await this.hotelRepository.findOne({ where: { id: hotelId, partnerId } });
    if (!hotel) throw new ForbiddenException('Access denied or hotel not found');

    const offer = this.offerRepository.create({ ...offerData, hotel });
    return this.offerRepository.save(offer);
  }

  async updateHotelOffer(hotelId: string, offerId: string, partnerId: string, offerData: any) {
    const hotel = await this.hotelRepository.findOne({ where: { id: hotelId, partnerId } });
    if (!hotel) throw new ForbiddenException('Access denied or hotel not found');

    const offer = await this.offerRepository.findOne({ where: { id: offerId, hotel: { id: hotelId } } });
    if (!offer) throw new NotFoundException('Offer not found');

    Object.assign(offer, offerData);
    return this.offerRepository.save(offer);
  }

  async deleteHotelOffer(hotelId: string, offerId: string, partnerId: string) {
    const hotel = await this.hotelRepository.findOne({ where: { id: hotelId, partnerId } });
    if (!hotel) throw new ForbiddenException('Access denied or hotel not found');

    const offer = await this.offerRepository.findOne({ where: { id: offerId, hotel: { id: hotelId } } });
    if (!offer) throw new NotFoundException('Offer not found');

    await this.offerRepository.remove(offer);
    return { success: true, message: 'Offer deleted' };
  }

  async replyToReview(hotelId: string, reviewId: string, partnerId: string, replyData: any) {
    const hotel = await this.hotelRepository.findOne({ where: { id: hotelId, partnerId } });
    if (!hotel) throw new ForbiddenException('Access denied or hotel not found');

    const review = await this.reviewRepository.findOne({ where: { id: reviewId, hotel: { id: hotelId } } });
    if (!review) throw new NotFoundException('Review not found');

    const reply = this.replyRepository.create({
      ...replyData,
      review,
      partnerId,
    });
    return this.replyRepository.save(reply);
  }
}
