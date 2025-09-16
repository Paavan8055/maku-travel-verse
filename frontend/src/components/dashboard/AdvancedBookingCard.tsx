import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  Users, 
  MapPin, 
  Plane, 
  Building, 
  Activity,
  ExternalLink,
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit
} from "lucide-react";

interface BookingData {
  id: string;
  booking_reference: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  check_in_date: string;
  check_out_date: string;
  guest_count: number;
  total_amount: number;
  currency: string;
  booking_type: string;
  booking_data: any;
  created_at: string;
  updated_at: string;
  items: Array<{
    id: string;
    item_type: string;
    item_details: any;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  latest_payment: {
    id: string;
    stripe_payment_intent_id: string;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
  } | null;
}

interface AdvancedBookingCardProps {
  booking: BookingData;
  onViewDetails: (bookingId: string) => void;
  onCheckIn: (bookingId: string) => void;
  onModifyBooking: (bookingId: string) => void;
  onCancelBooking: (bookingId: string) => void;
  onDownloadItinerary: (bookingId: string) => void;
}

export const AdvancedBookingCard = ({
  booking,
  onViewDetails,
  onCheckIn,
  onModifyBooking,
  onCancelBooking,
  onDownloadItinerary
}: AdvancedBookingCardProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getBookingTypeIcon = (type: string) => {
    switch (type) {
      case 'flight':
        return <Plane className="h-5 w-5 text-primary" />;
      case 'hotel':
        return <Building className="h-5 w-5 text-primary" />;
      case 'activity':
        return <Activity className="h-5 w-5 text-primary" />;
      default:
        return <MapPin className="h-5 w-5 text-primary" />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  };

  // Check if booking is upcoming and can be checked into
  const isUpcoming = booking.check_in_date && new Date(booking.check_in_date) > new Date();
  const canCheckIn = booking.booking_type === 'flight' && booking.status === 'confirmed' && 
                     booking.check_in_date && 
                     new Date(booking.check_in_date).getTime() - new Date().getTime() <= 24 * 60 * 60 * 1000; // 24 hours

  // Get check-in links for flights
  const getCheckInLink = () => {
    if (booking.booking_type !== 'flight' || !booking.booking_data?.check_in_links) return null;
    return booking.booking_data.check_in_links;
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getBookingTypeIcon(booking.booking_type)}
            <div>
              <CardTitle className="text-lg capitalize">
                {booking.booking_type} Booking
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Ref: {booking.booking_reference}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(booking.status)}
            <Badge 
              variant={
                booking.status === 'confirmed' ? 'default' : 
                booking.status === 'pending' ? 'secondary' : 
                'destructive'
              }
              className="capitalize"
            >
              {booking.status}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Booking Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Check-in</p>
              <p className="text-muted-foreground">{formatDate(booking.check_in_date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Check-out</p>
              <p className="text-muted-foreground">{formatDate(booking.check_out_date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Guests</p>
              <p className="text-muted-foreground">{booking.guest_count}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 flex items-center justify-center">
              <span className="text-lg">💰</span>
            </div>
            <div>
              <p className="font-medium">Total</p>
              <p className="text-muted-foreground font-semibold">
                {formatCurrency(booking.total_amount, booking.currency)}
              </p>
            </div>
          </div>
        </div>

        {/* Special Features for Flight Bookings */}
        {booking.booking_type === 'flight' && booking.booking_data && (
          <div className="space-y-2">
            <Separator />
            <div className="text-sm space-y-1">
              {booking.booking_data.confirmation_number && (
                <p><span className="font-medium">Confirmation:</span> {booking.booking_data.confirmation_number}</p>
              )}
              {booking.booking_data.passengers && (
                <p><span className="font-medium">Passengers:</span> {booking.booking_data.passengers.length}</p>
              )}
              {booking.booking_data.selected_seats && (
                <p><span className="font-medium">Seats:</span> {booking.booking_data.selected_seats.map((s: any) => s.seatNumber).join(', ')}</p>
              )}
            </div>
          </div>
        )}

        {/* Payment Status */}
        {booking.latest_payment && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="text-sm">
              <p className="font-medium">Payment Status</p>
              <p className="text-muted-foreground capitalize">{booking.latest_payment.status}</p>
            </div>
            <Badge 
              variant={booking.latest_payment.status === 'succeeded' ? 'default' : 'secondary'}
              className="capitalize"
            >
              {booking.latest_payment.status}
            </Badge>
          </div>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onViewDetails(booking.id)}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            View Details
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onDownloadItinerary(booking.id)}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Itinerary
          </Button>

          {/* Check-in Button for Flights */}
          {canCheckIn && getCheckInLink() && (
            <Button 
              size="sm" 
              onClick={() => window.open(getCheckInLink(), '_blank')}
              className="flex items-center gap-2 col-span-2"
            >
              <Plane className="h-4 w-4" />
              Check In Online
            </Button>
          )}

          {/* Modify/Cancel Buttons */}
          {booking.status === 'confirmed' && isUpcoming && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onModifyBooking(booking.id)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Modify
              </Button>
              
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => onCancelBooking(booking.id)}
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};