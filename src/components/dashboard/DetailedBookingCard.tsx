import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, MapPin, Users, Clock, CreditCard, Star, Plane, Hotel, Activity, Package, Eye, Download, Phone } from "lucide-react";

interface BookingItem {
  id: string;
  item_type: string;
  item_details: any;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface DetailedBooking {
  id: string;
  booking_reference: string;
  status: string;
  check_in_date?: string;
  check_out_date?: string;
  guest_count?: number;
  total_amount: number;
  currency: string;
  booking_type: string;
  booking_data: any;
  created_at: string;
  items?: BookingItem[];
  latest_payment?: {
    status: string;
    amount: number;
    currency: string;
  };
}

interface DetailedBookingCardProps {
  booking: DetailedBooking;
  onViewDetails?: (bookingId: string) => void;
  onDownloadItinerary?: (bookingId: string) => void;
}

const getBookingTypeIcon = (type: string) => {
  switch (type) {
    case 'flight': return <Plane className="h-5 w-5" />;
    case 'hotel': return <Hotel className="h-5 w-5" />;
    case 'activity': return <Activity className="h-5 w-5" />;
    case 'package': return <Package className="h-5 w-5" />;
    default: return <MapPin className="h-5 w-5" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export function DetailedBookingCard({ booking, onViewDetails, onDownloadItinerary }: DetailedBookingCardProps) {
  const renderFlightDetails = () => {
    const flightSegments = booking.items?.filter(item => item.item_type === 'flight_segment') || [];
    const passengers = booking.items?.filter(item => item.item_type === 'passenger') || [];
    
    return (
      <div className="space-y-3">
        {flightSegments.map((segment, index) => (
          <div key={index} className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-blue-900">
                {segment.item_details.type.toUpperCase()} FLIGHT
              </span>
              <Badge variant="outline" className="text-blue-700">
                {segment.item_details.class}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
              <div><strong>Route:</strong> {segment.item_details.route}</div>
              <div><strong>Flight:</strong> {segment.item_details.flight}</div>
              <div><strong>Date:</strong> {new Date(segment.item_details.date).toLocaleDateString()}</div>
              <div><strong>Duration:</strong> {segment.item_details.duration}</div>
            </div>
          </div>
        ))}
        
        {passengers.length > 0 && (
          <div className="mt-3">
            <h4 className="font-medium mb-2">Passengers ({passengers.length})</h4>
            <div className="grid gap-2">
              {passengers.map((passenger, index) => (
                <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                  <strong>{passenger.item_details.name}</strong>
                  {passenger.item_details.seat && (
                    <span className="ml-2 text-gray-600">• Seat: {passenger.item_details.seat}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderHotelDetails = () => {
    const hotelNights = booking.items?.filter(item => item.item_type === 'hotel_night') || [];
    const extras = booking.items?.filter(item => item.item_type === 'hotel_extra') || [];
    
    if (hotelNights.length === 0) return null;
    
    const firstNight = hotelNights[0];
    const lastNight = hotelNights[hotelNights.length - 1];
    
    return (
      <div className="space-y-3">
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="grid grid-cols-2 gap-2 text-sm text-green-800">
            <div><strong>Hotel:</strong> {firstNight.item_details.hotel_name}</div>
            <div><strong>Room:</strong> {firstNight.item_details.room_type}</div>
            <div><strong>Check-in:</strong> {new Date(firstNight.item_details.date).toLocaleDateString()}</div>
            <div><strong>Check-out:</strong> {new Date(new Date(lastNight.item_details.date).getTime() + 24*60*60*1000).toLocaleDateString()}</div>
            <div><strong>Nights:</strong> {hotelNights.length}</div>
            <div><strong>Guests:</strong> {firstNight.item_details.guests}</div>
          </div>
        </div>
        
        {extras.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Extras & Add-ons</h4>
            <div className="space-y-1">
              {extras.map((extra, index) => (
                <div key={index} className="text-sm p-2 bg-gray-50 rounded flex justify-between">
                  <span>{extra.item_details.name}</span>
                  <span className="font-medium">{booking.currency} {extra.total_price}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderActivityDetails = () => {
    const participants = booking.items?.filter(item => item.item_type === 'activity_participant') || [];
    const addOns = booking.items?.filter(item => item.item_type === 'activity_addon') || [];
    
    if (participants.length === 0) return null;
    
    const activity = participants[0];
    
    return (
      <div className="space-y-3">
        <div className="p-3 bg-purple-50 rounded-lg">
          <div className="grid grid-cols-2 gap-2 text-sm text-purple-800">
            <div><strong>Activity:</strong> {activity.item_details.activity_name}</div>
            <div><strong>Date:</strong> {new Date(activity.item_details.date).toLocaleDateString()}</div>
            <div><strong>Time:</strong> {activity.item_details.time}</div>
            <div><strong>Duration:</strong> {activity.item_details.duration}</div>
            <div className="col-span-2"><strong>Location:</strong> {activity.item_details.location}</div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Participants ({participants.length})</h4>
          <div className="grid gap-2">
            {participants.map((participant, index) => (
              <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                <strong>{participant.item_details.participant_name}</strong>
                <span className="ml-2 text-gray-600">• {participant.item_details.participant_type}</span>
              </div>
            ))}
          </div>
        </div>
        
        {addOns.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Add-ons</h4>
            <div className="space-y-1">
              {addOns.map((addOn, index) => (
                <div key={index} className="text-sm p-2 bg-gray-50 rounded flex justify-between">
                  <span>{addOn.item_details.name}</span>
                  <span className="font-medium">{booking.currency} {addOn.total_price}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBookingDetails = () => {
    switch (booking.booking_type) {
      case 'flight': return renderFlightDetails();
      case 'hotel': return renderHotelDetails();
      case 'activity': return renderActivityDetails();
      default: return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              {getBookingTypeIcon(booking.booking_type)}
            </div>
            <div>
              <CardTitle className="text-lg">
                {booking.booking_reference}
              </CardTitle>
              <CardDescription className="text-sm">
                {booking.booking_type.charAt(0).toUpperCase() + booking.booking_type.slice(1)} Booking
              </CardDescription>
            </div>
          </div>
          <Badge className={getStatusColor(booking.status)}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Booking Summary */}
        <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">
              {booking.currency} {booking.total_amount}
            </div>
            <div className="text-xs text-gray-600">Total Amount</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              {new Date(booking.created_at).toLocaleDateString()}
            </div>
            <div className="text-xs text-gray-600">Booked On</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {booking.latest_payment?.status || 'Pending'}
            </div>
            <div className="text-xs text-gray-600">Payment Status</div>
          </div>
        </div>

        <Separator />

        {/* Detailed Booking Information */}
        {renderBookingDetails()}

        <Separator />

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onViewDetails?.(booking.id)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onDownloadItinerary?.(booking.id)}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm">
            <Phone className="h-4 w-4 mr-2" />
            Support
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}