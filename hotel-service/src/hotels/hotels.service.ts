import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hotel } from './entities/hotel.entity';
import { Review } from './entities/review.entity';

@Injectable()
export class HotelsService {
  constructor(
    @InjectRepository(Hotel)
    private readonly hotelRepository: Repository<Hotel>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

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
      order: { ratingValue: 'DESC' },
    });
    return hotels.map((h) => ({
      id: h.id,
      hotelName: h.hotelName,
      badgeText: h.badgeText,
      imagePath: h.imagePath,
      ratingValue: h.ratingValue,
      priceInt: h.priceInt,
      priceText: h.priceText,
      distanceText: h.distanceText,
    }));
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
    const { location, limit = 20, page = 1 } = searchParams;
    const query = this.hotelRepository.createQueryBuilder('hotel');

    if (location) {
      query.where('hotel.hotelName ILIKE :loc', { loc: `%${location}%` })
           .orWhere('hotel.address ILIKE :loc', { loc: `%${location}%` });
    }

    const [hotels, totalResults] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      totalResults,
      page,
      limit,
      hotels,
    };
  }

  async getHotelDetails(hotelId: string) {
    const hotel = await this.hotelRepository.findOne({
      where: { id: hotelId },
      relations: ['roomTypes', 'reviews'],
    });

    if (!hotel) {
      throw new NotFoundException(`Hotel with ID ${hotelId} was not found.`);
    }

    const topReviews = hotel.reviews ? hotel.reviews.slice(0, 3) : [];
    
    // Rating breakdown calculation mock
    const ratingBreakdown = {
      overall: hotel.ratingValue,
      label: hotel.ratingText,
      totalRatings: hotel.reviewsCount,
      breakdown: {
        excellent: 0.8,
        veryGood: 0.1,
        average: 0.05,
        poor: 0.03,
        bad: 0.02,
      },
    };

    return {
      ...hotel,
      topReviews,
      ratingBreakdown,
      guestPhotoCount: hotel.galleryImages ? hotel.galleryImages.length : 0,
    };
  }

  async getHotelReviews(hotelId: string, sort: string, page: number, limit: number) {
    const [reviews, totalReviews] = await this.reviewRepository.findAndCount({
      where: { hotel: { id: hotelId } },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' }, // Simplified sort
    });

    return {
      hotelId,
      ratingBreakdown: {
        overall: 4.6,
        label: 'Excellent',
        totalRatings: totalReviews,
        breakdown: {
          excellent: 0.8,
          veryGood: 0.1,
          average: 0.05,
          poor: 0.03,
          bad: 0.02,
        },
      },
      totalReviews,
      page,
      limit,
      reviews,
    };
  }

  async getHotelPhotos(hotelId: string, page: number, limit: number) {
    const hotel = await this.hotelRepository.findOne({ where: { id: hotelId } });
    if (!hotel) {
      throw new NotFoundException(`Hotel with ID ${hotelId} was not found.`);
    }
    const allPhotos = hotel.galleryImages || [];
    const photos = allPhotos.slice((page - 1) * limit, page * limit);
    return {
      hotelId,
      totalPhotos: allPhotos.length,
      page,
      limit,
      photos,
    };
  }
}
