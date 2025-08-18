import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Star, MapPin, Wifi, Car, Utensils, Heart, ChevronLeft, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import Navbar from "@/components/Navbar";
import { OffersWidget, LocalTipsPanel } from "@/features/bookingEnhancements/components";
import { HotelOffersDisplay } from "@/components/hotel/HotelOffersDisplay";

const BookingSelectPage = () => {
  const navigate = useNavigate();
  const [addFundContribution, setAddFundContribution] = useState(false);
  const [fundContribution, setFundContribution] = useState(50);
  const [fundBalance] = useState(1250);

  // Get hotel data and search parameters from URL
  const urlParams = new URLSearchParams(window.location.search);
  const hotelParam = urlParams.get('hotel');
  
  console.log('BookingSelect URL params:', Object.fromEntries(urlParams.entries()));
  
  // Extract search parameters with multiple possible names
  const checkInParam = urlParams.get('checkin') || urlParams.get('checkIn');
  const checkOutParam = urlParams.get('checkout') || urlParams.get('checkOut');
  const adultsParam = urlParams.get('adults');
  const childrenParam = urlParams.get('children');
  const roomsParam = urlParams.get('rooms');
  
  console.log('Extracted search params:', {
    checkIn: checkInParam,
    checkOut: checkOutParam,
    adults: adultsParam,
    children: childrenParam,
    rooms: roomsParam
  });
  
  // Try to get search criteria from session storage as fallback
  let searchCriteria: any = {};
  try {
    const stored = sessionStorage.getItem('hotelSearchCriteria');
    if (stored) {
      searchCriteria = JSON.parse(stored);
      console.log('Search criteria from session storage:', searchCriteria);
    }
  } catch (error) {
    console.error('Failed to parse search criteria:', error);
  }
  
  // Use URL params first, then fallback to session storage, then defaults
  const checkIn = checkInParam || searchCriteria.checkin;
  const checkOut = checkOutParam || searchCriteria.checkout;
  const adults = parseInt(adultsParam || searchCriteria.adults || '2');
  const children = parseInt(childrenParam || searchCriteria.children || '0');
  const totalGuests = adults + children;
  
  console.log('Final values used:', {
    checkIn,
    checkOut,
    adults,
    children,
    totalGuests
  });
  
  // Calculate nights and format dates
  let nights = 1; // default to 1 night
  let checkInDate = "Today"; // default
  let checkOutDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  }); // 1 day from today
  
  if (checkIn && checkOut) {
    try {
      const checkInDateObj = new Date(checkIn);
      const checkOutDateObj = new Date(checkOut);
      nights = Math.ceil((checkOutDateObj.getTime() - checkInDateObj.getTime()) / (1000 * 60 * 60 * 24));
      
      checkInDate = checkInDateObj.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      checkOutDate = checkOutDateObj.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      
      console.log('Calculated nights and dates:', {
        nights,
        checkInDate,
        checkOutDate
      });
    } catch (error) {
      console.error('Failed to parse dates:', error);
      // Keep defaults
    }
  } else {
    console.warn('Missing check-in or check-out dates, using defaults');
  }

  let hotel: any = {
    id: "1",
    name: "Ocean Breeze Resort",
    location: "Seminyak, Bali", 
    rating: 4.8,
    reviews: 1234,
    images: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop"
    ],
    amenities: ["Free WiFi", "Pool", "Spa", "Restaurant", "Beach Access", "Gym"],
    verified: true,
    description: "Luxury beachfront resort with world-class amenities and stunning ocean views."
  };

  // Try to parse hotel data from URL parameter
  if (hotelParam) {
    try {
      const decodedHotel = JSON.parse(decodeURIComponent(hotelParam));
      hotel = {
        ...hotel,
        ...decodedHotel,
        location: decodedHotel.address || hotel.location,
        reviews: decodedHotel.reviewCount || hotel.reviews,
        verified: true
      };
      console.log('Parsed hotel data:', hotel);
    } catch (error) {
      console.error('Failed to parse hotel data from URL:', error);
    }
  }

  // Extract destination from hotel data for offers and tips
  const destination = hotel.location.split(',')[1]?.trim() || 'BALI';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Breadcrumb & Header */}
      <div className="pt-24 pb-6 px-6 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Search
            </Button>
          </div>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{hotel.name}</h1>
              <div className="flex items-center space-x-4 text-muted-foreground">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {hotel.location}
                </div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
                  {hotel.rating} ({hotel.reviews} reviews)
                </div>
                {hotel.verified && <Badge className="bg-green-500">Verified</Badge>}
              </div>
            </div>
            
            {/* Fund Balance Display */}
            <Card className="travel-card">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  <p className="text-xl font-bold text-primary">${fundBalance}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Hotel Details */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="grid grid-cols-2 gap-2 mb-6 rounded-lg overflow-hidden">
              {hotel.images.map((image, index) => (
                <div key={index} className="aspect-video">
                  <img
                    src={image}
                    alt={`${hotel.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>

            {/* Description */}
            <Card className="travel-card mb-6">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-3">About This Property</h2>
                <p className="text-muted-foreground mb-4">{hotel.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {hotel.amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center space-x-2">
                      <Wifi className="h-4 w-4 text-primary" />
                      <span className="text-sm">{amenity}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Real Amadeus Hotel Offers */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Available Rooms</h2>
              <HotelOffersDisplay
                hotelId={hotel.id}  
                hotelName={hotel.name}
                checkIn={checkIn || '2025-08-20'}
                checkOut={checkOut || '2025-08-21'}
                adults={adults}
                children={children}
                rooms={parseInt(roomsParam || '1')}
                currency="USD"
              />
            </div>
          </div>

          {/* Booking Summary & Fund Manager */}
          <div className="space-y-6">
            {/* Booking Summary */}
            <Card className="travel-card">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">Booking Summary</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Check-in:</span>
                    <span>{checkInDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Check-out:</span>
                    <span>{checkOutDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>{nights} {nights === 1 ? 'night' : 'nights'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Guests:</span>
                    <span>{totalGuests} {totalGuests === 1 ? 'guest' : 'guests'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Travel Fund Contribution */}
            <Card className="travel-card">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">Travel Fund Manager</h3>
                
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox 
                    id="fund-contribution"
                    checked={addFundContribution}
                    onCheckedChange={(checked) => setAddFundContribution(checked === true)}
                  />
                  <label htmlFor="fund-contribution" className="text-sm font-medium">
                    Add to Travel Fund
                  </label>
                </div>

                {addFundContribution && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Contribution amount:</span>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setFundContribution(Math.max(10, fundContribution - 10))}
                        >
                          -
                        </Button>
                        <span className="w-16 text-center">${fundContribution}</span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setFundContribution(fundContribution + 10)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Build your fund for future trips. Earn 2% bonus on contributions over $100.
                    </p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center text-sm">
                     <span>Current Balance:</span>
                     <span className="font-bold">${fundBalance}</span>
                   </div>
                   {addFundContribution && (
                     <div className="flex justify-between items-center text-sm mt-1">
                       <span>After Contribution:</span>
                       <span className="font-bold text-primary">${fundBalance + fundContribution}</span>
                     </div>
                   )}
                 </div>
               </CardContent>
             </Card>

             {/* Booking Enhancements */}
             <div className="space-y-4">
               <OffersWidget route={`${hotel.location}-DESTINATION`} limit={2} />
               <LocalTipsPanel locationId={destination.toUpperCase()} />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSelectPage;
