import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building, 
  MapPin, 
  Star, 
  Wifi,
  Car,
  Utensils,
  Waves,
  Dumbbell,
  Calendar,
  Users
} from 'lucide-react';
import { format as formatDate } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface HotelResultsProps {
  searchParams: {
    destination: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    rooms: number;
  };
  hotels: any[];
  loading: boolean;
  error: string | null;
}

export const HotelResults: React.FC<HotelResultsProps> = ({
  searchParams,
  hotels,
  loading,
  error
}) => {
  const navigate = useNavigate();

  const handleHotelSelect = (hotel: any) => {
    navigate('/hotel-booking-review', { 
      state: { 
        hotel, 
        searchParams 
      } 
    });
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi':
      case 'internet':
        return <Wifi className="h-4 w-4" />;
      case 'parking':
        return <Car className="h-4 w-4" />;
      case 'restaurant':
      case 'dining':
        return <Utensils className="h-4 w-4" />;
      case 'pool':
      case 'swimming':
        return <Waves className="h-4 w-4" />;
      case 'gym':
      case 'fitness':
        return <Dumbbell className="h-4 w-4" />;
      default:
        return null;
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

  if (!hotels || hotels.length === 0) {
    return (
      <Card className="p-6 text-center">
        <div className="space-y-4">
          <Building className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">No hotels found</h3>
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
          <h2 className="text-2xl font-bold">Hotel Results</h2>
          <p className="text-muted-foreground">
            {searchParams.destination} • {formatDate(new Date(searchParams.checkIn), 'MMM d')} - {formatDate(new Date(searchParams.checkOut), 'MMM d, yyyy')}
          </p>
        </div>
        <Badge variant="secondary">
          {hotels.length} hotel{hotels.length !== 1 ? 's' : ''} found
        </Badge>
      </div>

      <div className="space-y-4">
        {hotels.map((hotel, index) => (
          <Card key={`${hotel.id || hotel.hotelId || index}`} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex space-x-4">
              {/* Hotel Image */}
              <div className="w-32 h-24 bg-muted rounded overflow-hidden flex-shrink-0">
                {hotel.image || hotel.photos?.[0] ? (
                  <img 
                    src={hotel.image || hotel.photos[0]} 
                    alt={hotel.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Hotel Details */}
              <div className="flex-1 min-w-0">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold line-clamp-1">
                        {hotel.name || hotel.hotelName || 'Hotel Name'}
                      </h3>
                      
                      {/* Star Rating */}
                      {hotel.rating && (
                        <div className="flex items-center space-x-1">
                          {[...Array(Math.floor(hotel.rating))].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                          {hotel.rating % 1 !== 0 && (
                            <Star className="h-4 w-4 fill-yellow-400/50 text-yellow-400" />
                          )}
                          <span className="text-sm text-muted-foreground ml-1">
                            ({hotel.rating}/5)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  {hotel.address && (
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">{hotel.address}</span>
                    </div>
                  )}

                  {/* Amenities */}
                  {hotel.amenities && hotel.amenities.length > 0 && (
                    <div className="flex items-center space-x-2">
                      {hotel.amenities.slice(0, 4).map((amenity: string, i: number) => (
                        <div key={i} className="flex items-center space-x-1 text-sm text-muted-foreground">
                          {getAmenityIcon(amenity)}
                          <span className="capitalize">{amenity}</span>
                        </div>
                      ))}
                      {hotel.amenities.length > 4 && (
                        <span className="text-sm text-muted-foreground">
                          +{hotel.amenities.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Room Type */}
                  {hotel.roomType && (
                    <Badge variant="outline" className="w-fit">
                      {hotel.roomType}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Price and Action */}
              <div className="text-right space-y-2">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    ${hotel.price?.total || hotel.totalPrice || hotel.price || '0'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {hotel.price?.currency || 'AUD'} • per night
                  </div>
                  {hotel.price?.taxes && (
                    <div className="text-xs text-muted-foreground">
                      +${hotel.price.taxes} taxes
                    </div>
                  )}
                </div>
                
                <Button 
                  onClick={() => handleHotelSelect(hotel)}
                  className="w-full"
                >
                  Select Hotel
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};