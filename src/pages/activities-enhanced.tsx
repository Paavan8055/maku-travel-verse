import React from 'react';
import Navbar from '@/components/Navbar';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Calendar,
  Users,
  Package2,
  Heart,
  Route
} from 'lucide-react';
import { format } from 'date-fns';
import { useEnhancedActivitySearch } from '@/features/search/hooks/useEnhancedActivitySearch';
import { usePersonalizedRecommendations } from '@/features/user/hooks/usePersonalizedRecommendations';
import { ActivityFiltersComponent } from '@/features/search/components/ActivityFilters';
import { ActivityDetailModal } from '@/features/search/components/ActivityDetailModal';
import { MapWithActivities } from '@/components/maps/MapWithActivities';
import ActivityWishlist from '@/features/user/components/ActivityWishlist';
import TripBundleBuilder from '@/features/bundles/components/TripBundleBuilder';
import ItineraryPlanner from '@/features/itinerary/components/ItineraryPlanner';

const ActivitiesEnhancedPage = () => {
  const [searchParams] = useSearchParams();
  
  // Get parameters from URL
  const destination = searchParams.get('destination') || 'sydney';
  const date = searchParams.get('date') || '2025-08-24';
  const participants = parseInt(searchParams.get('participants') || '2');
  const checkOut = searchParams.get('checkout') || format(new Date(new Date(date).getTime() + 3 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

  // Enhanced search and recommendations
  const {
    activities,
    loading,
    searchActivities,
    filteredActivities,
    applyFilters,
    currentFilters,
    availableFilters,
  } = useEnhancedActivitySearch();

  const { recommendations, loading: recommendationsLoading } = usePersonalizedRecommendations();

  // UI State
  const [selectedActivity, setSelectedActivity] = React.useState<any>(null);
  const [showDetailModal, setShowDetailModal] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('activities');

  // Initialize search
  React.useEffect(() => {
    searchActivities({ destination, date, participants });
  }, [destination, date, participants]);

  const handleActivitySelect = (activity: any) => {
    setSelectedActivity(activity);
    setShowDetailModal(true);
  };

  const handleBundleComplete = (bundleItems: any[], totalPrice: number) => {
    // Handle bundle booking completion
    console.log('Bundle completed:', { bundleItems, totalPrice });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Plan Your Trip to {destination}
          </h1>
          <p className="text-muted-foreground">
            {format(new Date(date), 'MMM dd, yyyy')} • {participants} participant{participants !== 1 ? 's' : ''}
          </p>
          
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="secondary">{filteredActivities.length} activities found</Badge>
            <Badge variant="outline">{recommendations.length} personalized recommendations</Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="activities" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Activities
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Map View
            </TabsTrigger>
            <TabsTrigger value="bundles" className="flex items-center gap-2">
              <Package2 className="h-4 w-4" />
              Trip Bundles
            </TabsTrigger>
            <TabsTrigger value="itinerary" className="flex items-center gap-2">
              <Route className="h-4 w-4" />
              Itinerary
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Wishlist
            </TabsTrigger>
          </TabsList>

          {/* Activities Tab */}
          <TabsContent value="activities" className="space-y-6">
            <div className="flex gap-8">
              {/* Filters */}
              <div className="w-80 flex-shrink-0">
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
                  resultCount={filteredActivities.length}
                />
                
                {/* Personalized Recommendations */}
                {recommendations.length > 0 && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="text-sm">Recommended for You</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {recommendations.slice(0, 3).map((rec, index) => (
                        <div key={rec.activity.id} className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer" onClick={() => handleActivitySelect(rec.activity)}>
                          <h4 className="font-medium text-sm line-clamp-2">{rec.activity.name}</h4>
                          <div className="flex items-center justify-between mt-2">
                            <Badge variant="outline" className="text-xs">{rec.confidence}</Badge>
                            <span className="text-xs text-muted-foreground">{(rec.score * 100).toFixed(0)}% match</span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Activity Grid */}
              <div className="flex-1">
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <div className="aspect-video bg-muted rounded-t-lg" />
                        <CardContent className="p-4 space-y-3">
                          <div className="h-4 bg-muted rounded w-3/4" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                          <div className="h-3 bg-muted rounded w-1/4" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredActivities.map((activity, index) => (
                      <Card key={`${activity.id}-${index}`} className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => handleActivitySelect(activity)}>
                        {(activity.images?.[0] || activity.photos?.[0]) && (
                          <div className="aspect-video relative overflow-hidden rounded-t-lg">
                            <img
                              src={activity.images?.[0] || activity.photos?.[0]}
                              alt={activity.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.svg';
                              }}
                            />
                          </div>
                        )}
                        
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                                {activity.name}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {activity.description}
                              </p>
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-2xl font-bold text-primary">
                                  {activity.price?.currency || 'AUD'} {activity.price?.total || activity.totalPrice || '0'}
                                </p>
                                <p className="text-xs text-muted-foreground">per person</p>
                              </div>
                              <Button size="sm">
                                View Details
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Map View Tab */}
          <TabsContent value="map">
            <MapWithActivities
              activities={filteredActivities}
              onActivitySelect={handleActivitySelect}
              className="h-[600px]"
            />
          </TabsContent>

          {/* Trip Bundles Tab */}
          <TabsContent value="bundles">
            <TripBundleBuilder
              destination={destination}
              checkIn={date}
              checkOut={checkOut}
              guests={participants}
              onBundleComplete={handleBundleComplete}
            />
          </TabsContent>

          {/* Itinerary Tab */}
          <TabsContent value="itinerary">
            <ItineraryPlanner
              tripName={`${destination} Trip`}
              startDate={date}
              endDate={checkOut}
              destination={destination}
            />
          </TabsContent>

          {/* Wishlist Tab */}
          <TabsContent value="wishlist">
            <ActivityWishlist
              onActivitySelect={handleActivitySelect}
            />
          </TabsContent>
        </Tabs>

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
  );
};

export default ActivitiesEnhancedPage;