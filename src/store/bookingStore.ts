import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BookingState {
  // Hotel booking state
  selectedHotelOffer: any | null;
  selectedHotelData: any | null;
  selectedAddOns: any[];
  addOnsTotal: number;
  
  // Flight booking state
  selectedOutboundFlight: any | null;
  selectedInboundFlight: any | null;
  multiCityFlights: any[];
  tripType: string;
  
  // Activity booking state
  selectedActivityOffer: any | null;
  
  // Guest/Passenger info
  guestInfo: any | null;
  passengerInfo: any | null;
  
  // Actions
  setHotelBooking: (offer: any, data: any, addOns: any[], total: number) => void;
  setFlightBooking: (outbound: any, inbound?: any, multiCity?: any[], type?: string) => void;
  setActivityBooking: (offer: any) => void;
  setGuestInfo: (info: any) => void;
  setPassengerInfo: (info: any) => void;
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
      setHotelBooking: (offer, data, addOns, total) => set({
        selectedHotelOffer: offer,
        selectedHotelData: data,
        selectedAddOns: addOns,
        addOnsTotal: total
      }),
      
      setFlightBooking: (outbound, inbound, multiCity, type) => set({
        selectedOutboundFlight: outbound,
        selectedInboundFlight: inbound,
        multiCityFlights: multiCity || [],
        tripType: type || 'oneway'
      }),
      
      setActivityBooking: (offer) => set({
        selectedActivityOffer: offer
      }),
      
      setGuestInfo: (info) => set({
        guestInfo: info
      }),
      
      setPassengerInfo: (info) => set({
        passengerInfo: info
      }),
      
      clearBooking: () => set({
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
        passengerInfo: null
      })
    }),
    {
      name: 'booking-store',
      partialize: (state) => ({
        selectedHotelOffer: state.selectedHotelOffer,
        selectedHotelData: state.selectedHotelData,
        selectedAddOns: state.selectedAddOns,
        addOnsTotal: state.addOnsTotal,
        selectedOutboundFlight: state.selectedOutboundFlight,
        selectedInboundFlight: state.selectedInboundFlight,
        multiCityFlights: state.multiCityFlights,
        tripType: state.tripType,
        selectedActivityOffer: state.selectedActivityOffer,
        guestInfo: state.guestInfo,
        passengerInfo: state.passengerInfo
      })
    }
  )
);