import { BadRequestException } from '@nestjs/common';

/** Discount applied to every booking, in rupees. */
const FLAT_DISCOUNT = 200;

/** Charge per guest beyond the first, per room, per night (or per hourly slot). */
const EXTRA_GUEST_CHARGE = 500;

/** Tax rate applied on top of extra-guest charges. */
const EXTRA_GUEST_TAX_RATE = 0.12;

/** Share of the nightly rate charged for a 3/6/9 hour stay. */
const HOURLY_FACTORS: Record<number, number> = {
  3: 0.15,
  6: 0.25,
  9: 0.35,
};

export interface PriceBreakdown {
  perUnitPrice: number;
  nights: number;
  rooms: number;
  guests: number;
  roomStayCost: number;
  extraGuestCharges: number;
  taxes: number;
  discount: number;
  total: number;
  currency: string;
}

/**
 * Pulls the rupee amount out of a free-text tax label such as
 * `"₹1,710 taxes & fees"`. Digit separators are stripped first — matching the
 * first digit run on the raw string would read `₹1,710` as `1`.
 */
export function parseTaxAmount(taxes: unknown): number {
  if (typeof taxes === 'number') return Math.max(0, Math.round(taxes));
  if (typeof taxes !== 'string') return 0;
  const match = taxes.replace(/[,\s]/g, '').match(/\d+(\.\d+)?/);
  if (!match) return 0;
  return Math.max(0, Math.round(Number(match[0])));
}

/** Whole nights between two ISO dates. Same-day stays count as one night. */
export function countNights(checkInDate: string, checkOutDate: string): number {
  const start = new Date(`${checkInDate}T00:00:00Z`);
  const end = new Date(`${checkOutDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new BadRequestException('checkInDate and checkOutDate must be valid dates.');
  }
  if (end.getTime() < start.getTime()) {
    throw new BadRequestException('checkOutDate cannot be before checkInDate.');
  }
  const days = Math.round(
    (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
  );
  return Math.max(1, days);
}

export interface PriceInput {
  roomPrice: number;
  roomTaxes: unknown;
  checkInDate: string;
  checkOutDate: string;
  rooms: number;
  adults: number;
  children: number;
  isHourly: boolean;
  hourlyDurationHours?: number | null;
}

/**
 * The single source of truth for what a stay costs.
 *
 * Both the quote endpoint and booking creation call this, so the price a guest
 * is shown is the same one that gets charged.
 */
export function calculatePrice(input: PriceInput): PriceBreakdown {
  const nights = countNights(input.checkInDate, input.checkOutDate);
  const rooms = Math.max(1, input.rooms);
  const guests = Math.max(1, input.adults + (input.children || 0));

  let perUnitPrice = input.roomPrice;
  if (input.isHourly) {
    const factor = HOURLY_FACTORS[input.hourlyDurationHours ?? 0];
    if (!factor) {
      throw new BadRequestException(
        'hourlyDurationHours must be 3, 6 or 9 for an hourly booking.',
      );
    }
    // Hourly rates are quoted in round tens.
    perUnitPrice = Math.round((input.roomPrice * factor) / 10) * 10;
  }

  // An hourly stay is a single slot regardless of the date range.
  const stayMultiplier = input.isHourly ? 1 : nights;
  const units = stayMultiplier * rooms;

  const roomStayCost = perUnitPrice * units;
  const extraGuestCharges =
    guests > 1 ? (guests - 1) * EXTRA_GUEST_CHARGE * units : 0;
  const baseTax = parseTaxAmount(input.roomTaxes) * units;
  const taxes = baseTax + Math.round(extraGuestCharges * EXTRA_GUEST_TAX_RATE);
  const subtotal = roomStayCost + extraGuestCharges;
  const discount = Math.min(FLAT_DISCOUNT, subtotal + taxes);
  const total = Math.round(subtotal + taxes - discount);

  return {
    perUnitPrice,
    nights: input.isHourly ? 0 : nights,
    rooms,
    guests,
    roomStayCost,
    extraGuestCharges,
    taxes,
    discount,
    total,
    currency: 'INR',
  };
}
