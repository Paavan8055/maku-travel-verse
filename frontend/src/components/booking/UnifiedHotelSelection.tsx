import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bed, 
  Users, 
  Coffee, 
  Wifi, 
  Car, 
  Utensils,
  Star,
  Calendar,
  MapPin,
  Info
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RoomOption {
  id: string;
  name: string;
  description: string;
  bedType: string;
  occupancy: number;
  size: string;
  pricePerNight: number;
  boardType: 'room_only' | 'breakfast' | 'half_board' | 'full_board' | 'all_inclusive';
  amenities: string[];
  cancellationPolicy: string;
  isRefundable: boolean;
}

interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'spa' | 'dining' | 'transport' | 'experience';
  isPerPerson: boolean;
}

interface Hotel {
  id: string;
  name: string;
  starRating: number;
  rating: number;
  reviewCount: number;
  address: string;
  images: string[];
  roomOptions: RoomOption[];
  availableAddOns: AddOn[];
  checkIn: string;
  checkOut: string;
  nights: number;
  totalGuests: number;
}

interface UnifiedHotelSelectionProps {
  hotel: Hotel;
  onContinue: (selection: {
    roomId: string;
    addOns: string[];
    specialRequests: string;
    totalPrice: number;
  }) => void;
  onBack: () => void;
}

export function UnifiedHotelSelection({ hotel, onContinue, onBack }: UnifiedHotelSelectionProps) {
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [specialRequests, setSpecialRequests] = useState('');

  const selectedRoomData = hotel.roomOptions.find(room => room.id === selectedRoom);
  
  // Calculate total price
  const calculateTotal = () => {
    if (!selectedRoomData) return 0;
    
    const roomTotal = selectedRoomData.pricePerNight * hotel.nights;
    const addOnsTotal = selectedAddOns.reduce((total, addOnId) => {
      const addOn = hotel.availableAddOns.find(a => a.id === addOnId);
      if (!addOn) return total;
      
      const multiplier = addOn.isPerPerson ? hotel.totalGuests : 1;
      return total + (addOn.price * multiplier * hotel.nights);
    }, 0);
    
    return roomTotal + addOnsTotal;
  };

  const getBoardTypeLabel = (boardType: string) => {
    const labels = {
      room_only: 'Room Only',
      breakfast: 'Bed & Breakfast',
      half_board: 'Half Board',
      full_board: 'Full Board',
      all_inclusive: 'All Inclusive'
    };
    return labels[boardType as keyof typeof labels] || boardType;
  };

  const handleAddOnToggle = (addOnId: string) => {
    setSelectedAddOns(prev => 
      prev.includes(addOnId) 
        ? prev.filter(id => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  const handleContinue = () => {
    if (!selectedRoom) return;
    
    onContinue({
      roomId: selectedRoom,
      addOns: selectedAddOns,
      specialRequests,
      totalPrice: calculateTotal()
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hotel Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{hotel.name}</CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(hotel.starRating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-muted-foreground">•</span>
                <span className="font-medium">{hotel.rating}/5</span>
                <span className="text-muted-foreground">({hotel.reviewCount} reviews)</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{hotel.address}</span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{hotel.checkIn} - {hotel.checkOut}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{hotel.totalGuests} guests • {hotel.nights} nights</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Room Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Your Room</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {hotel.roomOptions.map((room) => (
            <div key={room.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold">{room.name}</h4>
                    <Badge variant={room.isRefundable ? "secondary" : "outline"}>
                      {room.isRefundable ? "Refundable" : "Non-refundable"}
                    </Badge>
                    <Badge variant="outline">
                      {getBoardTypeLabel(room.boardType)}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">{room.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Bed className="h-4 w-4" />
                      <span>{room.bedType}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4" />
                      <span>Up to {room.occupancy} guests</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">{room.size}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {room.amenities.slice(0, 4).map((amenity, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                    {room.amenities.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{room.amenities.length - 4} more
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    <Info className="h-3 w-3 inline mr-1" />
                    {room.cancellationPolicy}
                  </div>
                </div>
                
                <div className="text-right ml-4">
                  <div className="mb-2">
                    <div className="text-2xl font-bold">
                      ${room.pricePerNight}
                    </div>
                    <div className="text-sm text-muted-foreground">per night</div>
                    <div className="text-sm font-medium">
                      ${room.pricePerNight * hotel.nights} total
                    </div>
                  </div>
                  
                  <Button
                    variant={selectedRoom === room.id ? "default" : "outline"}
                    onClick={() => setSelectedRoom(room.id)}
                  >
                    {selectedRoom === room.id ? "Selected" : "Select"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Add-ons Selection */}
      {selectedRoom && hotel.availableAddOns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Enhance Your Stay</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hotel.availableAddOns.map((addOn) => {
              const isSelected = selectedAddOns.includes(addOn.id);
              const totalPrice = addOn.isPerPerson 
                ? addOn.price * hotel.totalGuests * hotel.nights
                : addOn.price * hotel.nights;
              
              return (
                <div key={addOn.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{addOn.name}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{addOn.description}</p>
                    <Badge variant="outline" className="text-xs">
                      {addOn.isPerPerson ? `$${addOn.price} per person per night` : `$${addOn.price} per night`}
                    </Badge>
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className="font-medium">${totalPrice}</div>
                    <div className="text-sm text-muted-foreground">for {hotel.nights} nights</div>
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className="mt-2"
                      onClick={() => handleAddOnToggle(addOn.id)}
                    >
                      {isSelected ? "Remove" : "Add"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Special Requests */}
      {selectedRoom && (
        <Card>
          <CardHeader>
            <CardTitle>Special Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Any special requests or preferences? (e.g., high floor, late check-in, dietary requirements)"
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              className="min-h-20"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Special requests cannot be guaranteed but the hotel will do their best to accommodate.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Price Summary & Continue */}
      {selectedRoom && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Room ({hotel.nights} nights)</span>
                <span>${selectedRoomData!.pricePerNight * hotel.nights}</span>
              </div>
              
              {selectedAddOns.map(addOnId => {
                const addOn = hotel.availableAddOns.find(a => a.id === addOnId);
                if (!addOn) return null;
                
                const total = addOn.isPerPerson 
                  ? addOn.price * hotel.totalGuests * hotel.nights
                  : addOn.price * hotel.nights;
                
                return (
                  <div key={addOnId} className="flex justify-between text-sm">
                    <span>{addOn.name}</span>
                    <span>${total}</span>
                  </div>
                );
              })}
              
              <Separator />
              
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>${calculateTotal()}</span>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={onBack} className="flex-1">
                Back to Search
              </Button>
              <Button 
                onClick={handleContinue}
                disabled={!selectedRoom}
                className="flex-1"
              >
                Continue to Guest Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}