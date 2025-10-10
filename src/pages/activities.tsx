
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { SearchErrorBoundary } from "@/components/error-boundaries/SearchErrorBoundary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  MapPin, 
  Clock, 
  Users, 
  AlertTriangle, 
  Star, 
  Filter, 
  SortAsc, 
  Heart, 
  Share2, 
  Calendar,
  Search,
  Grid3X3,
  List,
  Eye
} from "lucide-react";
import { format as formatDate } from "date-fns";
import { validateActivitySearch } from "@/utils/inputValidation";
import { useToast } from "@/hooks/use-toast";
import { GlobalDestinationSearch } from "@/components/search/GlobalDestinationSearch";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { advancedCacheManager } from "@/features/search/lib/AdvancedCacheManager";
import { useAdvancedProviderRotation } from "@/hooks/useAdvancedProviderRotation";
import { unifiedSearchOrchestrator } from "@/services/core";
import { AdaptiveResultsRanking } from "@/components/search/AdaptiveResultsRanking";
import { PersonalizedSearchExperience } from "@/components/search/PersonalizedSearchExperience";
import { PredictiveSearchSuggestions } from "@/components/search/PredictiveSearchSuggestions";
import { ContextAwareRecommendations } from "@/components/search/ContextAwareRecommendations";
import { useEnhancedActivitySearch } from "@/features/search/hooks/useEnhancedActivitySearch";
import { ActivityFiltersComponent, ActivityFilters } from "@/features/search/components/ActivityFilters";
import { ActivityDetailModal } from "@/features/search/components/ActivityDetailModal";
import { ActivityResults } from "@/pages/search/ActivityResults";
import { SearchResultsSkeleton } from "@/components/ux";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

const ActivitiesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Get parameters from URL
  const destination = searchParams.get('destination') || 'sydney';
  const date = searchParams.get('date') || '2025-08-24';
  const participants = parseInt(searchParams.get('participants') || '2');

  // Enhanced unified search
  const { searchWithAdvancedRotation, searchState } = useAdvancedProviderRotation();
  
  // Enhanced activity search hook
  const {
    activities,
    loading,
    error,
    searchActivities,
    filteredActivities,
    applyFilters,
    currentFilters,
    availableFilters,
    pagination,
    resetSearch
  } = useEnhancedActivitySearch();

  // Enhanced state management
  const [rankedActivities, setRankedActivities] = useState<any[]>([]);
  const [currentSearchId, setCurrentSearchId] = useState<string | null>(null);

  // UI state
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  console.log('ActivitiesPage: Search criteria:', { destination, date, participants });

  // Enhanced unified search function
  const handleUnifiedActivitySearch = async () => {
    const validation = validateActivitySearch({ destination, date, participants });
    if (!validation.isValid) {
      toast({
        title: "Invalid Search",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('ActivitiesPage: Starting unified activity search');
      
      // Generate unique search ID
      const searchId = `activity-search-${Date.now()}`;
      setCurrentSearchId(searchId);

      // Create search request for unified orchestrator
      const searchRequest = {
        type: 'activity' as const,
        searchType: 'activity' as const,
        params: {
          destination,
          date,
          participants,
          searchId
        },
        priority: 'high' as const,
        options: {
          enableML: true,
          cacheResults: true,
          timeoutMs: 30000,
          maxProviders: 3
        }
      };

      const results = await unifiedSearchOrchestrator.orchestrateMultiServiceSearch([searchRequest]);

      console.log('ActivitiesPage: Unified search results:', results);

      if (results.length > 0) {
        const activityResult = results[0];
        
        if (activityResult.success && activityResult.data) {
          // Handle enhanced response structure
          let activityData = activityResult.data.activities || activityResult.data.data || activityResult.data || [];
          
          // Enhance activity data
          activityData = activityData.map((activity: any) => ({
            ...activity,
            id: activity.id || activity.activityId || Math.random().toString(),
            name: activity.name || activity.title || 'Unknown Activity',
            description: activity.description || activity.shortDescription || '',
            source: activity.source ?? 'unified',
            searchId
          }));
          
          // Use both unified results and enhanced search
          searchActivities({ destination, date, participants });
          
        } else {
          console.error('ActivitiesPage: Activity result failed:', activityResult.error);
          // Fallback to enhanced search
          searchActivities({ destination, date, participants });
        }
      } else {
        console.error('ActivitiesPage: Unified search failed: No results');
        // Fallback to enhanced search
        searchActivities({ destination, date, participants });
      }

    } catch (error) {
      console.error('ActivitiesPage: Unified search error:', error);
      // Fallback to enhanced search
      searchActivities({ destination, date, participants });
    }
  };

  // Initialize search on component mount or parameter change
  useEffect(() => {
    handleUnifiedActivitySearch();
  }, [destination, date, participants]);

  // Handle activity selection for detail view
  const handleActivitySelect = (activity: any) => {
    console.log('Activity selected:', activity);
    setSelectedActivity(activity);
    setShowDetailModal(true);
  };

  // Handle new search
  const handleNewSearch = (newDestination: string, newDate: string, newParticipants: number) => {
    setSearchParams({
      destination: newDestination,
      date: newDate,
      participants: newParticipants.toString()
    });
  };

  // Filter activities by search query
  const searchFilteredActivities = searchQuery.trim() 
    ? filteredActivities.filter(activity =>
        activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredActivities;

  return (
    <SearchErrorBoundary fallbackMessage="Activity search is temporarily unavailable. Please try again later.">
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <div className="container mx-auto px-4 py-8 pt-24">
          {/* Enhanced Header with Search */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold mb-2">Activities in {destination}</h1>
                <p className="text-muted-foreground">
                  {formatDate(new Date(date), 'MMM dd, yyyy')} • {participants} participant{participants !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center space-x-4 mt-4 lg:mt-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search activities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>
            </div>

            {/* Enhanced Search Components */}
            {!loading && !error && !searchState.isLoading && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <PersonalizedSearchExperience
                  searchType="activity"
                  currentSearch={{
                    destination,
                    date,
                    participants
                  }}
                  onRecommendationSelect={(rec) => {
                    console.log('Activity recommendation selected:', rec);
                    toast({
                      title: "Recommendation Applied",
                      description: `Applied ${rec.action} filter to your search`
                    });
                  }}
                />
                <PredictiveSearchSuggestions
                  searchType="activity"
                  currentLocation={destination}
                  onSuggestionSelect={(suggestion) => {
                    console.log('Activity suggestion selected:', suggestion);
                    handleNewSearch(suggestion.destination || suggestion.name, date, participants);
                  }}
                />
                <ContextAwareRecommendations
                  searchType="activity"
                  currentContext={{
                    destination,
                    dates: { start: new Date(date), end: new Date(date) },
                    travelers: { adults: participants, children: 0 },
                    tripPurpose: 'leisure'
                  }}
                  onRecommendationSelect={(rec) => {
                    console.log('Context recommendation selected:', rec);
                    toast({
                      title: "Recommendation Applied",
                      description: rec.title
                    });
                  }}
                />
              </div>
            )}

            {/* Adaptive Results Ranking */}
            {filteredActivities.length > 0 && !loading && !searchState.isLoading && (
              <AdaptiveResultsRanking
                results={filteredActivities}
                searchParams={{ destination, date, participants }}
                searchType="activity"
                onRankingComplete={setRankedActivities}
              />
            )}

            {/* Results Bar */}
            {!loading && !error && !searchState.isLoading && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-muted/50 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                  <Badge variant="secondary">
                    {pagination.totalItems} activit{pagination.totalItems !== 1 ? 'ies' : 'y'} found
                  </Badge>
                  {searchQuery && (
                    <Badge variant="outline">
                      Filtered by: "{searchQuery}"
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

            {/* Real-time Search Progress */}
            {(loading || searchState.isLoading) && (
              <div className="mb-6 text-center">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Searching for activities...</p>
              </div>
            )}

            <div className="flex gap-8">
            {/* Filters Sidebar */}
            {showFilters && (
              <div className="hidden lg:block w-80 flex-shrink-0">
                <ActivityFiltersComponent
                  filters={currentFilters}
                  onFiltersChange={applyFilters}
                  onClearFilters={() => applyFilters({
                    priceRange: [0, availableFilters.maxPrice],
                    duration: [],
                    categories: [],
                    rating: 0,
                    groupSize: [1, 20],
                    difficulty: [],
                    features: [],
                    sortBy: 'popularity',
                    sortOrder: 'desc'
                  })}
                  availableFilters={availableFilters}
                  resultCount={pagination.totalItems}
                />
              </div>
            )}

            {/* Main Content */}
            <div className="flex-1">
              {(loading || searchState.isLoading) && (
                <SearchResultsSkeleton count={6} type="activity" />
              )}

              {error && !loading && (
                <Card className="p-12 text-center">
                  <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Search Error</h3>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => handleUnifiedActivitySearch()} variant="outline">
                      Try Again
                    </Button>
                    <Button onClick={() => navigate('/')} variant="default">
                      New Search
                    </Button>
                  </div>
                </Card>
              )}

              {!loading && !error && searchFilteredActivities.length === 0 && (
                <Card className="p-12 text-center">
                  <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Activities Found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ? 
                      `No activities match "${searchQuery}". Try adjusting your search or filters.` :
                      "No activities found for your criteria. Try adjusting your filters or search in a different destination."
                    }
                  </p>
                  <div className="flex gap-3 justify-center">
                    {searchQuery && (
                      <Button onClick={() => setSearchQuery('')} variant="outline">
                        Clear Search
                      </Button>
                    )}
                    <Button onClick={() => navigate('/')} variant="default">
                      New Search
                    </Button>
                  </div>
                </Card>
              )}

              {/* Activity Results */}
              {!loading && !error && !searchState.isLoading && searchFilteredActivities.length > 0 && (
                <div className="space-y-6">
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {(rankedActivities.length > 0 ? rankedActivities : searchFilteredActivities).map((activity, index) => (
                        <Card key={`${activity.id}-${index}`} className="hover:shadow-lg transition-shadow cursor-pointer group">
                          <div className="relative" onClick={() => handleActivitySelect(activity)}>
                            {(activity.images?.[0] || activity.photos?.[0] || activity.pictures?.[0]) && (
                              <div className="aspect-video relative overflow-hidden rounded-t-lg">
                                <img
                                  src={activity.images?.[0] || activity.photos?.[0] || activity.pictures?.[0]}
                                  alt={activity.name || activity.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    e.currentTarget.src = '/placeholder.svg';
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                                <div className="absolute top-3 right-3">
                                  <Button size="sm" variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                            
                            <CardContent className="p-6">
                              <div className="space-y-4">
                                <div>
                                  <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                                    {activity.name || activity.title}
                                  </h3>
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {activity.description || activity.shortDescription}
                                  </p>
                                </div>

                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  {activity.rating > 0 && (
                                    <div className="flex items-center space-x-1">
                                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                      <span>{activity.rating.toFixed(1)}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center space-x-1">
                                    <Clock className="h-4 w-4" />
                                    <span>{activity.duration}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <MapPin className="h-4 w-4" />
                                    <span>{activity.location}</span>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-2xl font-bold text-primary">
                                      {activity.price?.currency || 'AUD'} {activity.price?.total || activity.totalPrice || '0'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">per person</p>
                                  </div>
                                  <Button onClick={() => handleActivitySelect(activity)} size="sm">
                                    View Details
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <ActivityResults
                      searchParams={{ destination, date, participants }}
                      activities={rankedActivities.length > 0 ? rankedActivities : searchFilteredActivities}
                      loading={loading || searchState.isLoading}
                      error={error}
                    />
                  )}

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex justify-center mt-8">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                pagination.setPage(pagination.currentPage - 1);
                              }}
                              className={pagination.currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                            />
                          </PaginationItem>
                          
                          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                            const page = i + 1;
                            return (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    pagination.setPage(page);
                                  }}
                                  isActive={page === pagination.currentPage}
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          })}
                          
                          <PaginationItem>
                            <PaginationNext
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                pagination.setPage(pagination.currentPage + 1);
                              }}
                              className={pagination.currentPage === pagination.totalPages ? 'pointer-events-none opacity-50' : ''}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Activity Detail Modal */}
          <ActivityDetailModal
            activity={selectedActivity}
            isOpen={showDetailModal}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedActivity(null);
            }}
            searchParams={{ destination, date, participants }}
          />
        </div>
      </div>
    </SearchErrorBoundary>
  );
};

export default ActivitiesPage;
