import { Injectable } from '@nestjs/common';

@Injectable()
export class LocationService {
  autocomplete(query: string, type: string) {
    if (type !== 'hotel') {
      return { suggestions: [] };
    }

    // Mock response for autocomplete
    return {
      suggestions: [
        {
          placeId: 'place_001',
          mainText: 'Connaught Place',
          secondaryText: 'New Delhi, India',
        },
        {
          placeId: 'place_002',
          mainText: 'Karol Bagh',
          secondaryText: 'New Delhi, India',
        },
      ],
    };
  }
}
