/**
 * Photo Retrieval Service for MAKU.Travel
 * 
 * Handles server-side photo retrieval and caching for hotels from multiple providers.
 * Integrates with Amadeus photo API and HotelBeds image services.
 */

import { supabase } from '@/integrations/supabase/client';
import logger from '@/utils/logger';

export interface HotelPhoto {
  url: string;
  caption: string;
  type: string;
  width?: number;
  height?: number;
  category?: string;
}

export interface PhotoRetrievalResult {
  success: boolean;
  photos: HotelPhoto[];
  source: 'amadeus' | 'hotelbeds' | 'sabre' | 'fallback';
  cached?: boolean;
  error?: string;
}

/**
 * PhotoRetriever Class
 * Manages photo retrieval from multiple sources with caching and fallbacks
 */
export class PhotoRetriever {
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly MAX_PHOTOS = 8;
  private static readonly FALLBACK_IMAGES = [
    '/assets/hotel-business.jpg',
    '/assets/hotel-luxury.jpg',
    '/assets/hotel-resort.jpg'
  ];

  /**
   * Retrieve photos for a hotel with intelligent source selection
   */
  static async getHotelPhotos(
    hotelId: string, 
    provider: 'amadeus' | 'hotelbeds' | 'sabre' | 'auto' = 'auto',
    useCache: boolean = true
  ): Promise<PhotoRetrievalResult> {
    try {
      // Check cache first if enabled
      if (useCache) {
        const cachedPhotos = await this.getCachedPhotos(hotelId);
        if (cachedPhotos) {
          return {
            success: true,
            photos: cachedPhotos,
            source: 'amadeus', // Most cached photos are from Amadeus
            cached: true
          };
        }
      }

      // Try provider-specific retrieval
      let result: PhotoRetrievalResult;

      // Try specific provider first
      if (provider === 'amadeus') {
        result = await this.tryAmadeusPhotos(hotelId);
      } else if (provider === 'hotelbeds') {
        result = await this.tryHotelBedsPhotos(hotelId);
      } else if (provider === 'sabre') {
        result = await this.trySabrePhotos(hotelId);
      } else {
        // Auto mode: try HotelBeds first (usually more photos), then Sabre, then Amadeus
        result = await this.tryHotelBedsPhotos(hotelId);
        if (!result || result.photos.length === 0) {
          result = await this.trySabrePhotos(hotelId);
        }
        if (!result || result.photos.length === 0) {
          result = await this.tryAmadeusPhotos(hotelId);
        }
      }

      // Fallback if no provider succeeded
      if (!result || result.photos.length === 0) {
        result = this.getFallbackPhotos();
      }

      // Cache successful results
      if (result.success && result.photos.length > 0 && useCache) {
        await this.cachePhotos(hotelId, result.photos, result.source);
      }

      return result;

    } catch (error) {
      logger.error('Photo retrieval error:', error);
      return {
        success: false,
        photos: [],
        source: 'fallback',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Try to get photos from Amadeus API
   */
  private static async tryAmadeusPhotos(hotelId: string): Promise<PhotoRetrievalResult | null> {
    try {
      const { data, error } = await supabase.functions.invoke('amadeus-hotel-photos', {
        body: { hotelId }
      });

      if (error) {
        logger.warn('Amadeus photos API error:', error);
        return null;
      }

      if (data?.success && data.photos?.length > 0) {
        const processedPhotos = this.processAmadeusPhotos(data.photos);
        return {
          success: true,
          photos: processedPhotos.slice(0, this.MAX_PHOTOS),
          source: 'amadeus'
        };
      }

      return null;
    } catch (error) {
      logger.warn('Amadeus photos request failed:', error);
      return null;
    }
  }

  /**
   * Try to get photos from HotelBeds content API
   */
  private static async tryHotelBedsPhotos(hotelId: string): Promise<PhotoRetrievalResult | null> {
    try {
      const { data, error } = await supabase.functions.invoke('hotelbeds-content', {
        body: { 
          hotelCodes: [hotelId],
          language: 'en',
          fields: ['images']
        }
      });

      if (error) {
        logger.warn('HotelBeds content API error:', error);
        return null;
      }

      if (data?.success && data.hotels?.length > 0) {
        const hotel = data.hotels[0];
        if (hotel.images && hotel.images.length > 0) {
          const processedPhotos = this.processHotelBedsPhotos(hotel.images);
          return {
            success: true,
            photos: processedPhotos.slice(0, this.MAX_PHOTOS),
            source: 'hotelbeds'
          };
        }
      }

      return null;
    } catch (error) {
      logger.warn('HotelBeds photos request failed:', error);
      return null;
    }
  }

  /**
   * Process Amadeus photo data into standard format
   */
  private static processAmadeusPhotos(photos: any[]): HotelPhoto[] {
    return photos.map(photo => ({
      url: photo.url || photo.links?.href,
      caption: photo.caption || photo.category || 'Hotel photo',
      type: photo.category || 'exterior',
      category: photo.category
    })).filter(photo => photo.url);
  }

  /**
   * Process HotelBeds photo data into standard format
   */
  private static processHotelBedsPhotos(images: any[]): HotelPhoto[] {
    return images.map(image => ({
      url: image.path,
      caption: image.typeDescription || 'Hotel photo',
      type: image.typeCode || 'exterior',
      category: image.typeDescription
    })).filter(photo => photo.url);
  }

  /**
   * Get fallback photos when APIs fail
   */
  private static getFallbackPhotos(): PhotoRetrievalResult {
    const photos: HotelPhoto[] = this.FALLBACK_IMAGES.map((url, index) => ({
      url,
      caption: `Hotel photo ${index + 1}`,
      type: 'exterior',
      category: 'fallback'
    }));

    return {
      success: true,
      photos,
      source: 'fallback'
    };
  }

  /**
   * Cache photos in localStorage with expiration
   */
  private static async cachePhotos(hotelId: string, photos: HotelPhoto[], source: string): Promise<void> {
    try {
      const cacheKey = `hotel-photos-${hotelId}`;
      const cacheData = {
        photos,
        source,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.CACHE_DURATION
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      logger.warn('Failed to cache photos:', error);
    }
  }

  /**
   * Get cached photos if still valid
   */
  private static async getCachedPhotos(hotelId: string): Promise<HotelPhoto[] | null> {
    try {
      const cacheKey = `hotel-photos-${hotelId}`;
      const cached = localStorage.getItem(cacheKey);

      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      
      // Check if cache is still valid
      if (Date.now() > cacheData.expiresAt) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return cacheData.photos;
    } catch (error) {
      logger.warn('Failed to read cached photos:', error);
      return null;
    }
  }

  /**
   * Try retrieving photos from Sabre Hotel Content API
   */
  static async trySabrePhotos(hotelId: string): Promise<PhotoRetrievalResult | null> {
    try {
      logger.info('Attempting Sabre photo retrieval', { hotelId });

      const { data, error } = await supabase.functions.invoke('sabre-hotel-content', {
        body: { hotelId }
      });

      if (error) {
        logger.warn('Sabre API error:', error);
        return null;
      }

      if (data?.success && data.images?.length > 0) {
        const photos = this.processSabrePhotos(data.images);
        logger.info(`Retrieved ${photos.length} photos from Sabre`, { hotelId });
        
        return {
          success: true,
          photos,
          source: 'sabre'
        };
      }

      return null;
    } catch (error) {
      logger.error('Sabre photo retrieval failed:', error);
      return null;
    }
  }

  /**
   * Process Sabre photo data into standard format
   */
  private static processSabrePhotos(images: any[]): HotelPhoto[] {
    return images.map(image => ({
      url: image.url,
      caption: image.caption || 'Hotel Image',
      type: 'photo',
      category: image.category || 'other',
      width: image.width,
      height: image.height
    })).slice(0, this.MAX_PHOTOS);
  }

  /**
   * Clear cached photos for a specific hotel
   */
  static clearCache(hotelId?: string): void {
    try {
      if (hotelId) {
        localStorage.removeItem(`hotel-photos-${hotelId}`);
      } else {
        // Clear all photo caches
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('hotel-photos-')) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (error) {
      logger.warn('Failed to clear photo cache:', error);
    }
  }

  /**
   * Preload photos for multiple hotels
   */
  static async preloadPhotos(hotelIds: string[]): Promise<void> {
    const preloadPromises = hotelIds.map(hotelId => 
      this.getHotelPhotos(hotelId, 'auto', true)
    );

    try {
      await Promise.allSettled(preloadPromises);
      logger.info(`Preloaded photos for ${hotelIds.length} hotels`);
    } catch (error) {
      logger.warn('Photo preloading failed:', error);
    }
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { totalCached: number; totalSize: string } {
    try {
      const keys = Object.keys(localStorage);
      const photoKeys = keys.filter(key => key.startsWith('hotel-photos-'));
      
      let totalSize = 0;
      photoKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      });

      return {
        totalCached: photoKeys.length,
        totalSize: `${(totalSize / 1024).toFixed(2)} KB`
      };
    } catch (error) {
      return { totalCached: 0, totalSize: '0 KB' };
    }
  }
}

export default PhotoRetriever;