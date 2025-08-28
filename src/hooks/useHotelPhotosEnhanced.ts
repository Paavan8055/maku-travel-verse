import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  const fetchPhotos = async (hotelId: string) => {
    if (!hotelId) return;
    
    setLoading(true);
    setError(null);

    try {
      console.log('🖼️ Fetching hotel photos for:', hotelId);

      const { data, error: functionError } = await supabase.functions.invoke('amadeus-hotel-photos', {
        body: { hotelId }
      });

      if (functionError) {
        console.error('❌ Hotel photos function error:', functionError);
        throw new Error(functionError.message || 'Failed to fetch hotel photos');
      }

      if (data?.success) {
        const fetchedPhotos = data.photos || [];
        setPhotos(fetchedPhotos);
        console.log(`✅ Found ${fetchedPhotos.length} photos for hotel ${hotelId}`);
        
        if (fetchedPhotos.length === 0) {
          console.log('📷 No photos returned from Amadeus for hotel:', hotelId);
        }
      } else {
        throw new Error(data?.error || 'Failed to fetch hotel photos');
      }
    } catch (err: any) {
      console.error('❌ Hotel photos error:', err);
      const errorMessage = err.message || 'Failed to fetch hotel photos';
      setError(errorMessage);
      setPhotos([]);
      
      // Only show toast for non-rate-limit errors
      if (!err.message?.includes('Too Many Requests')) {
        toast({
          title: "Photo Loading Issue",
          description: "Hotel photos temporarily unavailable",
          variant: "default"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    photos,
    loading,
    error,
    fetchPhotos
  };
};