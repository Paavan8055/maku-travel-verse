
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import logger from '@/utils/logger';

interface HotelPhoto {
  url: string;
  category: string;
  width?: number;
  height?: number;
  title: string;
}

interface UseHotelPhotosResult {
  photos: HotelPhoto[];
  loading: boolean;
  error: string | null;
  fetchPhotos: (hotelId: string) => Promise<void>;
}

export const useHotelPhotos = (): UseHotelPhotosResult => {
  const [photos, setPhotos] = useState<HotelPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotos = useCallback(async (hotelId: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching hotel photos for:', hotelId);

      const { data, error: functionError } = await supabase.functions.invoke('amadeus-hotel-photos', {
        body: { hotelId }
      });

      if (functionError) {
        logger.error('Hotel photos function error:', functionError);
        throw new Error(functionError.message || 'Failed to fetch hotel photos');
      }

      if (data?.success) {
        setPhotos(data.photos || []);
        console.log(`✅ Found ${data.photos?.length || 0} photos for hotel ${hotelId}`);
      } else {
        throw new Error(data?.error || 'Failed to fetch hotel photos');
      }
    } catch (err: any) {
      logger.error('Hotel photos error:', err);
      const errorMessage = err.message || 'Failed to fetch hotel photos';
      setError(errorMessage);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    photos,
    loading,
    error,
    fetchPhotos
  };
};
