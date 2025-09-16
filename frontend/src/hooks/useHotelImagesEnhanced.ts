import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HotelImage {
  url: string;
  type: string;
  category: string;
  title: string;
  order?: number;
  roomCode?: string;
}

interface UseHotelImagesResult {
  images: HotelImage[];
  loading: boolean;
  error: string | null;
  fetchImages: (hotelCode: string) => Promise<void>;
}

export const useHotelImagesEnhanced = (): UseHotelImagesResult => {
  const [images, setImages] = useState<HotelImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchImages = useCallback(async (hotelCode: string) => {
    if (!hotelCode) return;
    
    setLoading(true);
    setError(null);

    try {
      console.log('🖼️ Fetching enhanced images for hotel:', hotelCode);

      const { data, error: functionError } = await supabase.functions.invoke('hotelbeds-image-content', {
        body: { hotelCode }
      });

      if (functionError) {
        console.error('❌ Hotel images function error:', functionError);
        throw new Error(functionError.message || 'Failed to fetch hotel images');
      }

      if (data?.success) {
        const fetchedImages = data.images || [];
        setImages(fetchedImages);
        console.log(`✅ Found ${fetchedImages.length} enhanced images for hotel ${hotelCode}`);
        
        if (fetchedImages.length === 0) {
          console.log('📷 No enhanced images available for hotel:', hotelCode);
        }
      } else {
        throw new Error(data?.error || 'Failed to fetch hotel images');
      }
    } catch (err: any) {
      console.error('❌ Hotel images error:', err);
      const errorMessage = err.message || 'Failed to fetch hotel images';
      setError(errorMessage);
      setImages([]);
      
      // Only show toast for non-credential errors
      if (!err.message?.includes('credentials') && !err.message?.includes('authentication')) {
        toast({
          title: "Image Loading Issue",
          description: "Hotel images temporarily unavailable",
          variant: "default"
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    images,
    loading,
    error,
    fetchImages
  };
};