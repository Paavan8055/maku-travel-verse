import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Calendar, Users } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function BookingSelect() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Extract parameters from URL
  const hotelId = searchParams.get('hotelId');
  const offerId = searchParams.get('offerId');
  const hotelName = searchParams.get('hotelName') || 'Selected Hotel';
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const adults = parseInt(searchParams.get('adults') || '2');
  const children = parseInt(searchParams.get('children') || '0');
  const rooms = parseInt(searchParams.get('rooms') || '1');

  // Room selection preferences
  const [bedPreference, setBedPreference] = useState('any');
  const [specialRequests, setSpecialRequests] = useState('');

  console.log('BookingSelect URL params:', Object.fromEntries(searchParams.entries()));

  // Validate required parameters
  if (!hotelId || !offerId || !checkIn || !checkOut) {
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

  const handleBackClick = () => {
    // Go back to hotel details
    const params = new URLSearchParams({
      hotelId,
      checkIn,
      checkOut,
      adults: adults.toString(),
      children: children.toString(),
      rooms: rooms.toString()
    });
    navigate(`/HotelDetails?${params.toString()}`);
  };

  const handleContinue = () => {
    // Navigate to extras page with room selection data
    const params = new URLSearchParams({
      hotelId,
      offerId,
      checkIn,
      checkOut,
      adults: adults.toString(),
      children: children.toString(),
      rooms: rooms.toString(),
      bedPreference,
      specialRequests: encodeURIComponent(specialRequests)
    });
    navigate(`/BookingExtras?${params.toString()}`);
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackClick}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Room Selection</h1>
            <p className="text-muted-foreground">Customize your room preferences</p>
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

        {/* Room Preferences */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Room Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bedPreference">Bed Preference</Label>
              <select
                id="bedPreference"
                value={bedPreference}
                onChange={(e) => setBedPreference(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                <option value="any">Any bed type</option>
                <option value="king">King bed</option>
                <option value="queen">Queen bed</option>
                <option value="twin">Twin beds</option>
                <option value="double">Double bed</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
              <Input
                id="specialRequests"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="e.g., High floor, quiet room, early check-in..."
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Special requests are subject to availability and may incur additional charges.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Continue Button */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Selected offer</p>
                <p className="font-medium">Offer ID: {offerId}</p>
              </div>
              <Button onClick={handleContinue} size="lg">
                Continue to Extras
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
