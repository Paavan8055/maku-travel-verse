import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, MapPinIcon, UsersIcon, BedIcon, ClockIcon } from "lucide-react";
import { format } from "date-fns";

interface SearchSummaryProps {
  searchType: 'flight' | 'hotel' | 'activity' | 'flights' | 'hotels' | 'activities';
  searchParams: any;
  isReady: boolean;
  className?: string;
}

export const SearchSummary = ({ 
  searchType, 
  searchParams, 
  isReady, 
  className = "" 
}: SearchSummaryProps) => {
  if (!searchParams || !isReady) {
    return null;
  }

  const renderFlightSummary = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MapPinIcon className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium">{searchParams.origin}</span>
        <span className="text-muted-foreground">→</span>
        <span className="font-medium">{searchParams.destination}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Departure</p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(searchParams.departureDate), 'MMM dd, yyyy')}
            </p>
          </div>
        </div>
        
        {searchParams.returnDate && (
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Return</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(searchParams.returnDate), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <UsersIcon className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm">
          {searchParams.adults || 1} adult{(searchParams.adults || 1) > 1 ? 's' : ''}
          {searchParams.children > 0 && `, ${searchParams.children} child${searchParams.children > 1 ? 'ren' : ''}`}
          {searchParams.infants > 0 && `, ${searchParams.infants} infant${searchParams.infants > 1 ? 's' : ''}`}
        </span>
      </div>
    </div>
  );

  const renderHotelSummary = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MapPinIcon className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium">{searchParams.destination || searchParams.cityCode}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Check-in</p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(searchParams.checkIn), 'MMM dd, yyyy')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Check-out</p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(searchParams.checkOut), 'MMM dd, yyyy')}
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <UsersIcon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">{searchParams.adults || 2} guest{(searchParams.adults || 2) > 1 ? 's' : ''}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <BedIcon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">{searchParams.rooms || 1} room{(searchParams.rooms || 1) > 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );

  const renderActivitySummary = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MapPinIcon className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium">{searchParams.destination || searchParams.cityCode}</span>
      </div>
      
      {(searchParams.checkIn || searchParams.checkOut) && (
        <div className="flex items-center gap-2">
          <ClockIcon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">
            {searchParams.checkIn && format(new Date(searchParams.checkIn), 'MMM dd')}
            {searchParams.checkIn && searchParams.checkOut && ' - '}
            {searchParams.checkOut && format(new Date(searchParams.checkOut), 'MMM dd, yyyy')}
          </span>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (searchType) {
      case 'flight':
        return renderFlightSummary();
      case 'hotel':
        return renderHotelSummary();
      case 'activity':
        return renderActivitySummary();
      default:
        return null;
    }
  };

  const getTitle = () => {
    const titles = {
      flight: 'Flight Search Ready',
      hotel: 'Hotel Search Ready',
      activity: 'Activity Search Ready'
    };
    return titles[searchType];
  };

  return (
    <Card className={`border-success/20 bg-success/5 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">{getTitle()}</CardTitle>
          <Badge variant="default" className="bg-success/10 text-success border-success/20">
            Ready to search
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {renderContent()}
      </CardContent>
    </Card>
  );
};