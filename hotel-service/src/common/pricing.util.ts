export function getHourlyRateFactor(durationHours: number): number {
  if (durationHours <= 3) return 0.35;
  if (durationHours <= 6) return 0.55;
  if (durationHours <= 9) return 0.75;
  return 1.0;
}

export function computeStayPrice(
  pricePerNight: number,
  rooms: number,
  isHourly: boolean,
  durationHours?: number,
  nights: number = 1,
): { basePrice: number; taxes: number; grandTotal: number } {
  let factor = nights;
  if (isHourly) {
    factor = getHourlyRateFactor(durationHours || 3);
  }
  const basePrice = Math.round(pricePerNight * rooms * factor);
  const taxes = Math.round(basePrice * 0.12); // Standard 12% GST
  const grandTotal = basePrice + taxes;

  return { basePrice, taxes, grandTotal };
}
