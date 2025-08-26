import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ShoppingBag, 
  UtensilsCrossed, 
  Wifi, 
  Shield, 
  Car, 
  Hotel,
  Plus,
  Minus,
  CheckCircle
} from 'lucide-react';
import { useCurrency } from '@/hooks/use-currency';

interface AncillaryService {
  id: string;
  type: 'baggage' | 'meal' | 'seat' | 'wifi' | 'insurance' | 'transfer' | 'hotel' | 'lounge';
  name: string;
  description: string;
  price: number;
  currency: string;
  icon: React.ReactNode;
  passengerSpecific?: boolean;
  maxQuantity?: number;
  options?: { id: string; name: string; price: number }[];
}

interface SelectedService {
  serviceId: string;
  passengerIndex?: number;
  optionId?: string;
  quantity: number;
}

interface AncillaryServicesProps {
  passengerCount: number;
  onSelectionChange: (services: SelectedService[]) => void;
  onContinue: () => void;
  onBack: () => void;
  initialSelection?: SelectedService[];
}

const availableServices: AncillaryService[] = [
  {
    id: 'checked-bag',
    type: 'baggage',
    name: 'Checked Baggage',
    description: 'Additional checked baggage allowance (23kg)',
    price: 45,
    currency: 'AUD',
    icon: <ShoppingBag className="w-5 h-5" />,
    passengerSpecific: true,
    maxQuantity: 3,
  },
  {
    id: 'extra-legroom',
    type: 'seat',
    name: 'Extra Legroom Seat',
    description: 'Seats with additional legroom for comfort',
    price: 89,
    currency: 'AUD',
    icon: <CheckCircle className="w-5 h-5" />,
    passengerSpecific: true,
  },
  {
    id: 'premium-meal',
    type: 'meal',
    name: 'Premium Meal',
    description: 'Upgrade to premium dining experience',
    price: 32,
    currency: 'AUD',
    icon: <UtensilsCrossed className="w-5 h-5" />,
    passengerSpecific: true,
    options: [
      { id: 'beef', name: 'Premium Beef', price: 32 },
      { id: 'chicken', name: 'Gourmet Chicken', price: 28 },
      { id: 'vegetarian', name: 'Vegetarian Deluxe', price: 25 },
      { id: 'seafood', name: 'Fresh Seafood', price: 45 },
    ],
  },
  {
    id: 'wifi',
    type: 'wifi',
    name: 'In-Flight WiFi',
    description: 'High-speed internet access throughout the flight',
    price: 18,
    currency: 'AUD',
    icon: <Wifi className="w-5 h-5" />,
    options: [
      { id: 'basic', name: 'Basic (messaging)', price: 12 },
      { id: 'standard', name: 'Standard (browsing)', price: 18 },
      { id: 'premium', name: 'Premium (streaming)', price: 28 },
    ],
  },
  {
    id: 'travel-insurance',
    type: 'insurance',
    name: 'Travel Insurance',
    description: 'Comprehensive travel protection coverage',
    price: 85,
    currency: 'AUD',
    icon: <Shield className="w-5 h-5" />,
    options: [
      { id: 'basic', name: 'Basic Coverage', price: 65 },
      { id: 'comprehensive', name: 'Comprehensive', price: 85 },
      { id: 'premium', name: 'Premium Plus', price: 125 },
    ],
  },
  {
    id: 'airport-transfer',
    type: 'transfer',
    name: 'Airport Transfer',
    description: 'Private transfer from airport to hotel',
    price: 45,
    currency: 'AUD',
    icon: <Car className="w-5 h-5" />,
    options: [
      { id: 'shared', name: 'Shared Shuttle', price: 25 },
      { id: 'private', name: 'Private Car', price: 45 },
      { id: 'luxury', name: 'Luxury Vehicle', price: 95 },
    ],
  },
  {
    id: 'lounge-access',
    type: 'lounge',
    name: 'Airport Lounge Access',
    description: 'Premium lounge access with food and beverages',
    price: 55,
    currency: 'AUD',
    icon: <Hotel className="w-5 h-5" />,
    passengerSpecific: true,
  },
];

