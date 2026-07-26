import { BadRequestException } from '@nestjs/common';
import {
  calculatePrice,
  countNights,
  parseTaxAmount,
} from './booking-pricing.util';

describe('parseTaxAmount', () => {
  it('reads the full amount out of a grouped number', () => {
    // Matching the first digit run on the raw string would read this as 1.
    expect(parseTaxAmount('₹1,710 taxes & fees')).toBe(1710);
  });

  it('handles a plain label and a numeric column', () => {
    expect(parseTaxAmount('₹92 taxes')).toBe(92);
    expect(parseTaxAmount(500)).toBe(500);
  });

  it('falls back to zero when there is no amount', () => {
    expect(parseTaxAmount('taxes extra')).toBe(0);
    expect(parseTaxAmount(null)).toBe(0);
    expect(parseTaxAmount(undefined)).toBe(0);
  });
});

describe('countNights', () => {
  it('counts whole nights between the dates', () => {
    expect(countNights('2026-08-01', '2026-08-04')).toBe(3);
  });

  it('treats a same-day stay as one night', () => {
    expect(countNights('2026-08-01', '2026-08-01')).toBe(1);
  });

  it('rejects a checkout before the checkin', () => {
    expect(() => countNights('2026-08-04', '2026-08-01')).toThrow(
      BadRequestException,
    );
  });
});

describe('calculatePrice', () => {
  const base = {
    roomPrice: 9500,
    roomTaxes: '₹1,710 taxes & fees',
    checkInDate: '2026-08-01',
    checkOutDate: '2026-08-03',
    rooms: 1,
    adults: 2,
    children: 0,
    isHourly: false,
  };

  it('multiplies the nightly rate by nights and rooms', () => {
    const price = calculatePrice(base);
    expect(price.nights).toBe(2);
    expect(price.roomStayCost).toBe(9500 * 2);
    // One guest beyond the first, charged per night.
    expect(price.extraGuestCharges).toBe(500 * 2);
    expect(price.taxes).toBe(1710 * 2 + Math.round(1000 * 0.12));
    expect(price.total).toBe(
      price.roomStayCost + price.extraGuestCharges + price.taxes - 200,
    );
  });

  it('scales with the number of rooms', () => {
    const single = calculatePrice(base);
    const double = calculatePrice({ ...base, rooms: 2 });
    expect(double.roomStayCost).toBe(single.roomStayCost * 2);
    expect(double.taxes).toBe(single.taxes * 2);
  });

  it('charges an hourly stay as a single slot at the hourly factor', () => {
    const price = calculatePrice({
      ...base,
      isHourly: true,
      hourlyDurationHours: 6,
      checkOutDate: base.checkInDate,
    });
    // 25% of 9500 = 2375, rounded to the nearest ten.
    expect(price.perUnitPrice).toBe(2380);
    expect(price.roomStayCost).toBe(2380);
    expect(price.nights).toBe(0);
  });

  it('rejects an hourly booking without a supported duration', () => {
    expect(() =>
      calculatePrice({ ...base, isHourly: true, hourlyDurationHours: 4 }),
    ).toThrow(BadRequestException);
  });

  it('never discounts a stay below zero', () => {
    const price = calculatePrice({
      ...base,
      roomPrice: 50,
      roomTaxes: '₹0',
      adults: 1,
      checkOutDate: base.checkInDate,
    });
    expect(price.discount).toBe(50);
    expect(price.total).toBe(0);
  });
});
