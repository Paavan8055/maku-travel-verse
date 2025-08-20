// testimport { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string | null;
  adults?: number;
  children?: number;
  infants?: number;
  cabinClass?: string;
}

export interface UnifiedFlightSearchState {
  offers: any[];
  loading: boolean;
  error: string | null;
}

export default function useUnifiedFlightSearch(params: FlightSearchParams): UnifiedFlightSearchState {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOffers = async () => {
      if (!params.origin || !params.destination || !params.departureDate) {
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const amadeusPromise = supabase.functions.invoke('amadeus-flight-offers', {
          body: params,
        });
        const sabrePromise = supabase.functions.invoke('sabre-flight-offers', {
          body: params,
        });
        const [amadeusRes, sabreRes] = await Promise.allSettled([amadeusPromise, sabrePromise]);
        let combinedOffers: any[] = [];
        if (
          amadeusRes.status === 'fulfilled' &&
          (amadeusRes.value?.data?.offers || amadeusRes.value?.data?.data?.offers)
        ) {
          const amadeusData = amadeusRes.value.data;
          const offersFromAmadeus =
            amadeusData.offers || amadeusData.data?.offers || [];
          if (Array.isArray(offersFromAmadeus)) {
            combinedOffers = combinedOffers.concat(
              offersFromAmadeus.map((o: any) => ({
                ...o,
                supplier: 'amadeus',
              })),
            );
          }
        }
        if (
          sabreRes.status === 'fulfilled' &&
          (sabreRes.value?.data?.offers || sabreRes.value?.data?.data?.offers)
        ) {
          const sabreData = sabreRes.value.data;
          const offersFromSabre =
            sabreData.offers || sabreData.data?.offers || [];
          if (Array.isArray(offersFromSabre)) {
            combinedOffers = combinedOffers.concat(
              offersFromSabre.map((o: any) => ({
                ...o,
                supplier: 'sabre',
              })),
            );
          }
        }
        setOffers(combinedOffers);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch flight offers');
      }
      setLoading(false);
    };
    fetchOffers();
  }, [
    params.origin,
    params.destination,
    params.departureDate,
    params.returnDate,
    params.adults,
    params.children,
    params.infants,
    params.cabinClass,
  ]);

  return { offers, loading, error };
}