export const AncillaryServices = ({
  passengerCount,
  onSelectionChange,
  onContinue,
  onBack,
  initialSelection = []
}: AncillaryServicesProps) => {
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>(initialSelection);
  const { formatPrice } = useCurrency();

  const updateSelection = (newSelection: SelectedService[]) => {
    setSelectedServices(newSelection);
    onSelectionChange(newSelection);
  };

  const toggleService = (serviceId: string, passengerIndex?: number, optionId?: string) => {
    const existingIndex = selectedServices.findIndex(
      s => s.serviceId === serviceId && 
           s.passengerIndex === passengerIndex && 
           s.optionId === optionId
    );

    if (existingIndex >= 0) {
      const newSelection = selectedServices.filter((_, index) => index !== existingIndex);
      updateSelection(newSelection);
    } else {
      const newSelection = [...selectedServices, {
        serviceId,
        passengerIndex,
        optionId,
        quantity: 1
      }];
      updateSelection(newSelection);
    }
  };

  const updateQuantity = (serviceId: string, passengerIndex: number | undefined, optionId: string | undefined, change: number) => {
    const existingIndex = selectedServices.findIndex(
      s => s.serviceId === serviceId && 
           s.passengerIndex === passengerIndex && 
           s.optionId === optionId
    );

    if (existingIndex >= 0) {
      const newSelection = [...selectedServices];
      const newQuantity = Math.max(0, newSelection[existingIndex].quantity + change);
      
      if (newQuantity === 0) {
        newSelection.splice(existingIndex, 1);
      } else {
        const service = availableServices.find(s => s.id === serviceId);
        const maxQuantity = service?.maxQuantity || 10;
        newSelection[existingIndex].quantity = Math.min(newQuantity, maxQuantity);
      }
      updateSelection(newSelection);
    }
  };

  const isServiceSelected = (serviceId: string, passengerIndex?: number, optionId?: string) => {
    return selectedServices.some(
      s => s.serviceId === serviceId && 
           s.passengerIndex === passengerIndex && 
           s.optionId === optionId
    );
  };

  const getServiceQuantity = (serviceId: string, passengerIndex?: number, optionId?: string) => {
    const service = selectedServices.find(
      s => s.serviceId === serviceId && 
           s.passengerIndex === passengerIndex && 
           s.optionId === optionId
    );
    return service?.quantity || 0;
  };

  const calculateTotal = () => {
    return selectedServices.reduce((total, selected) => {
      const service = availableServices.find(s => s.id === selected.serviceId);
      if (!service) return total;

      let price = service.price;
      if (selected.optionId && service.options) {
        const option = service.options.find(opt => opt.id === selected.optionId);
        price = option?.price || service.price;
      }
      
      return total + (price * selected.quantity);
    }, 0);
  };

  const renderServiceCard = (service: AncillaryService) => (
    <Card key={service.id} className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {service.icon}
            </div>
            <div>
              <CardTitle className="text-lg">{service.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
            </div>
          </div>
          <Badge variant="secondary">
            {formatPrice(service.price, service.currency)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {service.options ? (
          <div className="space-y-3">
            {service.options.map((option) => (
              <div key={option.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={isServiceSelected(service.id, undefined, option.id)}
                    onCheckedChange={() => toggleService(service.id, undefined, option.id)}
                  />
                  <div>
                    <p className="font-medium">{option.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(option.price, service.currency)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : service.passengerSpecific ? (
          <div className="space-y-3">
            {Array.from({ length: passengerCount }, (_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={isServiceSelected(service.id, i)}
                    onCheckedChange={() => toggleService(service.id, i)}
                  />
                  <span className="font-medium">Passenger {i + 1}</span>
                </div>
                {service.maxQuantity && service.maxQuantity > 1 && isServiceSelected(service.id, i) && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(service.id, i, undefined, -1)}
                      disabled={getServiceQuantity(service.id, i) <= 1}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center">{getServiceQuantity(service.id, i)}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(service.id, i, undefined, 1)}
                      disabled={getServiceQuantity(service.id, i) >= service.maxQuantity!}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={isServiceSelected(service.id)}
                onCheckedChange={() => toggleService(service.id)}
              />
              <span className="font-medium">Add to booking</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Enhance Your Journey</h2>
        <p className="text-muted-foreground">
          Add services to make your travel more comfortable and convenient.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {availableServices.map(renderServiceCard)}
      </div>

      {selectedServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Services Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedServices.map((selected, index) => {
                const service = availableServices.find(s => s.id === selected.serviceId);
                if (!service) return null;

                let serviceName = service.name;
                let price = service.price;

                if (selected.optionId && service.options) {
                  const option = service.options.find(opt => opt.id === selected.optionId);
                  serviceName += ` (${option?.name})`;
                  price = option?.price || service.price;
                }

                if (selected.passengerIndex !== undefined) {
                  serviceName += ` - Passenger ${selected.passengerIndex + 1}`;
                }

                return (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{serviceName}</span>
                      {selected.quantity > 1 && (
                        <span className="text-muted-foreground"> × {selected.quantity}</span>
                      )}
                    </div>
                    <span className="font-medium">
                      {formatPrice(price * selected.quantity, service.currency)}
                    </span>
                  </div>
                );
              })}
              <Separator />
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total Add-ons:</span>
                <span>{formatPrice(calculateTotal(), 'AUD')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onContinue}>
          Continue to Payment
        </Button>
      </div>
    </div>
  );
};