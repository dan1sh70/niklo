import {
  normalizeAmenities,
  normalizeCancellationPolicy,
  normalizeFeatures,
  normalizeHotel,
  normalizeNearbyPlaces,
  normalizeRoomAmenities,
} from './hotel-response.util';

describe('normalizeAmenities', () => {
  it('turns legacy string rows into the object shape clients parse', () => {
    expect(normalizeAmenities(['Spa', 'Pool'])).toEqual([
      { name: 'Spa', icon: 'spa' },
      { name: 'Pool', icon: 'pool' },
    ]);
  });

  it('leaves rows that are already objects intact', () => {
    expect(
      normalizeAmenities([{ name: 'Free WiFi', icon: 'wifi' }]),
    ).toEqual([{ name: 'Free WiFi', icon: 'wifi' }]);
  });

  it('fills in a missing icon from the name', () => {
    expect(normalizeAmenities([{ name: 'Fitness Center' }])).toEqual([
      { name: 'Fitness Center', icon: 'gym' },
    ]);
  });

  it('returns an empty list for a null column', () => {
    expect(normalizeAmenities(null)).toEqual([]);
  });
});

describe('normalizeNearbyPlaces / normalizeFeatures', () => {
  it('expands strings into the full object each client expects', () => {
    expect(normalizeNearbyPlaces(['Cubbon Park'])).toEqual([
      { name: 'Cubbon Park', distance: '', imagePath: '' },
    ]);
    expect(normalizeFeatures(['Garden View'])).toEqual([
      { title: 'Garden View', ratingText: '', description: '', icon: 'star' },
    ]);
  });
});

describe('normalizeRoomAmenities', () => {
  it('maps strings onto the {icon, label} shape', () => {
    expect(normalizeRoomAmenities(['King Bed', 'Smart TV'])).toEqual([
      { icon: 'king_bed', label: 'King Bed' },
      { icon: 'tv', label: 'Smart TV' },
    ]);
  });
});

describe('normalizeCancellationPolicy', () => {
  it('derives a policy when the column is null', () => {
    expect(normalizeCancellationPolicy(null, true).type).toBe('refundable');
    expect(normalizeCancellationPolicy(null, false).type).toBe(
      'non_refundable',
    );
  });

  it('keeps a stored policy', () => {
    expect(
      normalizeCancellationPolicy({ type: 'flexible', description: 'x' }),
    ).toEqual({ type: 'flexible', description: 'x', table: [] });
  });
});

describe('normalizeHotel', () => {
  it('normalizes the hotel and its nested rooms in one pass', () => {
    const normalized = normalizeHotel({
      id: 'h1',
      freeCancellation: true,
      galleryImages: null,
      popularAmenities: ['Bar'],
      nearbyPlaces: ['MG Road Metro Station'],
      features: ['Fine Dining'],
      roomTypes: [{ id: 'r1', amenities: ['AC'], cancellationPolicy: null }],
    });

    expect(normalized.galleryImages).toEqual([]);
    expect(normalized.popularAmenities).toEqual([
      { name: 'Bar', icon: 'local_drink' },
    ]);
    expect(normalized.nearbyPlaces[0].name).toBe('MG Road Metro Station');
    expect(normalized.features[0].title).toBe('Fine Dining');
    expect(normalized.roomTypes[0].amenities).toEqual([
      { icon: 'ac_unit', label: 'AC' },
    ]);
    expect(normalized.roomTypes[0].cancellationPolicy.type).toBe('refundable');
  });

  it('passes a hotel with no relations through untouched', () => {
    expect(normalizeHotel(null)).toBeNull();
  });
});
