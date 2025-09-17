import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Package2, 
  Plane, 
  Bed, 
  MapPin, 
  Calendar,
  Users,
  Plus,
  Minus,
  Star,
  Clock,
  Percent,
  ShoppingCart
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface FlightOption {
  id: string;
  airline: string;
  departure: string;
  arrival: string;
  duration: string;
  price: { total: number; currency: string };
}

interface HotelOption {
  id: string;
  name: string;
  location: string;
  rating: number;
  amenities: string[];
  pricePerNight: { total: number; currency: string };
}

interface ActivityOption {
  id: string;
  name: string;
  duration: string;
  rating: number;
  price: { total: number; currency: string };
  category: string;
}

interface BundleItem {
  type: 'flight' | 'hotel' | 'activity';
  item: FlightOption | HotelOption | ActivityOption;
  quantity?: number;
  nights?: number;
}

interface TripBundleBuilderProps {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  onBundleComplete?: (bundle: BundleItem[], totalPrice: number) => void;
  className?: string;
}

export const TripBundleBuilder: React.FC<TripBundleBuilderProps> = ({
  destination,
  checkIn,
  checkOut,
  guests,
  onBundleComplete,
  className = ""
}) => {
  const [selectedItems, setSelectedItems] = useState<BundleItem[]>([]);
  const [currentTab, setCurrentTab] = useState<'flight' | 'hotel' | 'activity'>('flight');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Mock data - in real implementation, these would come from search APIs
  const mockFlights: FlightOption[] = [
    {
      id: 'fl1',
      airline: 'Jetstar',
      departure: 'SYD 09:00',
      arrival: `${destination} 11:30`,
      duration: '2h 30m',
      price: { total: 189, currency: 'AUD' }
    },
    {
      id: 'fl2', 
      airline: 'Qantas',
      departure: 'SYD 14:15',
      arrival: `${destination} 16:45`,
      duration: '2h 30m',
      price: { total: 249, currency: 'AUD' }
    }
  ];

  const mockHotels: HotelOption[] = [
    {
      id: 'ht1',
      name: 'Grand Palace Hotel',
      location: `${destination} CBD`,
      rating: 4.5,
      amenities: ['Pool', 'Gym', 'WiFi', 'Breakfast'],
      pricePerNight: { total: 120, currency: 'AUD' }
    },
    {
      id: 'ht2',
      name: 'Boutique Inn',
      location: `${destination} Waterfront`,
      rating: 4.2,
      amenities: ['WiFi', 'Restaurant', 'Bar'],
      pricePerNight: { total: 89, currency: 'AUD' }
    }
  ];

  const mockActivities: ActivityOption[] = [
    {
      id: 'ac1',
      name: 'City Sightseeing Tour',
      duration: '3 hours',
      rating: 4.6,
      price: { total: 45, currency: 'AUD' },
      category: 'Sightseeing'
    },
    {
      id: 'ac2',
      name: 'Harbor Cruise',
      duration: '2 hours',
      rating: 4.8,
      price: { total: 65, currency: 'AUD' },
      category: 'Water Sports'
    },
    {
      id: 'ac3',
      name: 'Food Walking Tour',
      duration: '4 hours',
      rating: 4.7,
      price: { total: 85, currency: 'AUD' },
      category: 'Food & Drink'
    }
  ];

  // Calculate nights between check-in and check-out
  const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));

  // Add item to bundle
  const addToBundle = (type: 'flight' | 'hotel' | 'activity', item: any) => {
    const bundleItem: BundleItem = {
      type,
      item,
      quantity: type === 'activity' ? 1 : undefined,
      nights: type === 'hotel' ? nights : undefined
    };

    setSelectedItems(prev => {
      // Remove existing item of same type (except activities)
      const filtered = type === 'activity' 
        ? prev 
        : prev.filter(i => i.type !== type);
      
      return [...filtered, bundleItem];
    });

    toast({
      title: "Added to bundle",
      description: `${item.name || `${item.airline} flight`} added to your trip bundle`
    });
  };

  // Remove item from bundle
  const removeFromBundle = (index: number) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
  };

  // Update activity quantity
  const updateActivityQuantity = (index: number, quantity: number) => {
    setSelectedItems(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  };

  // Calculate total bundle price
  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => {
      let itemPrice = 0;
      
      if (item.type === 'flight') {
        itemPrice = (item.item as FlightOption).price?.total || 0;
      } else if (item.type === 'hotel') {
        itemPrice = (item.item as HotelOption).pricePerNight?.total || 0;
      } else if (item.type === 'activity') {
        itemPrice = (item.item as ActivityOption).price?.total || 0;
      }
      
      if (item.type === 'hotel' && item.nights) {
        itemPrice *= item.nights;
      }
      
      if (item.type === 'activity' && item.quantity) {
        itemPrice *= item.quantity;
      }
      
      // Apply guest multiplier for hotels and activities
      if (item.type === 'hotel' || item.type === 'activity') {
        itemPrice *= guests;
      }
      
      return total + itemPrice;
    }, 0);
  };

  // Calculate bundle discount
  const getBundleDiscount = () => {
    const itemTypes = [...new Set(selectedItems.map(item => item.type))];
    if (itemTypes.length >= 3) return 0.15; // 15% for full bundle
    if (itemTypes.length >= 2) return 0.10; // 10% for partial bundle
    return 0;
  };

  const subtotal = calculateTotal();
  const discount = getBundleDiscount();
  const discountAmount = subtotal * discount;
  const totalPrice = subtotal - discountAmount;

  // Complete bundle
  const completeBundle = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "Empty bundle",
        description: "Please add some items to your bundle first",
        variant: "destructive"
      });
      return;
    }

    onBundleComplete?.(selectedItems, totalPrice);
  };

  const renderFlightOptions = () => (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <Plane className="h-4 w-4" />
        Select Flight
      </h3>
      {mockFlights.map(flight => (
        <Card key={flight.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{flight.airline}</div>
                <div className="text-sm text-muted-foreground">
                  {flight.departure} → {flight.arrival}
                </div>
                <div className="text-sm text-muted-foreground">
                  Duration: {flight.duration}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">
                  {flight.price.currency} {flight.price.total}
                </div>
                <div className="text-xs text-muted-foreground">per person</div>
                <Button 
                  size="sm" 
                  onClick={() => addToBundle('flight', flight)}
                  className="mt-2"
                >
                  Add Flight
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderHotelOptions = () => (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <Bed className="h-4 w-4" />
        Select Hotel
      </h3>
      {mockHotels.map(hotel => (
        <Card key={hotel.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium">{hotel.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                    <span className="text-sm">{hotel.rating}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">• {hotel.location}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {hotel.amenities.map(amenity => (
                    <Badge key={amenity} variant="outline" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="text-right ml-4">
                <div className="font-bold text-lg">
                  {hotel.pricePerNight.currency} {hotel.pricePerNight.total}
                </div>
                <div className="text-xs text-muted-foreground">per night</div>
                <div className="text-sm text-muted-foreground">
                  {nights} nights • {guests} guests
                </div>
                <Button 
                  size="sm" 
                  onClick={() => addToBundle('hotel', hotel)}
                  className="mt-2"
                >
                  Add Hotel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderActivityOptions = () => (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        Select Activities
      </h3>
      {mockActivities.map(activity => (
        <Card key={activity.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{activity.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                    <span className="text-sm">{activity.rating}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {activity.duration}
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs mt-2">
                  {activity.category}
                </Badge>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">
                  {activity.price.currency} {activity.price.total}
                </div>
                <div className="text-xs text-muted-foreground">per person</div>
                <Button 
                  size="sm" 
                  onClick={() => addToBundle('activity', activity)}
                  className="mt-2"
                >
                  Add Activity
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Bundle Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package2 className="h-5 w-5" />
            Build Your Trip Bundle
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            {destination} • {format(new Date(checkIn), 'MMM dd')} - {format(new Date(checkOut), 'MMM dd')} • {guests} guest{guests !== 1 ? 's' : ''}
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Options Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Navigation */}
          <div className="flex border-b">
            {(['flight', 'hotel', 'activity'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setCurrentTab(tab)}
                className={`px-4 py-2 font-medium text-sm capitalize border-b-2 transition-colors ${
                  currentTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'flight' && <Plane className="h-4 w-4 mr-2 inline" />}
                {tab === 'hotel' && <Bed className="h-4 w-4 mr-2 inline" />}
                {tab === 'activity' && <MapPin className="h-4 w-4 mr-2 inline" />}
                {tab}s
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div>
            {currentTab === 'flight' && renderFlightOptions()}
            {currentTab === 'hotel' && renderHotelOptions()}
            {currentTab === 'activity' && renderActivityOptions()}
          </div>
        </div>

        {/* Bundle Summary */}
        <div className="space-y-6">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Your Bundle
                {selectedItems.length > 0 && (
                  <Badge variant="secondary">{selectedItems.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Start adding items to your bundle
                </p>
              ) : (
                <>
                  <div className="space-y-3">
                    {selectedItems.map((bundleItem, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {(bundleItem.type === 'flight' 
                                ? `${(bundleItem.item as FlightOption).airline} Flight`
                                : (bundleItem.item as HotelOption | ActivityOption).name)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {bundleItem.type === 'hotel' && `${bundleItem.nights} nights`}
                              {bundleItem.type === 'activity' && (
                                <div className="flex items-center gap-2 mt-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateActivityQuantity(index, (bundleItem.quantity || 1) - 1)}
                                    disabled={bundleItem.quantity === 1}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="text-xs">{bundleItem.quantity}</span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateActivityQuantity(index, (bundleItem.quantity || 1) + 1)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFromBundle(index)}
                            className="text-destructive hover:text-destructive h-6 w-6 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Price Summary */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>AUD {subtotal}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span className="flex items-center gap-1">
                          <Percent className="h-3 w-3" />
                          Bundle Discount ({(discount * 100).toFixed(0)}%)
                        </span>
                        <span>-AUD {discountAmount.toFixed(0)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>AUD {totalPrice.toFixed(0)}</span>
                    </div>
                  </div>

                  <Button 
                    onClick={completeBundle}
                    className="w-full"
                    size="lg"
                  >
                    Book Bundle
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TripBundleBuilder;