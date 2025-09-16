import React, { useState } from 'react';
import { Plus, X, MapPin, Calendar, Users, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BookingItem {
  id: string;
  type: 'hotel' | 'flight' | 'activity' | 'transfer';
  title: string;
  description: string;
  location: string;
  date: string;
  guests: number;
  price: number;
  originalPrice?: number;
}

interface PackageDeal {
  id: string;
  name: string;
  description: string;
  items: BookingItem[];
  totalPrice: number;
  savings: number;
  duration: string;
}

interface MultiPropertyBookingProps {
  onPackageSelect?: (package_: PackageDeal) => void;
  className?: string;
}

export const MultiPropertyBooking: React.FC<MultiPropertyBookingProps> = ({
  onPackageSelect,
  className
}) => {
  const [selectedItems, setSelectedItems] = useState<BookingItem[]>([]);
  const [packageDeals] = useState<PackageDeal[]>([
    {
      id: 'luxury-dubai',
      name: 'Dubai Luxury Experience',
      description: '5-day luxury package with premium hotel, flights, and exclusive experiences',
      items: [
        {
          id: '1',
          type: 'hotel',
          title: 'Burj Al Arab',
          description: '3 nights in luxury suite',
          location: 'Dubai, UAE',
          date: '2024-03-15',
          guests: 2,
          price: 1200,
          originalPrice: 1500
        },
        {
          id: '2',
          type: 'flight',
          title: 'Business Class Flight',
          description: 'Round trip business class',
          location: 'Dubai, UAE',
          date: '2024-03-15',
          guests: 2,
          price: 800,
          originalPrice: 1000
        },
        {
          id: '3',
          type: 'activity',
          title: 'Desert Safari',
          description: 'Premium desert safari with dinner',
          location: 'Dubai, UAE',
          date: '2024-03-16',
          guests: 2,
          price: 150
        }
      ],
      totalPrice: 2150,
      savings: 350,
      duration: '5 days'
    }
  ]);

  const addItem = (type: BookingItem['type']) => {
    const newItem: BookingItem = {
      id: `item-${Date.now()}`,
      type,
      title: `New ${type}`,
      description: `Add ${type} details`,
      location: '',
      date: '',
      guests: 2,
      price: 0
    };
    setSelectedItems([...selectedItems, newItem]);
  };

  const removeItem = (id: string) => {
    setSelectedItems(selectedItems.filter(item => item.id !== id));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hotel': return <MapPin className="h-4 w-4" />;
      case 'flight': return <Package className="h-4 w-4" />;
      case 'activity': return <Calendar className="h-4 w-4" />;
      case 'transfer': return <Users className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'hotel': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'flight': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'activity': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'transfer': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Package Deals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Package Deals
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Save more with our curated travel packages
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {packageDeals.map(package_ => (
              <div
                key={package_.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onPackageSelect?.(package_)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold">{package_.name}</h4>
                    <p className="text-sm text-muted-foreground">{package_.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary">
                        ${package_.totalPrice}
                      </span>
                      <Badge variant="secondary" className="text-green-600">
                        Save ${package_.savings}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{package_.duration}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {package_.items.map(item => (
                    <div key={item.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                      <Badge className={getTypeColor(item.type)}>
                        {getTypeIcon(item.type)}
                        {item.type}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground">${item.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Package Builder */}
      <Card>
        <CardHeader>
          <CardTitle>Build Custom Package</CardTitle>
          <p className="text-sm text-muted-foreground">
            Create your own travel package by adding items
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add Item Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => addItem('hotel')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Hotel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addItem('flight')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Flight
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addItem('activity')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Activity
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addItem('transfer')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Transfer
              </Button>
            </div>

            {/* Selected Items */}
            <div className="space-y-3">
              {selectedItems.map(item => (
                <Card key={item.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <Badge className={getTypeColor(item.type)}>
                        {getTypeIcon(item.type)}
                        {item.type}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor={`title-${item.id}`}>Title</Label>
                        <Input
                          id={`title-${item.id}`}
                          value={item.title}
                          placeholder="Enter title"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`location-${item.id}`}>Location</Label>
                        <Input
                          id={`location-${item.id}`}
                          value={item.location}
                          placeholder="Enter location"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`date-${item.id}`}>Date</Label>
                        <Input
                          id={`date-${item.id}`}
                          type="date"
                          value={item.date}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`guests-${item.id}`}>Guests</Label>
                        <Select value={item.guests.toString()}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6].map(num => (
                              <SelectItem key={num} value={num.toString()}>
                                {num} guest{num > 1 ? 's' : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedItems.length > 0 && (
              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
                  </p>
                </div>
                <Button>
                  Create Package
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MultiPropertyBooking;