
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Users } from 'lucide-react';
import { HotelOffersDisplay } from '@/components/hotel/HotelOffersDisplay';

export default function BookingSelect() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Extract parameters from URL
  const hotelId = searchParams.get('hotelId');
  const hotelName = searchParams.get('hotelName') || 'Selected Hotel';
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const adults = parseInt(searchParams.get('adults') || '2');
  const children = parseInt(searchParams.get('children') || '0');
  const rooms = parseInt(searchParams.get('rooms') || '1');

  console.log('BookingSelect URL params:', Object.fromEntries(searchParams.entries()));

  // Validate required parameters
  if (!hotelId || !checkIn || !checkOut) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-lg font-semibold mb-4">Missing booking information</p>
            <p className="text-muted-foreground mb-4">
              Please return to hotel search and select a hotel with valid dates.
            </p>
            <Button onClick={() => navigate('/search/hotels')}>
              Back to Hotel Search
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate nights and format dates for display
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24));

  console.log('Extracted search params:', {
    checkIn,
    checkOut,
    adults: adults.toString(),
    children: children.toString(),
    rooms: rooms.toString()
  });

  const totalGuests = adults + children;

  console.log('Final values used:', {
    checkIn,
    checkOut,
    adults,
    children,
    totalGuests
  });

  console.log('Calculated nights and dates:', {
    nights,
    checkInDate: checkInDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }),
    checkOutDate: checkOutDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  });

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Select Your Room</h1>
          <p className="text-muted-foreground">Choose from available rooms and rates</p>
        </div>
      </div>

      {/* Booking Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Booking Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-medium">Hotel</p>
              <p className="text-muted-foreground">{hotelName}</p>
            </div>
            <div>
              <p className="font-medium">Dates</p>
              <p className="text-muted-foreground">
                {checkInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {checkOutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
            <div>
              <p className="font-medium">Duration</p>
              <p className="text-muted-foreground">{nights} night{nights !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <div>
                <p className="font-medium">Guests</p>
                <p className="text-muted-foreground">
                  {adults} adult{adults !== 1 ? 's' : ''}{children > 0 && `, ${children} child${children !== 1 ? 'ren' : ''}`}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hotel Offers Display */}
      <HotelOffersDisplay
        hotelId={hotelId}
        hotelName={hotelName}
        checkIn={checkIn}
        checkOut={checkOut}
        adults={adults}
        children={children}
        rooms={rooms}
        currency="USD"
      />
    </div>
  );
}
