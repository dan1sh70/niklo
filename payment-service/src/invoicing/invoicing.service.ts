import { Injectable } from '@nestjs/common';

@Injectable()
export class InvoicingService {
  /**
   * Simple utility to calculate GST breakup.
   * Assumes 5% GST for transportation services if not specified.
   */
  calculateGST(totalFare: number, gstRatePercent: number = 5) {
    // formula: baseFare + (baseFare * gstRatePercent/100) = totalFare
    // baseFare = totalFare / (1 + gstRatePercent/100)
    const gstFraction = gstRatePercent / 100;
    const baseFare = totalFare / (1 + gstFraction);
    const gstAmount = totalFare - baseFare;

    return {
      total: Number(totalFare.toFixed(2)),
      base_fare: Number(baseFare.toFixed(2)),
      cgst: Number((gstAmount / 2).toFixed(2)),
      sgst: Number((gstAmount / 2).toFixed(2)),
      total_gst: Number(gstAmount.toFixed(2)),
    };
  }
}
