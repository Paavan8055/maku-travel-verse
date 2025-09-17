import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ActivityFilters } from '../components/ActivityFilters';

export interface ActivitySearchParams {
  destination: string;
  date: string;
  participants: number;
}

export interface EnhancedActivity {
  id: string;
  name: string;
  title: string;
  description: string;
  shortDescription?: string;
  location: string;
  images: string[];
  photos?: string[];
  pictures?: string[];
  category: string;
  price: {
    total: number;
    currency: string;
    originalPrice?: number;
  };
  totalPrice?: number;
  duration: string;
  durationHours?: number;
  difficulty: string;
  rating: number;
  reviewCount: number;
  groupSize?: {
    min: number;
    max: number;
  };
  maxParticipants?: number;
  availability: string[];
  highlights: string[];
  included: string[];
  features: string[];
  cancellationPolicy: string;
  instantConfirmation: boolean;
  freeCancellation: boolean;
  provider: string;
  bookingLink?: string;
  minimumDuration?: string;
}

interface UseEnhancedActivitySearchReturn {
  activities: EnhancedActivity[];
  loading: boolean;
  error: string | null;
  searchActivities: (params: ActivitySearchParams) => Promise<void>;
  filteredActivities: EnhancedActivity[];
  applyFilters: (filters: ActivityFilters) => void;
  currentFilters: ActivityFilters;
  availableFilters: {
    categories: string[];
    maxPrice: number;
    features: string[];
  };
  pagination: {
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    totalItems: number;
    setPage: (page: number) => void;
    setItemsPerPage: (items: number) => void;
  };
  resetSearch: () => void;
}

const defaultFilters: ActivityFilters = {
  priceRange: [0, 500],
  duration: [],
  categories: [],
  rating: 0,
  groupSize: [1, 20],
  difficulty: [],
  features: [],
  sortBy: 'popularity',
  sortOrder: 'desc'
};

