// Amadeus API Types
export interface AmadeusFlightOffer {
  type: string;
  id: string;
  source: string;
  instantTicketingRequired: boolean;
  nonHomogeneous: boolean;
  oneWay: boolean;
  lastTicketingDate: string;
  numberOfBookableSeats: number;
  itineraries: AmadeusItinerary[];
  price: AmadeusPrice;
  pricingOptions: {
    fareType: string[];
    includedCheckedBagsOnly: boolean;
  };
  validatingAirlineCodes: string[];
  travelerPricings: AmadeusTravelerPricing[];
}

export interface AmadeusItinerary {
  duration: string;
  segments: AmadeusSegment[];
}

export interface AmadeusSegment {
  departure: AmadeusLocation;
  arrival: AmadeusLocation;
  carrierCode: string;
  number: string;
  aircraft: {
    code: string;
  };
  operating?: {
    carrierCode: string;
  };
  duration: string;
  id: string;
  numberOfStops: number;
  blacklistedInEU: boolean;
}

export interface AmadeusLocation {
  iataCode: string;
  terminal?: string;
  at: string;
}

export interface AmadeusPrice {
  currency: string;
  total: string;
  base: string;
  fees: AmadeusFee[];
  grandTotal: string;
}

export interface AmadeusFee {
  amount: string;
  type: string;
}

export interface AmadeusTravelerPricing {
  travelerId: string;
  fareOption: string;
  travelerType: string;
  price: AmadeusPrice;
  fareDetailsBySegment: AmadeusFareDetails[];
}

export interface AmadeusFareDetails {
  segmentId: string;
  cabin: string;
  fareBasis: string;
  class: string;
  includedCheckedBags: {
    quantity: number;
  };
}

// Hotel Types
export interface AmadeusHotelOffer {
  type: string;
  hotel: AmadeusHotel;
  available: boolean;
  offers: AmadeusHotelOfferDetails[];
  self: string;
}

export interface AmadeusHotel {
  type: string;
  hotelId: string;
  chainCode: string;
  dupeId: string;
  name: string;
  cityCode: string;
  latitude: number;
  longitude: number;
  hotelDistance?: {
    distance: number;
    distanceUnit: string;
  };
  address: {
    lines: string[];
    postalCode: string;
    cityName: string;
    countryCode: string;
  };
  contact?: {
    phone: string;
    fax?: string;
    email?: string;
  };
  amenities?: string[];
  rating?: string;
}

export interface AmadeusHotelOfferDetails {
  id: string;
  checkInDate: string;
  checkOutDate: string;
  rateCode: string;
  rateFamilyEstimated?: {
    code: string;
    type: string;
  };
  room: {
    type: string;
    typeEstimated: {
      category: string;
      beds: number;
      bedType: string;
    };
    description: {
      text: string;
      lang: string;
    };
  };
  guests: {
    adults: number;
    childAges?: number[];
  };
  price: AmadeusPrice;
  policies: {
    paymentType: string;
    cancellation?: {
      type: string;
      amount?: string;
      numberOfNights?: number;
      deadline?: string;
    };
  };
  self: string;
}

// Transfer Types
export interface AmadeusTransferOffer {
  type: string;
  id: string;
  transferType: string;
  start: AmadeusTransferLocation;
  end: AmadeusTransferLocation;
  duration: string;
  vehicle: AmadeusVehicle;
  serviceProvider: {
    code: string;
    name: string;
    logoUrl?: string;
    termsUrl?: string;
    isPreferredPartner?: boolean;
  };
  quotation: AmadeusPrice;
  converted?: AmadeusPrice;
  extraServices?: AmadeusExtraService[];
  equipment?: AmadeusEquipment[];
  cancellationRules?: AmadeusCancellationRule[];
  methodsOfPaymentAccepted?: string[];
  discountCodes?: AmadeusDiscountCode[];
  distance?: {
    value: number;
    unit: string;
  };
}

export interface AmadeusTransferLocation {
  dateTime: string;
  locationCode: string;
  lfiCode?: string;
  address?: {
    line: string;
    zip?: string;
    countryCode: string;
    cityName: string;
    latitude?: number;
    longitude?: number;
  };
  googlePlaceId?: string;
  name?: string;
  uicCode?: string;
}

export interface AmadeusVehicle {
  code: string;
  category: string;
  description: {
    text: string;
    lang: string;
  };
  seats: AmadeusSeats[];
  baggages: AmadeusBaggages[];
  imageURL?: string;
}

