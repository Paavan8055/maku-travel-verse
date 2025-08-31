
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

      // Parse the JSON response if it's a string
      let bookingsData: Booking[] = [];
      if (typeof data === 'string') {
        bookingsData = JSON.parse(data);
      } else if (Array.isArray(data)) {
        bookingsData = data;
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
