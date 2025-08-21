import { useState, useEffect } from "react";
import { MapPin, Star, Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import logger from "@/utils/logger";

interface PointOfInterest {
  id: string;
  name: string;
  category: string;
  subCategory?: string;
  rank?: number;
  distance: {
    value: number;
    unit: string;
  };
  tags: string[];
}

interface PointsOfInterestSectionProps {
  hotelName: string;
  latitude?: number;
  longitude?: number;
  className?: string;
}

export const PointsOfInterestSection = ({ 
  hotelName, 
  latitude, 
  longitude, 
  className 
}: PointsOfInterestSectionProps) => {
  const [pois, setPois] = useState<PointOfInterest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!latitude || !longitude) return;

    const fetchPointsOfInterest = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: functionError } = await supabase.functions.invoke('amadeus-points-of-interest', {
          body: {
            latitude,
            longitude,
            radius: 5 // 5km radius
          }
        });

        if (functionError) {
          throw functionError;
        }

        if (data?.success && data.pointsOfInterest) {
          // Sort by distance and take top 8
          const sortedPOIs = data.pointsOfInterest
            .sort((a: PointOfInterest, b: PointOfInterest) => a.distance.value - b.distance.value)
            .slice(0, 8);
          setPois(sortedPOIs);
        }
      } catch (err) {
        logger.error("Failed to fetch points of interest:", err);
        setError("Failed to load nearby attractions");
      } finally {
        setLoading(false);
      }
    };

    fetchPointsOfInterest();
  }, [latitude, longitude]);

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "sightseeing":
      case "tourism":
        return "🏛️";
      case "restaurant":
      case "food":
        return "🍽️";
      case "shopping":
        return "🛍️";
      case "entertainment":
        return "🎭";
      case "outdoor":
      case "nature":
        return "🌳";
      case "beach":
        return "🏖️";
      case "transport":
        return "🚇";
      default:
        return "📍";
    }
  };

  const formatDistance = (distance: { value: number; unit: string }) => {
    if (distance.unit === "KM") {
      return distance.value < 1 
        ? `${Math.round(distance.value * 1000)}m`
        : `${distance.value.toFixed(1)}km`;
    }
    return `${distance.value}${distance.unit.toLowerCase()}`;
  };

  if (!latitude || !longitude) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5" />
          <span>Near {hotelName}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-muted-foreground">Loading nearby attractions...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-muted-foreground">
            {error}
          </div>
        )}

        {!loading && !error && pois.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No nearby attractions found
          </div>
        )}

        {!loading && !error && pois.length > 0 && (
          <div className="space-y-3">
            {pois.map((poi) => (
              <div key={poi.id} className="flex items-center space-x-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <div className="text-2xl">{getCategoryIcon(poi.category)}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground truncate">{poi.name}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {poi.category}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDistance(poi.distance)}
                    </span>
                    {poi.rank && (
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-muted-foreground">
                          #{poi.rank}
                        </span>
                      </div>
                    )}
                  </div>
                  {poi.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {poi.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};