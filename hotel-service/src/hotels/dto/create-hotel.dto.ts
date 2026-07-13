export class CreateHotelDto {
  hotelName: string;
  badgeText?: string;
  imagePath: string;
  galleryImages?: string[];
  distanceText: string;
  ratingValue: number;
  ratingText: string;
  reviewsCount?: number;
  freeBreakfast?: boolean;
  freeWifi?: boolean;
  freeCancellation?: boolean;
  priceText: string;
  priceInt: number;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  popularAmenities?: any[];
  nearbyPlaces?: any[];
  features?: any[];
  rules?: any;
  hourlyOptions?: any;
  roomTypes?: any[];
}
