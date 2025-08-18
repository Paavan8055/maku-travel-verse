
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bed, Users, CreditCard, Calendar, MapPin, AlertCircle } from 'lucide-react';
import { useHotelOffers } from '@/hooks/useHotelOffers';
import { useHotelBooking } from '@/features/booking/hooks/useHotelBooking';

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
  const { createHotelBooking, isLoading: bookingLoading } = useHotelBooking();

  // Check if this is a fallback/demo hotel ID
  const isFallbackHotel = hotelId.startsWith('fallback-');

  useEffect(() => {
    if (hotelId && checkIn && checkOut && !isFallbackHotel) {
      fetchOffers({
        hotelId,
        checkIn,
        checkOut,
        adults,
        children,
        rooms,
        currency
      });
    }
  }, [hotelId, checkIn, checkOut, adults, children, rooms, currency, fetchOffers, isFallbackHotel]);

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
        useRealAmadeusBooking: true // Use real Amadeus booking
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

  // Show fallback demo rooms for demo hotels
  if (isFallbackHotel) {
    const demoRooms = [
      {
        id: 'demo-standard',
        type: 'Standard Room',
        description: 'Comfortable room with city view, perfect for business or leisure travelers.',
        capacity: adults,
        price: 120,
        amenities: ['Free WiFi', 'Air Conditioning', 'Private Bathroom', 'TV']
      },
      {
        id: 'demo-deluxe',
        type: 'Deluxe Room',
        description: 'Spacious room with premium amenities and enhanced comfort features.',
        capacity: adults,
        price: 180,
        amenities: ['Free WiFi', 'Air Conditioning', 'Private Bathroom', 'TV', 'Mini Bar', 'Balcony']
      }
    ];

    return (
      <div className="space-y-6">
        {/* Hotel Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {hotelName}
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

        {/* Demo Notice */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-800">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm font-medium">Demo Mode</p>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              This is a demonstration hotel. Real-time availability and booking would be integrated with live hotel APIs.
            </p>
          </CardContent>
        </Card>

        {/* Demo Rooms */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Available Rooms ({demoRooms.length})</h3>
          
          {demoRooms.map((room) => (
            <Card key={room.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Bed className="h-5 w-5 text-primary" />
                      <h4 className="text-lg font-semibold">{room.type}</h4>
                      <Badge variant="secondary">Demo</Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">
                      {room.description}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        Capacity: {room.capacity}
                      </div>
                      <div className="flex items-center gap-1">
                        <CreditCard className="h-4 w-4" />
                        Free cancellation
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {room.amenities.map((amenity) => (
                        <Badge key={amenity} variant="outline" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="text-right space-y-2 ml-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Total price</p>
                      <p className="text-2xl font-bold text-primary">
                        AUD ${room.price}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        per night
                      </p>
                    </div>
                    
                    <Button 
                      className="w-full"
                      onClick={() => handleBookOffer(room.id, room.price.toString())}
                      disabled={bookingLoading}
                    >
                      {bookingLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Booking...
                        </>
                      ) : (
                        'Book now (Demo)'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

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
    return (
      <Card className="w-full">
        <CardContent className="p-8">
          <div className="text-center text-destructive">
            <p className="text-lg font-semibold mb-2">Unable to load offers</p>
            <p className="text-sm">{error}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => fetchOffers({ hotelId, checkIn, checkOut, adults, children, rooms, currency })}
            >
              Try again
            </Button>
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
            <p className="text-lg font-semibold mb-2">No rooms available</p>
            <p className="text-sm text-muted-foreground">
              No rooms are available for your selected dates. Please try different dates.
            </p>
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
        
        {offers.map((offer) => (
          <Card key={offer.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
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

                  {offer.room.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {offer.room.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Capacity: {offer.room.capacity}
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
