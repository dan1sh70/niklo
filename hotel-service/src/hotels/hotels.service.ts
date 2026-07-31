import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Brackets, EntityManager, In, Repository } from 'typeorm';
import { Hotel } from './entities/hotel.entity';
import { Review } from './entities/review.entity';
import { RoomType } from './entities/room-type.entity';
import {
  Booking,
  HotelBookingStatus,
} from '../bookings/entities/booking.entity';
import { CreateHotelDto, UpdateHotelDto } from './dto/create-hotel.dto';
import { CreateRoomTypeDto, UpdateRoomTypeDto } from './dto/room-type.dto';
import { SearchHotelsDto } from './dto/search-hotels.dto';
import {
  CreateReviewDto,
  ReplyToReviewDto,
  UpsertOfferDto,
} from './dto/review.dto';
import { normalizeAmenities, normalizeHotel } from './hotel-response.util';

/** Statuses that prove a guest actually stayed (or is due to). */
const REVIEW_ELIGIBLE_STATUSES = [
  HotelBookingStatus.Confirmed,
  HotelBookingStatus.CheckedIn,
  HotelBookingStatus.CheckedOut,
];

/**
 * The id shape `@IsUUID()` accepts, as a POSIX pattern for Postgres.
 *
 * Postgres' own `uuid` type only checks that the value is 32 hex digits, so
 * `11111111-1111-1111-1111-111111111111` stores happily — but class-validator
 * also enforces the RFC-4122 version and variant nibbles, so those same ids are
 * rejected the moment a client sends one back in a booking body. Rows created
 * before this — the demo property that used to be seeded here — carried exactly
 * such an id, which made them impossible to book: `POST /bookings/hotel`
 * answered `400 hotelId must be a UUID`.
 */
const RFC_UUID_PATTERN =
  '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

