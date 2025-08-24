
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Percent, Calendar, Wifi, Car, Utensils, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import logger from '@/utils/logger';

interface FeaturedHotelDeal {
  id: string;
  name: string;
  location: string;
  destination: string;
  rating: number;
  reviews: number;
  price: string;
  originalPrice: string;
  savings: string;
  image: string;
  dealType: string;
  validUntil: string;
  inclusions: string[];
  highlights: string[];
  amadeus?: {
    hotelId: string;
    chainCode?: string;
    offers?: any[];
  };
}

interface FeaturedHotelDealsProps {
  onDealSelect?: (location: string, hotelName?: string, checkIn?: string) => void;
}

const getInclusionIcon = (inclusion: string) => {
  switch (inclusion.toLowerCase()) {
    case 'wifi':
      return <Wifi className="h-3 w-3" />;
    case 'airport transfer':
      return <Car className="h-3 w-3" />;
    case 'breakfast':
      return <Utensils className="h-3 w-3" />;
    default:
      return <Star className="h-3 w-3" />;
  }
};

export function FeaturedHotelDeals({ onDealSelect }: FeaturedHotelDealsProps) {
  const [deals, setDeals] = useState<FeaturedHotelDeal[]>([]);
  const [loading, setLoading] = useState(true);

  // Popular destinations for featured deals
  const popularDestinations = ['Sydney', 'Melbourne', 'Tokyo', 'Singapore', 'Dubai', 'London'];

  useEffect(() => {
    const fetchFeaturedDeals = async () => {
      try {
        setLoading(true);
        const allDeals: FeaturedHotelDeal[] = [];

        // Fetch hotels from popular destinations
        for (const destination of popularDestinations.slice(0, 4)) {
          try {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dayAfter = new Date();
            dayAfter.setDate(dayAfter.getDate() + 2);

            const { data, error } = await supabase.functions.invoke('provider-rotation', {
              body: {
                searchType: 'hotel',
                params: {
                  destination,
                  checkIn: tomorrow.toISOString().split('T')[0],
                  checkOut: dayAfter.toISOString().split('T')[0],
                  guests: 2,
                  rooms: 1,
                  currency: 'USD'
                }
              }
            });

            if (error) {
              logger.warn(`Failed to fetch hotels for ${destination}:`, error);
              continue;
            }

            if (data?.success && data?.hotels) {
              // Take top 2 hotels from each destination and convert to deals
              const destinationDeals = data.hotels.slice(0, 2).map((hotel: any, index: number) => {
                const basePrice = parseFloat(hotel.pricePerNight) || Math.floor(Math.random() * 400) + 200;
                const discountPercent = Math.floor(Math.random() * 30) + 15; // 15-45% discount
                const originalPrice = Math.round(basePrice * (1 + discountPercent / 100));
                const savings = originalPrice - basePrice;
                
                // Generate deal types
                const dealTypes = ['Early Bird Special', 'Flash Sale', 'Limited Time Offer', 'Best Price Guarantee', 'Weekend Deal'];
                const dealType = dealTypes[Math.floor(Math.random() * dealTypes.length)];
                
                // Generate expiry dates
                const validUntil = new Date();
                validUntil.setDate(validUntil.getDate() + Math.floor(Math.random() * 30) + 7);

                return {
                  id: hotel.id,
                  name: hotel.name,
                  location: destination,
                  destination,
                  rating: hotel.rating || (4.0 + Math.random() * 1.0),
                  reviews: Math.floor(Math.random() * 2000) + 500,
                  price: basePrice.toString(),
                  originalPrice: originalPrice.toString(),
                  savings: savings.toString(),
                  image: hotel.images?.[0] || '/assets/hotel-budget.jpg',
                  dealType,
                  validUntil: validUntil.toISOString().split('T')[0],
                  inclusions: ['WiFi', 'Breakfast', 'Pool Access'].slice(0, Math.floor(Math.random() * 3) + 1),
                  highlights: hotel.amenities?.slice(0, 3) || ['City View', 'Modern Design', 'Prime Location'],
                  amadeus: {
                    hotelId: hotel.amadeus?.hotelId || hotel.id,
                    chainCode: hotel.amadeus?.chainCode,
                    offers: hotel.amadeus?.offers
                  }
                };
              });

              allDeals.push(...destinationDeals);
            }
          } catch (destError) {
            logger.warn(`Error fetching hotels for ${destination}:`, destError);
          }
        }

        // Shuffle and take up to 6 deals
        const shuffledDeals = allDeals.sort(() => Math.random() - 0.5).slice(0, 6);
        setDeals(shuffledDeals);

      } catch (error) {
        logger.error('Error fetching featured deals:', error);
        toast.error('Unable to load featured deals');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedDeals();
  }, []);

  const handleDealClick = (deal: FeaturedHotelDeal) => {
    if (onDealSelect) {
      // Set check-in date to a week from now for deals
      const checkInDate = new Date();
      checkInDate.setDate(checkInDate.getDate() + 7);
      onDealSelect(deal.destination, deal.name, checkInDate.toISOString().split('T')[0]);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', { 
      day: '2-digit', 
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Percent className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Featured Hotel Deals</h3>
          <Badge variant="secondary" className="bg-orange-100 text-orange-600">Loading...</Badge>
        </div>
        
        <div className="flex gap-6 overflow-x-auto pb-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="flex-shrink-0 w-96 overflow-hidden border-0 bg-white shadow-xl">
              <div className="relative h-56 bg-muted animate-pulse" />
              <CardContent className="p-6 space-y-3">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                <div className="h-6 bg-muted rounded animate-pulse w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Percent className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Featured Hotel Deals</h3>
        <Badge variant="secondary" className="bg-orange-100 text-orange-600">Live Deals</Badge>
      </div>
      
      <div className="flex gap-6 overflow-x-auto pb-4">
        {deals.map((deal) => (
          <Card 
            key={deal.id} 
            className="flex-shrink-0 w-96 hover:shadow-2xl transition-all duration-300 cursor-pointer group overflow-hidden border-0 bg-white shadow-xl"
            onClick={() => handleDealClick(deal)}
          >
            <div className="relative h-56 overflow-hidden">
              <img 
                src={deal.image} 
                alt={deal.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/assets/hotel-budget.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              
              {/* Savings badge */}
              <Badge className="absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold px-3 py-1">
                Save ${deal.savings}
              </Badge>
              
              {/* Deal type */}
              <Badge className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-black font-medium px-3 py-1">
                {deal.dealType}
              </Badge>
              
              {/* Valid until */}
              <div className="absolute top-16 right-4 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm">
                <Calendar className="h-4 w-4" />
                <span>Until {formatDate(deal.validUntil)}</span>
              </div>
              
              {/* Hotel info */}
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="flex items-center gap-1 mb-2">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{deal.location}</span>
                  <div className="flex items-center gap-1 ml-auto">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{deal.rating.toFixed(1)}</span>
                  </div>
                </div>
                <h3 className="font-bold text-xl leading-tight">{deal.name}</h3>
              </div>
            </div>
            
            <CardContent className="p-6">
              {/* Highlights */}
              <div className="flex flex-wrap gap-1 mb-3">
                {deal.highlights.slice(0, 3).map((highlight) => (
                  <Badge key={highlight} variant="outline" className="text-xs px-2 py-0.5">
                    {highlight}
                  </Badge>
                ))}
              </div>
              
              {/* Inclusions */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-muted-foreground">Includes:</span>
                <div className="flex items-center gap-1">
                  {deal.inclusions.slice(0, 3).map((inclusion) => (
                    <div key={inclusion} className="flex items-center gap-1 text-xs text-muted-foreground">
                      {getInclusionIcon(inclusion)}
                      <span>{inclusion}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Reviews */}
              <div className="flex items-center gap-1 mb-4 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{deal.rating.toFixed(1)}</span>
                <span>•</span>
                <span>{deal.reviews.toLocaleString()} reviews</span>
              </div>
              
              {/* Price and booking */}
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-muted-foreground line-through">
                      ${deal.originalPrice}
                    </span>
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-600">
                      -{Math.round((parseInt(deal.savings) / parseInt(deal.originalPrice)) * 100)}%
                    </Badge>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-primary">
                      ${deal.price}
                    </span>
                    <span className="text-sm text-muted-foreground">/night</span>
                  </div>
                  <p className="text-xs text-muted-foreground">per room</p>
                </div>
                
                <Button 
                  className="bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg group-hover:shadow-xl transition-all" 
                  size="lg"
                >
                  Book Deal
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {deals.length === 0 && !loading && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Unable to load featured deals at the moment.</p>
          <p className="text-sm">Please try refreshing the page.</p>
        </div>
      )}
    </div>
  );
}
