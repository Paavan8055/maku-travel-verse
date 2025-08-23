import { useState, useEffect } from 'react';

interface BookingSession {
  hotelId?: string;
  hotelName?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  rooms?: number;
  selectedOffer?: any;
  selectedAddOns?: any[];
  step?: 'search' | 'room-selection' | 'checkout' | 'payment';
  timestamp?: number;
}

const SESSION_KEY = 'hotel_booking_session';
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

export const useSessionRecovery = () => {
  const [session, setSession] = useState<BookingSession | null>(null);
  const [hasRecoverableSession, setHasRecoverableSession] = useState(false);

  useEffect(() => {
    const savedSession = localStorage.getItem(SESSION_KEY);
    if (savedSession) {
      try {
        const parsedSession: BookingSession = JSON.parse(savedSession);
        const isExpired = Date.now() - (parsedSession.timestamp || 0) > SESSION_DURATION;
        
        if (!isExpired && parsedSession.hotelId) {
          setSession(parsedSession);
          setHasRecoverableSession(true);
        } else {
          // Clean up expired session
          localStorage.removeItem(SESSION_KEY);
        }
      } catch (error) {
        console.error('Error parsing saved session:', error);
        localStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  const saveSession = (sessionData: Partial<BookingSession>) => {
    const updatedSession = {
      ...session,
      ...sessionData,
      timestamp: Date.now()
    };
    
    setSession(updatedSession);
    localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
  };

  const clearSession = () => {
    setSession(null);
    setHasRecoverableSession(false);
    localStorage.removeItem(SESSION_KEY);
    // Also clear sessionStorage items
    sessionStorage.removeItem('selectedHotelOffer');
    sessionStorage.removeItem('selectedHotelData');
    sessionStorage.removeItem('selectedAddOns');
    sessionStorage.removeItem('addOnsTotal');
  };

  const recoverSession = () => {
    if (!session) return null;
    
    // Create URL for session recovery
    const params = new URLSearchParams();
    if (session.hotelId) params.set('hotelId', session.hotelId);
    if (session.hotelName) params.set('hotelName', session.hotelName);
    if (session.checkIn) params.set('checkIn', session.checkIn);
    if (session.checkOut) params.set('checkOut', session.checkOut);
    if (session.adults) params.set('adults', session.adults.toString());
    if (session.children) params.set('children', session.children.toString());
    if (session.rooms) params.set('rooms', session.rooms.toString());

    // Restore sessionStorage for checkout
    if (session.selectedOffer) {
      sessionStorage.setItem('selectedHotelOffer', JSON.stringify(session.selectedOffer));
    }
    if (session.selectedAddOns) {
      sessionStorage.setItem('selectedAddOns', JSON.stringify(session.selectedAddOns));
    }

    return {
      searchUrl: `/search/hotels?${params.toString()}`,
      bookingUrl: session.step === 'checkout' || session.step === 'payment' 
        ? `/hotel-checkout?${params.toString()}` 
        : `/booking/select?${params.toString()}`,
      step: session.step || 'search'
    };
  };

  return {
    session,
    hasRecoverableSession,
    saveSession,
    clearSession,
    recoverSession
  };
};