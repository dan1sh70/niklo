import { Injectable, NotFoundException, OnApplicationBootstrap, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hotel, StayType } from './entities/hotel.entity';
import { Review } from './entities/review.entity';
import { RoomType } from './entities/room-type.entity';
import { PartnerOffer } from './entities/partner-offer.entity';
import { PartnerReviewReply } from './entities/partner-review-reply.entity';

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
  ) {}

  async onApplicationBootstrap() {
    const count = await this.hotelRepository.count();
    if (count === 0) {
      const hotel = this.hotelRepository.create({
        id: 'htl_goa_091',
        title: 'Taj Exotica Resort & Spa, Goa',
        stay_type: StayType.RESORT,
        city: 'Goa',
        address: 'Benaulim Beach, South Goa',
        latitude: 15.2559,
        longitude: 73.9216,
        star_rating: 5,
        user_rating: 4.8,
        rating_text: 'Exceptional',
        reviews_count: 312,
        price_per_night: 8500,
        original_price_per_night: 10000,
        discount_percent: 15,
        badge_text: 'Top Rated',
        distance_text: '500m from Benaulim Beach',
        free_breakfast: true,
        free_wifi: true,
        free_cancellation: true,
        image_url: 'https://cdn.niklo.com/hotels/taj_goa_hero.jpg',
        gallery_images: [
          'https://cdn.niklo.com/hotels/taj_goa_1.jpg',
          'https://cdn.niklo.com/hotels/taj_goa_2.jpg'
        ],
        amenities: [
          { name: 'Free WiFi', icon: 'wifi' },
          { name: 'Swimming Pool', icon: 'pool' }
        ],
        nearby_places: [
          { title: 'Benaulim Beach', distance: '500m' },
          { title: 'Airport', distance: '22km' }
        ],
        features: [
          { title: 'Beachfront Access', icon: 'waves' }
        ],
        house_rules: [
          'Check-in: 2:00 PM',
          'Check-out: 11:00 AM',
          'Govt ID Required'
        ],
        rating_breakdown: {
          cleanliness: 4.8,
          location: 4.9,
          service: 4.7,
          value: 4.6
        },
        description: 'A luxurious five-star resort located in the heart of Goa.',
        is_active: true,
        roomTypes: [
          {
            id: 'rm_deluxe_01',
            title: 'Deluxe Ocean View Room',
            price_per_night: 8500,
            max_guests: 2,
            max_adults: 2,
            max_children: 1,
            available_rooms_count: 5,
            room_size_sqft: 450,
            bed_type: 'King Bed',
            amenities: ['Air Conditioning', 'Flat Screen TV', 'Private Bathroom'],
            images: ['https://cdn.niklo.com/hotels/taj_goa_room1.jpg']
          }
        ]
      });
      await this.hotelRepository.save(hotel);
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
    return {
      destinations: [
        {
          id: 'dest_001',
          name: 'Delhi',
          label: 'Explore',
          imagePath: 'https://cdn.niklo.com/destinations/delhi.jpg',
        },
        {
          id: 'dest_002',
          name: 'Mumbai',
          label: 'Explore',
          imagePath: 'https://cdn.niklo.com/destinations/mumbai.jpg',
        },
      ],
    };
  }

  async getStayTypes() {
    return {
      stayTypes: [
        {
          id: 'type_001',
          label: 'Beach',
          imagePath: 'https://cdn.niklo.com/stay_types/beach.jpg',
        },
        {
          id: 'type_002',
          label: 'Hill Station',
          imagePath: 'https://cdn.niklo.com/stay_types/hills.jpg',
        },
        {
          id: 'type_003',
          label: 'Business',
          imagePath: 'https://cdn.niklo.com/stay_types/business.jpg',
        },
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

  async searchHotels(searchParams: any) {
    const { city, limit = 20, page = 1 } = searchParams;
    const query = this.hotelRepository.createQueryBuilder('hotel');

    if (city) {
      query
        .where('hotel.city ILIKE :loc', { loc: `%${city}%` })
        .orWhere('hotel.title ILIKE :loc', { loc: `%${city}%` })
        .orWhere('hotel.address ILIKE :loc', { loc: `%${city}%` });
    }

    const [hotels, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      total,
      page,
      limit,
      hotels: hotels.map((h) => this.mapHotelToDto(h)),
    };
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

    // Calculate nights
    let nightsCount = 1;
    if (checkParams.check_in && checkParams.check_out) {
      const start = new Date(checkParams.check_in);
      const end = new Date(checkParams.check_out);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      nightsCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    }

    const requestedRooms = checkParams.rooms_count || 1;
    const available = roomType.available_rooms_count >= requestedRooms;

    const totalRoomPrice = Number(roomType.price_per_night) * nightsCount * requestedRooms;
    const taxesAndFees = Math.round(totalRoomPrice * 0.12); // 12% tax mock
    const grandTotal = totalRoomPrice + taxesAndFees;

    return {
      hotel_id: hotel.id,
      room_type_id: roomType.id,
      room_title: roomType.title,
      available,
      remaining_rooms: roomType.available_rooms_count,
      nights_count: nightsCount,
      price_per_night: Number(roomType.price_per_night),
      total_room_price: totalRoomPrice,
      taxes_and_fees: taxesAndFees,
      grand_total: grandTotal,
    };
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
        images: rt.images
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
      reviews,
    };
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
