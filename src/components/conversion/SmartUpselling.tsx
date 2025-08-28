import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, MapPin, Wifi, Coffee, Car, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UpsellOffer {
  id: string;
  type: 'room_upgrade' | 'add_on' | 'package' | 'insurance';
  title: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  savings: number;
  urgency?: string;
  benefits: string[];
  icon: React.ReactNode;
  recommended?: boolean;
  limitedTime?: boolean;
}

interface SmartUpsellingProps {
  hotelId?: string;
  currentBooking?: {
    roomType: string;
    price: number;
    checkIn: string;
    checkOut: string;
    guests: number;
  };
  onOfferSelect?: (offer: UpsellOffer) => void;
  className?: string;
}

export const SmartUpselling: React.FC<SmartUpsellingProps> = ({
  hotelId,
  currentBooking,
  onOfferSelect,
  className
}) => {
  const [selectedOffers, setSelectedOffers] = useState<string[]>([]);
  const [offers, setOffers] = useState<UpsellOffer[]>([]);

  useEffect(() => {
    // Generate smart upsell offers based on booking data
    const generateOffers = (): UpsellOffer[] => {
      const baseOffers: UpsellOffer[] = [
        {
          id: 'room_upgrade',
          type: 'room_upgrade',
          title: 'Upgrade to Ocean View Suite',
          description: 'Stunning ocean views, larger space, and premium amenities',
          originalPrice: 180,
          discountedPrice: 120,
          savings: 60,
          urgency: 'Only 2 rooms left at this price',
          benefits: ['Ocean view', 'Larger room', 'Premium toiletries', 'Balcony access'],
          icon: <Star className="h-4 w-4" />,
          recommended: true,
          limitedTime: true
        },
        {
          id: 'early_checkin',
          type: 'add_on',
          title: 'Early Check-in Guarantee',
          description: 'Check in from 12 PM instead of 3 PM',
          originalPrice: 35,
          discountedPrice: 25,
          savings: 10,
          benefits: ['Guaranteed early access', 'Skip the waiting'],
          icon: <Clock className="h-4 w-4" />
        },
        {
          id: 'airport_transfer',
          type: 'add_on',
          title: 'Private Airport Transfer',
          description: 'Luxury sedan pickup and drop-off service',
          originalPrice: 85,
          discountedPrice: 65,
          savings: 20,
          benefits: ['Door-to-door service', 'Professional driver', 'Flight tracking'],
          icon: <Car className="h-4 w-4" />
        },
        {
          id: 'dining_package',
          type: 'package',
          title: 'Gourmet Dining Package',
          description: 'Breakfast, lunch & dinner at hotel restaurants',
          originalPrice: 150,
          discountedPrice: 99,
          savings: 51,
          benefits: ['3 meals daily', 'Premium restaurants', 'Room service credit'],
          icon: <Utensils className="h-4 w-4" />
        },
        {
          id: 'wifi_package',
          type: 'add_on',
          title: 'Premium WiFi & Business Center',
          description: 'High-speed internet and workspace access',
          originalPrice: 25,
          discountedPrice: 15,
          savings: 10,
          benefits: ['Unlimited high-speed WiFi', 'Business center access', 'Printing services'],
          icon: <Wifi className="h-4 w-4" />
        },
        {
          id: 'travel_insurance',
          type: 'insurance',
          title: 'Travel Protection Plan',
          description: 'Complete coverage for unexpected changes',
          originalPrice: 45,
          discountedPrice: 29,
          savings: 16,
          benefits: ['Trip cancellation', 'Medical coverage', 'Baggage protection'],
          icon: <MapPin className="h-4 w-4" />
        }
      ];

      return baseOffers;
    };

    setOffers(generateOffers());
  }, [hotelId, currentBooking]);

  const handleOfferToggle = (offer: UpsellOffer) => {
    const isSelected = selectedOffers.includes(offer.id);
    
    if (isSelected) {
      setSelectedOffers(prev => prev.filter(id => id !== offer.id));
    } else {
      setSelectedOffers(prev => [...prev, offer.id]);
      onOfferSelect?.(offer);
    }
  };

  const totalSavings = offers
    .filter(offer => selectedOffers.includes(offer.id))
    .reduce((total, offer) => total + offer.savings, 0);

  const totalUpgrade = offers
    .filter(offer => selectedOffers.includes(offer.id))
    .reduce((total, offer) => total + offer.discountedPrice, 0);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Enhance Your Stay</h3>
        {totalSavings > 0 && (
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            Save ${totalSavings} total
          </Badge>
        )}
      </div>

      <div className="grid gap-3">
        {offers.map((offer) => {
          const isSelected = selectedOffers.includes(offer.id);
          
          return (
            <Card 
              key={offer.id} 
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                isSelected && "ring-2 ring-primary border-primary",
                offer.recommended && "border-orange-200 bg-orange-50/50"
              )}
              onClick={() => handleOfferToggle(offer)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    {offer.icon}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          {offer.title}
                          {offer.recommended && (
                            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                              Recommended
                            </Badge>
                          )}
                          {offer.limitedTime && (
                            <Badge variant="destructive" className="text-xs">
                              Limited
                            </Badge>
                          )}
                        </h4>
                        <p className="text-sm text-muted-foreground">{offer.description}</p>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-muted-foreground line-through">
                            ${offer.originalPrice}
                          </span>
                          <span className="font-semibold text-primary">
                            ${offer.discountedPrice}
                          </span>
                        </div>
                        <p className="text-xs text-green-600 font-medium">
                          Save ${offer.savings}
                        </p>
                      </div>
                    </div>

                    {offer.urgency && (
                      <p className="text-xs text-orange-600 font-medium">
                        ⚡ {offer.urgency}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1">
                      {offer.benefits.map((benefit, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {benefit}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedOffers.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Total Upgrades</p>
                <p className="text-sm text-muted-foreground">
                  {selectedOffers.length} item{selectedOffers.length > 1 ? 's' : ''} selected
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-lg">+${totalUpgrade}</p>
                <p className="text-sm text-green-600">
                  (${totalSavings} saved)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SmartUpselling;