import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AmadeusActivity,
  AmadeusFlightOffer,
  AmadeusHotel,
  AmadeusHotelOffer,
} from '@/types/amadeus';

interface HotelBookingDetails {
  hotel: AmadeusHotel;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  guestCount: number;
  roomCount: number;
  totalAmount: number;
  currency: string;
}

interface HotelAddOn {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  description?: string;
  isPerPerson?: boolean;
}

interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title?: string;
  arrivalTime?: string;
  specialRequests?: string;
  roomPreferences?: string;
  smsNotifications?: boolean;
  emailUpdates?: boolean;
}

interface PassengerInfo extends GuestInfo {
  middleName?: string;
  dateOfBirth: string;
  gender: 'M' | 'F' | 'X';
  passportNumber?: string;
  passportExpiry?: string;
  nationality?: string;
}

interface BookingState {
  // Hotel booking state
  selectedHotelOffer: AmadeusHotelOffer | null;
  selectedHotelData: HotelBookingDetails | null;
  selectedAddOns: HotelAddOn[];
  addOnsTotal: number;

  // Flight booking state
  selectedOutboundFlight: AmadeusFlightOffer | null;
  selectedInboundFlight: AmadeusFlightOffer | null;
  multiCityFlights: AmadeusFlightOffer[];
  tripType: 'oneway' | 'roundtrip' | 'multicity';

  // Activity booking state
  selectedActivityOffer: AmadeusActivity | null;

  // Guest/Passenger info
  guestInfo: GuestInfo | null;
  passengerInfo: PassengerInfo | null;

  // Actions
  setHotelBooking: (offer: AmadeusHotelOffer, data: HotelBookingDetails, addOns: HotelAddOn[], total: number) => void;
  setFlightBooking: (
    outbound: AmadeusFlightOffer,
    inbound?: AmadeusFlightOffer,
    multiCity?: AmadeusFlightOffer[],
    type?: 'oneway' | 'roundtrip' | 'multicity'
  ) => void;
  setActivityBooking: (offer: AmadeusActivity) => void;
  setGuestInfo: (info: GuestInfo) => void;
  setPassengerInfo: (info: PassengerInfo) => void;
  clearBooking: () => void;
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set) => ({
      // Initial state
      selectedHotelOffer: null,
      selectedHotelData: null,
      selectedAddOns: [],
      addOnsTotal: 0,
      selectedOutboundFlight: null,
      selectedInboundFlight: null,
      multiCityFlights: [],
      tripType: 'oneway',
      selectedActivityOffer: null,
      guestInfo: null,
      passengerInfo: null,

      // Actions
      setHotelBooking: (offer, data, addOns, total) =>
        set({
          selectedHotelOffer: offer,
          selectedHotelData: data,
          selectedAddOns: addOns,
          addOnsTotal: total,
        }),

      setFlightBooking: (outbound, inbound, multiCity, type) =>
        set({
          selectedOutboundFlight: outbound,
          selectedInboundFlight: inbound || null,
          multiCityFlights: multiCity || [],
    tripType: type || 'oneway',
        }),

      setActivityBooking: (offer) =>
        set({
          selectedActivityOffer: offer,
        }),

      setGuestInfo: (info) =>
        set({
          guestInfo: info,
        }),

      setPassengerInfo: (info) =>
        set({
          passengerInfo: info,
        }),

      clearBooking: () =>
        set({
          selectedHotelOffer: null,
          selectedHotelData: null,
          selectedAddOns: [],
          addOnsTotal: 0,
          selectedOutboundFlight: null,
          selectedInboundFlight: null,
          multiCityFlights: [],
          tripType: 'oneway',
          selectedActivityOffer: null,
          guestInfo: null,
          passengerInfo: null,
        }),
    }),
    {
      name: 'booking-store',
      partialize: (state) => sanitizeBookingState(state),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...sanitizeBookingState(persistedState as Partial<BookingState>),
      }),
    }
  )
);

function sanitizeBookingState(state: Partial<BookingState>): Partial<BookingState> {
  return {
    selectedHotelOffer: state.selectedHotelOffer ?? null,
    selectedHotelData: state.selectedHotelData ?? null,
    selectedAddOns: Array.isArray(state.selectedAddOns) ? state.selectedAddOns : [],
    addOnsTotal: typeof state.addOnsTotal === 'number' ? state.addOnsTotal : 0,
    selectedOutboundFlight: state.selectedOutboundFlight ?? null,
    selectedInboundFlight: state.selectedInboundFlight ?? null,
    multiCityFlights: Array.isArray(state.multiCityFlights)
      ? state.multiCityFlights
      : [],
    tripType:
      state.tripType === 'roundtrip' || state.tripType === 'multicity'
        ? state.tripType
        : 'oneway',
    selectedActivityOffer: state.selectedActivityOffer ?? null,
    guestInfo: state.guestInfo ?? null,
    passengerInfo: state.passengerInfo ?? null,
  };
}