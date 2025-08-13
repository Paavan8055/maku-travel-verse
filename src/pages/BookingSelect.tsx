import { useState, useEffect } from "react";
import { Star, MapPin, Wifi, Car, Utensils, Heart, ChevronLeft, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import Navbar from "@/components/Navbar";
import { OffersWidget, LocalTipsPanel } from "@/features/bookingEnhancements/components";

const BookingSelectPage = () => {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [addFundContribution, setAddFundContribution] = useState(false);
  const [fundContribution, setFundContribution] = useState(50);
  const [fundBalance] = useState(1250);
  // Sleeping options
  const [bedType, setBedType] = useState<'King' | 'Queen' | 'Twin'>('King');
  const [extraBeds, setExtraBeds] = useState<number>(0);
  const [rollaway, setRollaway] = useState<boolean>(false);
  const [sofaBed, setSofaBed] = useState<boolean>(false);

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

  const rooms = [
    {
      id: "deluxe",
      name: "Deluxe Ocean View",
      size: "35 sqm",
      guests: 2,
      price: hotel.pricePerNight || 450,
      originalPrice: Math.round((hotel.pricePerNight || 450) * 1.3),
      savings: Math.round((hotel.pricePerNight || 450) * 0.3),
      amenities: ["King Bed", "Ocean View", "Balcony", "Free WiFi"],
      availability: "Last 3 rooms",
      image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&h=300&fit=crop"
    },
    {
      id: "suite",
      name: "Presidential Suite",
      size: "75 sqm",
      guests: 4,
      price: Math.round((hotel.pricePerNight || 450) * 1.9),
      originalPrice: Math.round((hotel.pricePerNight || 450) * 2.7),
      savings: Math.round((hotel.pricePerNight || 450) * 0.8),
      amenities: ["Master Bedroom", "Living Room", "Kitchen", "Ocean View", "Private Balcony"],
      availability: "2 rooms left",
      image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop"
    }
  ];

  const handleRoomSelect = (roomId: string) => {
    setSelectedRoom(roomId);
  };

  const handleContinue = () => {
    if (!selectedRoom) return;

    const selectedRoomData = rooms.find(room => room.id === selectedRoom);

    // Persist selections for downstream steps
    try {
      const selections = {
        hotelId: hotel.id,
        hotelName: hotel.name,
        roomId: selectedRoom,
        roomName: selectedRoomData?.name,
        nightlyPrice: selectedRoomData?.price || 0,
        bedType,
        extraBeds,
        rollaway,
        sofaBed,
        fundContribution: addFundContribution ? fundContribution : 0,
        // Preserve search criteria
        checkIn,
        checkOut,
        nights,
        adults,
        children,
        totalGuests
      };
      sessionStorage.setItem('hotelBookingSelections', JSON.stringify(selections));
      console.log('Saved booking selections:', selections);
    } catch (error) {
      console.error('Failed to save booking selections:', error);
    }

    // Pass search parameters to checkout
    const checkoutParams = new URLSearchParams();
    if (checkIn) checkoutParams.set('checkin', checkIn);
    if (checkOut) checkoutParams.set('checkout', checkOut);
    if (adults) checkoutParams.set('adults', adults.toString());
    if (children) checkoutParams.set('children', children.toString());
    
    const checkoutUrl = `/booking/checkout/hotel${checkoutParams.toString() ? '?' + checkoutParams.toString() : ''}`;
    console.log('Navigating to hotel checkout:', checkoutUrl);
    window.location.href = checkoutUrl;
  };

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

            {/* Room Selection */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Choose Your Room</h2>
              
              {rooms.map((room) => (
                <Card 
                  key={room.id} 
                  className={`travel-card cursor-pointer transition-all ${
                    selectedRoom === room.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleRoomSelect(room.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <img
                        src={room.image}
                        alt={room.name}
                        className="w-32 h-24 object-cover rounded-lg"
                      />
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-bold">{room.name}</h3>
                          <div className="text-right">
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl font-bold">${room.price}</span>
                              <span className="text-sm text-muted-foreground line-through">
                                ${room.originalPrice}
                              </span>
                            </div>
                            <div className="text-xs text-green-600">Save ${room.savings}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                          <span>{room.size}</span>
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            Up to {room.guests} guests
                          </span>
                          <Badge variant="destructive" className="text-xs">
                            {room.availability}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {room.amenities.map((amenity) => (
                            <Badge key={amenity} variant="secondary" className="text-xs">
                              {amenity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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

                {selectedRoom && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Selected Room:</span>
                    </div>
                    <p className="text-sm">{rooms.find(r => r.id === selectedRoom)?.name}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span>{nights} {nights === 1 ? 'night' : 'nights'} × ${rooms.find(r => r.id === selectedRoom)?.price}</span>
                      <span className="font-bold">${(rooms.find(r => r.id === selectedRoom)?.price || 0) * nights}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bed & Sleeping Options */}
            <Card className="travel-card">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-bold">Bed & Sleeping Options</h3>

                {/* Bed type selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bed type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['King','Queen','Twin'] as const).map(bt => (
                      <Button
                        key={bt}
                        type="button"
                        variant={bedType === bt ? 'default' : 'outline'}
                        onClick={() => setBedType(bt)}
                        className="w-full"
                      >
                        {bt}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Additional beds counter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Additional beds</label>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setExtraBeds(Math.max(0, extraBeds - 1))}>-</Button>
                    <span className="w-10 text-center">{extraBeds}</span>
                    <Button variant="outline" size="sm" onClick={() => setExtraBeds(extraBeds + 1)}>+</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Request extra single beds (subject to availability, fees may apply).</p>
                </div>

                {/* Special bed requests */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="rollaway" checked={rollaway} onCheckedChange={(c) => setRollaway(c === true)} />
                    <label htmlFor="rollaway" className="text-sm">Rollaway bed</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="sofaBed" checked={sofaBed} onCheckedChange={(c) => setSofaBed(c === true)} />
                    <label htmlFor="sofaBed" className="text-sm">Sofa bed</label>
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

             {/* Continue Button */}
             <Button 
               onClick={handleContinue}
               disabled={!selectedRoom}
               className="w-full btn-primary h-12"
             >
               Continue to Details
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSelectPage;
