import { istHour, surgeFor, quoteFare, toLatLng } from './fare';
import { RideType } from './entities/ride.entity';

/**
 * Surge bands are Indian commercial hours, but every service container runs
 * UTC (nothing sets `TZ`). These pin the bands to IST so the peaks cannot
 * drift back to the container clock.
 */
describe('surge', () => {
  it('reads the hour in IST regardless of the process timezone', () => {
    expect(istHour(new Date('2026-07-30T00:00:00Z'))).toBe(5); // 05:30 IST
    expect(istHour(new Date('2026-07-30T12:00:00Z'))).toBe(17); // 17:30 IST
    expect(istHour(new Date('2026-07-30T19:00:00Z'))).toBe(0); // 00:30 IST next day
  });

  it('applies the evening peak during the IST evening', () => {
    // 18:30 IST — squarely in the 17-21 band.
    expect(surgeFor(new Date('2026-07-30T13:00:00Z'))).toBe(1.4);
  });

  it('does not apply the evening peak at 17:00 UTC, which is 22:30 IST', () => {
    // The old `getHours()` version charged peak here on a UTC container.
    expect(surgeFor(new Date('2026-07-30T17:00:00Z'))).toBe(1.0);
  });

  it('applies the morning peak during the IST morning', () => {
    // 09:30 IST.
    expect(surgeFor(new Date('2026-07-30T04:00:00Z'))).toBe(1.3);
  });

  it('applies the late-night band after midnight IST', () => {
    // 01:30 IST.
    expect(surgeFor(new Date('2026-07-30T20:00:00Z'))).toBe(1.25);
  });
});

describe('quoteFare', () => {
  it('refuses to quote without both coordinates', () => {
    expect(quoteFare(null, { lat: 12.9, lng: 77.6 }, RideType.SEDAN)).toBeNull();
    expect(
      quoteFare({ lat: 0, lng: 0 }, { lat: 12.9, lng: 77.6 }, RideType.SEDAN),
    ).toBeNull();
  });

  it('scales with distance', () => {
    const near = quoteFare(
      { lat: 12.9716, lng: 77.5946 },
      { lat: 12.9916, lng: 77.6146 },
      RideType.SEDAN,
      new Date('2026-07-30T08:00:00Z'), // 13:30 IST — no surge band
    );
    const far = quoteFare(
      { lat: 12.9716, lng: 77.5946 },
      { lat: 13.0616, lng: 77.6846 },
      RideType.SEDAN,
      new Date('2026-07-30T08:00:00Z'),
    );

    expect(near).not.toBeNull();
    expect(far).not.toBeNull();
    expect(far!.fareEstimate).toBeGreaterThan(near!.fareEstimate);
  });
});

describe('toLatLng', () => {
  it('accepts the shapes the codebase actually passes around', () => {
    expect(toLatLng('12.97,77.59')).toEqual({ lat: 12.97, lng: 77.59 });
    expect(toLatLng({ lat: 12.97, lng: 77.59 })).toEqual({
      lat: 12.97,
      lng: 77.59,
    });
    expect(toLatLng({ latitude: 12.97, longitude: 77.59 })).toEqual({
      lat: 12.97,
      lng: 77.59,
    });
    expect(toLatLng(null)).toBeNull();
  });
});
