import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { UnifiedHotelSelection } from '@/components/booking/UnifiedHotelSelection';
import { useEnhancedHotelSearch } from '@/hooks/useEnhancedHotelSearch';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function HotelSelectionPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Extract search parameters
  const hotelId = searchParams.get('hotelId');
  const destination = searchParams.get('destination');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const guests = parseInt(searchParams.get('guests') || '2');
  const rooms = parseInt(searchParams.get('rooms') || '1');

  // Calculate nights
  const checkInDate = new Date(checkIn || '');
  const checkOutDate = new Date(checkOut || '');
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

  // Search for hotel details if we have the parameters
  const searchCriteria = destination && checkIn && checkOut ? {
    destination,
    checkIn,
    checkOut,
    guests,
    rooms,
    hotelName: hotelId ? undefined : undefined
  } : null;

  const { hotels, loading, error } = useEnhancedHotelSearch(searchCriteria);
  
  // Find the specific hotel
  const selectedHotel = hotels.find(h => h.id === hotelId) || hotels[0];

  const handleContinue = (selection: {
    roomId: string;
    addOns: string[];
    specialRequests: string;
    totalPrice: number;
  }) => {
    const bookingParams = new URLSearchParams({
      hotelId: selectedHotel?.id || '',
      destination: destination || '',
      checkIn: checkIn || '',
      checkOut: checkOut || '',
      guests: guests.toString(),
      rooms: rooms.toString(),
      roomId: selection.roomId,
      addOns: JSON.stringify(selection.addOns),
      specialRequests: selection.specialRequests,
      totalPrice: selection.totalPrice.toString()
    });
    
    navigate(`/booking/traveller-details?${bookingParams.toString()}`);
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading hotel details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !selectedHotel) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 text-center">
              <h2 className="text-2xl font-semibold mb-4">Hotel Not Found</h2>
              <p className="text-muted-foreground mb-6">
                {error || "We couldn't find the hotel you're looking for."}
              </p>
              <Button onClick={handleBack} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Search
              </Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Transform hotel data for the UnifiedHotelSelection component
  const enhancedHotel = {
    ...selectedHotel,
    checkIn: checkIn || '',
    checkOut: checkOut || '',
    nights,
    totalGuests: guests,
    roomOptions: selectedHotel.roomOptions?.length > 0 ? selectedHotel.roomOptions : [
      {
        id: 'standard',
        name: 'Standard Room',
        description: 'Comfortable accommodation with modern amenities',
        bedType: 'Queen Bed',
        occupancy: guests,
        size: '25 sqm',
        pricePerNight: selectedHotel.pricePerNight,
        boardType: 'room_only' as const,
        amenities: selectedHotel.amenities,
        cancellationPolicy: selectedHotel.cancellationPolicy,
        isRefundable: true
      }
    ],
    availableAddOns: [
      {
        id: 'late-checkout',
        name: 'Late Checkout',
        description: 'Check out up to 2 hours later than standard time',
        price: 50,
        type: 'experience' as const,
        isPerPerson: false
      },
      {
        id: 'breakfast',
        name: 'Continental Breakfast',
        description: 'Daily breakfast buffet for all guests',
        price: 35,
        type: 'dining' as const,
        isPerPerson: true
      },
      {
        id: 'airport-transfer',
        name: 'Airport Transfer',
        description: 'Private transfer to/from airport',
        price: 80,
        type: 'transport' as const,
        isPerPerson: false
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <UnifiedHotelSelection
          hotel={enhancedHotel}
          onContinue={handleContinue}
          onBack={handleBack}
        />
      </div>
    </div>
  );
}