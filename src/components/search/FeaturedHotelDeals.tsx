import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Percent, Calendar, Wifi, Car, Utensils } from 'lucide-react';

// Import hotel images
import parkHyattImg from '@/assets/hotel-park-hyatt.jpg';
import shangriLaImg from '@/assets/hotel-shangri-la.jpg';
import boutiqueImg from '@/assets/hotel-boutique.jpg';
import budgetImg from '@/assets/hotel-budget.jpg';

// Import destination images as fallbacks
import maldivesImg from '@/assets/hero-maldives.jpg';
import swissAlpsImg from '@/assets/hero-swiss-alps.jpg';
import tokyoImg from '@/assets/destinations/tokyo.jpg';

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
}

interface FeaturedHotelDealsProps {
  onDealSelect?: (location: string, hotelName?: string, checkIn?: string) => void;
}

const featuredDeals: FeaturedHotelDeal[] = [
  {
    id: '1',
    name: 'Conrad Maldives Rangali Island',
    location: 'Maldives',
    destination: 'Maldives',
    rating: 4.9,
    reviews: 1847,
    price: '1200',
    originalPrice: '1600',
    savings: '400',
    image: maldivesImg,
    dealType: 'Early Bird Special',
    validUntil: '2025-09-30',
    inclusions: ['Breakfast', 'Airport Transfer', 'WiFi'],
    highlights: ['Overwater Villa', 'Private Beach', 'Sunset View']
  },
  {
    id: '2',
    name: 'The Chedi Andermatt',
    location: 'Swiss Alps',
    destination: 'Switzerland',
    rating: 4.8,
    reviews: 923,
    price: '850',
    originalPrice: '1100',
    savings: '250',
    image: swissAlpsImg,
    dealType: 'Winter Package',
    validUntil: '2025-10-15',
    inclusions: ['Breakfast', 'Spa Access', 'Ski Pass'],
    highlights: ['Mountain View', 'Luxury Spa', 'Ski-in/Ski-out']
  },
  {
    id: '3',
    name: 'Park Hyatt Tokyo',
    location: 'Tokyo',
    destination: 'Tokyo',
    rating: 4.8,
    reviews: 2156,
    price: '520',
    originalPrice: '680',
    savings: '160',
    image: tokyoImg,
    dealType: 'City Break Deal',
    validUntil: '2025-08-31',
    inclusions: ['Breakfast', 'City Tour', 'WiFi'],
    highlights: ['City View', 'Premium Location', 'Modern Design']
  },
  {
    id: '4',
    name: 'Shangri-La The Marina',
    location: 'Cairns',
    destination: 'Australia',
    rating: 4.6,
    reviews: 1834,
    price: '340',
    originalPrice: '450',
    savings: '110',
    image: shangriLaImg,
    dealType: 'Tropical Escape',
    validUntil: '2025-09-15',
    inclusions: ['Breakfast', 'Pool Access', 'WiFi'],
    highlights: ['Marina View', 'Great Barrier Reef', 'Tropical Garden']
  },
  {
    id: '5',
    name: 'QT Gold Coast',
    location: 'Gold Coast',
    destination: 'Australia',
    rating: 4.5,
    reviews: 1456,
    price: '280',
    originalPrice: '350',
    savings: '70',
    image: boutiqueImg,
    dealType: 'Beach Getaway',
    validUntil: '2025-08-25',
    inclusions: ['Breakfast', 'Beach Access', 'Pool'],
    highlights: ['Beach Front', 'Boutique Style', 'Rooftop Bar']
  },
  {
    id: '6',
    name: 'Budget Plus Melbourne',
    location: 'Melbourne',
    destination: 'Australia',
    rating: 4.2,
    reviews: 987,
    price: '120',
    originalPrice: '160',
    savings: '40',
    image: budgetImg,
    dealType: 'Smart Saver',
    validUntil: '2025-09-01',
    inclusions: ['WiFi', 'City Location'],
    highlights: ['Central Location', 'Clean Rooms', 'Great Value']
  }
];

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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Percent className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Featured Hotel Deals</h3>
        <Badge variant="secondary" className="bg-orange-100 text-orange-600">Limited Time</Badge>
      </div>
      
      <div className="flex gap-6 overflow-x-auto pb-4">
        {featuredDeals.map((deal) => (
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
                    <span className="text-sm font-medium">{deal.rating}</span>
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
                <span>{deal.rating}</span>
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
    </div>
  );
}