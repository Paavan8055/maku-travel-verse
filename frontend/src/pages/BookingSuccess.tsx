import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, Mail, Calendar, MapPin, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BookingDetails {
  id: string;
  booking_reference: string;
  status: string;
  booking_type: string;
  total_amount: number;
  currency: string;
  booking_data: any;
  created_at: string;
  items?: any[];
}

export default function BookingSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [sendingConfirmation, setSendingConfirmation] = useState(false);

  const bookingId = searchParams.get('booking_id');
  const sessionId = searchParams.get('session_id');
  const paymentIntentId = searchParams.get('payment_intent');

  useEffect(() => {
    if (bookingId || sessionId || paymentIntentId) {
      verifyBookingAndPayment();
    } else {
      setLoading(false);
    }
  }, [bookingId, sessionId, paymentIntentId]);

  const verifyBookingAndPayment = async () => {
    try {
      setLoading(true);

      // Verify the payment and get booking details
      const { data, error } = await supabase.functions.invoke('verify-booking-payment', {
        body: {
          booking_id: bookingId,
          session_id: sessionId,
          payment_intent_id: paymentIntentId
        }
      });

      if (error) throw error;

      if (data.success) {
        setBooking(data.booking);
        
        // Send booking confirmation email
        if (data.booking?.booking_data?.customerInfo?.email) {
          await sendBookingConfirmation(
            data.booking.id,
            data.booking.booking_data.customerInfo.email,
            data.booking.booking_type
          );
        }
      } else {
        throw new Error(data.error || 'Booking verification failed');
      }

    } catch (error) {
      console.error('Booking verification error:', error);
      toast({
        title: "Verification Failed",
        description: "There was an issue verifying your booking. Please contact support.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendBookingConfirmation = async (bookingId: string, email: string, bookingType: string) => {
    try {
      setSendingConfirmation(true);
      
      const { error } = await supabase.functions.invoke('send-booking-confirmation', {
        body: {
          bookingId,
          customerEmail: email,
          bookingType
        }
      });

      if (error) throw error;

      toast({
        title: "Confirmation Sent",
        description: "A confirmation email has been sent to your email address.",
      });

    } catch (error) {
      console.error('Error sending confirmation:', error);
      toast({
        title: "Email Error",
        description: "Confirmation email could not be sent, but your booking is confirmed.",
        variant: "destructive"
      });
    } finally {
      setSendingConfirmation(false);
    }
  };

  const formatBookingData = () => {
    if (!booking) return null;

    const { booking_data, booking_type } = booking;

    switch (booking_type) {
      case 'flight':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{booking_data?.origin} → {booking_data?.destination}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Departure: {booking_data?.departureDate}</span>
            </div>
            {booking_data?.returnDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Return: {booking_data?.returnDate}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{booking_data?.passengers || booking_data?.adults || 1} passenger(s)</span>
            </div>
          </div>
        );

      case 'hotel':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{booking_data?.hotelName || booking_data?.destination}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Check-in: {booking_data?.checkInDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Check-out: {booking_data?.checkOutDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{booking_data?.guestCount || booking_data?.adults || 1} guest(s)</span>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Booking details available in your confirmation email.
            </p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Verifying your booking...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center p-6">
            <p className="text-destructive mb-4">Booking not found or verification failed.</p>
            <Button onClick={() => navigate('/')}>Return Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto py-8">
        <Card className="mb-8">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-green-600">Booking Confirmed!</CardTitle>
            <p className="text-muted-foreground">
              Your booking has been successfully confirmed and payment processed.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Booking Reference</h3>
              <p className="text-2xl font-mono font-bold text-primary">
                {booking.booking_reference}
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Booking Details</h3>
              {formatBookingData()}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="font-semibold">
                  {booking.currency} {booking.total_amount.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Booking Date</p>
                <p className="font-semibold">
                  {new Date(booking.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => sendBookingConfirmation(
                  booking.id, 
                  booking.booking_data?.customerInfo?.email, 
                  booking.booking_type
                )}
                disabled={sendingConfirmation}
              >
                <Mail className="mr-2 h-4 w-4" />
                {sendingConfirmation ? 'Sending...' : 'Resend Confirmation Email'}
              </Button>

              <Button variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download Receipt
              </Button>

              <Button 
                className="w-full"
                onClick={() => navigate('/bookings')}
              >
                View My Bookings
              </Button>

              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => navigate('/')}
              >
                Return Home
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">What's Next?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• A confirmation email has been sent to your email address</li>
              <li>• You can manage your booking in the "My Bookings" section</li>
              <li>• Check-in online 24 hours before departure (for flights)</li>
              <li>• Keep your booking reference handy for any inquiries</li>
              <li>• Contact our support team if you need any assistance</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}