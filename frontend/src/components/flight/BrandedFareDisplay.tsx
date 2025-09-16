import React, { useState } from 'react';
import { Check, X, Luggage, Utensils, Wifi, Star, Plane } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface BrandedFare {
  id: string;
  cabinClass: 'economy' | 'premium_economy' | 'business' | 'first';
  fareFamily: string;
  basePrice: number;
  totalPrice: number;
  currency: string;
  included: {
    baggage: {
      cabin: string;
      checked: string;
    };
    seatSelection: boolean;
    mealService: boolean;
    wifi: boolean;
    loungeAccess: boolean;
    changeable: boolean;
    refundable: boolean;
  };
  description?: string;
  popular?: boolean;
}

interface BrandedFareDisplayProps {
  fares: BrandedFare[];
  selectedFareId?: string;
  onFareSelect: (fareId: string) => void;
  showSeatMap?: boolean;
  onSeatMapToggle?: () => void;
}

export const BrandedFareDisplay: React.FC<BrandedFareDisplayProps> = ({
  fares,
  selectedFareId,
  onFareSelect,
  showSeatMap = false,
  onSeatMapToggle,
}) => {
  const [expandedFare, setExpandedFare] = useState<string | null>(null);

  const getCabinIcon = (cabinClass: string) => {
    switch (cabinClass) {
      case 'first':
        return <Star className="h-4 w-4 text-primary" />;
      case 'business':
        return <Plane className="h-4 w-4 text-primary" />;
      default:
        return <Plane className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getCabinColor = (cabinClass: string) => {
    switch (cabinClass) {
      case 'first':
        return 'bg-gradient-to-r from-primary to-primary-glow';
      case 'business':
        return 'bg-gradient-to-r from-secondary to-accent';
      case 'premium_economy':
        return 'bg-gradient-to-r from-accent to-muted';
      default:
        return 'bg-muted';
    }
  };

  const FeatureIcon = ({ included, icon: Icon, label }: { 
    included: boolean; 
    icon: React.ComponentType<any>; 
    label: string;
  }) => (
    <div className="flex items-center gap-2 text-sm">
      {included ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <X className="h-4 w-4 text-red-500" />
      )}
      <Icon className="h-4 w-4" />
      <span className={cn(
        "text-xs",
        included ? "text-foreground" : "text-muted-foreground line-through"
      )}>
        {label}
      </span>
    </div>
  );

  return (
    <div className="space-y-4">
      {fares.map((fare) => (
        <Card
          key={fare.id}
          className={cn(
            "relative transition-all duration-200 cursor-pointer hover:shadow-md",
            selectedFareId === fare.id && "ring-2 ring-primary shadow-lg",
            fare.popular && "border-primary"
          )}
          onClick={() => onFareSelect(fare.id)}
        >
          {fare.popular && (
            <Badge 
              className="absolute -top-2 left-4 bg-primary text-primary-foreground"
            >
              Most Popular
            </Badge>
          )}
          
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getCabinIcon(fare.cabinClass)}
                <div>
                  <CardTitle className="text-lg">{fare.fareFamily}</CardTitle>
                  <p className="text-sm text-muted-foreground capitalize">
                    {fare.cabinClass.replace('_', ' ')}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {fare.currency} {fare.totalPrice.toFixed(2)}
                </div>
                {fare.basePrice !== fare.totalPrice && (
                  <div className="text-sm text-muted-foreground">
                    Base: {fare.currency} {fare.basePrice.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <FeatureIcon
                included={!!fare.included.baggage.checked}
                icon={Luggage}
                label={fare.included.baggage.checked || 'No checked bag'}
              />
              <FeatureIcon
                included={fare.included.mealService}
                icon={Utensils}
                label="Meal service"
              />
              <FeatureIcon
                included={fare.included.wifi}
                icon={Wifi}
                label="WiFi"
              />
              <FeatureIcon
                included={fare.included.seatSelection}
                icon={Plane}
                label="Seat selection"
              />
            </div>

            {fare.description && (
              <p className="text-sm text-muted-foreground mb-3">
                {fare.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {fare.included.changeable && (
                  <Badge variant="outline" className="text-xs">
                    Changeable
                  </Badge>
                )}
                {fare.included.refundable && (
                  <Badge variant="outline" className="text-xs">
                    Refundable
                  </Badge>
                )}
                {fare.included.loungeAccess && (
                  <Badge variant="outline" className="text-xs">
                    Lounge Access
                  </Badge>
                )}
              </div>

              {selectedFareId === fare.id && onSeatMapToggle && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSeatMapToggle();
                  }}
                >
                  {showSeatMap ? 'Hide' : 'Select'} Seats
                </Button>
              )}
            </div>

            {expandedFare === fare.id && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-2">Baggage</h4>
                    <p>Cabin: {fare.included.baggage.cabin}</p>
                    <p>Checked: {fare.included.baggage.checked || 'Not included'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Flexibility</h4>
                    <p>Changes: {fare.included.changeable ? 'Allowed' : 'Not allowed'}</p>
                    <p>Refunds: {fare.included.refundable ? 'Allowed' : 'Not allowed'}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};