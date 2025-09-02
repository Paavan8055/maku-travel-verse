import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Calendar, MapPin, Users, Star, Wifi, Car, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/Navbar";
import { HotelBookingProgress } from "@/components/hotel/HotelBookingProgress";
import { useCurrency } from "@/features/currency/CurrencyProvider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logger from "@/utils/logger";

interface HotelOffer {
  id: string;
  hotelId: string;
  name: string;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  rating: number;
  reviewScore?: number;
  totalReviews?: number;
  roomType: string;
  roomDescription: string;
  boardType: string;
  images: string[];
  amenities: string[];
  price: {
    total: number;
    currency: string;
    breakdown: {
      roomRate: number;
      taxes: number;
      fees: number;
    };
  };
  cancellationPolicy: string;
  checkIn: string;
  checkOut: string;
  guests: {
    adults: number;
    children: number;
  };
  nights: number;
  offerId?: string;
}

const HotelBookingReview = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();
  const [hotelOffer, setHotelOffer] = useState<HotelOffer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHotelData = async () => {
      try {
        // Try to get hotel data from session storage first
        const storedHotel = sessionStorage.getItem('selectedHotelOffer');
        
        if (storedHotel) {
          const hotel = JSON.parse(storedHotel);
          setHotelOffer(hotel);
          setLoading(false);
          return;
        }

        // If not in session storage, get from URL params
        const hotelId = searchParams.get('hotelId');
        const offerId = searchParams.get('offerId');
        
        if (!hotelId || !offerId) {
          toast({
            title: "Hotel data missing",
            description: "Please go back and select a hotel.",
            variant: "destructive",
          });
          navigate('/search/hotels');
          return;
        }

        // Attempt to get real hotel data from provider
        const checkIn = searchParams.get('checkIn') || new Date().toISOString().split('T')[0];
        const checkOut = searchParams.get('checkOut') || new Date(Date.now() + 86400000).toISOString().split('T')[0];
        const adults = parseInt(searchParams.get('adults') || '2');
        const children = parseInt(searchParams.get('children') || '0');
        const destination = searchParams.get('destination') || 'SYD';

        // Try to fetch live hotel data from provider rotation
        const searchHotels = async () => {
          try {
            const { data: hotelSearchData, error } = await supabase.functions.invoke('provider-rotation', {
              body: {
                searchType: 'hotel',
                params: {
                  destination,
                  checkInDate: checkIn,
                  checkOutDate: checkOut,
                  adults,
                  children,
                  rooms: 1
                }
              }
            });

            if (error) {
              throw new Error(`Provider search failed: ${error.message}`);
            }

            if (hotelSearchData?.success && hotelSearchData?.data?.offers?.length > 0) {
              // Find the specific hotel offer by ID
              const selectedOffer = hotelSearchData.data.offers.find((offer: any) => 
                offer.hotel?.hotelId === hotelId || offer.id === offerId
              );

              if (selectedOffer) {
                // Transform provider data to our format
                const providerHotel: HotelOffer = {
                  id: selectedOffer.id || offerId,
                  hotelId: selectedOffer.hotel?.hotelId || hotelId,
                  name: selectedOffer.hotel?.name || `Hotel ${hotelId.toUpperCase()}`,
                  address: selectedOffer.hotel?.address || "Address not available",
                  city: selectedOffer.hotel?.address?.cityName || destination,
                  country: selectedOffer.hotel?.address?.countryCode || "AU",
                  latitude: selectedOffer.hotel?.geoCode?.latitude,
                  longitude: selectedOffer.hotel?.geoCode?.longitude,
                  rating: selectedOffer.hotel?.rating || 4,
                  reviewScore: selectedOffer.hotel?.rating || 8.0,
                  totalReviews: selectedOffer.hotel?.reviewCount || 100,
                  roomType: selectedOffer.room?.type?.category || "Standard Room",
                  roomDescription: selectedOffer.room?.description?.text || "Comfortable room with modern amenities",
                  boardType: selectedOffer.board || "Room Only",
                  images: selectedOffer.hotel?.media?.map((img: any) => img.uri) || ["/placeholder.svg"],
                  amenities: selectedOffer.hotel?.amenities || ["WiFi", "Parking"],
                  price: {
                    total: parseFloat(selectedOffer.price?.total || selectedOffer.offers?.[0]?.price?.total || '299'),
                    currency: selectedOffer.price?.currency || "AUD",
                    breakdown: {
                      roomRate: parseFloat(selectedOffer.price?.base || selectedOffer.price?.total || '299') * 0.85,
                      taxes: parseFloat(selectedOffer.price?.taxes || '0') || parseFloat(selectedOffer.price?.total || '299') * 0.12,
                      fees: parseFloat(selectedOffer.price?.fees || '0') || parseFloat(selectedOffer.price?.total || '299') * 0.03
                    }
                  },
                  cancellationPolicy: selectedOffer.policies?.cancellation?.description || "Free cancellation until 24 hours before check-in",
                  checkIn,
                  checkOut,
                  guests: { adults, children },
                  nights: Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)),
                  offerId: selectedOffer.id || offerId
                };

                setHotelOffer(providerHotel);
                setLoading(false);
                logger.info('Successfully loaded live hotel data from provider');
                return;
              }
            }

            // If no specific offer found, show error
            throw new Error('Hotel offer not found in search results');

          } catch (providerError) {
            logger.warn('Provider search failed, falling back to cached data:', providerError);
            
            // Fallback: Try to create basic hotel structure from params
            const price = parseFloat(searchParams.get('price') || '299');
            const fallbackHotel: HotelOffer = {
              id: offerId,
              hotelId,
              name: `Hotel ${hotelId.toUpperCase()}`,
              address: "Address pending live data",
              city: destination === 'SYD' ? 'Sydney' : destination,
              country: "Australia",
              rating: 4,
              reviewScore: 8.0,
              totalReviews: 0,
              roomType: "Standard Room",
              roomDescription: "Room details will be confirmed",
              boardType: "Room Only",
              images: ["/placeholder.svg"],
              amenities: ["WiFi", "Standard amenities"],
              price: {
                total: price,
                currency: "AUD",
                breakdown: {
                  roomRate: price * 0.85,
                  taxes: price * 0.12,
                  fees: price * 0.03
                }
              },
              cancellationPolicy: "Cancellation policy will be confirmed",
              checkIn,
              checkOut,
              guests: { adults, children },
              nights: Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)),
              offerId
            };

            setHotelOffer(fallbackHotel);
            setLoading(false);
            
            toast({
              title: "Limited hotel data available",
              description: "Using cached information. Full details will be confirmed at booking.",
              variant: "default",
            });
          }
        };

        await searchHotels();
      } catch (error) {
        logger.error('Error loading hotel data:', error);
        toast({
          title: "Error loading hotel data",
          description: "Please try again.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    loadHotelData();
  }, [searchParams, navigate, toast]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getAmenityIcon = (amenity: string) => {
    const amenityLower = amenity.toLowerCase();
    if (amenityLower.includes('wifi')) return <Wifi className="h-4 w-4" />;
    if (amenityLower.includes('parking') || amenityLower.includes('car')) return <Car className="h-4 w-4" />;
    if (amenityLower.includes('restaurant') || amenityLower.includes('dining')) return <Utensils className="h-4 w-4" />;
    return <Star className="h-4 w-4" />;
  };

  const handleContinue = () => {
    if (!hotelOffer) {
      toast({
        title: "Hotel data missing",
        description: "Please go back and select a hotel.",
        variant: "destructive",
      });
      return;
    }

    // Store hotel data for checkout
    sessionStorage.setItem('selectedHotelOffer', JSON.stringify(hotelOffer));

    // Navigate to checkout with booking parameters
    const queryParams = new URLSearchParams();
    queryParams.set('bookingType', 'hotel');
    queryParams.set('hotelId', hotelOffer.hotelId);
    queryParams.set('offerId', hotelOffer.offerId || hotelOffer.id);
    queryParams.set('checkIn', hotelOffer.checkIn);
    queryParams.set('checkOut', hotelOffer.checkOut);
    queryParams.set('adults', hotelOffer.guests.adults.toString());
    queryParams.set('children', hotelOffer.guests.children.toString());
    queryParams.set('amount', hotelOffer.price.total.toString());
    queryParams.set('currency', hotelOffer.price.currency);

    navigate(`/hotel-checkout?${queryParams.toString()}`);
  };

  const handleGoBack = () => {
    navigate('/search/hotels');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading hotel details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hotelOffer) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="border-dashed border-2 border-border/50 max-w-md">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">No hotel selected. Please go back and select a hotel.</p>
              <Button onClick={handleGoBack}>
                Select Hotel
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HotelBookingProgress currentStep={2} />
      
      {/* Header */}
      <div className="pt-6 pb-6 px-6 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-6xl mx-auto">
          <Button variant="ghost" size="sm" onClick={handleGoBack} className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Hotel Search
          </Button>
          
          <h1 className="text-3xl font-bold">Review Your <span className="hero-text">Hotel Booking</span></h1>
          <p className="text-muted-foreground mt-2">
            Please review your hotel details before proceeding to guest information
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Hotel Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hotel Information */}
            <Card className="border border-border/50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <img 
                    src={hotelOffer.images[0]} 
                    alt={hotelOffer.name}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-xl font-bold">{hotelOffer.name}</h2>
                      <div className="flex">
                        {[...Array(hotelOffer.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4" />
                      {hotelOffer.address}, {hotelOffer.city}, {hotelOffer.country}
                    </div>
                    {hotelOffer.reviewScore && (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800">
                          {hotelOffer.reviewScore}/10
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          ({hotelOffer.totalReviews} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="mb-6" />

                {/* Stay Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <Calendar className="h-5 w-5 mx-auto mb-2 text-primary" />
                    <div className="text-sm font-medium">Check-in</div>
                    <div className="text-sm text-muted-foreground">{formatDate(hotelOffer.checkIn)}</div>
                  </div>
                  <div className="text-center">
                    <Calendar className="h-5 w-5 mx-auto mb-2 text-primary" />
                    <div className="text-sm font-medium">Check-out</div>
                    <div className="text-sm text-muted-foreground">{formatDate(hotelOffer.checkOut)}</div>
                  </div>
                  <div className="text-center">
                    <Users className="h-5 w-5 mx-auto mb-2 text-primary" />
                    <div className="text-sm font-medium">Guests</div>
                    <div className="text-sm text-muted-foreground">
                      {hotelOffer.guests.adults} Adult{hotelOffer.guests.adults > 1 ? 's' : ''}
                      {hotelOffer.guests.children > 0 && `, ${hotelOffer.guests.children} Child${hotelOffer.guests.children > 1 ? 'ren' : ''}`}
                    </div>
                  </div>
                </div>

                <Separator className="mb-6" />

                {/* Room Details */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Room Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Room Type</span>
                      <span className="text-sm font-medium">{hotelOffer.roomType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Board Type</span>
                      <span className="text-sm font-medium">{hotelOffer.boardType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Nights</span>
                      <span className="text-sm font-medium">{hotelOffer.nights} night{hotelOffer.nights > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">{hotelOffer.roomDescription}</p>
                </div>

                {/* Amenities */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Hotel Amenities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {hotelOffer.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        {getAmenityIcon(amenity)}
                        {amenity}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cancellation Policy */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-1">Cancellation Policy</h4>
                  <p className="text-sm text-green-700">{hotelOffer.cancellationPolicy}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Price Summary */}
          <div>
            <Card className="travel-card sticky top-24">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">Price Summary</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Room rate ({hotelOffer.nights} night{hotelOffer.nights > 1 ? 's' : ''})</span>
                    <span className="font-medium">{formatCurrency(hotelOffer.price.breakdown.roomRate)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm">Taxes & fees</span>
                    <span className="font-medium">{formatCurrency(hotelOffer.price.breakdown.taxes + hotelOffer.price.breakdown.fees)}</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Amount</span>
                    <span className="text-xl font-bold text-foreground">
                      {formatCurrency(hotelOffer.price.total)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">for {hotelOffer.nights} night{hotelOffer.nights > 1 ? 's' : ''}, includes taxes</p>
                </div>

                <Button 
                  onClick={handleContinue}
                  className="w-full mt-6 btn-primary h-12"
                >
                  CONTINUE TO GUEST DETAILS
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelBookingReview;