
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { SearchErrorBoundary } from "@/components/error-boundaries/SearchErrorBoundary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Users, AlertTriangle } from "lucide-react";
import { format as formatDate } from "date-fns";

const ActivitiesPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get parameters from URL
  const destination = searchParams.get('destination') || 'sydney';
  const date = searchParams.get('date') || '2025-08-24';
  const participants = parseInt(searchParams.get('participants') || '2');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activities, setActivities] = useState<any[]>([]);

  console.log('ActivitiesPage: Search criteria:', { destination, date, participants });

  // Test activity search directly
  useEffect(() => {
    const testActivitySearch = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('Testing activity search with:', { destination, date, participants });
        
        // Import supabase client
        const { supabase } = await import('@/integrations/supabase/client');
        
        const { data, error: functionError } = await supabase.functions.invoke('provider-rotation', {
          body: {
            searchType: 'activity',
            params: {
              destination,
              date,
              participants
            }
          }
        });

        console.log('Activity search response:', { data, error: functionError });

        if (functionError) {
          throw new Error(functionError.message || 'Activity search failed');
        }

        if (data?.success && data?.data?.data) {
          setActivities(data.data.data);
          console.log('Found activities:', data.data.data.length);
        } else {
          throw new Error(data?.error || 'No activities found');
        }
      } catch (err) {
        console.error('Activity search error:', err);
        setError(err instanceof Error ? err.message : 'Activity search failed');
      } finally {
        setLoading(false);
      }
    };

    testActivitySearch();
  }, [destination, date, participants]);

  const handleActivitySelect = (activity: any) => {
    console.log('Activity selected:', activity);
    // Open booking link in new tab
    if (activity.bookingLink) {
      window.open(activity.bookingLink, '_blank');
    }
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  return (
    <SearchErrorBoundary fallbackMessage="Activity search is temporarily unavailable. Please try again later.">
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <div className="container mx-auto px-4 py-8 pt-24">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Activities in {destination}</h1>
            <p className="text-muted-foreground">
              {formatDate(new Date(date), 'MMM dd, yyyy')} • {participants} participant{participants !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold mb-2">Finding activities...</h3>
              <p className="text-muted-foreground">Searching for the best experiences</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <Card className="p-12 text-center">
              <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Service Temporarily Unavailable</h3>
              <p className="text-muted-foreground mb-4">Activity search providers are currently experiencing issues. Please try again in a few minutes.</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Try Again
              </Button>
            </Card>
          )}

          {/* Results */}
          {!loading && !error && activities.length > 0 && (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground mb-4">
                Found {activities.length} activities
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activities.map((activity, index) => (
                  <Card key={`${activity.id}-${index}`} className="hover:shadow-lg transition-shadow">
                    {activity.pictures && activity.pictures[0] && (
                      <div className="aspect-video relative overflow-hidden rounded-t-lg">
                        <img
                          src={activity.pictures[0]}
                          alt={activity.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">{activity.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {stripHtml(activity.description)}
                          </p>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{destination}</span>
                          </div>
                          {activity.minimumDuration && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{activity.minimumDuration}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-primary">
                              {activity.price?.currencyCode || 'AUD'} {activity.price?.amount || '99'}
                            </p>
                            <p className="text-xs text-muted-foreground">per person</p>
                          </div>
                          <Button onClick={() => handleActivitySelect(activity)}>
                            Book Now
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {!loading && !error && activities.length === 0 && (
            <Card className="p-12 text-center">
              <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Service Temporarily Unavailable</h3>
              <p className="text-muted-foreground mb-4">Activity search providers are currently experiencing issues. Please try again later.</p>
              <Button onClick={() => navigate('/')} variant="outline">
                New Search
              </Button>
            </Card>
          )}
        </div>
      </div>
    </SearchErrorBoundary>
  );
};

export default ActivitiesPage;
