import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Star, MapPin, Car, Wifi, Coffee, Users, Calendar, ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logger from '@/utils/logger';

interface HotelBedsRoom {
  rateKey: string;
  rateClass: string;
  rateType: string;
  net: number;
  discount?: number;
  sellingRate: number;
  hotelMandatory?: boolean;
  allotment?: number;
  paymentType: string;
  packaging?: boolean;
  boardCode: string;
  boardName: string;
  rooms: Array<{
    roomCode: string;
    roomName: string;
    paxes: Array<{
      roomId: number;
      type: string;
      age?: number;
      name?: string;
      surname?: string;
    }>;
  }>;
  cancellationPolicies?: Array<{
    amount: number;
    from: string;
  }>;
  taxes?: {
    allIncluded: boolean;
    taxes: Array<{
      included: boolean;
      percent?: number;
      amount: number;
      currency: string;
      type: string;
      clientAmount?: number;
      clientCurrency?: string;
    }>;
  };
  promotions?: Array<{
    code: string;
    name: string;
    remark: string;
  }>;
}

interface HotelBedsHotel {
  code: number;
  name: string;
  description?: string;
  categoryCode: string;
  categoryName: string;
  destinationCode: string;
  destinationName: string;
  zoneCode: number;
  zoneName: string;
  coordinates: {
    longitude: number;
    latitude: number;
  };
  address: {
    content: string;
    street?: string;
    number?: string;
  };
  postalCode: string;
  city: {
    content: string;
  };
  images?: Array<{
    imageTypeCode: string;
    path: string;
    order: number;
    visualOrder: number;
  }>;
  facilities?: Array<{
    facilityCode: number;
    facilityGroupCode: number;
    order: number;
    number?: number;
    voucher?: boolean;
    ageFrom?: number;
    ageTo?: number;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

export const HotelBedsDetails = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const hotelId = searchParams.get("hotelId");
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");
  const adults = parseInt(searchParams.get("adults") || "2");
  const children = parseInt(searchParams.get("children") || "0");
  const rooms = parseInt(searchParams.get("rooms") || "1");

  const [hotel, setHotel] = useState<HotelBedsHotel | null>(null);
  const [offers, setOffers] = useState<HotelBedsRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHotelDetails = async () => {
      if (!hotelId || !checkIn || !checkOut) return;

      setLoading(true);
      setError(null);

      try {
        console.log('Fetching HotelBeds hotel details for:', { hotelId, checkIn, checkOut, adults, children, rooms });

        // First get hotel content/details
        const { data: contentData, error: contentError } = await supabase.functions.invoke("hotelbeds-content", {
          body: { 
            hotelCode: hotelId,
            language: 'ENG'
          }
        });

        if (contentError) {
          throw new Error(contentError.message);
        }

        if (contentData?.success && contentData.hotel) {
          setHotel(contentData.hotel);
        }

        // Then get room rates and availability
        const { data: ratesData, error: ratesError } = await supabase.functions.invoke("hotelbeds-checkrates", {
          body: { 
            hotelCode: hotelId,
            checkIn, 
            checkOut, 
            adults, 
            children, 
            rooms,
            currency: 'AUD'
          }
        });

        if (ratesError) {
          console.warn('Error fetching rates:', ratesError);
        } else if (ratesData?.success && ratesData.hotel?.rooms) {
          setOffers(ratesData.hotel.rooms);
        }

      } catch (err) {
        console.error('Error fetching HotelBeds hotel details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load hotel details');
        toast.error("Failed to load hotel details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchHotelDetails();
  }, [hotelId, checkIn, checkOut, adults, children, rooms]);

  const getAmenityIcon = (facilityCode: number) => {
    // Map common HotelBeds facility codes to icons
    const facilityIcons: Record<number, any> = {
      10: Wifi, // Internet
      15: Car, // Parking
      20: Coffee, // Restaurant
      261: Users, // Family rooms
    };
    return facilityIcons[facilityCode] || MapPin;
  };

  const renderStars = (categoryCode: string) => {
    // Extract star rating from category code (e.g., "4EST" = 4 stars)
    const stars = parseInt(categoryCode.charAt(0)) || 0;
    return Array.from({ length: Math.min(stars, 5) }, (_, i) => (
      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
    ));
  };

  const formatPrice = (amount: number, currency: string = 'AUD') => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const handleSelectRoom = (room: HotelBedsRoom) => {
    const bookingParams = new URLSearchParams({
      provider: 'hotelbeds',
      hotelId: hotelId!,
      hotelName: hotel?.name || '',
      rateKey: room.rateKey,
      checkIn: checkIn!,
      checkOut: checkOut!,
      adults: adults.toString(),
      children: children.toString(),
      rooms: rooms.toString(),
      price: room.sellingRate.toString(),
      currency: 'AUD',
      roomType: room.rooms[0]?.roomName || '',
      boardType: room.boardName
    });

    navigate(`/booking/hotel?${bookingParams.toString()}`);
  };

  if (!hotelId || !checkIn || !checkOut) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Missing required parameters for hotel details.</p>
              <Button onClick={() => navigate('/search')} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Search
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading HotelBeds hotel details...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-destructive mb-4">{error}</p>
              <div className="space-x-4">
                <Button onClick={() => window.location.reload()}>Try Again</Button>
                <Button variant="outline" onClick={() => navigate('/search')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Search
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Results
        </Button>

        {hotel && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    {hotel.name}
                    <Badge variant="secondary">HotelBeds</Badge>
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    {renderStars(hotel.categoryCode)}
                    <span className="text-sm text-muted-foreground">
                      {hotel.categoryName}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="font-medium">{hotel.address.content}</p>
                  <p className="text-sm text-muted-foreground">
                    {hotel.city.content}, {hotel.postalCode}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {hotel.destinationName}, {hotel.zoneName}
                  </p>
                </div>
              </div>

              {hotel.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{hotel.description}</p>
                </div>
              )}

              {hotel.facilities && hotel.facilities.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Facilities</h3>
                  <div className="flex flex-wrap gap-2">
                    {hotel.facilities.slice(0, 8).map((facility, index) => {
                      const IconComponent = getAmenityIcon(facility.facilityCode);
                      return (
                        <Badge key={index} variant="outline" className="flex items-center gap-1">
                          <IconComponent className="h-3 w-3" />
                          Facility {facility.facilityCode}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Available Rooms
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {checkIn} - {checkOut} • {adults} adults {children > 0 && `, ${children} children`} • {rooms} room(s)
            </p>
          </CardHeader>
          <CardContent>
            {offers.length > 0 ? (
              <div className="space-y-4">
                {offers.map((room, index) => (
                  <Card key={index} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {room.rooms[0]?.roomName || 'Standard Room'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {room.boardName} • {room.rateClass}
                          </p>
                          {room.paymentType && (
                            <Badge variant="outline" className="mt-1">
                              {room.paymentType}
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {formatPrice(room.sellingRate)}
                          </div>
                          {room.net !== room.sellingRate && (
                            <div className="text-sm text-muted-foreground">
                              Net: {formatPrice(room.net)}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">per night</p>
                        </div>
                      </div>

                      {room.taxes && (
                        <div className="mb-3">
                          <p className="text-sm font-medium">Tax Information:</p>
                          <p className="text-xs text-muted-foreground">
                            {room.taxes.allIncluded ? 'All taxes included' : 'Additional taxes may apply'}
                          </p>
                        </div>
                      )}

                      {room.cancellationPolicies && room.cancellationPolicies.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium">Cancellation:</p>
                          <p className="text-xs text-muted-foreground">
                            Free cancellation until {room.cancellationPolicies[0].from}
                          </p>
                        </div>
                      )}

                      {room.promotions && room.promotions.length > 0 && (
                        <div className="mb-3">
                          {room.promotions.map((promo, promoIndex) => (
                            <Badge key={promoIndex} variant="secondary" className="mr-1">
                              {promo.name}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <Separator className="my-3" />
                      
                      <Button 
                        onClick={() => handleSelectRoom(room)}
                        className="w-full"
                      >
                        Select Room
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No rooms available for the selected dates.</p>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/search')}
                  className="mt-4"
                >
                  Try Different Dates
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};