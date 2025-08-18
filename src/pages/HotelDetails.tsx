import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { HotelOffersDisplay } from '@/components/hotel/HotelOffersDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Wifi, Car, Utensils, Waves } from 'lucide-react';

export const HotelDetails = () => {
  const [searchParams] = useSearchParams();
  
  // Extract hotel and search parameters
  const hotelData = searchParams.get('hotel');
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const adults = parseInt(searchParams.get('adults') || '2');
  const children = parseInt(searchParams.get('children') || '0');
  const rooms = parseInt(searchParams.get('rooms') || '1');

  if (!hotelData || !checkIn || !checkOut) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Hotel information not found</h2>
              <p className="text-muted-foreground">
                Please go back and select a hotel from the search results.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  let hotel;
  try {
    hotel = JSON.parse(decodeURIComponent(hotelData));
  } catch (error) {
    console.error('Error parsing hotel data:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Invalid hotel data</h2>
              <p className="text-muted-foreground">
                There was an error loading the hotel information. Please try again.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case "wifi":
        return <Wifi className="h-4 w-4" />;
      case "parking":
        return <Car className="h-4 w-4" />;
      case "restaurant":
        return <Utensils className="h-4 w-4" />;
      case "pool":
        return <Waves className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Hotel Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl mb-2">{hotel.name}</CardTitle>
                <div className="flex items-center space-x-2 mb-2">
                  {renderStars(hotel.starRating)}
                  <span className="text-sm text-muted-foreground">({hotel.starRating} star hotel)</span>
                </div>
                <div className="flex items-center space-x-1 mb-4">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{hotel.address}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-1 mb-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{hotel.rating}</span>
                  <span className="text-sm text-muted-foreground">({hotel.reviewCount} reviews)</span>
                </div>
                <Badge variant="secondary">{hotel.propertyType}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <img
                  src={hotel.images[0] || "/placeholder.svg"}
                  alt={hotel.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
              <div>
                <p className="text-muted-foreground mb-6">{hotel.description}</p>
                
                {/* Amenities */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Amenities</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {hotel.amenities.slice(0, 6).map((amenity: string) => (
                      <div key={amenity} className="flex items-center space-x-2">
                        {getAmenityIcon(amenity)}
                        <span className="text-sm">{amenity}</span>
                      </div>
                    ))}
                    {hotel.amenities.length > 6 && (
                      <div className="text-sm text-muted-foreground">
                        +{hotel.amenities.length - 6} more amenities
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Real-time Hotel Offers */}
        <HotelOffersDisplay
          hotelId={hotel.id}
          hotelName={hotel.name}
          checkIn={checkIn}
          checkOut={checkOut}
          adults={adults}
          children={children}
          rooms={rooms}
          currency="USD"
        />
      </div>
    </div>
  );
};