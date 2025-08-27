import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Clock, 
  Star, 
  Calendar,
  Users,
  Camera,
  Mountain,
  Utensils,
  Waves,
  Building
} from 'lucide-react';
import { format as formatDate } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface ActivityResultsProps {
  searchParams: {
    destination: string;
    date: string;
    participants: number;
  };
  activities: any[];
  loading: boolean;
  error: string | null;
}

export const ActivityResults: React.FC<ActivityResultsProps> = ({
  searchParams,
  activities,
  loading,
  error
}) => {
  const navigate = useNavigate();

  const handleActivitySelect = (activity: any) => {
    navigate('/activity-booking-review', { 
      state: { 
        activity, 
        searchParams 
      } 
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'sightseeing':
      case 'tours':
        return <Camera className="h-4 w-4" />;
      case 'adventure':
      case 'outdoor':
        return <Mountain className="h-4 w-4" />;
      case 'food':
      case 'culinary':
        return <Utensils className="h-4 w-4" />;
      case 'water':
      case 'marine':
        return <Waves className="h-4 w-4" />;
      case 'cultural':
      case 'museums':
        return <Building className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="flex space-x-4">
              <div className="w-32 h-24 bg-muted rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-1/4"></div>
              </div>
              <div className="text-right space-y-2">
                <div className="h-6 bg-muted rounded w-20"></div>
                <div className="h-8 bg-muted rounded w-24"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <div className="space-y-4">
          <div className="text-destructive text-lg font-semibold">Search Error</div>
          <p className="text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card className="p-6 text-center">
        <div className="space-y-4">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">No activities found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or dates
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Activity Results</h2>
          <p className="text-muted-foreground">
            {searchParams.destination} • {formatDate(new Date(searchParams.date), 'MMM d, yyyy')}
          </p>
        </div>
        <Badge variant="secondary">
          {activities.length} activit{activities.length !== 1 ? 'ies' : 'y'} found
        </Badge>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => (
          <Card key={`${activity.id || index}`} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex space-x-4">
              {/* Activity Image */}
              <div className="w-32 h-24 bg-muted rounded overflow-hidden flex-shrink-0">
                {activity.image || activity.photos?.[0] ? (
                  <img 
                    src={activity.image || activity.photos[0]} 
                    alt={activity.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {getCategoryIcon(activity.category)}
                  </div>
                )}
              </div>

              {/* Activity Details */}
              <div className="flex-1 min-w-0">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold line-clamp-2">
                        {activity.name || activity.title || 'Activity Name'}
                      </h3>
                      
                      {/* Rating */}
                      {activity.rating && (
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{activity.rating}</span>
                          {activity.reviewCount && (
                            <span className="text-sm text-muted-foreground">
                              ({activity.reviewCount} reviews)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Category */}
                  {activity.category && (
                    <div className="flex items-center space-x-1">
                      {getCategoryIcon(activity.category)}
                      <Badge variant="outline" className="capitalize">
                        {activity.category}
                      </Badge>
                    </div>
                  )}

                  {/* Duration */}
                  {activity.duration && (
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{activity.duration}</span>
                    </div>
                  )}

                  {/* Location */}
                  {activity.location && (
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">{activity.location}</span>
                    </div>
                  )}

                  {/* Description */}
                  {activity.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {activity.description}
                    </p>
                  )}

                  {/* Features */}
                  {activity.features && activity.features.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {activity.features.slice(0, 3).map((feature: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {activity.features.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{activity.features.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Price and Action */}
              <div className="text-right space-y-2">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    ${activity.price?.total || activity.totalPrice || activity.price || '0'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {activity.price?.currency || 'AUD'} • per person
                  </div>
                  {activity.price?.originalPrice && activity.price.originalPrice > (activity.price.total || activity.totalPrice || activity.price || 0) && (
                    <div className="text-xs text-muted-foreground line-through">
                      ${activity.price.originalPrice}
                    </div>
                  )}
                </div>
                
                <Button 
                  onClick={() => handleActivitySelect(activity)}
                  className="w-full"
                >
                  Book Activity
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};