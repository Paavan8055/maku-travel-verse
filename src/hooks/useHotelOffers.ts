import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface HotelOffersParams {
  hotelId: string;
  checkIn: string;
  checkOut: string;
  adults?: number;
  children?: number;
  rooms?: number;
  currency?: string;
}

interface HotelOffer {
  id: string;
  checkInDate: string;
  checkOutDate: string;
  rateCode: string;
  rateFamilyEstimated: any;
  room: {
    type: string;
    typeEstimated: any;
    description: string;
    capacity: number;
  };
  guests: any;
  price: {
    currency: string;
    base: string;
    total: string;
    taxes: any[];
    markups: any[];
    variations: any;
  };
  policies: {
    paymentType: string;
    cancellation: any;
    guarantee: any;
    deposit: any;
  };
  self: string;
}

interface UseHotelOffersResult {
  offers: HotelOffer[];
  loading: boolean;
  error: string | null;
  fetchOffers: (params: HotelOffersParams) => Promise<void>;
  hotel: any;
}

export const useHotelOffers = (): UseHotelOffersResult => {
  const [offers, setOffers] = useState<HotelOffer[]>([]);
  const [hotel, setHotel] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOffers = useCallback(async (params: HotelOffersParams) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching hotel offers for:', params);

      const { data, error: functionError } = await supabase.functions.invoke('amadeus-hotel-offers', {
        body: {
          hotelId: params.hotelId,
          checkIn: params.checkIn,
          checkOut: params.checkOut,
          adults: params.adults || 2,
          children: params.children || 0,
          rooms: params.rooms || 1,
          currency: params.currency || 'USD'
        }
      });

      if (functionError) {
        console.error('Hotel offers function error:', functionError);
        throw new Error(functionError.message || 'Failed to fetch hotel offers');
      }

      if (data?.success) {
        setOffers(data.offers || []);
        setHotel(data.hotel);
        console.log(`✅ Found ${data.offers?.length || 0} offers for hotel ${params.hotelId}`);
        
        if (data.offers?.length === 0) {
          toast.info('No room offers available for selected dates');
        } else {
          toast.success(`Found ${data.offers.length} room options`);
        }
      } else {
        throw new Error(data?.error || 'Failed to fetch hotel offers');
      }
    } catch (err: any) {
      console.error('Hotel offers error:', err);
      const errorMessage = err.message || 'Failed to fetch hotel offers';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    offers,
    hotel,
    loading,
    error,
    fetchOffers
  };
};