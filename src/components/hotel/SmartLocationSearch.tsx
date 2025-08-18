import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

interface LocationResult {
  name: string;
  distance: number;
  coordinates: [number, number];
}

interface SmartLocationSearchProps {
  onLocationSelect: (location: string) => void;
  className?: string;
}

export const SmartLocationSearch: React.FC<SmartLocationSearchProps> = ({
  onLocationSelect,
  className = ""
}) => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [searchRadius, setSearchRadius] = useState([10]); // km
  const [nearbyLocations, setNearbyLocations] = useState<LocationResult[]>([]);
  const { toast } = useToast();

  const popularLocations = [
    { name: "Sydney CBD", coordinates: [-33.8688, 151.2093] as [number, number] },
    { name: "Melbourne CBD", coordinates: [-37.8136, 144.9631] as [number, number] },
    { name: "Brisbane City", coordinates: [-27.4698, 153.0251] as [number, number] },
    { name: "Perth CBD", coordinates: [-31.9505, 115.8605] as [number, number] },
    { name: "Adelaide CBD", coordinates: [-34.9285, 138.6007] as [number, number] },
    { name: "Gold Coast", coordinates: [-28.0167, 153.4000] as [number, number] },
    { name: "Cairns", coordinates: [-16.9203, 145.7781] as [number, number] },
    { name: "Darwin", coordinates: [-12.4634, 130.8456] as [number, number] },
  ];

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive",
      });
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [
          position.coords.latitude,
          position.coords.longitude
        ];
        setUserLocation(coords);
        findNearbyLocations(coords);
        setIsGettingLocation(false);
        
        toast({
          title: "Location Found",
          description: "Now showing hotels near your location.",
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsGettingLocation(false);
        
        let message = "Could not access your location.";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Location access denied. Please enable location services.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "Location information unavailable.";
        }
        
        toast({
          title: "Location Error",
          description: message,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const findNearbyLocations = (userCoords: [number, number]) => {
    const nearby = popularLocations
      .map(location => ({
        ...location,
        distance: calculateDistance(
          userCoords[0], userCoords[1],
          location.coordinates[0], location.coordinates[1]
        )
      }))
      .filter(location => location.distance <= searchRadius[0])
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);

    setNearbyLocations(nearby);
  };

  useEffect(() => {
    if (userLocation) {
      findNearbyLocations(userLocation);
    }
  }, [searchRadius, userLocation]);

  return (
    <Card className={`travel-card ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Hotels Near Me
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
            >
              {isGettingLocation ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Navigation className="h-4 w-4 mr-2" />
              )}
              {isGettingLocation ? 'Finding...' : 'Find My Location'}
            </Button>
          </div>

          {userLocation && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Search Radius: {searchRadius[0]} km
                </label>
                <Slider
                  value={searchRadius}
                  onValueChange={setSearchRadius}
                  max={50}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              {nearbyLocations.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Nearby destinations:</p>
                  {nearbyLocations.map((location, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => onLocationSelect(location.name)}
                    >
                      <div>
                        <p className="font-medium">{location.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {location.distance.toFixed(1)} km away
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {location.distance < 5 ? 'Very Close' : 'Nearby'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No destinations found within {searchRadius[0]} km.
                  Try increasing the search radius.
                </p>
              )}
            </div>
          )}

          {!userLocation && (
            <div className="text-center py-4">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Enable location access to find hotels near you
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};