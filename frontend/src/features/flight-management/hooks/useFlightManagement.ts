import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface FlightManagementActions {
  // Flight Exchange
  getExchangeOptions: (pnrLocator: string, userId?: string) => Promise<any>;
  processExchange: (pnrLocator: string, selectedOption: any, userId?: string) => Promise<any>;
  
  // Seat Selection
  getSeatMap: (pnrLocator: string, flightSegmentId: string, userId?: string) => Promise<any>;
  selectSeats: (pnrLocator: string, flightSegmentId: string, seatSelections: any[], userId?: string) => Promise<any>;
  
  // Air Extras
  getAvailableExtras: (pnrLocator: string, flightSegmentId: string, userId?: string) => Promise<any>;
  bookExtras: (pnrLocator: string, flightSegmentId: string, extraSelections: any[], userId?: string) => Promise<any>;
  
  // Travel Alerts
  checkTravelAlerts: (pnrLocator: string, userId?: string) => Promise<any>;
  getFlightStatus: (pnrLocator: string, flightNumber?: string) => Promise<any>;
  acknowledgeAlert: (alertId: string) => Promise<any>;
  
  // PNR Management
  retrievePnr: (pnrLocator: string, userId?: string) => Promise<any>;
  modifyPnr: (pnrLocator: string, modificationData: any, userId?: string) => Promise<any>;
  cancelPnr: (pnrLocator: string, userId?: string) => Promise<any>;
}

export const useFlightManagement = (): FlightManagementActions & {
  isLoading: boolean;
  error: string | null;
} => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleApiCall = useCallback(async (
    functionName: string,
    payload: any,
    successMessage?: string
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: apiError } = await supabase.functions.invoke(functionName, {
        body: payload
      });

      if (apiError) throw apiError;

      if (!data.success) {
        throw new Error(data.error || `${functionName} operation failed`);
      }

      if (successMessage) {
        toast({
          title: "Success",
          description: successMessage,
        });
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Operation failed';
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Flight Exchange Methods
  const getExchangeOptions = useCallback(async (pnrLocator: string, userId?: string) => {
    return handleApiCall('sabre-flight-exchange', {
      action: 'get_exchange_options',
      pnrLocator,
      userId
    });
  }, [handleApiCall]);

  const processExchange = useCallback(async (pnrLocator: string, selectedOption: any, userId?: string) => {
    return handleApiCall('sabre-flight-exchange', {
      action: 'process_exchange',
      pnrLocator,
      selectedOption,
      userId
    }, 'Flight exchange completed successfully');
  }, [handleApiCall]);

  // Seat Selection Methods
  const getSeatMap = useCallback(async (pnrLocator: string, flightSegmentId: string, userId?: string) => {
    return handleApiCall('sabre-seat-selection', {
      action: 'get_seatmap',
      pnrLocator,
      flightSegmentId,
      userId
    });
  }, [handleApiCall]);

  const selectSeats = useCallback(async (pnrLocator: string, flightSegmentId: string, seatSelections: any[], userId?: string) => {
    return handleApiCall('sabre-seat-selection', {
      action: 'select_seats',
      pnrLocator,
      flightSegmentId,
      seatSelections,
      userId
    }, 'Seats selected successfully');
  }, [handleApiCall]);

  // Air Extras Methods
  const getAvailableExtras = useCallback(async (pnrLocator: string, flightSegmentId: string, userId?: string) => {
    return handleApiCall('sabre-air-extras', {
      action: 'get_available',
      pnrLocator,
      flightSegmentId,
      userId
    });
  }, [handleApiCall]);

  const bookExtras = useCallback(async (pnrLocator: string, flightSegmentId: string, extraSelections: any[], userId?: string) => {
    return handleApiCall('sabre-air-extras', {
      action: 'book_extras',
      pnrLocator,
      flightSegmentId,
      extraSelections,
      userId
    }, 'Air extras booked successfully');
  }, [handleApiCall]);

  // Travel Alerts Methods
  const checkTravelAlerts = useCallback(async (pnrLocator: string, userId?: string) => {
    return handleApiCall('sabre-travel-alerts', {
      action: 'check_alerts',
      pnrLocator,
      userId
    });
  }, [handleApiCall]);

  const getFlightStatus = useCallback(async (pnrLocator: string, flightNumber?: string) => {
    return handleApiCall('sabre-travel-alerts', {
      action: 'get_flight_status',
      pnrLocator,
      flightNumber
    });
  }, [handleApiCall]);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    return handleApiCall('sabre-travel-alerts', {
      action: 'acknowledge_alert',
      alertId
    }, 'Alert acknowledged');
  }, [handleApiCall]);

  // PNR Management Methods
  const retrievePnr = useCallback(async (pnrLocator: string, userId?: string) => {
    return handleApiCall('sabre-pnr-management', {
      action: 'retrieve',
      pnrLocator,
      userId
    });
  }, [handleApiCall]);

  const modifyPnr = useCallback(async (pnrLocator: string, modificationData: any, userId?: string) => {
    return handleApiCall('sabre-pnr-management', {
      action: 'modify',
      pnrLocator,
      modificationData,
      userId
    }, 'PNR modified successfully');
  }, [handleApiCall]);

  const cancelPnr = useCallback(async (pnrLocator: string, userId?: string) => {
    return handleApiCall('sabre-pnr-management', {
      action: 'cancel',
      pnrLocator,
      userId
    }, 'PNR cancelled successfully');
  }, [handleApiCall]);

  return {
    isLoading,
    error,
    // Flight Exchange
    getExchangeOptions,
    processExchange,
    // Seat Selection
    getSeatMap,
    selectSeats,
    // Air Extras
    getAvailableExtras,
    bookExtras,
    // Travel Alerts
    checkTravelAlerts,
    getFlightStatus,
    acknowledgeAlert,
    // PNR Management
    retrievePnr,
    modifyPnr,
    cancelPnr
  };
};