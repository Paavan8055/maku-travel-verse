import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Clock, Navigation2, Locate } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Activity {
  id: string;
  name: string;
  location: string;
  price: { total: number; currency: string };
  rating: number;
  duration: string;
  coordinates?: { lat: number; lng: number };
  category: string;
}

interface ActivityMapProps {
  activities: Activity[];
  selectedActivityId?: string;
  onActivitySelect: (activity: Activity) => void;
  center?: [number, number];
  className?: string;
  showUserLocation?: boolean;
}

const ActivityMap: React.FC<ActivityMapProps> = ({
  activities,
  selectedActivityId,
  onActivitySelect,
  center = [-33.8688, 151.2093], // Sydney default
  className = "",
  showUserLocation = true
}) => {
  const mapRef = useRef<L.Map>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const { toast } = useToast();

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Geolocation is not supported by your browser",
        variant: "destructive"
      });
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: [number, number] = [
          position.coords.latitude,
          position.coords.longitude
        ];
        setUserLocation(location);
        
        // Center map on user location
        if (mapRef.current) {
          mapRef.current.setView(location, 13);
        }
        
        setLoadingLocation(false);
        toast({
          title: "Location found",
          description: "Showing activities near you"
        });
      },
      (error) => {
        setLoadingLocation(false);
        let message = "Unable to get your location";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location access denied by user";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information unavailable";
            break;
          case error.TIMEOUT:
            message = "Location request timed out";
            break;
        }
        
        toast({
          title: "Location error",
          description: message,
          variant: "destructive"
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  // Add mock coordinates for activities without them
  const activitiesWithCoords = activities.map((activity, index) => ({
    ...activity,
    coordinates: activity.coordinates || {
      lat: center[0] + (Math.random() - 0.5) * 0.02,
      lng: center[1] + (Math.random() - 0.5) * 0.02
    }
  }));

  // Create custom marker icons based on category
  const createCustomIcon = (category: string, isSelected: boolean) => {
    const color = isSelected ? '#ef4444' : getCategoryColor(category);
    return L.divIcon({
      html: `
        <div style="
          background-color: ${color};
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ${getCategoryIcon(category)}
        </div>
      `,
      className: 'custom-div-icon',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  };

  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      'Adventure': '#f59e0b',
      'Cultural': '#8b5cf6', 
      'Food & Drink': '#ec4899',
      'Nature': '#10b981',
      'Sightseeing': '#3b82f6',
      'Water Sports': '#06b6d4'
    };
    return colors[category] || '#6b7280';
  };

  const getCategoryIcon = (category: string): string => {
    const icons: { [key: string]: string } = {
      'Adventure': '🏔️',
      'Cultural': '🏛️',
      'Food & Drink': '🍽️',
      'Nature': '🌳',
      'Sightseeing': '👀',
      'Water Sports': '🏄'
    };
    return icons[category] || '📍';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        {showUserLocation && (
          <Button
            onClick={getCurrentLocation}
            disabled={loadingLocation}
            size="sm"
            variant="secondary"
            className="shadow-md"
          >
            {loadingLocation ? (
              <Navigation2 className="h-4 w-4 animate-spin" />
            ) : (
              <Locate className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Category Legend */}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <Card className="p-3">
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(activities.map(a => a.category))).map(category => (
              <div key={category} className="flex items-center gap-1 text-xs">
                <div 
                  className="w-3 h-3 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: getCategoryColor(category) }}
                />
                <span>{category}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Map Container */}
      <MapContainer
        center={center}
        zoom={13}
        className="w-full h-full rounded-lg"
        ref={mapRef}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* User Location Marker */}
        {userLocation && (
          <Marker 
            position={userLocation}
            icon={L.divIcon({
              html: `
                <div style="
                  background-color: #3b82f6;
                  width: 16px;
                  height: 16px;
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
                  animation: pulse 2s infinite;
                "></div>
              `,
              className: 'user-location-icon',
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            })}
          >
            <Popup>
              <div className="text-center">
                <div className="flex items-center gap-1 text-sm font-medium">
                  <Locate className="h-4 w-4 text-primary" />
                  Your Location
                </div>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Activity Markers */}
        {activitiesWithCoords.map((activity) => (
          <Marker
            key={activity.id}
            position={[activity.coordinates!.lat, activity.coordinates!.lng]}
            icon={createCustomIcon(activity.category, activity.id === selectedActivityId)}
            eventHandlers={{
              click: () => onActivitySelect(activity)
            }}
          >
            <Popup>
              <div className="min-w-[200px] p-2">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm line-clamp-2">
                    {activity.name}
                  </h4>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {activity.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{activity.rating.toFixed(1)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{activity.duration}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-primary">
                      {activity.price.currency} {activity.price.total}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {activity.category}
                    </Badge>
                  </div>

                  <Button 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={() => onActivitySelect(activity)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
          }
          
          .user-location-icon div {
            animation: pulse 2s infinite;
          }
        `
      }} />
    </div>
  );
};

export default ActivityMap;