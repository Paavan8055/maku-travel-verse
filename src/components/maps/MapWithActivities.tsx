import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ActivityMap from './ActivityMap';
import { MapPin, List, Eye } from 'lucide-react';
import { EnhancedActivity } from '@/features/search/hooks/useEnhancedActivitySearch';

interface MapWithActivitiesProps {
  activities: EnhancedActivity[];
  onActivitySelect: (activity: EnhancedActivity) => void;
  className?: string;
}

export const MapWithActivities: React.FC<MapWithActivitiesProps> = ({
  activities,
  onActivitySelect,
  className = ""
}) => {
  const [selectedActivityId, setSelectedActivityId] = useState<string>();
  const [showMap, setShowMap] = useState(false);

  const handleActivitySelect = (activity: EnhancedActivity) => {
    setSelectedActivityId(activity.id);
    onActivitySelect(activity);
  };

  if (!showMap) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Map View
            </div>
            <Button onClick={() => setShowMap(true)} variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Show Map
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Activities Map
          </div>
          <Button onClick={() => setShowMap(false)} variant="outline" size="sm">
            <List className="h-4 w-4 mr-2" />
            List View
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-96 w-full">
          <ActivityMap
            activities={activities}
            selectedActivityId={selectedActivityId}
            onActivitySelect={handleActivitySelect}
            className="rounded-b-lg"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default MapWithActivities;