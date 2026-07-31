import { RideType } from './entities/ride.entity';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface FareQuote {
  fareEstimate: number;
  surgeMultiplier: number;
  distanceKm: number;
  estimatedTimeMins: number;
}

/**
 * Per-vehicle rate card. Figures are placeholders in the same spirit as the
 * rest of the seed data — swap them for the commercial rate card before
 * launch, but note that everything downstream now scales with real distance.
 */
const RATE_CARD: Record<
  RideType,
  {
    baseFare: number;
    perKm: number;
    perMin: number;
    minimumFare: number;
    avgSpeedKmph: number;
  }
> = {
  [RideType.MINI]: {
    baseFare: 40,
    perKm: 11,
    perMin: 1.0,
    minimumFare: 60,
    avgSpeedKmph: 22,
  },
  [RideType.SEDAN]: {
    baseFare: 50,
    perKm: 14,
    perMin: 1.2,
    minimumFare: 80,
    avgSpeedKmph: 22,
  },
  [RideType.SUV]: {
    baseFare: 80,
    perKm: 19,
    perMin: 1.5,
    minimumFare: 120,
    avgSpeedKmph: 21,
  },
  [RideType.PREMIUM]: {
    baseFare: 110,
    perKm: 24,
    perMin: 2.0,
    minimumFare: 180,
    avgSpeedKmph: 22,
  },
  [RideType.OUTSTATION]: {
    baseFare: 250,
    perKm: 13,
    perMin: 0,
    minimumFare: 1200,
    avgSpeedKmph: 50,
  },
  [RideType.HOURLY]: {
    baseFare: 200,
    perKm: 10,
    perMin: 2.5,
    minimumFare: 250,
    avgSpeedKmph: 20,
  },
};

// Straight-line distance under-reports what the car actually drives. 1.35 is a
// common approximation for Indian city road networks. Replace this with a real
// routing/Distance Matrix call when a maps provider is wired up.
const ROAD_DISTANCE_FACTOR = 1.35;

const EARTH_RADIUS_KM = 6371;

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance between two points, in kilometres. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

// Peak windows below are Indian commercial hours, so they have to be read in
// IST regardless of what the container's clock says. Nothing sets `TZ` in
// docker-compose.yaml, so every service runs UTC — `getHours()` put the
// "evening peak" at 22:30-02:30 IST and the morning one at 13:30-16:30.
const IST_OFFSET_MINUTES = 5 * 60 + 30;

/** Hour of the day in IST (0-23), whatever timezone the process runs in. */
export function istHour(date: Date): number {
  const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes();
  return Math.floor((((utcMinutes + IST_OFFSET_MINUTES) % 1440) + 1440) % 1440 / 60);
}

/**
 * Time-of-day surge. Morning and evening peaks only — deliberately simple and
 * deterministic so a quote can be reproduced from its inputs.
 */
export function surgeFor(date = new Date()): number {
  const hour = istHour(date);
  if (hour >= 8 && hour < 11) return 1.3; // morning peak
  if (hour >= 17 && hour < 21) return 1.4; // evening peak
  if (hour >= 23 || hour < 5) return 1.25; // late night
  return 1.0;
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Distance-and-time based quote.
 *
 * Returns `null` when either coordinate is missing or invalid, so callers can
 * decide whether to reject the request rather than quoting a made-up number.
 */
export function quoteFare(
  pickup: LatLng | null,
  drop: LatLng | null,
  rideType: RideType,
  now = new Date(),
): FareQuote | null {
  if (!isValid(pickup) || !isValid(drop)) return null;

  const card = RATE_CARD[rideType] ?? RATE_CARD[RideType.SEDAN];

  const distanceKm = round2(haversineKm(pickup, drop) * ROAD_DISTANCE_FACTOR);
  const estimatedTimeMins = Math.max(
    1,
    Math.round((distanceKm / card.avgSpeedKmph) * 60),
  );

  const surgeMultiplier = surgeFor(now);

  const raw =
    card.baseFare + distanceKm * card.perKm + estimatedTimeMins * card.perMin;

  const fareEstimate = round2(
    Math.max(card.minimumFare, raw) * surgeMultiplier,
  );

  return { fareEstimate, surgeMultiplier, distanceKm, estimatedTimeMins };
}

function isValid(p: LatLng | null): p is LatLng {
  return (
    !!p &&
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lng) &&
    Math.abs(p.lat) <= 90 &&
    Math.abs(p.lng) <= 180 &&
    !(p.lat === 0 && p.lng === 0) // the classic "no GPS fix yet" sentinel
  );
}

/**
 * Accepts the several coordinate shapes floating around the codebase:
 * `{lat,lng}`, `{latitude,longitude}`, and the `"12.97,77.59"` string stored
 * in `pickup_location` / `drop_location`.
 */
export function toLatLng(value: any): LatLng | null {
  if (!value) return null;

  if (typeof value === 'string') {
    const [lat, lng] = value.split(',').map(Number);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }

  const lat = value.lat ?? value.latitude;
  const lng = value.lng ?? value.lon ?? value.longitude;

  return Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))
    ? { lat: Number(lat), lng: Number(lng) }
    : null;
}
