/**
 * Response normalizers for the hotel payloads.
 *
 * Early rows were seeded with plain string arrays (`["Spa", "Pool"]`) while the
 * clients expect objects (`{ name, icon }`). Sending strings makes the Flutter
 * models throw during `fromJson`, so every hotel payload leaving this service is
 * pushed through these helpers. Rows that already hold objects pass through
 * untouched, which keeps both shapes valid in the database.
 */

/** Icon keys the mobile clients know how to render. */
const ICON_KEYWORDS: Array<[RegExp, string]> = [
  [/wifi|internet/i, 'wifi'],
  [/breakfast|meal|restaurant|dining/i, 'free_breakfast'],
  [/pool|swim/i, 'pool'],
  [/spa|massage|wellness/i, 'spa'],
  [/parking|garage|valet/i, 'parking'],
  [/gym|fitness|workout/i, 'gym'],
  [/bed|room|suite/i, 'king_bed'],
  [/tennis|sport|game/i, 'sports_tennis'],
  [/bar|drink|minibar|mini bar|water/i, 'local_drink'],
  [/bath|shower|toilet/i, 'bathroom'],
  [/ac\b|air ?condition|cooling/i, 'ac_unit'],
  [/tv|television|screen|stream/i, 'tv'],
  [/station|metro|airport|park|mall|distance|km/i, 'location_on'],
  [/guest|people|family|staff/i, 'people'],
];

export function guessIcon(label: string): string {
  for (const [pattern, icon] of ICON_KEYWORDS) {
    if (pattern.test(label)) return icon;
  }
  return 'star';
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** `["Spa"]` or `[{ name, icon }]` -> `[{ name, icon }]`. */
export function normalizeAmenities(value: unknown): Array<{
  name: string;
  icon: string;
}> {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => {
    if (isRecord(entry)) {
      const name = String(entry.name ?? entry.label ?? entry.title ?? '');
      return { name, icon: String(entry.icon ?? guessIcon(name)) };
    }
    const name = String(entry ?? '');
    return { name, icon: guessIcon(name) };
  });
}

/** `["MG Road Metro"]` or `[{ name, distance, imagePath }]` -> object form. */
export function normalizeNearbyPlaces(value: unknown): Array<{
  name: string;
  distance: string;
  imagePath: string;
}> {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => {
    if (isRecord(entry)) {
      return {
        name: String(entry.name ?? entry.title ?? ''),
        distance: String(entry.distance ?? ''),
        imagePath: String(entry.imagePath ?? entry.image ?? ''),
      };
    }
    return { name: String(entry ?? ''), distance: '', imagePath: '' };
  });
}

/** `["Garden View"]` or `[{ title, ratingText, description, icon }]`. */
export function normalizeFeatures(value: unknown): Array<{
  title: string;
  ratingText: string;
  description: string;
  icon: string;
}> {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => {
    if (isRecord(entry)) {
      const title = String(entry.title ?? entry.name ?? '');
      return {
        title,
        ratingText: String(entry.ratingText ?? ''),
        description: String(entry.description ?? ''),
        icon: String(entry.icon ?? guessIcon(title)),
      };
    }
    const title = String(entry ?? '');
    return { title, ratingText: '', description: '', icon: guessIcon(title) };
  });
}

/** Room amenities use `{ icon, label }` on the client. */
export function normalizeRoomAmenities(value: unknown): Array<{
  icon: string;
  label: string;
}> {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => {
    if (isRecord(entry)) {
      const label = String(entry.label ?? entry.name ?? entry.title ?? '');
      return { icon: String(entry.icon ?? guessIcon(label)), label };
    }
    const label = String(entry ?? '');
    return { icon: guessIcon(label), label };
  });
}

/**
 * The client requires a non-null cancellation policy object; rows seeded before
 * the column existed hold `null`, so fall back to the property's own
 * free-cancellation flag rather than sending `null` down the wire.
 */
export function normalizeCancellationPolicy(
  value: unknown,
  freeCancellation = false,
): { type: string; description: string; table: any[] } {
  if (isRecord(value)) {
    return {
      type: String(value.type ?? 'non_refundable'),
      description: String(value.description ?? ''),
      table: Array.isArray(value.table) ? value.table : [],
    };
  }
  return freeCancellation
    ? {
        type: 'refundable',
        description: 'Free cancellation up to 24h before check-in',
        table: [],
      }
    : {
        type: 'non_refundable',
        description: 'This booking is not eligible for a refund',
        table: [],
      };
}

export function normalizeRoomType(room: any, freeCancellation = false) {
  if (!room) return room;
  return {
    ...room,
    images: Array.isArray(room.images) ? room.images : [],
    inclusions: Array.isArray(room.inclusions) ? room.inclusions : [],
    amenities: normalizeRoomAmenities(room.amenities),
    cancellationPolicy: normalizeCancellationPolicy(
      room.cancellationPolicy,
      freeCancellation,
    ),
  };
}

/** Normalizes a hotel row (with or without its relations) for the wire. */
export function normalizeHotel(hotel: any) {
  if (!hotel) return hotel;
  return {
    ...hotel,
    galleryImages: Array.isArray(hotel.galleryImages) ? hotel.galleryImages : [],
    popularAmenities: normalizeAmenities(hotel.popularAmenities),
    nearbyPlaces: normalizeNearbyPlaces(hotel.nearbyPlaces),
    features: normalizeFeatures(hotel.features),
    roomTypes: Array.isArray(hotel.roomTypes)
      ? hotel.roomTypes.map((room: any) =>
          normalizeRoomType(room, hotel.freeCancellation),
        )
      : hotel.roomTypes,
  };
}