@Injectable()
export class HotelsService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Hotel)
    private readonly hotelRepository: Repository<Hotel>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(RoomType)
    private readonly roomTypeRepository: Repository<RoomType>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  /**
   * Properties come from partners through `POST /api/v1/hotels`, never from
   * this service — so nothing is seeded here. The one startup task is a repair
   * of rows that already exist.
   *
   * It must not take the service down with it: Nest propagates a rejected
   * bootstrap hook out of `app.listen()`, the process exits, and the container
   * restart-loops. Starting with unrepaired data is the lesser failure.
   */
  async onApplicationBootstrap() {
    await this.runStartupTask('legacy id repair', () => this.repairLegacyIds());
  }

  private async runStartupTask(name: string, task: () => Promise<void>) {
    try {
      await task();
    } catch (err) {
      console.error(`hotel-service ${name} failed; continuing without it.`, err);
    }
  }

  /**
   * Rewrites hotel and room ids that Postgres accepts but `@IsUUID()` does not.
   *
   * Idempotent: rows that already carry an RFC-4122 id are not matched, so this
   * is a no-op on every boot after the first. Bookings reference hotels and
   * rooms by plain string columns rather than by foreign key, so they are
   * repointed here too — otherwise a guest's existing stay would lose its hotel
   * name the moment the property's id changed.
   */
  private async repairLegacyIds() {
    await this.hotelRepository.manager.transaction(async (tx) => {
      const rooms: Array<{ id: string }> = await tx.query(
        `SELECT id::text AS id FROM room_types WHERE id::text !~* $1`,
        [RFC_UUID_PATTERN],
      );
      for (const room of rooms) {
        const nextId = randomUUID();
        await tx.query(`UPDATE room_types SET id = $1 WHERE id = $2`, [
          nextId,
          room.id,
        ]);
        await tx.query(
          `UPDATE bookings SET "roomTypeId" = $1 WHERE "roomTypeId" = $2`,
          [nextId, room.id],
        );
        console.log(`Repaired room type id ${room.id} -> ${nextId}.`);
      }

      const hotels: Array<{ id: string }> = await tx.query(
        `SELECT id::text AS id FROM hotels WHERE id::text !~* $1`,
        [RFC_UUID_PATTERN],
      );
      for (const hotel of hotels) {
        await this.rehomeHotel(tx, hotel.id, randomUUID());
      }
    });
  }

  /**
   * Moves a property to a new id.
   *
   * A plain `UPDATE hotels SET id = ...` cannot work: `room_types` and `reviews`
   * hold a foreign key to the row being renamed, and those constraints are not
   * deferrable. So the row is copied under the new id first, the children are
   * repointed, and only then is the old row dropped — by which time nothing
   * references it and the `ON DELETE CASCADE` has nothing to take with it.
   */
  private async rehomeHotel(tx: EntityManager, oldId: string, nextId: string) {
    const legacy = await tx.findOne(Hotel, { where: { id: oldId } });
    if (!legacy) return;

    // `findOne` above loads no relations, so the spread carries columns only.
    await tx.save(tx.create(Hotel, { ...legacy, id: nextId }));
    await tx.query(`UPDATE room_types SET "hotelId" = $1 WHERE "hotelId" = $2`, [
      nextId,
      oldId,
    ]);
    await tx.query(`UPDATE reviews SET "hotelId" = $1 WHERE "hotelId" = $2`, [
      nextId,
      oldId,
    ]);
    await tx.query(`UPDATE bookings SET "hotelId" = $1 WHERE "hotelId" = $2`, [
      nextId,
      oldId,
    ]);
    await tx.query(`DELETE FROM hotels WHERE id = $1`, [oldId]);
    console.log(`Repaired hotel id ${oldId} -> ${nextId} (${legacy.hotelName}).`);
  }

  // ------------------------------------------------------------- discovery

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

  async getPopularCities() {
    return {
      cities: ['Bangalore', 'Mumbai', 'Delhi', 'Goa', 'Kolkata'],
    };
  }

  async getTrendingHotels(limit: number) {
    const hotels = await this.hotelRepository.find({
      where: { isActive: true },
      take: limit,
      order: { ratingValue: 'DESC' },
    });
    // Trending cards only need the summary fields, but they are still sent
    // through the normalizer so a card and a detail page never disagree.
    return hotels.map((h) => {
      const normalized = normalizeHotel(h);
      return {
        id: normalized.id,
        hotelName: normalized.hotelName,
        badgeText: normalized.badgeText,
        imagePath: normalized.imagePath,
        galleryImages: normalized.galleryImages,
        ratingValue: normalized.ratingValue,
        ratingText: normalized.ratingText,
        reviewsCount: normalized.reviewsCount,
        freeBreakfast: normalized.freeBreakfast,
        freeWifi: normalized.freeWifi,
        freeCancellation: normalized.freeCancellation,
        priceInt: normalized.priceInt,
        priceText: normalized.priceText,
        distanceText: normalized.distanceText,
        description: normalized.description,
        address: normalized.address,
        popularAmenities: normalized.popularAmenities,
        nearbyPlaces: normalized.nearbyPlaces,
        features: normalized.features,
      };
    });
  }

  /** Live partner promotions; `offer` is the one the banner should show. */
  async getActivePromotions() {
    const hotels = await this.hotelRepository.find({
      where: { isActive: true },
    });
    const now = Date.now();

    const offers = hotels.flatMap((hotel) =>
      (Array.isArray(hotel.offers) ? hotel.offers : [])
        .filter((offer: any) => {
          if (offer?.isActive === false) return false;
          if (!offer?.expiresAt) return true;
          const expiry = new Date(offer.expiresAt).getTime();
          return Number.isNaN(expiry) || expiry > now;
        })
        .map((offer: any) => ({
          ...offer,
          hotelId: hotel.id,
          hotelName: hotel.hotelName,
        })),
    );

    return { offer: offers[0] ?? null, offers };
  }

  /**
   * Hotel search.
   *
   * Column-backed filters run in SQL; the amenity chip is matched in memory
   * because amenities are jsonb that may hold either strings or objects.
   * Paging is applied after that match so the total always reflects what the
   * caller can actually page through.
   */
  async searchHotels(dto: SearchHotelsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const filters = dto.filters ?? {};

    const query = this.hotelRepository
      .createQueryBuilder('hotel')
      .where('hotel.isActive = true');

    if (dto.location) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('hotel.hotelName ILIKE :loc', {
            loc: `%${dto.location}%`,
          }).orWhere('hotel.address ILIKE :loc', { loc: `%${dto.location}%` });
        }),
      );
    }

    if (filters.selectedCategory === 'Budget') {
      query.andWhere('hotel.priceInt < :budgetMax', { budgetMax: 5000 });
    } else if (filters.selectedCategory === 'Luxury') {
      query.andWhere('hotel.priceInt >= :luxuryMin', { luxuryMin: 7000 });
    }

    const ratingFloors: Record<string, number> = {
      '5 Star': 4.7,
      '4 Star & above': 4.0,
      '3 Star & above': 3.0,
    };
    const ratingFloor = ratingFloors[filters.ratingFilter ?? ''];
    if (ratingFloor !== undefined) {
      query.andWhere('hotel.ratingValue >= :ratingFloor', { ratingFloor });
    }

    if (filters.priceFilter === 'Under ₹2000') {
      query.andWhere('hotel.priceInt < :priceCap', { priceCap: 2000 });
    } else if (filters.priceFilter === 'Above ₹2000') {
      query.andWhere('hotel.priceInt >= :priceFloor', { priceFloor: 2000 });
    }

    if (filters.amenityFilter === 'Free WiFi') {
      query.andWhere('hotel.freeWifi = true');
    } else if (filters.amenityFilter === 'Breakfast Included') {
      query.andWhere('hotel.freeBreakfast = true');
    }

    if (filters.priceFilter === 'Low to High') {
      query.orderBy('hotel.priceInt', 'ASC');
    } else if (filters.priceFilter === 'High to Low') {
      query.orderBy('hotel.priceInt', 'DESC');
    } else {
      query.orderBy('hotel.ratingValue', 'DESC');
    }

    let hotels = await query.getMany();

    const amenityKeyword =
      filters.amenityFilter === 'Swimming Pool'
        ? 'pool'
        : filters.amenityFilter === 'Gym'
          ? 'gym'
          : null;
    if (amenityKeyword) {
      hotels = hotels.filter((hotel) =>
        normalizeAmenities(hotel.popularAmenities).some((amenity) =>
          amenity.name.toLowerCase().includes(amenityKeyword),
        ),
      );
    }

    const totalResults = hotels.length;
    const paged = hotels.slice((page - 1) * limit, page * limit);

    return {
      totalResults,
      page,
      limit,
      hotels: paged.map((hotel) => normalizeHotel(hotel)),
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

    const reviews = hotel.reviews ?? [];
    const topReviews = [...reviews]
      .sort((a, b) => b.createdAt?.getTime?.() - a.createdAt?.getTime?.())
      .slice(0, 3);

    return {
      ...normalizeHotel(hotel),
      topReviews,
      ratingBreakdown: this.buildRatingBreakdown(hotel, reviews),
      guestPhotoCount: hotel.galleryImages ? hotel.galleryImages.length : 0,
    };
  }

  async getHotelReviews(
    hotelId: string,
    sort: string,
    page: number,
    limit: number,
  ) {
    const order: any =
      sort === 'highest'
        ? { rating: 'DESC' }
        : sort === 'lowest'
          ? { rating: 'ASC' }
          : { createdAt: 'DESC' };

    const [reviews, totalReviews] = await this.reviewRepository.findAndCount({
      where: { hotel: { id: hotelId } },
      skip: (page - 1) * limit,
      take: limit,
      order,
    });

    const hotel = await this.hotelRepository.findOne({
      where: { id: hotelId },
      relations: { reviews: true },
    });

    return {
      hotelId,
      ratingBreakdown: this.buildRatingBreakdown(hotel, hotel?.reviews ?? []),
      totalReviews,
      page,
      limit,
      reviews,
    };
  }

  async getHotelPhotos(hotelId: string, page: number, limit: number) {
    const hotel = await this.hotelRepository.findOne({
      where: { id: hotelId },
      relations: { roomTypes: true },
    });
    if (!hotel) {
      throw new NotFoundException(`Hotel with ID ${hotelId} was not found.`);
    }
    // Room photos belong to the property too, so the gallery includes them.
    const allPhotos = [
      ...(hotel.galleryImages || []),
      ...(hotel.roomTypes || []).flatMap((room) => room.images || []),
    ].filter((photo, index, list) => photo && list.indexOf(photo) === index);

    return {
      hotelId,
      totalPhotos: allPhotos.length,
      page,
      limit,
      photos: allPhotos.slice((page - 1) * limit, page * limit),
    };
  }

  // --------------------------------------------------------- partner: property

  /**
   * Registers a property to the signed-in partner.
   *
   * The optional presentation fields are defaulted rather than demanded, so
   * onboarding can submit as soon as it has a name and an address. `priceInt`
   * is recomputed from the rooms as soon as any are added.
   */
  async createHotel(ownerId: string, dto: CreateHotelDto) {
    const priceInt = dto.priceInt ?? 0;
    const hotel = this.hotelRepository.create({
      ...dto,
      ownerId,
      imagePath: dto.imagePath ?? '',
      galleryImages: dto.galleryImages ?? [],
      description: dto.description ?? '',
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
      ratingValue: dto.ratingValue ?? 0,
      ratingText: dto.ratingText ?? 'New',
      reviewsCount: dto.reviewsCount ?? 0,
      distanceText: dto.distanceText ?? '',
      priceInt,
      priceText:
        dto.priceText ??
        (priceInt > 0 ? `₹${priceInt.toLocaleString('en-IN')}/night` : ''),
      roomTypes: (dto.roomTypes ?? []) as any,
    } as any);
    const saved = await this.hotelRepository.save(hotel);
    await this.refreshHotelPriceFromRooms((saved as any).id);
    return normalizeHotel(
      await this.hotelRepository.findOne({
        where: { id: (saved as any).id },
        relations: { roomTypes: true },
      }),
    );
  }

  /**
   * One-off ownership transfer for properties that predate partner accounts.
   *
   * Guarded by `ADMIN_API_KEY` and disabled outright when that is unset, so it
   * cannot be used to take over someone else's property.
   */
  async transferOwnership(hotelId: string, ownerId: string, adminKey?: string) {
    const expected = process.env.ADMIN_API_KEY;
    if (!expected) {
      throw new ForbiddenException(
        'Ownership transfer is disabled. Set ADMIN_API_KEY to enable it.',
      );
    }
    if (adminKey !== expected) {
      throw new ForbiddenException('Invalid admin key.');
    }

    const hotel = await this.hotelRepository.findOne({
      where: { id: hotelId },
    });
    if (!hotel) {
      throw new NotFoundException(`Hotel with ID ${hotelId} was not found.`);
    }

    hotel.ownerId = ownerId;
    await this.hotelRepository.save(hotel);
    return { hotelId, ownerId, hotelName: hotel.hotelName };
  }

  async updateHotel(ownerId: string, hotelId: string, dto: UpdateHotelDto) {
    const hotel = await this.findOwnedHotel(hotelId, ownerId);
    Object.assign(hotel, dto);
    const saved = await this.hotelRepository.save(hotel);
    return normalizeHotel(saved);
  }

  async getPartnerProperties(ownerId: string) {
    const hotels = await this.hotelRepository.find({
      where: { ownerId },
      relations: { roomTypes: true },
      order: { createdAt: 'DESC' },
    });
    return {
      total: hotels.length,
      properties: hotels.map((hotel) => normalizeHotel(hotel)),
    };
  }

  // ------------------------------------------------------------ partner: rooms

  async listRooms(ownerId: string, hotelId: string) {
    const hotel = await this.findOwnedHotel(hotelId, ownerId, {
      roomTypes: true,
    });
    const rooms = hotel.roomTypes ?? [];
    const roomIds = rooms.map((room) => room.id);

    // Rooms sold today, so the partner sees live occupancy next to inventory.
    const active = roomIds.length
      ? await this.bookingRepository.find({
          where: {
            roomTypeId: In(roomIds),
            status: In([
              HotelBookingStatus.Confirmed,
              HotelBookingStatus.CheckedIn,
            ]),
          },
        })
      : [];

    return {
      hotelId,
      total: rooms.length,
      rooms: rooms.map((room) => ({
        ...room,
        occupiedRooms: active
          .filter((b) => b.roomTypeId === room.id)
          .reduce((sum, b) => sum + b.rooms, 0),
      })),
    };
  }

  async addRoom(ownerId: string, hotelId: string, dto: CreateRoomTypeDto) {
    const hotel = await this.findOwnedHotel(hotelId, ownerId);
    const room = this.roomTypeRepository.create({
      ...dto,
      hotel,
      images: dto.images ?? [],
      inclusions: dto.inclusions ?? [],
      amenities: dto.amenities ?? [],
      imageCount: dto.imageCount ?? (dto.images?.length ?? 0),
      size: dto.size ?? '',
      mealPlan: dto.mealPlan ?? 'Room Only',
      mealPlanDesc: dto.mealPlanDesc ?? 'No meals included',
      taxes: dto.taxes ?? '₹0 taxes & fees',
      totalRooms: dto.totalRooms ?? 1,
    } as any);
    const saved = await this.roomTypeRepository.save(room);
    await this.refreshHotelPriceFromRooms(hotelId);
    return saved;
  }

  async updateRoom(
    ownerId: string,
    hotelId: string,
    roomId: string,
    dto: UpdateRoomTypeDto,
  ) {
    await this.findOwnedHotel(hotelId, ownerId);
    const room = await this.findRoomInHotel(roomId, hotelId);
    Object.assign(room, dto);
    const saved = await this.roomTypeRepository.save(room);
    await this.refreshHotelPriceFromRooms(hotelId);
    return saved;
  }

  /**
   * Rooms with live bookings are deactivated rather than deleted, so existing
   * guests keep a record of what they booked.
   */
  async removeRoom(ownerId: string, hotelId: string, roomId: string) {
    await this.findOwnedHotel(hotelId, ownerId);
    const room = await this.findRoomInHotel(roomId, hotelId);

    const liveBookings = await this.bookingRepository.count({
      where: {
        roomTypeId: roomId,
        status: In([
          HotelBookingStatus.PendingPayment,
          HotelBookingStatus.Confirmed,
          HotelBookingStatus.CheckedIn,
        ]),
      },
    });

    if (liveBookings > 0) {
      room.isActive = false;
      await this.roomTypeRepository.save(room);
      await this.refreshHotelPriceFromRooms(hotelId);
      return {
        deleted: false,
        deactivated: true,
        message: `Room kept but taken off sale — ${liveBookings} live booking(s) reference it.`,
      };
    }

    await this.roomTypeRepository.remove(room);
    await this.refreshHotelPriceFromRooms(hotelId);
    return { deleted: true, deactivated: false, message: 'Room deleted.' };
  }

  // ---------------------------------------------------------- reviews & offers

  /** Only guests with a real booking at the property can review it. */
  async createReview(userId: string, hotelId: string, dto: CreateReviewDto) {
    const hotel = await this.hotelRepository.findOne({
      where: { id: hotelId },
      relations: { reviews: true },
    });
    if (!hotel) {
      throw new NotFoundException(`Hotel with ID ${hotelId} was not found.`);
    }

    const stayed = await this.bookingRepository.count({
      where: {
        hotelId,
        userId,
        status: In(REVIEW_ELIGIBLE_STATUSES),
      },
    });
    if (stayed === 0) {
      throw new ForbiddenException(
        'Only guests with a booking at this property can review it.',
      );
    }

    const existing = await this.reviewRepository.findOne({
      where: { hotel: { id: hotelId }, userId },
    });
    if (existing) {
      throw new ConflictException('You have already reviewed this property.');
    }

    const review = this.reviewRepository.create({
      hotel,
      userId,
      title: dto.title,
      reviewerName: dto.reviewerName ?? 'Niklo Guest',
      date: new Date().toISOString().split('T')[0],
      rating: dto.rating,
      comment: dto.comment,
      hasPropertyReply: false,
    });
    const saved = await this.reviewRepository.save(review);

    await this.refreshHotelRating(hotelId);
    return saved;
  }

  async replyToReview(
    ownerId: string,
    hotelId: string,
    reviewId: string,
    dto: ReplyToReviewDto,
  ) {
    await this.findOwnedHotel(hotelId, ownerId);
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId, hotel: { id: hotelId } },
    });
    if (!review) {
      throw new NotFoundException(`Review ${reviewId} was not found.`);
    }
    review.propertyReply = dto.reply;
    review.hasPropertyReply = true;
    review.repliedAt = new Date();
    return this.reviewRepository.save(review);
  }

  async listOffers(ownerId: string, hotelId: string) {
    const hotel = await this.findOwnedHotel(hotelId, ownerId);
    return { hotelId, offers: Array.isArray(hotel.offers) ? hotel.offers : [] };
  }

  async addOffer(ownerId: string, hotelId: string, dto: UpsertOfferDto) {
    const hotel = await this.findOwnedHotel(hotelId, ownerId);
    const offers = Array.isArray(hotel.offers) ? hotel.offers : [];
    const offer = {
      id: `offer_${Date.now().toString(36)}`,
      title: dto.title,
      description: dto.description ?? '',
      cta: dto.cta ?? 'Grab Deal',
      imagePath: dto.imagePath ?? '',
      discountPercent: dto.discountPercent ?? 0,
      expiresAt: dto.expiresAt ?? null,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    hotel.offers = [...offers, offer];
    await this.hotelRepository.save(hotel);
    return offer;
  }

  async removeOffer(ownerId: string, hotelId: string, offerId: string) {
    const hotel = await this.findOwnedHotel(hotelId, ownerId);
    const offers = Array.isArray(hotel.offers) ? hotel.offers : [];
    const remaining = offers.filter((offer: any) => offer?.id !== offerId);
    if (remaining.length === offers.length) {
      throw new NotFoundException(`Offer ${offerId} was not found.`);
    }
    hotel.offers = remaining;
    await this.hotelRepository.save(hotel);
    return { removed: true, offerId };
  }

  // ------------------------------------------------------------------ helpers

  private async findOwnedHotel(
    hotelId: string,
    ownerId: string,
    relations?: any,
  ): Promise<Hotel> {
    const hotel = await this.hotelRepository.findOne({
      where: { id: hotelId },
      relations,
    });
    if (!hotel) {
      throw new NotFoundException(`Hotel with ID ${hotelId} was not found.`);
    }
    if (hotel.ownerId !== ownerId) {
      throw new ForbiddenException('You do not manage this property.');
    }
    return hotel;
  }

  private async findRoomInHotel(
    roomId: string,
    hotelId: string,
  ): Promise<RoomType> {
    const room = await this.roomTypeRepository.findOne({
      where: { id: roomId },
      relations: { hotel: true },
    });
    if (!room || room.hotel?.id !== hotelId) {
      throw new NotFoundException(
        `Room ${roomId} was not found on this property.`,
      );
    }
    return room;
  }

  /**
   * Keeps the property's headline rate equal to its cheapest sellable room.
   *
   * The rate lives on the hotel because search and the listing cards read it,
   * but the rooms are what a guest actually pays for — so it is derived rather
   * than typed in twice.
   */
  private async refreshHotelPriceFromRooms(hotelId: string) {
    const rooms = await this.roomTypeRepository
      .createQueryBuilder('room')
      .leftJoin('room.hotel', 'hotel')
      .where('hotel.id = :hotelId', { hotelId })
      .andWhere('room.isActive = true')
      .getMany();

    if (rooms.length === 0) return;

    const cheapest = rooms.reduce(
      (min, room) => (room.price < min ? room.price : min),
      rooms[0].price,
    );
    await this.hotelRepository.update(hotelId, {
      priceInt: cheapest,
      priceText: `₹${cheapest.toLocaleString('en-IN')}/night`,
    });
  }

  /** Keeps the denormalized rating on the hotel in step with its reviews. */
  private async refreshHotelRating(hotelId: string) {
    const reviews = await this.reviewRepository.find({
      where: { hotel: { id: hotelId } },
    });
    if (reviews.length === 0) return;

    const average =
      reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    await this.hotelRepository.update(hotelId, {
      ratingValue: Math.round(average * 10) / 10,
      ratingText: this.ratingLabel(average),
      reviewsCount: reviews.length,
    });
  }

  private ratingLabel(rating: number): string {
    if (rating >= 4.7) return 'Exceptional';
    if (rating >= 4.2) return 'Excellent';
    if (rating >= 3.5) return 'Very Good';
    if (rating >= 2.5) return 'Average';
    return 'Poor';
  }

  /**
   * Distribution of ratings. Computed from the real reviews when there are any,
   * so the breakdown bars stop showing an invented split.
   */
  private buildRatingBreakdown(hotel: Hotel | null, reviews: Review[]) {
    const buckets = {
      excellent: 0,
      veryGood: 0,
      average: 0,
      poor: 0,
      bad: 0,
    };

    for (const review of reviews) {
      if (review.rating >= 4.5) buckets.excellent += 1;
      else if (review.rating >= 3.5) buckets.veryGood += 1;
      else if (review.rating >= 2.5) buckets.average += 1;
      else if (review.rating >= 1.5) buckets.poor += 1;
      else buckets.bad += 1;
    }

    const total = reviews.length;
    const share = (count: number) =>
      total === 0 ? 0 : Math.round((count / total) * 100) / 100;

    return {
      overall: hotel?.ratingValue ?? 0,
      label: hotel?.ratingText ?? '',
      totalRatings: total,
      breakdown: {
        excellent: share(buckets.excellent),
        veryGood: share(buckets.veryGood),
        average: share(buckets.average),
        poor: share(buckets.poor),
        bad: share(buckets.bad),
      },
    };
  }
}
