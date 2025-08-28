import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import logger from "@/utils/logger";

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
  ancillaryServices?: any[];
}

export const useHotelOffers = (): UseHotelOffersResult => {
  const [offers, setOffers] = useState<HotelOffer[]>([]);
  const [hotel, setHotel] = useState<any>(null);
  const [ancillaryServices, setAncillaryServices] = useState<any[]>([]);
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
        logger.error('Hotel offers function error:', functionError);
        const errorMessage = functionError.message || 'Failed to fetch hotel offers';
        
        // Enhanced error handling with retry suggestion
        if (errorMessage.includes('404') || errorMessage.includes('not found')) {
          throw new Error('Hotel not found. Please try a different hotel or check your search criteria.');
        } else if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
          throw new Error('Connection timeout. Please check your internet connection and try again.');
        } else if (errorMessage.includes('rate limit')) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        }
        
        throw new Error(errorMessage);
      }

      if (data?.success) {
        setOffers(data.offers || []);
        setHotel(data.hotel);
        setAncillaryServices(data.ancillaryServices || []);
        console.log(`✅ Found ${data.offers?.length || 0} offers for hotel ${params.hotelId}`);
        console.log(`✅ Found ${data.ancillaryServices?.length || 0} ancillary services`);
        
        if (data.offers?.length === 0) {
          toast.info('No room offers available for selected dates. Try adjusting your dates or check other hotels.');
          setError('No rooms available for the selected dates. Please try different dates or another hotel.');
        } else {
          toast.success(`Found ${data.offers.length} room options`);
        }
      } else {
        throw new Error(data?.error || 'Failed to fetch hotel offers');
      }
    } catch (err: any) {
      logger.error('Hotel offers error:', err);
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
    ancillaryServices,
    loading,
    error,
    fetchOffers
  };
};