// Advanced room and guest selector with children ages and promo codes
import { useState } from "react";
import { Users, Minus, Plus, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Room {
  adults: number;
  children: number[];
}

interface RoomGuestSelectorProps {
  rooms: Room[];
  onRoomsChange: (rooms: Room[]) => void;
  promoCode?: string;
  onPromoCodeChange?: (code: string) => void;
  className?: string;
}

export const RoomGuestSelector = ({
  rooms,
  onRoomsChange,
  promoCode = "",
  onPromoCodeChange,
  className
}: RoomGuestSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPromoCode, setShowPromoCode] = useState(false);

  const totalGuests = rooms.reduce((total, room) => total + room.adults + room.children.length, 0);

  const addRoom = () => {
    onRoomsChange([...rooms, { adults: 1, children: [] }]);
  };

  const removeRoom = (index: number) => {
    if (rooms.length > 1) {
      const newRooms = rooms.filter((_, i) => i !== index);
      onRoomsChange(newRooms);
    }
  };

  const updateAdults = (roomIndex: number, change: number) => {
    const newRooms = [...rooms];
    const newAdults = Math.max(1, Math.min(8, newRooms[roomIndex].adults + change));
    newRooms[roomIndex].adults = newAdults;
    onRoomsChange(newRooms);
  };

  const addChild = (roomIndex: number) => {
    const newRooms = [...rooms];
    if (newRooms[roomIndex].children.length < 4) {
      newRooms[roomIndex].children.push(5); // Default age
      onRoomsChange(newRooms);
    }
  };

  const removeChild = (roomIndex: number, childIndex: number) => {
    const newRooms = [...rooms];
    newRooms[roomIndex].children.splice(childIndex, 1);
    onRoomsChange(newRooms);
  };

  const updateChildAge = (roomIndex: number, childIndex: number, age: number) => {
    const newRooms = [...rooms];
    newRooms[roomIndex].children[childIndex] = age;
    onRoomsChange(newRooms);
  };

  const getSummaryText = () => {
    if (rooms.length === 1) {
      const room = rooms[0];
      const adults = room.adults;
      const children = room.children.length;
      
      if (children === 0) {
        return adults === 1 ? "1 Guest" : `${adults} Guests`;
      } else {
        return `${adults} Adult${adults > 1 ? 's' : ''}, ${children} Child${children > 1 ? 'ren' : ''}`;
      }
    } else {
      return `${totalGuests} Guests in ${rooms.length} Rooms`;
    }
  };

  return (
    <div className="space-y-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal",
              className
            )}
          >
            <Users className="mr-2 h-4 w-4" />
            {getSummaryText()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-4 space-y-4">
            <h4 className="font-medium text-sm">Rooms & Guests</h4>
            
            {rooms.map((room, roomIndex) => (
              <div key={roomIndex} className="space-y-3 p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium text-sm">Room {roomIndex + 1}</h5>
                  {rooms.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRoom(roomIndex)}
                      className="h-6 w-6 p-0"
                    >
                      ×
                    </Button>
                  )}
                </div>
                
                {/* Adults */}
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Adults</Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateAdults(roomIndex, -1)}
                      disabled={room.adults <= 1}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm">{room.adults}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateAdults(roomIndex, 1)}
                      disabled={room.adults >= 8}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                {/* Children */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Children</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addChild(roomIndex)}
                      disabled={room.children.length >= 4}
                      className="h-8 px-2"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Child
                    </Button>
                  </div>
                  
                  {room.children.map((age, childIndex) => (
                    <div key={childIndex} className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground w-12">Child {childIndex + 1}</span>
                      <Select
                        value={age.toString()}
                        onValueChange={(value) => updateChildAge(roomIndex, childIndex, parseInt(value))}
                      >
                        <SelectTrigger className="w-20 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 18 }, (_, i) => (
                            <SelectItem key={i} value={i.toString()}>
                              {i} {i === 1 ? "year" : "years"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeChild(roomIndex, childIndex)}
                        className="h-8 w-8 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {/* Add Room Button */}
            {rooms.length < 4 && (
              <Button
                variant="outline"
                onClick={addRoom}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Room
              </Button>
            )}
            
            <Separator />
            
            {/* Promo Code Section */}
            <div className="space-y-2">
              <Button
                variant="ghost"
                onClick={() => setShowPromoCode(!showPromoCode)}
                className="w-full justify-start p-0 h-auto text-sm"
              >
                <Gift className="h-4 w-4 mr-2" />
                {showPromoCode ? "Hide" : "Add"} promo code
              </Button>
              
              {showPromoCode && onPromoCodeChange && (
                <Input
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => onPromoCodeChange(e.target.value)}
                  className="h-8"
                />
              )}
            </div>
            
            <Button
              onClick={() => setIsOpen(false)}
              className="w-full"
            >
              Done
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};