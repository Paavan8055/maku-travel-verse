import { useState } from "react";
import { Star, MapPin, Wifi, Car, Coffee, Users, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface HotelSearchResult {
  id: string;
  name: string;
  location?: string;
  rating?: number;
  price: number;
  currency: string;
  image?: string;
  amenities?: string[];
  provider: 'amadeus' | 'hotelbeds' | 'unified';
  description?: string;
  cancellationPolicy?: string;
  freeWifi?: boolean;
  freeParking?: boolean;
  taxesIncluded?: boolean;
  originalPrice?: number;
  discount?: number;
  promotions?: Array<{
    code: string;
    name: string;
    description?: string;
  }>;
  rateKey?: string; // HotelBeds specific
  hotelCode?: string | number; // HotelBeds specific
}

interface HotelSearchResultCardProps {
  hotel: HotelSearchResult;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms: number;
}

export const HotelSearchResultCard = ({
  hotel,
  checkIn,
  checkOut,
  adults,
  children,
  rooms
}: HotelSearchResultCardProps) => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);

  const formatPrice = (price: number, currency: string = 'AUD') => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(price);
  };

  const getProviderBadgeColor = (provider: string) => {
    switch (provider) {
      case 'hotelbeds': return 'bg-blue-500';
      case 'amadeus': return 'bg-green-500';
      case 'unified': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const handleViewDetails = () => {
    const params = new URLSearchParams({
      hotelId: hotel.hotelCode?.toString() || hotel.id,
      provider: hotel.provider,
      checkIn,
      checkOut,
      adults: adults.toString(),
      children: children.toString(),
      rooms: rooms.toString()
    });

    if (hotel.rateKey) {
      params.set('rateKey', hotel.rateKey);
    }

    navigate(`/hotel-details?${params.toString()}`);
  };

  const renderStars = (rating: number) => {
    const stars = Math.floor(rating);
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getAmenityIcon = (amenity: string) => {
    const amenityLower = amenity.toLowerCase();
    if (amenityLower.includes('wifi') || amenityLower.includes('internet')) {
      return <Wifi className="h-3 w-3" />;
    }
    if (amenityLower.includes('parking') || amenityLower.includes('car')) {
      return <Car className="h-3 w-3" />;
    }
    if (amenityLower.includes('restaurant') || amenityLower.includes('dining')) {
      return <Coffee className="h-3 w-3" />;
    }
    if (amenityLower.includes('family') || amenityLower.includes('kids')) {
      return <Users className="h-3 w-3" />;
    }
    return <Info className="h-3 w-3" />;
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={handleViewDetails}>
      <div className="flex">
        {/* Hotel Image */}
        <div className="w-48 h-32 flex-shrink-0 bg-muted relative overflow-hidden">
          {hotel.image ? (
            <>
              <img
                src={hotel.image}
                alt={hotel.name}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(false)}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 bg-muted flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">No image</span>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-xs text-muted-foreground">No image</span>
            </div>
          )}
          
          {/* Provider Badge */}
          <Badge 
            className={`absolute top-2 left-2 text-white text-xs ${getProviderBadgeColor(hotel.provider)}`}
          >
            {hotel.provider.toUpperCase()}
          </Badge>

          {/* Discount Badge */}
          {hotel.discount && hotel.discount > 0 && (
            <Badge variant="destructive" className="absolute top-2 right-2 text-xs">
              -{hotel.discount}%
            </Badge>
          )}
        </div>

        {/* Hotel Details */}
        <CardContent className="flex-1 p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg truncate">{hotel.name}</h3>
                {hotel.rating && (
                  <div className="flex items-center">
                    {renderStars(hotel.rating)}
                  </div>
                )}
              </div>

              {hotel.location && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{hotel.location}</span>
                </div>
              )}

              {hotel.description && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {hotel.description}
                </p>
              )}

              {/* Amenities */}
              {hotel.amenities && hotel.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {hotel.amenities.slice(0, 4).map((amenity, index) => (
                    <Badge key={index} variant="outline" className="text-xs flex items-center gap-1">
                      {getAmenityIcon(amenity)}
                      <span className="truncate max-w-20">{amenity}</span>
                    </Badge>
                  ))}
                  {hotel.amenities.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{hotel.amenities.length - 4} more
                    </Badge>
                  )}
                </div>
              )}

              {/* Quick amenity indicators */}
              <div className="flex gap-2 mb-2">
                {hotel.freeWifi && (
                  <Badge variant="secondary" className="text-xs flex items-center gap-1">
                    <Wifi className="h-3 w-3" />
                    Free WiFi
                  </Badge>
                )}
                {hotel.freeParking && (
                  <Badge variant="secondary" className="text-xs flex items-center gap-1">
                    <Car className="h-3 w-3" />
                    Free Parking
                  </Badge>
                )}
              </div>

              {/* Promotions */}
              {hotel.promotions && hotel.promotions.length > 0 && (
                <div className="mb-2">
                  {hotel.promotions.slice(0, 2).map((promo, index) => (
                    <Badge key={index} variant="secondary" className="text-xs mr-1 mb-1">
                      {promo.name}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Cancellation Policy */}
              {hotel.cancellationPolicy && (
                <p className="text-xs text-green-600 mb-2">
                  {hotel.cancellationPolicy}
                </p>
              )}
            </div>

            {/* Price Section */}
            <div className="text-right ml-4 flex-shrink-0">
              <div className="text-right">
                {hotel.originalPrice && hotel.originalPrice > hotel.price && (
                  <div className="text-sm line-through text-muted-foreground">
                    {formatPrice(hotel.originalPrice, hotel.currency)}
                  </div>
                )}
                <div className="text-2xl font-bold text-primary">
                  {formatPrice(hotel.price, hotel.currency)}
                </div>
                <div className="text-xs text-muted-foreground">
                  per night{!hotel.taxesIncluded && ' + taxes'}
                </div>
                {hotel.taxesIncluded && (
                  <div className="text-xs text-green-600">
                    Taxes included
                  </div>
                )}
              </div>
              
              <Button className="mt-3 w-full" size="sm">
                View Details
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};