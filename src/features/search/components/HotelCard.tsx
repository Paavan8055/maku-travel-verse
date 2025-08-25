
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Star, Wifi, Car, Utensils, Waves, Shield, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RealBookingButton } from "@/components/RealBookingButton";
import { RoomSelectionModal } from "@/components/booking";
import { useHotelImagesEnhanced } from "@/hooks/useHotelImagesEnhanced";

interface Hotel {
  id: string;
  name: string;
  description: string;
  address: string;
  images: string[];
  starRating: number;
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  currency: string;
  totalPrice: number;
  propertyType: string;
  distanceFromCenter: number;
  amenities: string[];
  cancellationPolicy: string;
  breakfast: boolean;
  safetyRating?: string;
  pointsOfInterest?: any[];
  deals?: {
    type: string;
    description: string;
    savings: number;
  };
  amadeus?: {
    hotelId: string;
    chainCode: string;
    dupeId: number;
    offers: any[];
  };
}

interface HotelCardProps {
  hotel: Hotel;
}

export const HotelCard = ({ hotel }: HotelCardProps) => {
  const navigate = useNavigate();
  const [showRoomSelection, setShowRoomSelection] = useState(false);
  const { images, fetchImages } = useHotelImagesEnhanced();

  // Fetch images when component mounts
  useEffect(() => {
    if (hotel.amadeus?.hotelId || hotel.id) {
      // Use HotelBeds hotel code for better image quality
      const hotelCode = hotel.id; // Assume hotel.id is the HotelBeds code
      fetchImages(hotelCode);
    }
  }, [hotel.id, hotel.amadeus?.hotelId, fetchImages]);

  const handleSelectHotel = () => {
    // Get current search parameters to preserve them
    const currentUrlParams = new URLSearchParams(window.location.search);
    
    console.log('Current URL params when selecting hotel:', Object.fromEntries(currentUrlParams.entries()));
    console.log('Hotel selected:', hotel.name, 'with Amadeus ID:', hotel.amadeus?.hotelId || hotel.id);
    
    // Create new search parameters for hotel offers
    const searchParams = new URLSearchParams();
    
    // Use the real Amadeus hotel ID if available
    const hotelId = hotel.amadeus?.hotelId || hotel.id;
    searchParams.set('hotelId', hotelId);
    
    // Enhanced parameter standardization with validation
    const checkInValue = currentUrlParams.get('checkIn') || currentUrlParams.get('checkin');
    const checkOutValue = currentUrlParams.get('checkOut') || currentUrlParams.get('checkout');
    
    // Improved guest handling with proper separation of adults/children
    let adultsValue = currentUrlParams.get('adults');
    let childrenValue = currentUrlParams.get('children') || '0';
    
    // Fallback to guests parameter if adults not specified
    if (!adultsValue) {
      const guestsValue = currentUrlParams.get('guests') || '2';
      const totalGuests = parseInt(guestsValue);
      adultsValue = Math.max(1, totalGuests).toString();
      // If guests > 2, assume some might be children
      if (totalGuests > 2 && parseInt(childrenValue) === 0) {
        const assumedChildren = Math.max(0, totalGuests - 2);
        childrenValue = assumedChildren.toString();
        adultsValue = Math.max(1, totalGuests - assumedChildren).toString();
      }
    }
    
    const roomsValue = currentUrlParams.get('rooms') || '1';
    
    if (checkInValue) searchParams.set('checkIn', checkInValue);
    if (checkOutValue) searchParams.set('checkOut', checkOutValue);
    searchParams.set('adults', adultsValue);
    searchParams.set('children', childrenValue);
    searchParams.set('rooms', roomsValue);
    
    // Pass hotel name for display
    searchParams.set('hotelName', hotel.name);
    
    console.log('Hotel offers params:', Object.fromEntries(searchParams.entries()));
    
    // Navigate to hotel offers page
    const finalUrl = `/booking/select?${searchParams.toString()}`;
    console.log('Navigating to hotel offers:', finalUrl);
    navigate(finalUrl);
  };

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
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="flex">
          {/* Hotel Image */}
          <div className="w-64 h-48 relative overflow-hidden rounded-l-lg">
            <img
              src={images?.[0]?.url || hotel.images?.[0] || '/placeholder.svg'}
              alt={hotel.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
            {hotel.deals && (
              <div className="absolute top-3 left-3">
                <Badge className="bg-green-500 text-white">
                  Save ${hotel.deals.savings}
                </Badge>
              </div>
            )}
          </div>

          {/* Hotel Details */}
          <div className="flex-1 p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-xl font-semibold text-foreground">{hotel.name}</h3>
                  <div className="flex items-center">
                    {renderStars(hotel.starRating)}
                  </div>
                </div>

                <div className="flex items-center space-x-1 mb-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {hotel.distanceFromCenter}km from center
                  </span>
                </div>

                <div className="flex items-center space-x-2 mb-3">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium text-foreground">
                      {hotel.rating > 0 ? hotel.rating.toFixed(1) : 'Not rated'}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {hotel.reviewCount > 0 ? `(${hotel.reviewCount} reviews)` : '(No reviews yet)'}
                  </span>
                  <Badge variant="secondary">{hotel.propertyType}</Badge>
                  {hotel.safetyRating && (
                    <Badge variant="outline" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      Safety: {hotel.safetyRating}
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {hotel.description && hotel.description !== 'Hotel accommodation' 
                    ? hotel.description 
                    : 'Description not available'}
                </p>

                {/* Amenities */}
                <div className="flex items-center space-x-3 mb-3">
                  {hotel.amenities.slice(0, 4).map((amenity) => (
                    <div key={amenity} className="flex items-center space-x-1">
                      {getAmenityIcon(amenity)}
                      <span className="text-xs text-muted-foreground">{amenity}</span>
                    </div>
                  ))}
                  {hotel.amenities.length > 4 && (
                    <span className="text-xs text-muted-foreground">
                      +{hotel.amenities.length - 4} more
                    </span>
                  )}
                </div>

                {/* Policies */}
                <div className="flex items-center space-x-4 text-sm">
                  {hotel.breakfast && (
                    <Badge variant="outline" className="text-xs">
                      ✓ Breakfast included
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {hotel.cancellationPolicy}
                  </Badge>
                </div>
              </div>

                {/* Pricing */}
                <div className="text-right space-y-2 ml-6">
                  <div>
                    <p className="text-sm text-muted-foreground">From</p>
                    <p className="text-2xl font-bold text-foreground">
                      {hotel.pricePerNight > 0 
                        ? `${hotel.currency}${hotel.pricePerNight}`
                        : 'Price unavailable'
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">per night</p>
                  </div>
                  <div className="border-t pt-2">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-lg font-semibold text-foreground">
                      {hotel.totalPrice > 0 
                        ? `${hotel.currency}${hotel.totalPrice}`
                        : 'Contact for price'
                      }
                    </p>
                  </div>
                  <Button 
                    className="btn-primary w-full"
                    disabled={hotel.pricePerNight <= 0}
                    onClick={() => {
                      if (hotel.pricePerNight <= 0) return;
                      setShowRoomSelection(true);
                    }}
                  >
                    {hotel.pricePerNight > 0 ? 'Select Room' : 'Contact Hotel'}
                  </Button>

                  <RoomSelectionModal
                    isOpen={showRoomSelection}
                    onClose={() => setShowRoomSelection(false)}
                    hotelId={hotel.amadeus?.hotelId || hotel.id}
                    hotelName={hotel.name}
                    checkIn={(() => {
                      const urlParams = new URLSearchParams(window.location.search);
                      return urlParams.get('checkIn') || urlParams.get('checkin') || new Date().toISOString().split('T')[0];
                    })()}
                    checkOut={(() => {
                      const urlParams = new URLSearchParams(window.location.search);
                      return urlParams.get('checkOut') || urlParams.get('checkout') || new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0];
                    })()}
                    adults={(() => {
                      const urlParams = new URLSearchParams(window.location.search);
                      return parseInt(urlParams.get('adults') || urlParams.get('guests') || '2');
                    })()}
                    children={(() => {
                      const urlParams = new URLSearchParams(window.location.search);
                      return parseInt(urlParams.get('children') || '0');
                    })()}
                    rooms={(() => {
                      const urlParams = new URLSearchParams(window.location.search);
                      return parseInt(urlParams.get('rooms') || '1');
                    })()}
                    currency={hotel.currency}
                    onRoomSelected={(selectedOffer, hotelData, selectedAddOns) => {
                      // Calculate add-ons total
                      const addOnsTotal = selectedAddOns?.reduce((total, addOn) => {
                        const nights = Math.ceil((new Date(selectedOffer.checkOutDate).getTime() - 
                                                  new Date(selectedOffer.checkInDate).getTime()) / (1000 * 60 * 60 * 24));
                        const price = addOn.perNight ? addOn.price * nights : addOn.price;
                        return total + price;
                      }, 0) || 0;

                      // Navigate to hotel checkout with selected room offer
                      const params = new URLSearchParams({
                        hotelId: hotelData.hotelId,
                        hotelName: hotelData.name,
                        checkIn: selectedOffer.checkInDate,
                        checkOut: selectedOffer.checkOutDate,
                        adults: selectedOffer.guests.adults?.toString() || '2',
                        children: selectedOffer.guests.children?.toString() || '0',
                        rooms: '1',
                        price: selectedOffer.price.total,
                        currency: selectedOffer.price.currency,
                        rateCode: selectedOffer.rateCode,
                        offerId: selectedOffer.id
                      });
                      
                      // Store detailed offer and add-ons for checkout
                      sessionStorage.setItem('selectedHotelOffer', JSON.stringify(selectedOffer));
                      sessionStorage.setItem('selectedHotelData', JSON.stringify(hotelData));
                      sessionStorage.setItem('selectedAddOns', JSON.stringify(selectedAddOns || []));
                      sessionStorage.setItem('addOnsTotal', addOnsTotal.toString());
                      
                      navigate(`/hotel-checkout?${params.toString()}`);
                    }}
                  />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
