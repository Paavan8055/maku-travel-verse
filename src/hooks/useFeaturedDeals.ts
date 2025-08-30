import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import logger from '@/utils/logger';

interface FeaturedDeal {
  id: string;
  type: 'hotel' | 'flight' | 'activity';
  name: string;
  location: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviews?: number;
  image: string;
  verified?: boolean;
  badge?: string;
  duration?: string;
  airline?: string;
  amenities?: any[];
  marketplace?: string;
  from?: string;
  to?: string;
  stops?: string;
}

interface FeaturedDealsState {
  hotels: FeaturedDeal[];
  flights: FeaturedDeal[];
  activities: FeaturedDeal[];
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
}

const FEATURED_DESTINATIONS = [
  { city: 'SYD', country: 'Australia', name: 'Sydney', coords: { lat: -33.8688, lng: 151.2093 } },
  { city: 'NYC', country: 'USA', name: 'New York', coords: { lat: 40.7128, lng: -74.0060 } },
  { city: 'PAR', country: 'France', name: 'Paris', coords: { lat: 48.8566, lng: 2.3522 } },
  { city: 'TYO', country: 'Japan', name: 'Tokyo', coords: { lat: 35.6762, lng: 139.6503 } }
];

const FEATURED_FLIGHT_ROUTES = [
  { from: 'SYD', to: 'MEL', fromName: 'Sydney', toName: 'Melbourne' },
  { from: 'LAX', to: 'NYC', fromName: 'Los Angeles', toName: 'New York' },
  { from: 'LHR', to: 'CDG', fromName: 'London', toName: 'Paris' },
  { from: 'NRT', to: 'ICN', fromName: 'Tokyo', toName: 'Seoul' }
];

// Enhanced fallback data with more variety
const FALLBACK_DATA: FeaturedDealsState = {
  hotels: [
    {
      id: "h1",
      type: "hotel",
      name: "Ocean View Resort & Spa",
      location: "Maldives",
      price: 350,
      originalPrice: 450,
      rating: 4.8,
      reviews: 1234,
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&h=192&fit=crop&fm=webp&q=70",
      verified: true,
      badge: "Best Deal",
      marketplace: "Family"
    },
    {
      id: "h2",
      type: "hotel",
      name: "Urban Luxury Suites",
      location: "Sydney, Australia",
      price: 280,
      originalPrice: 350,
      rating: 4.7,
      reviews: 892,
      image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=300&h=192&fit=crop&fm=webp&q=70",
      verified: true,
      badge: "City Center",
      marketplace: "Solo"
    },
    {
      id: "h3",
      type: "hotel",
      name: "Mountain Lodge Retreat",
      location: "Swiss Alps",
      price: 220,
      originalPrice: 290,
      rating: 4.9,
      reviews: 2156,
      image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=300&h=192&fit=crop&fm=webp&q=70",
      verified: true,
      badge: "Pet Friendly",
      marketplace: "Pet"
    },
    {
      id: "h4",
      type: "hotel",
      name: "Zen Wellness Resort",
      location: "Bali, Indonesia",
      price: 180,
      originalPrice: 240,
      rating: 4.9,
      reviews: 756,
      image: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=300&h=192&fit=crop&fm=webp&q=70",
      verified: true,
      badge: "Spa Special",
      marketplace: "Spiritual"
    }
  ],
  flights: [
    {
      id: "f1",
      type: "flight",
      name: "Sydney to Melbourne",
      from: "Sydney",
      to: "Melbourne",
      location: "Australia",
      price: 180,
      originalPrice: 250,
      airline: "Qantas",
      duration: "1h 30m",
      stops: "Direct",
      rating: 4.6,
      image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=300&h=130&fit=crop&fm=webp&q=70"
    },
    {
      id: "f2",
      type: "flight",
      name: "London to Tokyo",
      from: "London",
      to: "Tokyo",
      location: "International",
      price: 750,
      originalPrice: 950,
      airline: "Japan Airlines",
      duration: "11h 45m",
      stops: "Direct",
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1544168190-79c17527004f?w=300&h=130&fit=crop&fm=webp&q=70"
    }
  ],
  activities: [
    {
      id: "a1",
      type: "activity",
      name: "Harbour Bridge Climb",
      location: "Sydney, Australia",
      price: 120,
      originalPrice: 160,
      duration: "3 hours",
      rating: 4.9,
      reviews: 342,
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop&fm=webp&q=80"
    },
    {
      id: "a2",
      type: "activity",
      name: "Cooking Class with Local Chef",
      location: "Tuscany, Italy",
      price: 85,
      originalPrice: 110,
      duration: "4 hours",
      rating: 4.8,
      reviews: 567,
      image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=200&fit=crop&fm=webp&q=80"
    }
  ],
  loading: false,
  error: null,
  lastFetched: null
};

