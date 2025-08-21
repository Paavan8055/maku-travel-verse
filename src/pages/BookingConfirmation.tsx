import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logger from "@/utils/logger";

interface BookingData {
  id: string;
  booking_reference: string;
  status: string;
  total_amount: number;
  currency: string;
  booking_type: string;
  booking_data: any;
  created_at: string;
}

export default function BookingConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const sessionId = searchParams.get("session_id");
  const bookingId = searchParams.get("booking_id");
  
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBookingDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        if (sessionId && bookingId) {
          // Verify payment via session
          const { data, error: verifyError } = await supabase.functions.invoke(
            'verify-booking-payment',
            { body: { sessionId, bookingId } }
          );

          if (verifyError) {
            throw new Error('Failed to verify payment');
          }

          if (data?.booking) {
            setBooking(data.booking);
            return;
          }
        }

        // Fallback: Guest booking lookup with email/booking reference
        if (bookingId) {
          const { data, error: lookupError } = await supabase.functions.invoke(
            'guest-booking-lookup',
            { body: { bookingId } }
          );

          if (lookupError) {
            throw new Error('Failed to find booking');
          }

          if (data?.booking) {
            setBooking(data.booking);
            return;
          }
        }

        // Final fallback: Use session storage for demo
        const sessionBooking = sessionStorage.getItem('lastBooking');
        if (sessionBooking) {
          setBooking(JSON.parse(sessionBooking));
          return;
        }

        throw new Error('Booking not found');
      } catch (err: any) {
        logger.error('Booking confirmation error:', err);
        setError(err.message || 'Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    loadBookingDetails();
  }, [sessionId, bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Loading your booking...</h2>
              <p className="text-muted-foreground">
                We're confirming your payment and retrieving your booking details.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4 text-red-600">Booking Not Found</h2>
              <p className="text-muted-foreground mb-6">
                {error || 'We could not find your booking details. Please check your email for confirmation.'}
              </p>
              <div className="space-x-4">
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => navigate('/')}>
                  Return Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const nights = booking.booking_data?.checkIn && booking.booking_data?.checkOut 
    ? Math.ceil((new Date(booking.booking_data.checkOut).getTime() - new Date(booking.booking_data.checkIn).getTime()) / (1000 * 60 * 60 * 24))
    : 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Success Header */}
        <Card className="mb-6">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-green-800 mb-2">Booking Confirmed!</h1>
            <p className="text-xl text-muted-foreground mb-4">
              Your reservation has been successfully processed.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 inline-block">
              <p className="text-sm text-green-700">
                Booking Reference: <span className="font-mono font-bold">{booking.booking_reference}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Stay Details */}
          <Card>
            <CardHeader>
              <CardTitle>Stay Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {booking.booking_data?.selectedOffer?.hotel?.name && (
                <div>
                  <h3 className="font-semibold">Hotel</h3>
                  <p className="text-muted-foreground">{booking.booking_data.selectedOffer.hotel.name}</p>
                </div>
              )}
              
              {booking.booking_data?.selectedOffer?.hotel?.address && (
                <div>
                  <h3 className="font-semibold">Location</h3>
                  <p className="text-muted-foreground">
                    {booking.booking_data.selectedOffer.hotel.address.lines?.join(', ')}, {booking.booking_data.selectedOffer.hotel.address.cityName}
                  </p>
                </div>
              )}

              {booking.booking_data?.checkIn && (
                <div>
                  <h3 className="font-semibold">Check-in</h3>
                  <p className="text-muted-foreground">
                    {new Date(booking.booking_data.checkIn).toLocaleDateString('en-AU', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}

              {booking.booking_data?.checkOut && (
                <div>
                  <h3 className="font-semibold">Check-out</h3>
                  <p className="text-muted-foreground">
                    {new Date(booking.booking_data.checkOut).toLocaleDateString('en-AU', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })} ({nights} {nights === 1 ? 'night' : 'nights'})
                  </p>
                </div>
              )}

              <div>
                <h3 className="font-semibold">Guests</h3>
                <p className="text-muted-foreground">
                  {booking.booking_data?.adults || 2} Adults
                  {booking.booking_data?.children > 0 && `, ${booking.booking_data.children} Children`}
                </p>
              </div>

              <div>
                <h3 className="font-semibold">Rooms</h3>
                <p className="text-muted-foreground">{booking.booking_data?.rooms || 1} Room(s)</p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Room Total</span>
                <span>{booking.currency} {booking.booking_data?.roomPrice?.toFixed(2) || '0.00'}</span>
              </div>
              
              {booking.booking_data?.addonsPrice > 0 && (
                <div className="flex justify-between">
                  <span>Extras</span>
                  <span>{booking.currency} {booking.booking_data.addonsPrice.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Taxes & Fees</span>
                <span>Included</span>
              </div>

              <hr />
              
              <div className="flex justify-between font-semibold text-lg">
                <span>Total Paid</span>
                <span>{booking.currency} {booking.total_amount.toFixed(2)}</span>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-700 text-center">
                  ✅ Payment Status: <span className="font-semibold">Confirmed</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 text-center space-x-4">
          <Button onClick={() => navigate('/dashboard')}>
            View My Bookings
          </Button>
          <Button variant="outline" onClick={() => navigate('/')}>
            Book Another Trip
          </Button>
        </div>

        {/* Additional Info */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">What's Next?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• A confirmation email has been sent to {booking.booking_data?.customerInfo?.email || 'your email'}</li>
              <li>• Your booking reference is: <span className="font-mono">{booking.booking_reference}</span></li>
              <li>• Please present this reference and valid ID at check-in</li>
              <li>• For any changes or cancellations, contact the hotel directly</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}