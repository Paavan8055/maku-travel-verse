import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

// Unified travel state management for seamless cross-module experience
interface TravelState {
  destination: string;
  checkInDate: Date | null;
  checkOutDate: Date | null;
  adults: number;
  children: number;
  infants: number;
  rooms: number;
  cabin: 'economy' | 'premium' | 'business' | 'first';
  tripType: 'roundtrip' | 'oneway' | 'multicity';
  
  // Cross-module integration
  activeModule: 'flights' | 'hotels' | 'activities' | 'transfers';
  bundlePreferences: {
    includeFlights: boolean;
    includeHotels: boolean;
    includeActivities: boolean;
    includeTransfers: boolean;
  };
  
  // Smart suggestions based on user behavior
  recentSearches: TravelSearch[];
  favoriteDestinations: string[];
  
  // Real-time context
  weatherData?: WeatherInfo;
  localEvents?: LocalEvent[];
  crowdLevels?: CrowdInfo;
}

interface TravelSearch {
  id: string;
  destination: string;
  dates: { checkIn: Date; checkOut: Date };
  travelers: { adults: number; children: number };
  timestamp: Date;
  module: string;
}

interface WeatherInfo {
  temperature: number;
  condition: string;
  forecast: Array<{ date: string; temp: number; condition: string }>;
}

interface LocalEvent {
  id: string;
  name: string;
  date: Date;
  category: string;
  impact: 'low' | 'medium' | 'high';
}

interface CrowdInfo {
  level: 'low' | 'medium' | 'high';
  peak_times: string[];
  recommendation: string;
}

type TravelAction =
  | { type: 'SET_DESTINATION'; payload: string }
  | { type: 'SET_DATES'; payload: { checkIn: Date; checkOut: Date } }
  | { type: 'SET_TRAVELERS'; payload: { adults: number; children: number; infants?: number } }
  | { type: 'SET_ACTIVE_MODULE'; payload: TravelState['activeModule'] }
  | { type: 'UPDATE_BUNDLE_PREFERENCES'; payload: Partial<TravelState['bundlePreferences']> }
  | { type: 'ADD_RECENT_SEARCH'; payload: TravelSearch }
  | { type: 'SET_WEATHER_DATA'; payload: WeatherInfo }
  | { type: 'SET_LOCAL_EVENTS'; payload: LocalEvent[] }
  | { type: 'SET_CROWD_LEVELS'; payload: CrowdInfo }
  | { type: 'LOAD_FROM_URL_PARAMS'; payload: URLSearchParams };

const initialState: TravelState = {
  destination: '',
  checkInDate: null,
  checkOutDate: null,
  adults: 2,
  children: 0,
  infants: 0,
  rooms: 1,
  cabin: 'economy',
  tripType: 'roundtrip',
  activeModule: 'flights',
  bundlePreferences: {
    includeFlights: false,
    includeHotels: false,
    includeActivities: false,
    includeTransfers: false,
  },
  recentSearches: [],
  favoriteDestinations: [],
};

function travelReducer(state: TravelState, action: TravelAction): TravelState {
  switch (action.type) {
    case 'SET_DESTINATION':
      return { ...state, destination: action.payload };
    
    case 'SET_DATES':
      return { 
        ...state, 
        checkInDate: action.payload.checkIn,
        checkOutDate: action.payload.checkOut
      };
    
    case 'SET_TRAVELERS':
      return {
        ...state,
        adults: action.payload.adults,
        children: action.payload.children,
        infants: action.payload.infants || state.infants,
      };
    
    case 'SET_ACTIVE_MODULE':
      return { ...state, activeModule: action.payload };
    
    case 'UPDATE_BUNDLE_PREFERENCES':
      return {
        ...state,
        bundlePreferences: { ...state.bundlePreferences, ...action.payload }
      };
    
    case 'ADD_RECENT_SEARCH':
      const recentSearches = [action.payload, ...state.recentSearches.slice(0, 9)];
      return { ...state, recentSearches };
    
    case 'SET_WEATHER_DATA':
      return { ...state, weatherData: action.payload };
    
    case 'SET_LOCAL_EVENTS':
      return { ...state, localEvents: action.payload };
    
    case 'SET_CROWD_LEVELS':
      return { ...state, crowdLevels: action.payload };
    
    case 'LOAD_FROM_URL_PARAMS':
      const params = action.payload;
      return {
        ...state,
        destination: params.get('destination') || state.destination,
        checkInDate: params.get('checkIn') ? new Date(params.get('checkIn')!) : state.checkInDate,
        checkOutDate: params.get('checkOut') ? new Date(params.get('checkOut')!) : state.checkOutDate,
        adults: parseInt(params.get('adults') || state.adults.toString()),
        children: parseInt(params.get('children') || state.children.toString()),
      };
    
    default:
      return state;
  }
}

interface TravelContextType {
  state: TravelState;
  dispatch: React.Dispatch<TravelAction>;
  
  // Helper functions for cross-module navigation
  navigateToModule: (module: TravelState['activeModule'], preserveParams?: boolean) => void;
  createBundledSearch: () => void;
  getSmartSuggestions: () => TravelSearch[];
  
  // Real-time data fetchers
  fetchContextualData: (destination: string) => Promise<void>;
  isDataComplete: () => boolean;
  
  // Performance optimizations
  preloadModuleData: (module: TravelState['activeModule']) => void;
}

const TravelContext = createContext<TravelContextType | undefined>(undefined);

interface TravelProviderProps {
  children: ReactNode;
}