export const useFeaturedDeals = () => {
  const [state, setState] = useState<FeaturedDealsState>(FALLBACK_DATA);

  const transformApiData = useCallback((apiResponse: any, type: string): FeaturedDeal[] => {
    // Check if we have API response data (even if it's demo data)
    const apiData = apiResponse?.data?.data || apiResponse?.data?.[`${type}s`] || apiResponse?.data;
    
    if (!Array.isArray(apiData)) return [];
    
    return apiData.slice(0, 4).map((item: any, index: number) => {
      const isDemo = item.isDemoData || apiResponse?.data?.meta?.isDemoData;
      const baseId = `${type}_${isDemo ? 'demo' : 'live'}_${Date.now()}_${index}`;
      
      if (type === 'hotel') {
        return {
          id: baseId,
          type: 'hotel' as const,
          name: item.name || `Premium Hotel ${index + 1}`,
          location: item.address || item.location || item.city || 'Prime Location',
          price: Math.round(item.price?.amount || 150 + (index * 50)),
          originalPrice: Math.round((item.price?.amount || 150 + (index * 50)) * 1.3),
          rating: item.rating?.score || item.rating || (4.5 + (Math.random() * 0.4)),
          reviews: item.rating?.reviews || Math.floor(Math.random() * 1000) + 200,
          image: `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&h=192&fit=crop&fm=webp&q=70&sig=${index}`,
          verified: true,
          badge: isDemo ? 'Demo Data' : ['Best Deal', 'Top Rated', 'Exclusive', 'Limited Time'][index % 4],
          marketplace: ['Family', 'Solo', 'Pet', 'Spiritual'][index % 4]
        };
      }
      
      if (type === 'flight') {
        return {
          id: baseId,
          type: 'flight' as const,
          name: `${item.departure?.airport || item.from || 'SYD'} to ${item.arrival?.airport || item.to || 'MEL'}`,
          from: item.departure?.city || item.from || 'Sydney',
          to: item.arrival?.city || item.to || 'Melbourne',
          location: 'Flight Route',
          price: Math.round(item.price?.amount || 200 + (index * 100)),
          originalPrice: Math.round((item.price?.amount || 200 + (index * 100)) * 1.25),
          airline: item.airline || 'Demo Airways',
          duration: item.duration || '2h 30m',
          stops: item.stops || 'Direct',
          rating: 4.4 + (Math.random() * 0.5),
          image: `https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=300&h=130&fit=crop&fm=webp&q=70&sig=${index}`
        };
      }
      
      if (type === 'activity') {
        return {
          id: baseId,
          type: 'activity' as const,
          name: item.name || `Exciting Activity ${index + 1}`,
          location: item.location || 'Sydney',
          price: Math.round(item.price?.amount || 80 + (index * 40)),
          originalPrice: Math.round((item.price?.amount || 80 + (index * 40)) * 1.4),
          duration: item.duration || `${2 + index} hours`,
          rating: item.rating?.score || (4.6 + (Math.random() * 0.3)),
          reviews: item.rating?.reviews || Math.floor(Math.random() * 500) + 100,
          image: `https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=300&h=200&fit=crop&fm=webp&q=80&sig=${index}`
        };
      }
      
      return {
        id: baseId,
        type: type as any,
        name: 'Featured Deal',
        location: 'Unknown',
        price: 100,
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop&fm=webp&q=80'
      };
    });
  }, []);

  const fetchRealDeals = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Get today and tomorrow for search dates
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const todayStr = today.toISOString().split('T')[0];
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      // Fetch multiple types in parallel with shorter timeouts
      const promises = [
        // Hotels - try a few popular destinations
        supabase.functions.invoke('provider-rotation', {
          body: {
            searchType: 'hotel',
            params: {
              cityCode: 'SYD',
              checkInDate: todayStr,
              checkOutDate: tomorrowStr,
              adults: 2,
              roomQuantity: 1,
              timeout: 8000
            }
          }
        }).catch(() => null),
        
        // Flights - try popular routes
        supabase.functions.invoke('provider-rotation', {
          body: {
            searchType: 'flight',
            params: {
              originLocationCode: 'SYD',
              destinationLocationCode: 'MEL',
              departureDate: nextWeek.toISOString().split('T')[0],
              adults: 1,
              timeout: 8000
            }
          }
        }).catch(() => null),
        
        // Activities - try Sydney
        supabase.functions.invoke('provider-rotation', {
          body: {
            searchType: 'activity',
            params: {
              destination: 'sydney',
              date: todayStr,
              participants: 2,
              radius: 20,
              timeout: 8000
            }
          }
        }).catch(() => null)
      ];

      const [hotelResult, flightResult, activityResult] = await Promise.allSettled(promises);
      
      let newHotels = FALLBACK_DATA.hotels;
      let newFlights = FALLBACK_DATA.flights;
      let newActivities = FALLBACK_DATA.activities;
      
      // Process hotel results
      if (hotelResult.status === 'fulfilled' && hotelResult.value?.data) {
        const transformed = transformApiData(hotelResult.value.data, 'hotel');
        if (transformed.length > 0) {
          newHotels = transformed;
          logger.info('✅ Featured deals: Using hotel data', { 
            count: transformed.length,
            isDemo: hotelResult.value.data?.meta?.isDemoData 
          });
        }
      }
      
      // Process flight results
      if (flightResult.status === 'fulfilled' && flightResult.value?.data) {
        const transformed = transformApiData(flightResult.value.data, 'flight');
        if (transformed.length > 0) {
          newFlights = transformed;
          logger.info('✅ Featured deals: Using flight data', { 
            count: transformed.length,
            isDemo: flightResult.value.data?.meta?.isDemoData 
          });
        }
      }
      
      // Process activity results
      if (activityResult.status === 'fulfilled' && activityResult.value?.data) {
        const transformed = transformApiData(activityResult.value.data, 'activity');
        if (transformed.length > 0) {
          newActivities = transformed;
          logger.info('✅ Featured deals: Using activity data', { 
            count: transformed.length,
            isDemo: activityResult.value.data?.meta?.isDemoData 
          });
        }
      }
      
      setState({
        hotels: newHotels,
        flights: newFlights,
        activities: newActivities,
        loading: false,
        error: null,
        lastFetched: new Date()
      });
      
      logger.info('✅ Featured deals refresh completed', {
        hotelsCount: newHotels.length,
        flightsCount: newFlights.length,  
        activitiesCount: newActivities.length,
        hasApiData: newHotels.some(h => h.id.includes('demo') || h.id.includes('live')) ||
                    newFlights.some(f => f.id.includes('demo') || f.id.includes('live')) ||
                    newActivities.some(a => a.id.includes('demo') || a.id.includes('live'))
      });
      
    } catch (error) {
      logger.error('❌ Featured deals fetch failed', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load latest deals',
        // Keep existing data on error
      }));
    }
  }, [transformApiData]);

  // Initial load and periodic refresh
  useEffect(() => {
    // Don't fetch immediately to avoid slowing down page load
    const timer = setTimeout(fetchRealDeals, 2000);
    
    // Refresh every 10 minutes
    const interval = setInterval(fetchRealDeals, 10 * 60 * 1000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchRealDeals]);

  const refresh = useCallback(() => {
    fetchRealDeals();
  }, [fetchRealDeals]);

  return {
    ...state,
    refresh
  };
};
