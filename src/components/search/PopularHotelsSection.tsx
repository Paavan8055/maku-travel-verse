import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, TrendingUp } from 'lucide-react';
import { useNavigate } from "react-router-dom";

// Import hotel images
import parkHyattImg from '@/assets/hotel-park-hyatt.jpg';
import shangriLaImg from '@/assets/hotel-shangri-la.jpg';
import boutiqueImg from '@/assets/hotel-boutique.jpg';
import budgetImg from '@/assets/hotel-budget.jpg';

// Import destination images as fallbacks
import sydneyImg from '@/assets/destinations/sydney.jpg';
import melbourneImg from '@/assets/destinations/melbourne.jpg';
import tokyoImg from '@/assets/destinations/tokyo.jpg';
import londonImg from '@/assets/destinations/london.jpg';
import singaporeImg from '@/assets/destinations/singapore.jpg';
import dubaiImg from '@/assets/destinations/dubai.jpg';

interface PopularHotel {
  id: string;
  name: string;
  location: string;
  rating: number;
  reviews: number;
  price: string;
  originalPrice?: string;
  image: string;
  amenities: string[];
  discount?: string;
}

interface PopularHotelsSectionProps {
  onHotelSelect?: (location: string, hotelName?: string) => void;
}

const popularHotels: PopularHotel[] = [
  {
    id: '1',
    name: 'Park Hyatt Sydney',
    location: 'Sydney',
    rating: 4.8,
    reviews: 2843,
    price: '450',
    originalPrice: '520',
    image: parkHyattImg,
    amenities: ['Harbor View', 'Spa', 'Pool', 'Restaurant'],
    discount: '15% OFF'
  },
  {
    id: '2',
    name: 'Shangri-La Hotel Sydney',
    location: 'Sydney',
    rating: 4.6,
    reviews: 1925,
    price: '380',
    originalPrice: '420',
    image: shangriLaImg,
    amenities: ['Opera House View', 'Spa', 'Business Center'],
    discount: '10% OFF'
  },
  {
    id: '3',
    name: 'QT Melbourne',
    location: 'Melbourne',
    rating: 4.7,
    reviews: 1654,
    price: '320',
    image: boutiqueImg,
    amenities: ['Boutique Style', 'Restaurant', 'Bar', 'Gym']
  },
  {
    id: '4',
    name: 'The Langham Melbourne',
    location: 'Melbourne',
    rating: 4.5,
    reviews: 2156,
    price: '290',
    originalPrice: '340',
    image: melbourneImg,
    amenities: ['Pool', 'Spa', 'Restaurant', 'Bar'],
    discount: 'Early Bird'
  },
  {
    id: '5',
    name: 'Conrad Tokyo',
    location: 'Tokyo',
    rating: 4.9,
    reviews: 3421,
    price: '580',
    image: tokyoImg,
    amenities: ['City View', 'Spa', 'Pool', 'Executive Lounge']
  },
  {
    id: '6',
    name: 'The Ritz-Carlton Singapore',
    location: 'Singapore',
    rating: 4.8,
    reviews: 2987,
    price: '520',
    originalPrice: '580',
    image: singaporeImg,
    amenities: ['Marina View', 'Club Level', 'Pool', 'Spa'],
    discount: 'Best Rate'
  },
  {
    id: '7',
    name: 'Burj Al Arab Dubai',
    location: 'Dubai',
    rating: 4.9,
    reviews: 4123,
    price: '1200',
    image: dubaiImg,
    amenities: ['All-Suite', 'Beach Access', 'Butler Service', 'Spa']
  },
  {
    id: '8',
    name: 'The Savoy London',
    location: 'London',
    rating: 4.7,
    reviews: 2765,
    price: '680',
    originalPrice: '750',
    image: londonImg,
    amenities: ['Thames View', 'Afternoon Tea', 'Spa', 'Restaurant'],
    discount: 'Limited Time'
  }
];

export function PopularHotelsSection({ onHotelSelect }: PopularHotelsSectionProps) {
  const navigate = useNavigate();

  const handleHotelClick = (hotel: PopularHotel) => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const searchParams = new URLSearchParams({
      destination: hotel.location,
      checkIn: today,
      checkOut: tomorrow,
      guests: '2',
      rooms: '1',
      hotelName: hotel.name,
      searched: 'true'
    });
    
    navigate(`/search/hotels?${searchParams.toString()}`);
    onHotelSelect?.(hotel.location, hotel.name);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Popular Hotels</h3>
        <Badge variant="secondary" className="bg-primary/10 text-primary">Trending</Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {popularHotels.map((hotel) => (
          <Card 
            key={hotel.id} 
            className="hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden border-0 bg-white shadow-lg"
            onClick={() => handleHotelClick(hotel)}
          >
            <div className="relative h-48 overflow-hidden">
              <img 
                src={hotel.image} 
                alt={hotel.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              
              {/* Discount badge */}
              {hotel.discount && (
                <Badge className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold px-2 py-1 text-xs">
                  {hotel.discount}
                </Badge>
              )}
              
              {/* Rating */}
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium">{hotel.rating}</span>
              </div>
              
              {/* Location */}
              <div className="absolute bottom-3 left-3 text-white">
                <div className="flex items-center gap-1 mb-1">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{hotel.location}</span>
                </div>
                <h3 className="font-bold text-lg leading-tight">{hotel.name}</h3>
              </div>
            </div>
            
            <CardContent className="p-4">
              {/* Amenities */}
              <div className="flex flex-wrap gap-1 mb-3">
                {hotel.amenities.slice(0, 2).map((amenity) => (
                  <Badge key={amenity} variant="secondary" className="text-xs px-2 py-0.5">
                    {amenity}
                  </Badge>
                ))}
                {hotel.amenities.length > 2 && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    +{hotel.amenities.length - 2}
                  </Badge>
                )}
              </div>
              
              {/* Reviews */}
              <div className="flex items-center gap-1 mb-3 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{hotel.rating}</span>
                <span>•</span>
                <span>{hotel.reviews.toLocaleString()} reviews</span>
              </div>
              
              {/* Price and booking */}
              <div className="flex items-center justify-between">
                <div className="text-left">
                  {hotel.originalPrice && (
                    <p className="text-xs text-muted-foreground line-through">
                      ${hotel.originalPrice}
                    </p>
                  )}
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-primary">
                      ${hotel.price}
                    </span>
                    <span className="text-xs text-muted-foreground">/night</span>
                  </div>
                </div>
                
                <Button 
                  variant="default" 
                  size="sm"
                  className="group-hover:bg-primary-600 transition-colors shadow-md"
                >
                  Book Now
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}