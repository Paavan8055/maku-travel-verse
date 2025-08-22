import { useState } from "react";
import { Search, Calendar, Users, MapPin, Plane, Building, Car, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { DestinationAutocomplete } from "@/components/search/DestinationAutocomplete";

interface MobileSearchSheetProps {
  trigger?: React.ReactNode;
}

export const MobileSearchSheet = ({ trigger }: MobileSearchSheetProps) => {
  const [activeTab, setActiveTab] = useState("hotels");
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState("2");

  const searchTabs = [
    { id: "hotels", label: "Hotels", icon: Building },
    { id: "flights", label: "Flights", icon: Plane },
    { id: "cars", label: "Cars", icon: Car },
    { id: "activities", label: "Activities", icon: Camera }
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="md:hidden">
            <Search className="h-4 w-4" />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh]">
        <SheetHeader>
          <SheetTitle>Search Travel</SheetTitle>
          <SheetDescription>
            Find hotels, flights, cars, and activities
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              {searchTabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex flex-col items-center space-y-1 text-xs"
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="hotels" className="space-y-4">
              <div className="space-y-4">
                <DestinationAutocomplete
                  value={destination}
                  onChange={setDestination}
                  onDestinationSelect={(d) => setDestination(d.code ? `${d.city ?? d.name} (${d.code})` : d.name)}
                  placeholder="Where are you going?"
                  className="w-full"
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {checkIn ? format(checkIn, "MMM dd") : "Check-in"}
                  </Button>
                  
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {checkOut ? format(checkOut, "MMM dd") : "Check-out"}
                  </Button>
                </div>

                <Select value={guests} onValueChange={setGuests}>
                  <SelectTrigger>
                    <Users className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Guests" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Guest</SelectItem>
                    <SelectItem value="2">2 Guests</SelectItem>
                    <SelectItem value="3">3 Guests</SelectItem>
                    <SelectItem value="4">4 Guests</SelectItem>
                    <SelectItem value="5">5+ Guests</SelectItem>
                  </SelectContent>
                </Select>

                <Button className="w-full mt-6">
                  <Search className="mr-2 h-4 w-4" />
                  Search Hotels
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="flights" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                Flight search coming soon
              </div>
            </TabsContent>

            <TabsContent value="cars" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                Car rental search coming soon
              </div>
            </TabsContent>

            <TabsContent value="activities" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                Activity search coming soon
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};