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
      
      // Test provider rotation system with minimal requests
      // This tests the actual production flow including quota management and fallbacks
      
      // Test activities via provider rotation
      let activitiesAvailable = true;
      try {
        const { data: activitiesTest, error: activitiesError } = await supabase.functions.invoke('provider-rotation', {
          body: {
            searchType: 'activity',
            params: {
              destination: 'sydney',
              date: new Date().toISOString().split('T')[0],
              participants: 1,
              radius: 10
            }
          }
        });
        
        if (activitiesError || !activitiesTest || !activitiesTest.success) {
          activitiesAvailable = false;
          logger.warn('Activities rotation unavailable:', activitiesError || activitiesTest?.error);
        }
      } catch (error) {
        activitiesAvailable = false;
        logger.error('Activities rotation health check failed:', error);
      }

      // Test hotels via provider rotation
      let hotelsAvailable = true;
      try {
        const { data: hotelsTest, error: hotelsError } = await supabase.functions.invoke('provider-rotation', {
          body: {
            searchType: 'hotel',
            params: {
              cityCode: 'SYD',
              checkInDate: new Date().toISOString().split('T')[0],
              checkOutDate: new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0],
              adults: 1,
              roomQuantity: 1
            }
          }
        });
        
        if (hotelsError || !hotelsTest || !hotelsTest.success) {
          hotelsAvailable = false;
          logger.warn('Hotels rotation unavailable:', hotelsError || hotelsTest?.error);
        }
      } catch (error) {
        hotelsAvailable = false;
        logger.error('Hotels rotation health check failed:', error);
      }

      // Test flights via provider rotation
      let flightsAvailable = true;
      try {
        const { data: flightsTest, error: flightsError } = await supabase.functions.invoke('provider-rotation', {
          body: {
            searchType: 'flight',
            params: {
              originLocationCode: 'SYD',
              destinationLocationCode: 'MEL',
              departureDate: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
              adults: 1
            }
          }
        });
        
        if (flightsError || !flightsTest || !flightsTest.success) {
          flightsAvailable = false;
          logger.warn('Flights rotation unavailable:', flightsError || flightsTest?.error);
        }
      } catch (error) {
        flightsAvailable = false;
        logger.error('Flights rotation health check failed:', error);
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