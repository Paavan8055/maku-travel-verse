
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import logger from '@/utils/logger';

export interface Booking {
  id: string;
  booking_reference: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  booking_type: string;
  total_amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
  booking_data: any;
  check_in_date?: string;
  check_out_date?: string;
  guest_count?: number;
  items?: any[];
  latest_payment?: any;
}

export const useBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchBookings = async () => {
    if (!user) {
      setBookings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase.rpc('get_user_bookings');
      
      if (fetchError) {
        throw fetchError;
      }

      // Handle the response data properly
      let bookingsData: Booking[] = [];
      if (data) {
        // If data is a string, parse it
        if (typeof data === 'string') {
          try {
            bookingsData = JSON.parse(data) as Booking[];
          } catch (parseError) {
            logger.error('Error parsing booking data:', parseError);
            bookingsData = [];
          }
        } else if (Array.isArray(data)) {
          // If data is already an array, cast it properly
          bookingsData = data.map((item: any) => ({
            id: item.id,
            booking_reference: item.booking_reference,
            status: item.status,
            booking_type: item.booking_type,
            total_amount: item.total_amount,
            currency: item.currency,
            created_at: item.created_at,
            updated_at: item.updated_at,
            booking_data: item.booking_data,
            check_in_date: item.check_in_date,
            check_out_date: item.check_out_date,
            guest_count: item.guest_count,
            items: item.items,
            latest_payment: item.latest_payment
          })) as Booking[];
        }
      }

      setBookings(bookingsData);
    } catch (err: any) {
      logger.error('Error fetching bookings:', err);
      setError(err.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  return {
    bookings,
    loading,
    error,
    refetch: fetchBookings
  };
};
