import { useNavigate } from "react-router-dom";
import { MapPin, Star, Wifi, Car, Utensils, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RealBookingButton } from "@/components/RealBookingButton";

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
  deals?: {
    type: string;
    description: string;
    savings: number;
  };
}

interface HotelCardProps {
  hotel: Hotel;
}

export const HotelCard = ({ hotel }: HotelCardProps) => {
  const navigate = useNavigate();

  const handleSelectHotel = () => {
    navigate(`/booking?type=hotel&id=${hotel.id}`);
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
              src={hotel.images[0] || "/placeholder.svg"}
              alt={hotel.name}
              className="w-full h-full object-cover"
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
                    <span className="font-medium text-foreground">{hotel.rating}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({hotel.reviewCount} reviews)
                  </span>
                  <Badge variant="secondary">{hotel.propertyType}</Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {hotel.description}
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
                    {hotel.currency}{hotel.pricePerNight}
                  </p>
                  <p className="text-sm text-muted-foreground">per night</p>
                </div>
                <div className="border-t pt-2">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-lg font-semibold text-foreground">
                    {hotel.currency}{hotel.totalPrice}
                  </p>
                </div>
                <RealBookingButton
                  bookingType="hotel"
                  bookingData={hotel}
                  amount={hotel.totalPrice}
                  currency="USD"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};