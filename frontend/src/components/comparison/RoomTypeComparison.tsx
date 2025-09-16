import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bed, 
  Users, 
  Wifi, 
  Coffee, 
  Bath, 
  Wind, 
  Tv, 
  Car,
  MapPin,
  Star,
  Check,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoomType {
  id: string;
  name: string;
  description: string;
  size: number; // in sqm
  maxOccupancy: number;
  bedConfiguration: string;
  pricePerNight: number;
  originalPrice?: number;
  currency: string;
  images: string[];
  amenities: string[];
  features: {
    name: string;
    included: boolean;
    description?: string;
  }[];
  cancellationPolicy: string;
  availability: number; // rooms available
  promotion?: {
    type: string;
    description: string;
    value: number;
  };
  virtualTour?: string;
}

interface RoomTypeComparisonProps {
  hotelName: string;
  roomTypes: RoomType[];
  checkIn: string;
  checkOut: string;
  guests: number;
  onRoomSelect: (roomType: RoomType) => void;
}

export const RoomTypeComparison: React.FC<RoomTypeComparisonProps> = ({
  hotelName,
  roomTypes,
  checkIn,
  checkOut,
  guests,
  onRoomSelect
}) => {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'comparison'>('grid');
  const [compareList, setCompareList] = useState<string[]>([]);

  const formatPrice = (price: number, currency: string = 'AUD') => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(price);
  };

  const getAmenityIcon = (amenity: string) => {
    const lower = amenity.toLowerCase();
    if (lower.includes('wifi')) return <Wifi className="h-4 w-4" />;
    if (lower.includes('coffee')) return <Coffee className="h-4 w-4" />;
    if (lower.includes('bath') || lower.includes('shower')) return <Bath className="h-4 w-4" />;
    if (lower.includes('tv')) return <Tv className="h-4 w-4" />;
    if (lower.includes('balcony') || lower.includes('terrace')) return <Wind className="h-4 w-4" />;
    if (lower.includes('parking')) return <Car className="h-4 w-4" />;
    if (lower.includes('view')) return <MapPin className="h-4 w-4" />;
    return <Check className="h-4 w-4" />;
  };

  const toggleCompare = (roomId: string) => {
    setCompareList(prev => 
      prev.includes(roomId) 
        ? prev.filter(id => id !== roomId)
        : prev.length < 3 
          ? [...prev, roomId] 
          : prev
    );
  };

  const getComparedRooms = () => {
    return roomTypes.filter(room => compareList.includes(room.id));
  };

  const getAllFeatures = () => {
    const allFeatures = new Set<string>();
    getComparedRooms().forEach(room => {
      room.features.forEach(feature => allFeatures.add(feature.name));
    });
    return Array.from(allFeatures);
  };

  const getRoomFeature = (room: RoomType, featureName: string) => {
    return room.features.find(f => f.name === featureName);
  };

  const getBestValue = () => {
    return roomTypes.reduce((best, current) => {
      const currentValue = current.size / current.pricePerNight;
      const bestValue = best.size / best.pricePerNight;
      return currentValue > bestValue ? current : best;
    });
  };

  const getUpgradeOptions = (baseRoom: RoomType) => {
    return roomTypes.filter(room => 
      room.id !== baseRoom.id && 
      room.pricePerNight > baseRoom.pricePerNight
    ).sort((a, b) => a.pricePerNight - b.pricePerNight);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{hotelName} - Room Options</CardTitle>
              <p className="text-muted-foreground">
                {checkIn} - {checkOut} • {guests} guests
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                Grid View
              </Button>
              <Button
                variant={viewMode === 'comparison' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('comparison')}
                disabled={compareList.length < 2}
              >
                Compare ({compareList.length})
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
        <TabsContent value="grid">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {roomTypes.map((room) => {
              const isSelected = selectedRoom === room.id;
              const isInCompare = compareList.includes(room.id);
              const bestValue = getBestValue();
              
              return (
                <Card 
                  key={room.id} 
                  className={cn(
                    "relative overflow-hidden transition-all duration-200",
                    isSelected && "ring-2 ring-primary",
                    isInCompare && "border-blue-500"
                  )}
                >
                  {/* Image */}
                  <div className="relative h-48 bg-muted">
                    {room.images.length > 0 ? (
                      <img
                        src={room.images[0]}
                        alt={room.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Bed className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {room.id === bestValue.id && (
                        <Badge className="bg-green-500 text-white">Best Value</Badge>
                      )}
                      {room.promotion && (
                        <Badge variant="destructive">
                          {room.promotion.type}
                        </Badge>
                      )}
                    </div>

                    {/* Compare Toggle */}
                    <Button
                      variant={isInCompare ? "default" : "secondary"}
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => toggleCompare(room.id)}
                      disabled={!isInCompare && compareList.length >= 3}
                    >
                      {isInCompare ? 'Remove' : 'Compare'}
                    </Button>

                    {/* Availability */}
                    <div className="absolute bottom-2 left-2">
                      <Badge variant="outline" className="bg-background/80">
                        {room.availability} left
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg">{room.name}</h3>
                        <p className="text-sm text-muted-foreground">{room.description}</p>
                      </div>

                      {/* Room Details */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>Max {room.maxOccupancy}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Bed className="h-4 w-4" />
                          <span>{room.bedConfiguration}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{room.size} m²</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4" />
                          <span>Premium</span>
                        </div>
                      </div>

                      {/* Key Amenities */}
                      <div className="flex flex-wrap gap-1">
                        {room.amenities.slice(0, 4).map((amenity, index) => (
                          <Badge key={index} variant="outline" className="text-xs flex items-center gap-1">
                            {getAmenityIcon(amenity)}
                            <span>{amenity}</span>
                          </Badge>
                        ))}
                        {room.amenities.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{room.amenities.length - 4} more
                          </Badge>
                        )}
                      </div>

                      {/* Price */}
                      <div className="space-y-2">
                        <div className="flex items-end justify-between">
                          <div>
                            {room.originalPrice && room.originalPrice > room.pricePerNight && (
                              <div className="text-sm line-through text-muted-foreground">
                                {formatPrice(room.originalPrice, room.currency)}
                              </div>
                            )}
                            <div className="text-xl font-bold text-primary">
                              {formatPrice(room.pricePerNight, room.currency)}
                            </div>
                            <div className="text-xs text-muted-foreground">per night</div>
                          </div>
                        </div>

                        {room.promotion && (
                          <div className="text-xs text-green-600 font-medium">
                            {room.promotion.description}
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                          {room.cancellationPolicy}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <Button 
                          className="w-full" 
                          onClick={() => {
                            setSelectedRoom(room.id);
                            onRoomSelect(room);
                          }}
                        >
                          Select Room
                        </Button>
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            View Details
                          </Button>
                          {room.virtualTour && (
                            <Button variant="outline" size="sm" className="flex-1">
                              Virtual Tour
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="comparison">
          {compareList.length >= 2 ? (
            <Card>
              <CardHeader>
                <CardTitle>Room Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 w-48">Feature</th>
                        {getComparedRooms().map((room) => (
                          <th key={room.id} className="text-center p-3 min-w-48">
                            <div className="space-y-2">
                              <div className="font-semibold">{room.name}</div>
                              <div className="text-lg font-bold text-primary">
                                {formatPrice(room.pricePerNight, room.currency)}
                              </div>
                              <Button
                                size="sm"
                                onClick={() => onRoomSelect(room)}
                              >
                                Select
                              </Button>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Basic Info */}
                      <tr className="border-b">
                        <td className="p-3 font-medium">Room Size</td>
                        {getComparedRooms().map((room) => (
                          <td key={room.id} className="text-center p-3">
                            {room.size} m²
                          </td>
                        ))}
                      </tr>
                      
                      <tr className="border-b">
                        <td className="p-3 font-medium">Max Occupancy</td>
                        {getComparedRooms().map((room) => (
                          <td key={room.id} className="text-center p-3">
                            <div className="flex items-center justify-center gap-1">
                              <Users className="h-4 w-4" />
                              {room.maxOccupancy}
                            </div>
                          </td>
                        ))}
                      </tr>

                      <tr className="border-b">
                        <td className="p-3 font-medium">Bed Configuration</td>
                        {getComparedRooms().map((room) => (
                          <td key={room.id} className="text-center p-3">
                            {room.bedConfiguration}
                          </td>
                        ))}
                      </tr>

                      <tr className="border-b">
                        <td className="p-3 font-medium">Availability</td>
                        {getComparedRooms().map((room) => (
                          <td key={room.id} className="text-center p-3">
                            <Badge variant={room.availability < 3 ? "destructive" : "secondary"}>
                              {room.availability} rooms
                            </Badge>
                          </td>
                        ))}
                      </tr>

                      {/* Features Comparison */}
                      {getAllFeatures().map((featureName) => (
                        <tr key={featureName} className="border-b">
                          <td className="p-3 font-medium">{featureName}</td>
                          {getComparedRooms().map((room) => {
                            const feature = getRoomFeature(room, featureName);
                            return (
                              <td key={room.id} className="text-center p-3">
                                {feature?.included ? (
                                  <Check className="h-5 w-5 text-green-500 mx-auto" />
                                ) : (
                                  <X className="h-5 w-5 text-red-500 mx-auto" />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}

                      {/* Cancellation Policy */}
                      <tr className="border-b">
                        <td className="p-3 font-medium">Cancellation</td>
                        {getComparedRooms().map((room) => (
                          <td key={room.id} className="text-center p-3 text-sm">
                            {room.cancellationPolicy}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="space-y-4">
                  <div className="text-6xl">📊</div>
                  <h3 className="text-xl font-semibold">Select rooms to compare</h3>
                  <p className="text-muted-foreground">
                    Choose at least 2 rooms from the grid view to see a detailed comparison.
                  </p>
                  <Button onClick={() => setViewMode('grid')}>
                    Back to Grid View
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Upgrade Suggestions */}
      {selectedRoom && (
        <Card>
          <CardHeader>
            <CardTitle>Consider Upgrading</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getUpgradeOptions(roomTypes.find(r => r.id === selectedRoom)!).slice(0, 3).map((upgrade) => {
                const baseRoom = roomTypes.find(r => r.id === selectedRoom)!;
                const priceDiff = upgrade.pricePerNight - baseRoom.pricePerNight;
                
                return (
                  <Card key={upgrade.id} className="p-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">{upgrade.name}</h4>
                      <div className="text-sm text-muted-foreground">
                        +{formatPrice(priceDiff)} per night
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {upgrade.size - baseRoom.size}m² larger
                      </div>
                      <Button size="sm" variant="outline" className="w-full">
                        Upgrade
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};