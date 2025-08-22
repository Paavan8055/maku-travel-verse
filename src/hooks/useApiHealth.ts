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
  }, []);

  const checkApiHealth = async () => {
    try {
      setLoading(true);
      
      // Test activities API with minimal request
      let activitiesAvailable = true;
      try {
        const { data: activitiesTest, error: activitiesError } = await supabase.functions.invoke('amadeus-activity-search', {
          body: {
            destination: 'sydney',
            date: new Date().toISOString().split('T')[0],
            participants: 2
          }
        });
        
        // If we get an auth error or service unavailable, mark as unavailable
        if (activitiesError || !activitiesTest) {
          activitiesAvailable = false;
          logger.warn('Activities API unavailable:', activitiesError);
        }
      } catch (error) {
        activitiesAvailable = false;
        logger.error('Activities API health check failed:', error);
      }

      // Test hotels API (simpler check)
      let hotelsAvailable = true;
      try {
        const { data: hotelsTest, error: hotelsError } = await supabase.functions.invoke('amadeus-hotel-search', {
          body: {
            destination: 'sydney',
            checkIn: new Date().toISOString().split('T')[0],
            checkOut: new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0],
            adults: 1
          }
        });
        
        if (hotelsError) {
          hotelsAvailable = false;
          logger.warn('Hotels API might be unavailable:', hotelsError);
        }
      } catch (error) {
        hotelsAvailable = false;
        logger.error('Hotels API health check failed:', error);
      }

      // For flights, assume available if we have the edge function
      // (we can expand this check later)
      const flightsAvailable = true;
      const transfersAvailable = true;

      setApiHealth({
        activities: activitiesAvailable,
        hotels: hotelsAvailable,
        flights: flightsAvailable,
        transfers: transfersAvailable,
      });

    } catch (error) {
      logger.error('API health check failed:', error);
      // On error, assume all APIs are available to not break user experience
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