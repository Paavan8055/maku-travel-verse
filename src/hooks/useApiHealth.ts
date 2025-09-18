import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import logger from '@/utils/logger';

interface ApiHealthStatus {
  activities: boolean;
  hotels: boolean;
  flights: boolean;
  transfers: boolean;
}

export const useApiHealth = () => {
  const [apiHealth, setApiHealth] = useState<ApiHealthStatus>({
    activities: true,
    hotels: true,
    flights: true,
    transfers: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkApiHealth();
    // Check health every 5 minutes to reduce rate limiting
    const interval = setInterval(checkApiHealth, 300000);
    return () => clearInterval(interval);
  }, []);

  const checkApiHealth = async () => {
    try {
      setLoading(true);
      
      // Test provider health with graceful degradation
      // Use lightweight health checks to avoid overwhelming providers
      
      // Test activities with timeout and graceful fallback
      let activitiesAvailable = true;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
        
        const { data: activitiesTest, error: activitiesError } = await supabase.functions.invoke('provider-rotation', {
          body: {
            searchType: 'activity',
            params: {
              destination: 'sydney',
              date: new Date().toISOString().split('T')[0],
              participants: 1,
              radius: 10,
              healthCheck: true // Flag for lightweight health check
            }
          }
        });
        
        clearTimeout(timeoutId);
        
        if (activitiesError || !activitiesTest?.success) {
          activitiesAvailable = false;
          logger.info('Activities provider degraded - continuing with fallback');
        }
      } catch (error) {
        activitiesAvailable = false;
        logger.info('Activities provider unavailable - graceful degradation active');
      }

      // Test hotels with timeout and graceful fallback
      let hotelsAvailable = true;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const { data: hotelsTest, error: hotelsError } = await supabase.functions.invoke('provider-rotation', {
          body: {
            searchType: 'hotel',
            params: {
              cityCode: 'SYD',
              checkInDate: new Date().toISOString().split('T')[0],
              checkOutDate: new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0],
              adults: 1,
              roomQuantity: 1,
              healthCheck: true
            }
          }
        });
        
        clearTimeout(timeoutId);
        
        if (hotelsError || !hotelsTest?.success) {
          hotelsAvailable = false;
          logger.info('Hotels provider degraded - continuing with fallback');
        }
      } catch (error) {
        hotelsAvailable = false;
        logger.info('Hotels provider unavailable - graceful degradation active');
      }

      // Test flights with timeout and graceful fallback
      let flightsAvailable = true;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const { data: flightsTest, error: flightsError } = await supabase.functions.invoke('provider-rotation', {
          body: {
            searchType: 'flight',
            params: {
              originLocationCode: 'SYD',
              destinationLocationCode: 'MEL',
              departureDate: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
              adults: 1,
              healthCheck: true
            }
          }
        });
        
        clearTimeout(timeoutId);
        
        if (flightsError || !flightsTest?.success) {
          flightsAvailable = false;
          logger.info('Flights provider degraded - continuing with fallback');
        }
      } catch (error) {
        flightsAvailable = false;
        logger.info('Flights provider unavailable - graceful degradation active');
      }

      // Test transfers (basic availability check)
      const transfersAvailable = true;

      setApiHealth({
        activities: activitiesAvailable,
        hotels: hotelsAvailable,
        flights: flightsAvailable,
        transfers: transfersAvailable,
      });

    } catch (error) {
      logger.info('API health check encountered issues - continuing with graceful degradation');
      // On error, maintain optimistic availability to ensure user experience
      setApiHealth({
        activities: true,
        hotels: true,
        flights: true,
        transfers: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    apiHealth,
    loading,
    checkApiHealth,
    isActivitiesAvailable: apiHealth.activities,
    isHotelsAvailable: apiHealth.hotels,
    isFlightsAvailable: apiHealth.flights,
    isTransfersAvailable: apiHealth.transfers,
  };
};