export interface AmadeusSeats {
  count: number;
  type: string;
}

export interface AmadeusBaggages {
  count: number;
  size: string;
}

export interface AmadeusExtraService {
  code: string;
  itemId: string;
  description: {
    text: string;
    lang: string;
  };
  quotation: AmadeusPrice;
  converted?: AmadeusPrice;
  isBookable: boolean;
  taxIncluded: boolean;
  includedInTotal: boolean;
}

export interface AmadeusEquipment {
  code: string;
  description: {
    text: string;
    lang: string;
  };
  quotation?: AmadeusPrice;
  converted?: AmadeusPrice;
  isBookable?: boolean;
  taxIncluded?: boolean;
  includedInTotal?: boolean;
}

export interface AmadeusCancellationRule {
  feeType: string;
  amount?: string;
  currency?: string;
  percentage?: number;
  deadline: string;
}

export interface AmadeusDiscountCode {
  type: string;
  value: string;
}

// Activity Types
export interface AmadeusActivity {
  type: string;
  id: string;
  self: {
    href: string;
    methods: string[];
  };
  name: string;
  shortDescription: string;
  description: string;
  geoCode: {
    latitude: number;
    longitude: number;
  };
  rating: string;
  pictures: string[];
  bookingLink: string;
  price: {
    currencyCode: string;
    amount: string;
  };
  minimumDuration?: string;
  maximumDuration?: string;
}

// Search Parameters
export interface FlightSearchParams {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  travelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  includedAirlineCodes?: string;
  excludedAirlineCodes?: string;
  nonStop?: boolean;
  currencyCode?: string;
  maxPrice?: number;
  max?: number;
}

export interface HotelSearchParams {
  hotelIds?: string;
  cityCode?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  radiusUnit?: 'KM' | 'MILE';
  chainCodes?: string;
  amenities?: string;
  ratings?: string;
  hotelSource?: 'ALL' | 'BEDBANK' | 'DIRECTCHAIN';
  checkInDate: string;
  checkOutDate: string;
  roomQuantity?: number;
  adults: number;
  childAges?: number[];
  currency?: string;
  paymentPolicy?: 'GUARANTEE' | 'DEPOSIT' | 'NONE';
  boardType?: string;
}

export interface TransferSearchParams {
  startLocationCode: string;
  endLocationCode: string;
  transferType: 'PRIVATE' | 'SHARED' | 'TAXI' | 'HOURLY';
  startDateTime: string;
  endDateTime?: string;
  passengers: number;
  startConnectedSegment?: {
    transportationType: string;
    transportationNumber: string;
    departure?: {
      localDateTime: string;
      iataCode: string;
    };
  };
  endConnectedSegment?: {
    transportationType: string;
    transportationNumber: string;
    arrival?: {
      localDateTime: string;
      iataCode: string;
    };
  };
}

export interface ActivitySearchParams {
  latitude: number;
  longitude: number;
  radius?: number;
  north?: number;
  west?: number;
  south?: number;
  east?: number;
}

// Order Types
export interface FlightOrder {
  id: string;
  profile_id: string;
  amadeus_order_id?: string;
  offer_source: string;
  offer_json: AmadeusFlightOffer;
  passengers?: any;
  seatmaps?: any;
  status: string;
  pnr?: string;
  ticket_numbers?: string[];
  price_total?: number;
  price_currency: string;
  checkin_links?: any;
  analytics?: any;
  meta?: any;
  created_at: string;
  updated_at: string;
}

export interface HotelOrder {
  id: string;
  profile_id: string;
  amadeus_booking_id?: string;
  hotel_id?: string;
  offer_json: AmadeusHotelOffer;
  guests?: any;
  status: string;
  confirmation_code?: string;
  checkin: string;
  checkout: string;
  rooms: number;
  total_price?: number;
  currency: string;
  meta?: any;
  created_at: string;
  updated_at: string;
}

export interface TransferOrder {
  id: string;
  profile_id: string;
  amadeus_transfer_order_id?: string;
  offer_json: AmadeusTransferOffer;
  passengers?: any;
  pickup_at: string;
  status: string;
  total_price?: number;
  currency: string;
  meta?: any;
  created_at: string;
  updated_at: string;
}

export interface ActivityOrder {
  id: string;
  profile_id: string;
  partner_booking_id?: string;
  activity_id: string;
  offer_json: AmadeusActivity;
  participants?: any;
  scheduled_at: string;
  status: string;
  total_price?: number;
  currency: string;
  meta?: any;
  created_at: string;
  updated_at: string;
}