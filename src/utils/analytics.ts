// Analytics utilities for tracking booking flow events

interface BookingEvent {
  eventName: string;
  hotelId?: string;
  hotelName?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  rooms?: number;
  price?: number;
  currency?: string;
  step?: string;
  timestamp?: number;
}

export const trackBookingEvent = (event: BookingEvent) => {
  const eventData = {
    ...event,
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  console.log('📊 Booking Analytics:', eventData);

  // In production, send to analytics service
  // Example: gtag('event', event.eventName, eventData)
  // Example: amplitude.track(event.eventName, eventData)
  
  // Store locally for debugging
  try {
    const events = JSON.parse(localStorage.getItem('booking_events') || '[]');
    events.push(eventData);
    // Keep only last 100 events
    if (events.length > 100) {
      events.splice(0, events.length - 100);
    }
    localStorage.setItem('booking_events', JSON.stringify(events));
  } catch (error) {
    console.warn('Failed to store analytics event:', error);
  }
};

export const trackHotelSearch = (params: {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms: number;
}) => {
  trackBookingEvent({
    eventName: 'hotel_search',
    ...params,
    step: 'search'
  });
};

export const trackHotelSelect = (params: {
  hotelId: string;
  hotelName: string;
  price: number;
  currency: string;
}) => {
  trackBookingEvent({
    eventName: 'hotel_selected',
    ...params,
    step: 'hotel_selection'
  });
};

export const trackRoomSelect = (params: {
  hotelId: string;
  hotelName: string;
  roomType: string;
  price: number;
  currency: string;
}) => {
  trackBookingEvent({
    eventName: 'room_selected',
    ...params,
    step: 'room_selection'
  });
};

export const trackAddOnsSelect = (params: {
  hotelId: string;
  addOns: string[];
  totalAddOnsPrice: number;
  currency: string;
}) => {
  trackBookingEvent({
    eventName: 'addons_selected',
    ...params,
    step: 'addons_selection'
  });
};

export const trackCheckoutStart = (params: {
  hotelId: string;
  hotelName: string;
  totalPrice: number;
  currency: string;
}) => {
  trackBookingEvent({
    eventName: 'checkout_started',
    ...params,
    step: 'checkout'
  });
};

export const trackPaymentStart = (params: {
  hotelId: string;
  totalPrice: number;
  currency: string;
  paymentMethod: string;
}) => {
  trackBookingEvent({
    eventName: 'payment_started',
    ...params,
    step: 'payment'
  });
};

export const trackBookingComplete = (params: {
  hotelId: string;
  hotelName: string;
  bookingId: string;
  totalPrice: number;
  currency: string;
}) => {
  trackBookingEvent({
    eventName: 'booking_completed',
    ...params,
    step: 'completion'
  });
};

export const trackError = (params: {
  errorType: string;
  errorMessage: string;
  step: string;
  hotelId?: string;
}) => {
  trackBookingEvent({
    eventName: 'booking_error',
    ...params
  });
};
