import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bed, Users, CreditCard, Calendar, MapPin, AlertCircle, Search, Image, Building } from 'lucide-react';
import { useHotelOffers } from '@/hooks/useHotelOffers';
import { useHotelPhotos } from '@/hooks/useHotelPhotos';
import { useHotelBooking } from '@/features/booking/hooks/useHotelBooking';
import { useNavigate } from 'react-router-dom';

interface HotelOffersDisplayProps {
  hotelId: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  adults?: number;
  children?: number;
  rooms?: number;
  currency?: string;
}

export const HotelOffersDisplay = ({
  hotelId,
  hotelName,
  checkIn,
  checkOut,
  adults = 2,
  children = 0,
  rooms = 1,
  currency = 'USD'
}: HotelOffersDisplayProps) => {
  const { offers, hotel, loading, error, fetchOffers } = useHotelOffers();
  const { photos, loading: photosLoading, fetchPhotos } = useHotelPhotos();
  const { createHotelBooking, isLoading: bookingLoading } = useHotelBooking();
  const navigate = useNavigate();

  useEffect(() => {
    if (hotelId && checkIn && checkOut) {
      console.log('Fetching offers for hotel ID:', hotelId);
      fetchOffers({
        hotelId,
        checkIn,
        checkOut,
        adults,
        children,
        rooms,
        currency
      });
      
      // Fetch hotel photos
      fetchPhotos(hotelId);
    }
  }, [hotelId, checkIn, checkOut, adults, children, rooms, currency, fetchOffers, fetchPhotos]);

  const handleBookOffer = async (offerId: string, price: string) => {
    console.log('Booking offer:', offerId);
    
    // For demo purposes - in production, collect guest details properly
    const guestDetails = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890'
    };

    const roomDetails = {
      roomType: 'Standard',
      boardType: 'Room Only',
      checkIn,
      checkOut,
      guests: adults
    };

    try {
      const result = await createHotelBooking({
        hotelOfferId: offerId,
        guestDetails,
        roomDetails,
        useRealAmadeusBooking: true
      });

      if (result.success) {
        console.log('Booking successful:', result);
        if (result.redirectUrl) {
          window.location.href = result.redirectUrl;
        }
      }
    } catch (error) {
      console.error('Booking failed:', error);
    }
  };

  const handleSearchAgain = () => {
    navigate('/search/hotels');
  };

  // Helper function to safely extract text from description object
  const getDescriptionText = (description: any): string => {
    if (typeof description === 'string') {
      return description;
    }
    if (description && typeof description === 'object' && description.text) {
      return description.text;
    }
    return '';
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading room offers...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    const isHotelNotFound = error.includes('not found') || error.includes('not available');
    
    return (
      <Card className="w-full">
        <CardContent className="p-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <p className="text-lg font-semibold mb-2">
              {isHotelNotFound ? 'Hotel Not Available' : 'Unable to load offers'}
            </p>
            <p className="text-sm mb-4 text-muted-foreground">{error}</p>
            
            {isHotelNotFound && (
              <div className="bg-muted p-4 rounded-lg mb-4 text-sm text-left">
                <p className="font-medium mb-2">This could happen because:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>The hotel is not available through our booking system</li>
                  <li>The hotel ID may have changed or is no longer valid</li>
                  <li>The hotel may be temporarily unavailable</li>
                </ul>
              </div>
            )}
            
            <div className="flex gap-3 justify-center">
              <Button 
                variant="outline" 
                onClick={() => fetchOffers({ hotelId, checkIn, checkOut, adults, children, rooms, currency })}
              >
                Try again
              </Button>
              <Button onClick={handleSearchAgain} className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search other hotels
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (offers.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-8">
          <div className="text-center">
            <Bed className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-semibold mb-2">No rooms available</p>
            <p className="text-sm text-muted-foreground mb-4">
              No rooms are available for your selected dates at this hotel.
            </p>
            <div className="bg-muted p-4 rounded-lg mb-4 text-sm text-left">
              <p className="font-medium mb-2">Try these alternatives:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Search for different dates</li>
                <li>Look for other hotels in the same area</li>
                <li>Reduce the number of rooms or guests</li>
              </ul>
            </div>
            <Button onClick={handleSearchAgain} className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search other hotels
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hotel Information */}
      {hotel && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {hotel.name || hotelName}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {checkIn} - {checkOut}
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {adults} adults {children > 0 && `, ${children} children`}
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Room Offers */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Available Rooms ({offers.length})</h3>
        
        {offers.map((offer) => {
          const descriptionText = getDescriptionText(offer.room.description);
          
          return (
            <Card key={offer.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex gap-6">
                  {/* Room Image */}
                  <div className="flex-shrink-0 w-48 h-32">
                    {photos.length > 0 ? (
                      <img 
                        src={photos[0].url} 
                        alt={photos[0].title || 'Hotel room'}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    
                    {/* Enhanced fallback placeholder */}
                    <div className={`w-full h-full bg-gradient-to-br from-muted/50 to-muted rounded-lg flex flex-col items-center justify-center ${photos.length > 0 ? 'hidden' : ''}`}>
                      {photosLoading ? (
                        <div className="text-center text-muted-foreground">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                          <p className="text-xs">Loading photo...</p>
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <Building className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-xs font-medium">{hotel?.name || hotelName}</p>
                          <p className="text-xs opacity-75">Photo not available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Room Details */}
                  <div className="flex-1 flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Bed className="h-5 w-5 text-primary" />
                        <h4 className="text-lg font-semibold">
                          {offer.room.type || offer.room.typeEstimated?.category || 'Standard Room'}
                        </h4>
                        {offer.rateFamilyEstimated && (
                          <Badge variant="secondary">
                            {offer.rateFamilyEstimated.code}
                          </Badge>
                        )}
                      </div>

                      {descriptionText && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {descriptionText}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          Capacity: {offer.room.capacity || offer.guests?.adults || 2}
                        </div>
                        {offer.policies?.cancellation && (
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-4 w-4" />
                            {offer.policies.cancellation.type === 'FULL_STAY' ? 'Free cancellation' : 'Non-refundable'}
                          </div>
                        )}
                      </div>

                      {offer.policies?.paymentType && (
                        <Badge variant="outline" className="text-xs">
                          Payment: {offer.policies.paymentType}
                        </Badge>
                      )}
                    </div>

                    <div className="text-right space-y-2 ml-6">
                      <div>
                        <p className="text-sm text-muted-foreground">Total price</p>
                        <p className="text-2xl font-bold text-primary">
                          {offer.price.currency} {offer.price.total}
                        </p>
                        {offer.price.base !== offer.price.total && (
                          <p className="text-sm text-muted-foreground">
                            Base: {offer.price.currency} {offer.price.base}
                          </p>
                        )}
                      </div>
                      
                      <Button 
                        className="w-full"
                        onClick={() => handleBookOffer(offer.id, offer.price.total)}
                        disabled={bookingLoading}
                      >
                        {bookingLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Booking...
                          </>
                        ) : (
                          'Book now'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