export const UnifiedTravelProvider: React.FC<TravelProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(travelReducer, initialState);
  const [searchParams] = useSearchParams();

  // Load initial state from URL parameters
  useEffect(() => {
    if (searchParams.toString()) {
      dispatch({ type: 'LOAD_FROM_URL_PARAMS', payload: searchParams });
    }
  }, [searchParams]);

  // Persist to localStorage for cross-session continuity
  useEffect(() => {
    const savedState = localStorage.getItem('unified-travel-state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        Object.entries(parsed).forEach(([key, value]) => {
          if (key === 'recentSearches' && Array.isArray(value)) {
            value.forEach(search => dispatch({ type: 'ADD_RECENT_SEARCH', payload: search }));
          }
        });
      } catch (error) {
        console.warn('Failed to load saved travel state:', error);
      }
    }
  }, []);

  // Save state changes to localStorage
  useEffect(() => {
    const stateToSave = {
      recentSearches: state.recentSearches,
      favoriteDestinations: state.favoriteDestinations,
      bundlePreferences: state.bundlePreferences,
    };
    localStorage.setItem('unified-travel-state', JSON.stringify(stateToSave));
  }, [state.recentSearches, state.favoriteDestinations, state.bundlePreferences]);

  const navigateToModule = (module: TravelState['activeModule'], preserveParams = true) => {
    dispatch({ type: 'SET_ACTIVE_MODULE', payload: module });
    
    if (preserveParams) {
      const params = new URLSearchParams();
      if (state.destination) params.set('destination', state.destination);
      if (state.checkInDate) params.set('checkIn', state.checkInDate.toISOString().split('T')[0]);
      if (state.checkOutDate) params.set('checkOut', state.checkOutDate.toISOString().split('T')[0]);
      if (state.adults > 0) params.set('adults', state.adults.toString());
      if (state.children > 0) params.set('children', state.children.toString());
      
      const url = `/search/${module}?${params.toString()}`;
      window.history.pushState({}, '', url);
    }
  };

  const createBundledSearch = () => {
    // Logic for creating multi-module search bundles
    const activeModules = Object.entries(state.bundlePreferences)
      .filter(([_, included]) => included)
      .map(([module, _]) => module.replace('include', '').toLowerCase());
    
    // Add to recent searches with bundle flag
    if (state.destination && state.checkInDate) {
      dispatch({
        type: 'ADD_RECENT_SEARCH',
        payload: {
          id: `bundle-${Date.now()}`,
          destination: state.destination,
          dates: { checkIn: state.checkInDate, checkOut: state.checkOutDate || state.checkInDate },
          travelers: { adults: state.adults, children: state.children },
          timestamp: new Date(),
          module: `bundle:${activeModules.join(',')}`,
        }
      });
    }
  };

  const getSmartSuggestions = (): TravelSearch[] => {
    // Return personalized suggestions based on search history and preferences
    return state.recentSearches
      .filter((search, index, self) => 
        index === self.findIndex(s => s.destination === search.destination)
      )
      .slice(0, 5);
  };

  const fetchContextualData = async (destination: string) => {
    try {
      // Mock implementation - would integrate with real APIs
      const weatherPromise = fetch(`/api/weather/${encodeURIComponent(destination)}`);
      const eventsPromise = fetch(`/api/events/${encodeURIComponent(destination)}`);
      const crowdPromise = fetch(`/api/crowds/${encodeURIComponent(destination)}`);
      
      const [weatherRes, eventsRes, crowdRes] = await Promise.allSettled([
        weatherPromise,
        eventsPromise,
        crowdPromise
      ]);

      // Process successful responses
      if (weatherRes.status === 'fulfilled' && weatherRes.value.ok) {
        const weatherData = await weatherRes.value.json();
        dispatch({ type: 'SET_WEATHER_DATA', payload: weatherData });
      }
      
      if (eventsRes.status === 'fulfilled' && eventsRes.value.ok) {
        const eventsData = await eventsRes.value.json();
        dispatch({ type: 'SET_LOCAL_EVENTS', payload: eventsData });
      }
      
      if (crowdRes.status === 'fulfilled' && crowdRes.value.ok) {
        const crowdData = await crowdRes.value.json();
        dispatch({ type: 'SET_CROWD_LEVELS', payload: crowdData });
      }
    } catch (error) {
      console.warn('Failed to fetch contextual data:', error);
    }
  };

  const isDataComplete = (): boolean => {
    return !!(state.destination && state.checkInDate && state.adults > 0);
  };

  const preloadModuleData = async (module: TravelState['activeModule']) => {
    // Preload data for smooth module transitions
    if (!isDataComplete()) return;
    
    try {
      const searchKey = `${state.destination}-${state.checkInDate?.toISOString().split('T')[0]}-${state.adults}`;
      
      // Check if data is already cached
      const cached = sessionStorage.getItem(`${module}-${searchKey}`);
      if (cached) return;
      
      // Preload module-specific data
      // Implementation would vary by module
      console.log(`Preloading data for ${module}...`);
      
    } catch (error) {
      console.warn(`Failed to preload data for ${module}:`, error);
    }
  };

  const value: TravelContextType = {
    state,
    dispatch,
    navigateToModule,
    createBundledSearch,
    getSmartSuggestions,
    fetchContextualData,
    isDataComplete,
    preloadModuleData,
  };

  return (
    <TravelContext.Provider value={value}>
      {children}
    </TravelContext.Provider>
  );
};

export const useUnifiedTravel = (): TravelContextType => {
  const context = useContext(TravelContext);
  if (!context) {
    throw new Error('useUnifiedTravel must be used within a UnifiedTravelProvider');
  }
  return context;
};

// Export types for use in other components
export type { TravelState, TravelSearch, WeatherInfo, LocalEvent, CrowdInfo };