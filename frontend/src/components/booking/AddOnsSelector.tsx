import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Coffee, 
  Car, 
  Wifi, 
  Utensils, 
  Bed, 
  Shield,
  Clock,
  MapPin,
  CheckCircle
} from 'lucide-react';

interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: 'meals' | 'transport' | 'services' | 'amenities';
  required: boolean;
  perNight?: boolean;
}

interface AddOnsSelectorProps {
  addOns: AddOn[];
  selectedAddOns: string[];
  onAddOnsChange: (selectedIds: string[]) => void;
  nights: number;
  currency: string;
}

export const AddOnsSelector: React.FC<AddOnsSelectorProps> = ({
  addOns,
  selectedAddOns,
  onAddOnsChange,
  nights,
  currency
}) => {
  const handleAddOnToggle = (addOnId: string) => {
    const newSelection = selectedAddOns.includes(addOnId)
      ? selectedAddOns.filter(id => id !== addOnId)
      : [...selectedAddOns, addOnId];
    
    onAddOnsChange(newSelection);
  };

  const getAddOnIcon = (category: string) => {
    switch (category) {
      case 'meals': return <Utensils className="h-4 w-4" />;
      case 'transport': return <Car className="h-4 w-4" />;
      case 'services': return <Shield className="h-4 w-4" />;
      case 'amenities': return <Wifi className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const calculateAddOnPrice = (addOn: AddOn) => {
    return addOn.perNight ? addOn.price * nights : addOn.price;
  };

  const getTotalAddOnsPrice = () => {
    return addOns
      .filter(addOn => selectedAddOns.includes(addOn.id))
      .reduce((total, addOn) => total + calculateAddOnPrice(addOn), 0);
  };

  const groupedAddOns = addOns.reduce((groups, addOn) => {
    const category = addOn.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(addOn);
    return groups;
  }, {} as Record<string, AddOn[]>);

  const categoryLabels = {
    meals: 'Dining & Meals',
    transport: 'Transportation',
    services: 'Hotel Services',
    amenities: 'Room Amenities'
  };

  if (addOns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>Add-ons & Extras</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No additional services available for this booking.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>Add-ons & Extras</span>
          </div>
          {selectedAddOns.length > 0 && (
            <Badge variant="secondary">
              {selectedAddOns.length} selected
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedAddOns).map(([category, categoryAddOns]) => (
          <div key={category}>
            <h4 className="font-medium mb-3 flex items-center space-x-2">
              {getAddOnIcon(category)}
              <span>{categoryLabels[category as keyof typeof categoryLabels]}</span>
            </h4>
            
            <div className="space-y-3">
              {categoryAddOns.map((addOn) => (
                <div 
                  key={addOn.id}
                  className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={addOn.id}
                    checked={selectedAddOns.includes(addOn.id)}
                    onCheckedChange={() => handleAddOnToggle(addOn.id)}
                    disabled={addOn.required}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <label 
                          htmlFor={addOn.id}
                          className="font-medium cursor-pointer"
                        >
                          {addOn.name}
                          {addOn.required && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Required
                            </Badge>
                          )}
                        </label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {addOn.description}
                        </p>
                        {addOn.perNight && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Per night for {nights} nights
                          </p>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium">
                          {currency} {calculateAddOnPrice(addOn).toFixed(2)}
                        </p>
                        {addOn.perNight && (
                          <p className="text-xs text-muted-foreground">
                            {currency} {addOn.price.toFixed(2)}/night
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {category !== Object.keys(groupedAddOns)[Object.keys(groupedAddOns).length - 1] && (
              <Separator className="mt-4" />
            )}
          </div>
        ))}
        
        {selectedAddOns.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex justify-between items-center font-medium">
              <span>Total add-ons:</span>
              <span>{currency} {getTotalAddOnsPrice().toFixed(2)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};