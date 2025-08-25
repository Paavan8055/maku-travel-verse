import { useState, useEffect, useRef } from 'react';
import { MapPin, DollarSign, Star, Navigation } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Hotel {
  id: string;
  name: string;
  pricePerNight: number;
  rating: number;
  starRating: number;
  location?: {
    lat: number;
    lng: number;
  };
  imageUrl?: string;
  amenities: string[];
  distanceFromCenter?: number;
}

interface InteractiveHotelMapProps {
  hotels: Hotel[];
  destination: string;
  onHotelSelect?: (hotel: Hotel) => void;
  className?: string;
}

export const InteractiveHotelMap = ({ 
  hotels, 
  destination, 
  onHotelSelect,
  className 
}: InteractiveHotelMapProps) => {
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: -33.8688, lng: 151.2093 }); // Sydney default
  const mapRef = useRef<HTMLDivElement>(null);

  // Geocode destination to get coordinates
  useEffect(() => {
    if (destination) {
      // Simple geocoding approximation for demo
      const coordinates = getDestinationCoordinates(destination);
      setMapCenter(coordinates);
    }
  }, [destination]);

  const getDestinationCoordinates = (dest: string) => {
    // Simple mapping for demo - in production, use a proper geocoding service
    const cityCoords: Record<string, { lat: number; lng: number }> = {
      'sydney': { lat: -33.8688, lng: 151.2093 },
      'melbourne': { lat: -37.8136, lng: 144.9631 },
      'brisbane': { lat: -27.4698, lng: 153.0251 },
      'perth': { lat: -31.9505, lng: 115.8605 },
      'adelaide': { lat: -34.9285, lng: 138.6007 },
      'new york': { lat: 40.7128, lng: -74.0060 },
      'london': { lat: 51.5074, lng: -0.1278 },
      'paris': { lat: 48.8566, lng: 2.3522 },
      'tokyo': { lat: 35.6762, lng: 139.6503 }
    };
    
    const normalizedDest = dest.toLowerCase();
    return cityCoords[normalizedDest] || { lat: -33.8688, lng: 151.2093 };
  };

  const handleHotelClick = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    onHotelSelect?.(hotel);
  };

  const calculateDistance = (hotel: Hotel) => {
    // Use existing distance if available, otherwise calculate
    if (hotel.distanceFromCenter) {
      return hotel.distanceFromCenter.toFixed(1);
    }
    
    // Simple distance calculation for demo
    if (hotel.location) {
      const dx = hotel.location.lat - mapCenter.lat;
      const dy = hotel.location.lng - mapCenter.lng;
      const distance = Math.sqrt(dx * dx + dy * dy) * 100; // Approximate km
      return Math.max(0.1, distance).toFixed(1);
    }
    
    return '0.5'; // Fallback
  };

  return (
    <div className={`relative w-full h-96 bg-secondary/10 rounded-lg overflow-hidden ${className}`}>
      {/* Map Container */}
      <div ref={mapRef} className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5">
        {/* Map Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" viewBox="0 0 400 300">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Hotel Pins */}
        {hotels.slice(0, 10).map((hotel, index) => {
          const x = 50 + (index % 4) * 20 + Math.random() * 10;
          const y = 30 + Math.floor(index / 4) * 25 + Math.random() * 10;
          
          return (
            <div
              key={hotel.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              style={{ left: `${x}%`, top: `${y}%` }}
              onClick={() => handleHotelClick(hotel)}
            >
              {/* Price Pin */}
              <div className="relative">
                <div className="bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-semibold shadow-lg group-hover:scale-110 transition-transform border-2 border-background">
                  ${hotel.pricePerNight}
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-primary"></div>
              </div>

              {/* Star Rating Indicator */}
              <div className="absolute -top-1 -right-1 bg-secondary text-secondary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {hotel.starRating}
              </div>
            </div>
          );
        })}

        {/* Center Marker for Destination */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="bg-background border-2 border-primary rounded-full p-2 shadow-lg">
            <Navigation className="h-4 w-4 text-primary" />
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 text-xs font-medium text-center whitespace-nowrap">
            {destination}
          </div>
        </div>
      </div>

      {/* Hotel Details Popup */}
      {selectedHotel && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <img 
                  src={selectedHotel.imageUrl || '/placeholder.svg'} 
                  alt={selectedHotel.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate">{selectedHotel.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{selectedHotel.rating}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {selectedHotel.starRating} star
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {selectedHotel.distanceFromCenter?.toFixed(1) || '0.5'} km away
                    </div>
                    <div className="text-lg font-bold text-primary">
                      ${selectedHotel.pricePerNight}
                      <span className="text-sm font-normal">/night</span>
                    </div>
                  </div>
                </div>
                <Button 
                  size="sm"
                  onClick={() => onHotelSelect?.(selectedHotel)}
                  className="shrink-0"
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-10 space-y-2">
        <Button 
          size="sm" 
          variant="outline" 
          className="bg-background/90 backdrop-blur-sm"
          onClick={() => setSelectedHotel(null)}
        >
          Show All Hotels
        </Button>
      </div>

      {/* Hotel Count Badge */}
      <div className="absolute top-4 left-4 z-10">
        <Badge className="bg-background/90 backdrop-blur-sm text-foreground">
          {hotels.length} hotels found
        </Badge>
      </div>
    </div>
  );
};