import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Hotel } from '../hotels/entities/hotel.entity';

/**
 * Well-known Indian destinations, offered alongside real property matches so a
 * guest can search a city the platform has no listings in yet without getting
 * an empty box.
 */
const KNOWN_DESTINATIONS: Array<{ name: string; region: string }> = [
  { name: 'Bengaluru', region: 'Karnataka, India' },
  { name: 'Mumbai', region: 'Maharashtra, India' },
  { name: 'New Delhi', region: 'Delhi, India' },
  { name: 'Goa', region: 'Goa, India' },
  { name: 'Jaipur', region: 'Rajasthan, India' },
  { name: 'Kolkata', region: 'West Bengal, India' },
  { name: 'Chennai', region: 'Tamil Nadu, India' },
  { name: 'Hyderabad', region: 'Telangana, India' },
  { name: 'Manali', region: 'Himachal Pradesh, India' },
  { name: 'Shimla', region: 'Himachal Pradesh, India' },
  { name: 'Udaipur', region: 'Rajasthan, India' },
  { name: 'Rishikesh', region: 'Uttarakhand, India' },
  { name: 'Munnar', region: 'Kerala, India' },
  { name: 'Darjeeling', region: 'West Bengal, India' },
  { name: 'Srinagar', region: 'Jammu & Kashmir, India' },
  { name: 'Port Blair', region: 'Andaman & Nicobar, India' },
];

const MAX_SUGGESTIONS = 8;

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Hotel)
    private readonly hotelRepository: Repository<Hotel>,
  ) {}

  /**
   * Suggestions for the destination field.
   *
   * Real properties are matched first (so picking a suggestion leads to actual
   * search results), then destinations that merely look right. Both are matched
   * against the query — this used to return the same two Delhi places whatever
   * the guest typed.
   */
  async autocomplete(query: string, type: string) {
    if (type && type !== 'hotel') {
      return { suggestions: [] };
    }

    const trimmed = (query ?? '').trim();
    if (trimmed.length === 0) {
      // With no query, offer the destinations that actually have listings.
      const hotels = await this.hotelRepository.find({
        where: { isActive: true },
        take: MAX_SUGGESTIONS,
      });
      return {
        suggestions: hotels.map((hotel) => ({
          placeId: `hotel_${hotel.id}`,
          mainText: hotel.hotelName,
          secondaryText: hotel.address,
          type: 'property',
        })),
      };
    }

    const like = `%${trimmed}%`;
    const matches = await this.hotelRepository
      .createQueryBuilder('hotel')
      .where('hotel.isActive = true')
      .andWhere(
        new Brackets((qb) => {
          qb.where('hotel.hotelName ILIKE :like', { like }).orWhere(
            'hotel.address ILIKE :like',
            { like },
          );
        }),
      )
      .take(MAX_SUGGESTIONS)
      .getMany();

    const suggestions = matches.map((hotel) => ({
      placeId: `hotel_${hotel.id}`,
      mainText: hotel.hotelName,
      secondaryText: hotel.address,
      type: 'property',
    }));

    const lower = trimmed.toLowerCase();
    for (const destination of KNOWN_DESTINATIONS) {
      if (suggestions.length >= MAX_SUGGESTIONS) break;
      if (!destination.name.toLowerCase().includes(lower)) continue;
      suggestions.push({
        placeId: `city_${destination.name.toLowerCase().replace(/\s+/g, '_')}`,
        mainText: destination.name,
        secondaryText: destination.region,
        type: 'city',
      });
    }

    return { suggestions };
  }
}
