import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { travelFundClient } from '@/lib/travelFundClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';

const BookingSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const bookingId = searchParams.get('booking_id');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      if (!bookingId || !sessionId) return;

      try {
        setLoading(true);
        
        const { data, error } = await supabase.functions.invoke('verify-booking-payment', {
          body: {
            booking_id: bookingId,
            session_id: sessionId
          }
        });

        if (error) {
          setError('Failed to verify payment. Please contact support.');
          return;
        }

        // Handle travel fund payments
        if (data?.booking?.booking_type === 'travel-fund') {
          const fundId = data.booking.booking_data?.fundId;
          const amount = data.booking.total_amount;
          
          if (fundId && amount) {
            await travelFundClient.addFunds(fundId, amount);
          }
        }

        setBookingData(data);
      } catch (err) {
        setError('An error occurred while processing your payment.');
      } finally {
        setLoading(false);
      }
    };

    handlePaymentSuccess();
  }, [bookingId, sessionId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-6">
            <p className="text-destructive">{error}</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isTravelFund = bookingData?.booking?.booking_type === 'travel-fund';

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-2xl">
            {isTravelFund ? 'Funds Added Successfully!' : 'Booking Confirmed!'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isTravelFund ? (
            <div className="text-center">
              <p className="text-lg">
                ${bookingData.booking.total_amount} has been added to your travel fund
              </p>
              <p className="text-muted-foreground">
                Fund: {bookingData.booking.booking_data?.fundName}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-lg">Your booking has been confirmed!</p>
              <p>Booking Reference: {bookingData?.booking?.booking_reference}</p>
            </div>
          )}
          
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={() => navigate(isTravelFund ? '/travel-fund' : '/dashboard')}
              className="flex-1"
            >
              {isTravelFund ? 'View Travel Funds' : 'View Bookings'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/')}>
              Return Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingSuccessPage;