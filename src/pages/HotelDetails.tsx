import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Star, Wifi, Car, Utensils, Waves } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { HotelBedsDetails } from "@/components/hotel/HotelBedsDetails";
import { toast } from "sonner";
import logger from "@/utils/logger";

type RoomOffer = {
  id: string;
  description?: { text?: string };
  price?: { total?: string; currency?: string; taxes?: any[] };
  room?: { 
    type?: string; 
    typeEstimated?: { 
      category?: string; 
      beds?: number; 
      bedType?: string;
      roomType?: string;
    }
  };
  policies?: any;
  guests?: { adults?: number };
  rateCode?: string;
  commission?: any;
  self?: string;
};

export const HotelDetails = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Extract search parameters
  const hotelId = searchParams.get("hotelId") || "";
  const provider = searchParams.get("provider");
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const adults = parseInt(searchParams.get("adults") || "2");
  const children = parseInt(searchParams.get("children") || "0");
  const rooms = parseInt(searchParams.get("rooms") || "1");

  // Helper function to detect HotelBeds hotel IDs
  const isHotelBedsHotelId = (id: string): boolean => {
    // HotelBeds hotel codes are typically numeric
    return /^\d+$/.test(id);
  };

  const isHotelBedsHotel =
    provider === "hotelbeds" || (hotelId && isHotelBedsHotelId(hotelId));

  // State for hotel details from Amadeus
  const [hotel, setHotel] = useState<any>(null);
  const [offers, setOffers] = useState<RoomOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch hotel details and offers from Amadeus
  useEffect(() => {
    const fetchHotelDetails = async () => {
      if (!hotelId || !checkIn || !checkOut || isHotelBedsHotel) return;

      setLoading(true);
      setError(null);

      try {
        console.log('Fetching hotel details for:', { hotelId, checkIn, checkOut, adults, children, rooms });

        const { data, error: functionError } = await supabase.functions.invoke("amadeus-hotel-details", {
          body: { 
            hotelId, 
            checkIn, 
            checkOut, 
            adults, 
            children, 
            rooms,
            currency: 'AUD'
          }
        });

        if (functionError) {
          throw new Error(functionError.message);
        }

        if (data?.success) {
          setHotel(data.hotel || null);
          setOffers(data.offers || []);
          
          if (data.offers?.length === 0) {
            toast.info('No room offers available for selected dates');
          } else {
            toast.success(`Found ${data.offers.length} room options`);
          }
        } else {
          throw new Error(data?.error || 'Failed to fetch hotel details');
        }
      } catch (err: any) {
        logger.error('Hotel details error:', err);
        const errorMessage = err.message || 'Failed to fetch hotel details';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchHotelDetails();
  }, [hotelId, checkIn, checkOut, adults, children, rooms]);

  if (isHotelBedsHotel) {
    return <HotelBedsDetails />;
  }

  // Validation and error handling
  if (!hotelId || !checkIn || !checkOut) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Missing hotel information</h2>
              <p className="text-muted-foreground mb-4">
                Please go back and select a hotel from the search results.
              </p>
              <Button onClick={() => navigate('/search/hotels')}>
                Back to Hotel Search
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Loading hotel details...</h2>
              <p className="text-muted-foreground">
                Fetching real-time room availability and pricing...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4 text-red-600">Error loading hotel</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <div className="space-x-4">
                <Button onClick={() => window.location.reload()}>Try Again</Button>
                <Button variant="outline" onClick={() => navigate('/search/hotels')}>
                  Back to Search
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
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
            <h1 className="text-2xl font-bold">Hotel Details</h1>
            <p className="text-muted-foreground">Select from available rooms and rates</p>
          </div>
        </div>

        {/* Hotel Information */}
        {hotel && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-3xl mb-2">{hotel.name}</CardTitle>
                  <div className="flex items-center space-x-1 mb-4">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {hotel.address?.lines?.join(", ")}, {hotel.address?.cityName} {hotel.address?.postalCode}
                    </span>
                  </div>
                  {hotel.rating && (
                    <div className="flex items-center space-x-2 mb-2">
                      {renderStars(hotel.rating)}
                      <span className="text-sm text-muted-foreground">({hotel.rating} star hotel)</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  {hotel.hotelType && (
                    <Badge variant="secondary">{hotel.hotelType}</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            {hotel.description && (
              <CardContent>
                <p className="text-muted-foreground">{hotel.description}</p>
              </CardContent>
            )}
          </Card>
        )}

        {/* Available Rooms */}
        <Card>
          <CardHeader>
            <CardTitle>Available Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            {offers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No rooms available for the selected dates.</p>
                <Button 
                  className="mt-4" 
                  onClick={() => navigate('/search/hotels')}
                >
                  Try Different Dates
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {offers.map((offer, index) => (
                  <Card key={index} className="border">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-lg">
                            {offer.room?.typeEstimated?.category || 
                             offer.room?.typeEstimated?.roomType || 
                             offer.room?.type || 
                             "Room"}
                          </h3>
                          {offer.room?.typeEstimated?.beds && (
                            <p className="text-sm text-muted-foreground">
                              {offer.room.typeEstimated.beds} bed(s)
                              {offer.room.typeEstimated.bedType && ` • ${offer.room.typeEstimated.bedType}`}
                            </p>
                          )}
                          {offer.description?.text && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {offer.description.text}
                            </p>
                          )}
                          {offer.guests?.adults && (
                            <p className="text-sm text-muted-foreground">
                              Up to {offer.guests.adults} adults
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {offer.price?.currency} {offer.price?.total}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Total stay
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2">
                        <div className="text-sm text-muted-foreground">
                          Rate: {offer.rateCode || 'Standard'}
                        </div>
                        <Button
                          onClick={() => {
                            const params = new URLSearchParams({
                              hotelId,
                              offerId: offer.id,
                              checkIn,
                              checkOut,
                              adults: adults.toString(),
                              children: children.toString(),
                              rooms: rooms.toString()
                            });
                            navigate(`/booking/select?${params.toString()}`);
                          }}
                        >
                          Select Room
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};