export const useEnhancedActivitySearch = (): UseEnhancedActivitySearchReturn => {
  const [activities, setActivities] = useState<EnhancedActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<ActivityFilters>(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [searchCache, setSearchCache] = useState<Map<string, EnhancedActivity[]>>(new Map());
  
  const { toast } = useToast();

  // Debounce filter changes to avoid excessive re-filtering
  const debouncedFilters = useDebounce(currentFilters, 300);

  // Normalize activity data from different provider formats
  const normalizeActivity = useCallback((rawActivity: any): EnhancedActivity => {
    return {
      id: rawActivity.id || rawActivity.activityId || Math.random().toString(36),
      name: rawActivity.name || rawActivity.title || 'Untitled Activity',
      title: rawActivity.title || rawActivity.name || 'Untitled Activity',
      description: rawActivity.description || rawActivity.shortDescription || '',
      shortDescription: rawActivity.shortDescription || rawActivity.description?.substring(0, 200) + '...',
      location: rawActivity.location || rawActivity.city || rawActivity.destination || 'Location TBD',
      images: rawActivity.images || rawActivity.photos || rawActivity.pictures || [],
      photos: rawActivity.photos || rawActivity.images || rawActivity.pictures || [],
      pictures: rawActivity.pictures || rawActivity.images || rawActivity.photos || [],
      category: rawActivity.category || rawActivity.type || 'Sightseeing',
      price: {
        total: parseFloat(rawActivity.price?.total || rawActivity.totalPrice || rawActivity.price?.amount || rawActivity.price || 0),
        currency: rawActivity.price?.currency || rawActivity.currency || 'AUD',
        originalPrice: parseFloat(rawActivity.price?.originalPrice || rawActivity.originalPrice || 0)
      },
      totalPrice: parseFloat(rawActivity.totalPrice || rawActivity.price?.total || rawActivity.price?.amount || rawActivity.price || 0),
      duration: rawActivity.duration || rawActivity.minimumDuration || 'Duration varies',
      durationHours: parseFloat(rawActivity.durationHours || rawActivity.duration?.match(/\d+/)?.[0] || 0),
      difficulty: rawActivity.difficulty || 'Easy',
      rating: parseFloat(rawActivity.rating || rawActivity.averageRating || 0),
      reviewCount: parseInt(rawActivity.reviewCount || rawActivity.reviews || 0),
      groupSize: rawActivity.groupSize || {
        min: parseInt(rawActivity.minParticipants || 1),
        max: parseInt(rawActivity.maxParticipants || 20)
      },
      maxParticipants: parseInt(rawActivity.maxParticipants || rawActivity.groupSize?.max || 20),
      availability: rawActivity.availability || rawActivity.availableDates || [],
      highlights: rawActivity.highlights || rawActivity.features?.slice(0, 3) || [],
      included: rawActivity.included || rawActivity.inclusions || [],
      features: rawActivity.features || rawActivity.amenities || [],
      cancellationPolicy: rawActivity.cancellationPolicy || rawActivity.cancellation || 'Standard cancellation policy applies',
      instantConfirmation: Boolean(rawActivity.instantConfirmation || rawActivity.instantBooking),
      freeCancellation: Boolean(rawActivity.freeCancellation || rawActivity.freeCancel),
      provider: rawActivity.provider || rawActivity.source || 'Demo Provider',
      bookingLink: rawActivity.bookingLink || rawActivity.url,
      minimumDuration: rawActivity.minimumDuration || rawActivity.duration
    };
  }, []);

  // Enhanced search function with caching and error handling
  const searchActivities = useCallback(async (params: ActivitySearchParams) => {
    const cacheKey = `${params.destination}-${params.date}-${params.participants}`;
    
    // Check cache first
    const cachedResult = searchCache.get(cacheKey);
    if (cachedResult) {
      setActivities(cachedResult);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('provider-rotation', {
        body: {
          searchType: 'activity',
          params: {
            destination: params.destination,
            date: params.date,
            participants: params.participants
          }
        }
      });

      if (functionError) {
        throw new Error(functionError.message || 'Activity search failed');
      }

      // Handle both successful and fallback responses with demo data
      const activitiesData = data?.data?.activities || data?.activities || [];
      
      if (data?.success || (Array.isArray(activitiesData) && activitiesData.length > 0)) {
        const normalizedActivities = activitiesData.map(normalizeActivity);
        setActivities(normalizedActivities);
        
        // Cache successful results
        setSearchCache(prev => new Map(prev.set(cacheKey, normalizedActivities)));
        
        if (data?.fallbackUsed || data?.data?.meta?.isDemoData) {
          toast({
            title: "Demo Data",
            description: "Showing sample activities while we restore full service.",
          });
        }
      } else {
        setActivities([]);
        setError("No activities found for your search criteria.");
        toast({
          title: "No Results",
          description: "No activities found. Try adjusting your search criteria.",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Activity search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setActivities([]);
      toast({
        title: "Search Error",
        description: "Failed to search activities. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [normalizeActivity, searchCache, toast]);

  // Filter and sort activities
  const filteredActivities = useMemo(() => {
    let filtered = [...activities];

    // Apply filters
    if (debouncedFilters.priceRange[0] > 0 || debouncedFilters.priceRange[1] < 500) {
      filtered = filtered.filter(activity => {
        const price = activity.price?.total || activity.totalPrice || 0;
        return price >= debouncedFilters.priceRange[0] && price <= debouncedFilters.priceRange[1];
      });
    }

    if (debouncedFilters.categories.length > 0) {
      filtered = filtered.filter(activity => 
        debouncedFilters.categories.includes(activity.category)
      );
    }

    if (debouncedFilters.duration.length > 0) {
      filtered = filtered.filter(activity => {
        const duration = activity.duration.toLowerCase();
        return debouncedFilters.duration.some(filterDuration => {
          switch (filterDuration) {
            case '1-2 hours': return duration.includes('1 hour') || duration.includes('2 hour');
            case '3-4 hours': return duration.includes('3 hour') || duration.includes('4 hour');
            case '5-6 hours': return duration.includes('5 hour') || duration.includes('6 hour');
            case 'Full day': return duration.includes('full day') || duration.includes('8 hour') || duration.includes('day');
            case 'Multi-day': return duration.includes('multi') || duration.includes('days');
            default: return false;
          }
        });
      });
    }

    if (debouncedFilters.rating > 0) {
      filtered = filtered.filter(activity => activity.rating >= debouncedFilters.rating);
    }

    if (debouncedFilters.difficulty.length > 0) {
      filtered = filtered.filter(activity => 
        debouncedFilters.difficulty.includes(activity.difficulty)
      );
    }

    if (debouncedFilters.features.length > 0) {
      filtered = filtered.filter(activity => 
        debouncedFilters.features.some(feature => 
          activity.features.includes(feature) || 
          (feature === 'Instant Confirmation' && activity.instantConfirmation) ||
          (feature === 'Free Cancellation' && activity.freeCancellation)
        )
      );
    }

    if (debouncedFilters.groupSize[0] > 1 || debouncedFilters.groupSize[1] < 20) {
      filtered = filtered.filter(activity => {
        const maxSize = activity.groupSize?.max || activity.maxParticipants || 20;
        const minSize = activity.groupSize?.min || 1;
        return maxSize >= debouncedFilters.groupSize[0] && minSize <= debouncedFilters.groupSize[1];
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (debouncedFilters.sortBy) {
        case 'price':
          aValue = a.price?.total || a.totalPrice || 0;
          bValue = b.price?.total || b.totalPrice || 0;
          break;
        case 'rating':
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case 'duration':
          aValue = a.durationHours || parseFloat(a.duration.match(/\d+/)?.[0] || '0');
          bValue = b.durationHours || parseFloat(b.duration.match(/\d+/)?.[0] || '0');
          break;
        case 'popularity':
          aValue = a.reviewCount || 0;
          bValue = b.reviewCount || 0;
          break;
        default:
          aValue = a.rating || 0;
          bValue = b.rating || 0;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return debouncedFilters.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      } else {
        const comparison = String(aValue).localeCompare(String(bValue));
        return debouncedFilters.sortOrder === 'asc' ? comparison : -comparison;
      }
    });

    return filtered;
  }, [activities, debouncedFilters]);

  // Calculate available filter options based on current activities
  const availableFilters = useMemo(() => {
    const categories = [...new Set(activities.map(a => a.category))];
    const maxPrice = Math.max(...activities.map(a => a.price?.total || a.totalPrice || 0), 500);
    const features = [...new Set(activities.flatMap(a => a.features))];
    
    return {
      categories: categories.length > 0 ? categories : ['Adventure', 'Cultural', 'Food & Drink', 'Nature', 'Sightseeing', 'Water Sports'],
      maxPrice: Math.ceil(maxPrice / 10) * 10, // Round up to nearest 10
      features: features.length > 0 ? features : ['Instant Confirmation', 'Free Cancellation', 'Small Group', 'Private Tour', 'Hotel Pickup']
    };
  }, [activities]);

  // Pagination
  const totalItems = filteredActivities.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedActivities = filteredActivities.slice(startIndex, startIndex + itemsPerPage);

  // Apply filters function
  const applyFilters = useCallback((filters: ActivityFilters) => {
    setCurrentFilters(filters);
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  // Set page function
  const setPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  // Set items per page function
  const setItemsPerPageFunc = useCallback((items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1); // Reset to first page when items per page changes
  }, []);

  // Reset search function
  const resetSearch = useCallback(() => {
    setActivities([]);
    setCurrentFilters(defaultFilters);
    setCurrentPage(1);
    setError(null);
    setSearchCache(new Map());
  }, []);

  return {
    activities: paginatedActivities,
    loading,
    error,
    searchActivities,
    filteredActivities: paginatedActivities,
    applyFilters,
    currentFilters,
    availableFilters,
    pagination: {
      currentPage,
      totalPages,
      itemsPerPage,
      totalItems,
      setPage,
      setItemsPerPage: setItemsPerPageFunc
    },
    resetSearch
  };
};