import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchLocalInsights } from "@/lib/bookingDataClient";
import { MapPin, Star, Utensils, Car, Camera, Info } from "lucide-react";
import logger from "@/utils/logger";
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
export default function LocalTipsPanel({
  locationId = 'NYC'
}: LocalTipsPanelProps) {
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
      logger.error('Error loading local insights:', error);
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
        return {
          text: 'Local Expert',
          variant: 'default' as const
        };
      case 'travel-blog':
        return {
          text: 'Travel Blog',
          variant: 'secondary' as const
        };
      case 'community':
        return {
          text: 'Community',
          variant: 'outline' as const
        };
      default:
        return {
          text: source,
          variant: 'outline' as const
        };
    }
  };
  if (loading) {
    return <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Local Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />)}
          </div>
        </CardContent>
      </Card>;
  }
  const featuredTips = insights.filter(tip => tip.is_featured);
  const regularTips = insights.filter(tip => !tip.is_featured);
  return <Card className="w-full">
      
      
    </Card>;
}