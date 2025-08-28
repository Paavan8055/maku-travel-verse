import { useState, useCallback } from 'react';
import { useBookingStore } from '@/store/bookingStore';

interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country?: string;
  passportNumber?: string;
}

interface PassengerInfo {
  passengers: Array<{
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    passportNumber?: string;
    nationality?: string;
  }>;
  contactEmail: string;
  contactPhone: string;
}

export const useBookingForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setGuestInfo, setPassengerInfo, guestInfo, passengerInfo } = useBookingStore();

  const submitGuestInfo = useCallback(async (data: GuestInfo) => {
    setIsSubmitting(true);
    try {
      setGuestInfo(data);
      return { success: true };
    } catch (error) {
      console.error('Failed to save guest info:', error);
      return { success: false, error: 'Failed to save guest information' };
    } finally {
      setIsSubmitting(false);
    }
  }, [setGuestInfo]);

  const submitPassengerInfo = useCallback(async (data: PassengerInfo) => {
    setIsSubmitting(true);
    try {
      setPassengerInfo(data);
      return { success: true };
    } catch (error) {
      console.error('Failed to save passenger info:', error);
      return { success: false, error: 'Failed to save passenger information' };
    } finally {
      setIsSubmitting(false);
    }
  }, [setPassengerInfo]);

  const clearBookingData = useCallback(() => {
    const { clearBooking } = useBookingStore.getState();
    clearBooking();
  }, []);

  return {
    guestInfo,
    passengerInfo,
    isSubmitting,
    submitGuestInfo,
    submitPassengerInfo,
    clearBookingData
  };
};