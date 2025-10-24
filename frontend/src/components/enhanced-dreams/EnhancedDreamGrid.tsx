import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Users, 
  Sparkles,
  Star,
  Bookmark,
  Share2,
  Eye,
  TrendingUp
} from 'lucide-react';
import { EnhancedDestination } from '@/types/enhanced-dream-types';
import { useEnhancedDreams } from '@/hooks/useEnhancedDreams';
import { cn } from '@/lib/utils';

interface EnhancedDreamGridProps {
  destinations: EnhancedDestination[];
  loading?: boolean;
  onDestinationClick?: (destination: EnhancedDestination) => void;
  showAIInsights?: boolean;
  viewMode?: 'grid' | 'list';
}

export const EnhancedDreamGrid: React.FC<EnhancedDreamGridProps> = ({
  destinations,
  loading = false,
  onDestinationClick,
  showAIInsights = true,
  viewMode = 'grid',
}) => {
  const { 
    updateDreamCollection, 
    viewDestination,
    userProfile 
  } = useEnhancedDreams();
  
  const [viewStartTimes, setViewStartTimes] = useState<Record<string, number>>({});
  const [bookmarkedDestinations, setBookmarkedDestinations] = useState<Set<string>>(new Set());

  // Track viewing time for each destination
  const handleDestinationView = (destination: EnhancedDestination) => {
    const startTime = Date.now();
    setViewStartTimes(prev => ({ ...prev, [destination.id]: startTime }));
    
    if (onDestinationClick) {
      onDestinationClick(destination);
    }
  };

  const handleDestinationLeave = (destination: EnhancedDestination) => {
    const startTime = viewStartTimes[destination.id];
    if (startTime) {
      const duration = (Date.now() - startTime) / 1000;
      viewDestination(destination, duration);
      
      setViewStartTimes(prev => {
        const updated = { ...prev };
        delete updated[destination.id];
        return updated;
      });
    }
  };

  const handleBookmarkToggle = async (destination: EnhancedDestination, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const isBookmarked = bookmarkedDestinations.has(destination.id);
    const action = isBookmarked ? 'remove' : 'add';
    
    const result = await updateDreamCollection(destination.id, action);
    
    if (result.success) {
      setBookmarkedDestinations(prev => {
        const updated = new Set(prev);
        if (isBookmarked) {
          updated.delete(destination.id);
        } else {
          updated.add(destination.id);
        }
        return updated;
      });
    }
  };

  const getRarityColor = (rarity: number) => {
    if (rarity >= 90) return 'text-purple-600 bg-purple-50 border-purple-200';
    if (rarity >= 70) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (rarity >= 50) return 'text-green-600 bg-green-50 border-green-200';
    return 'text-gray-600 bg-white border-gray-200';
  };

  const getRarityLabel = (rarity: number) => {
    if (rarity >= 90) return 'Legendary';
    if (rarity >= 70) return 'Epic';
    if (rarity >= 50) return 'Rare';
    return 'Common';
  };

  if (loading) {
    return (
      <div className={cn(
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-4'
      )}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-0">
              <div className="h-48 bg-muted rounded-t-lg"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-muted rounded w-16"></div>
                  <div className="h-6 bg-muted rounded w-20"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (destinations.length === 0) {
    return (
      <Card className="col-span-full">
        <CardContent className="p-12 text-center">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No destinations found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters or search criteria to discover amazing destinations!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn(
      viewMode === 'grid' 
        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
        : 'space-y-4'
    )}>
      {destinations.map((destination) => (
        <Card 
          key={destination.id}
          className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-border/50 hover:border-border"
          onClick={() => handleDestinationView(destination)}
          onMouseLeave={() => handleDestinationLeave(destination)}
        >
          <CardContent className="p-0">
            {/* Destination Image Placeholder */}
            <div className="relative h-48 bg-gradient-to-br from-primary/20 to-accent/20 rounded-t-lg overflow-hidden">
              <img
                src={`/api/placeholder/400/200?text=${encodeURIComponent(destination.name)}`}
                alt={destination.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  // Fallback to gradient background
                  e.currentTarget.style.display = 'none';
                }}
              />
              
              {/* Rarity Badge */}
              {showAIInsights && (
                <Badge 
                  className={cn(
                    'absolute top-3 left-3 border',
                    getRarityColor(destination.rarity_score)
                  )}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {getRarityLabel(destination.rarity_score)}
                </Badge>
              )}

              {/* Bookmark Button */}
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-3 right-3 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => handleBookmarkToggle(destination, e)}
              >
                <Heart 
                  className={cn(
                    "h-4 w-4",
                    bookmarkedDestinations.has(destination.id) 
                      ? "fill-red-500 text-red-500" 
                      : "text-muted-foreground"
                  )}
                />
              </Button>

              {/* AI Insights Overlay */}
              {showAIInsights && userProfile?.travel_personality && (
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="bg-black/70 backdrop-blur-sm rounded-lg p-2 text-white text-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        AI Match: {Math.round((destination.personality_match_factors[0]?.weight || 0) * 100)}%
                      </span>
                      {destination.optimal_seasons.length > 0 && (
                        <span className="text-xs opacity-80">
                          Best: {destination.optimal_seasons[0].season}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Destination Info */}
            <div className="p-4 space-y-3">
              {/* Header */}
              <div className="space-y-1">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-lg line-clamp-1">{destination.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-primary">
                    <Star className="h-3 w-3 fill-current" />
                    {destination.community_rating.overall_score.toFixed(1)}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{destination.country}</span>
                  <span>•</span>
                  <span className="capitalize">{destination.category}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground line-clamp-2">
                {destination.description}
              </p>

              {/* Highlights */}
              {destination.highlights && destination.highlights.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {destination.highlights.slice(0, 3).map((highlight, index) => (
                    <Badge key={index} variant="secondary" className="text-xs px-2 py-0">
                      {highlight}
                    </Badge>
                  ))}
                  {destination.highlights.length > 3 && (
                    <Badge variant="outline" className="text-xs px-2 py-0">
                      +{destination.highlights.length - 3} more
                    </Badge>
                  )}
                </div>
              )}

              {/* Stats Row */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {destination.avg_daily_cost && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      <span>${destination.avg_daily_cost}/day</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{destination.social_popularity || 0}</span>
                  </div>

                  {showAIInsights && (
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{Math.round(destination.engagement_score * 100)}</span>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Share2 className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Bookmark className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* AI Insights Footer */}
              {showAIInsights && destination.price_volatility.length > 0 && (
                <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <span>💡 Best booking window:</span>
                    <span className="font-medium">
                      {destination.price_volatility[0].booking_window_optimal} days ahead
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};