import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchLocalInsights } from "@/lib/bookingDataClient";
import { MapPin, Star, Utensils, Car, Camera, Info } from "lucide-react";

interface LocalInsight {
  id: string;
  location_id: string;
  tip_type: string;
  content: string;
  source: string;
  rating: number;
  is_featured: boolean;
  created_at: string;
}

interface LocalTipsPanelProps {
  locationId?: string;
}

export default function LocalTipsPanel({ locationId = 'NYC' }: LocalTipsPanelProps) {
  const [insights, setInsights] = useState<LocalInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (locationId) {
      loadInsights();
    }
  }, [locationId]);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const data = await fetchLocalInsights(locationId);
      setInsights(data);
    } catch (error) {
      console.error('Error loading local insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTipIcon = (tipType: string) => {
    switch (tipType) {
      case 'dining':
        return <Utensils className="h-4 w-4" />;
      case 'transport':
        return <Car className="h-4 w-4" />;
      case 'sightseeing':
        return <Camera className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getTipColor = (tipType: string) => {
    switch (tipType) {
      case 'dining':
        return 'bg-orange-100 text-orange-800';
      case 'transport':
        return 'bg-blue-100 text-blue-800';
      case 'sightseeing':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'local-guide':
        return { text: 'Local Expert', variant: 'default' as const };
      case 'travel-blog':
        return { text: 'Travel Blog', variant: 'secondary' as const };
      case 'community':
        return { text: 'Community', variant: 'outline' as const };
      default:
        return { text: source, variant: 'outline' as const };
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Local Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const featuredTips = insights.filter(tip => tip.is_featured);
  const regularTips = insights.filter(tip => !tip.is_featured);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Local Tips for {locationId.toUpperCase()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No local tips available for this destination yet.</p>
            <p className="text-sm">Be the first to share your insights!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Featured Tips */}
            {featuredTips.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Featured Tips
                </h4>
                <div className="space-y-3">
                  {featuredTips.map((tip) => (
                    <div
                      key={tip.id}
                      className="p-4 border-2 border-primary/20 rounded-lg bg-primary/5"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded ${getTipColor(tip.tip_type)}`}>
                            {getTipIcon(tip.tip_type)}
                          </div>
                          <span className="text-sm font-medium capitalize">
                            {tip.tip_type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge {...getSourceBadge(tip.source)} />
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs font-medium">
                              {tip.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{tip.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regular Tips */}
            {regularTips.length > 0 && (
              <div>
                {featuredTips.length > 0 && (
                  <h4 className="text-sm font-semibold mb-3 mt-6">More Tips</h4>
                )}
                <div className="space-y-3">
                  {regularTips.map((tip) => (
                    <div
                      key={tip.id}
                      className="p-3 border rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded ${getTipColor(tip.tip_type)}`}>
                            {getTipIcon(tip.tip_type)}
                          </div>
                          <span className="text-sm font-medium capitalize">
                            {tip.tip_type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {getSourceBadge(tip.source).text}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs">
                              {tip.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{tip.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            💡 Tips are curated from local experts and fellow travelers. 
            Ratings help you find the most valuable insights.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}