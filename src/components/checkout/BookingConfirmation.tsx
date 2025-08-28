import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle, Download, Mail, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logger from "@/utils/logger";

interface BookingDetails {
  id: string;
  booking_reference: string;
  status: string;
  booking_type: string;
  total_amount: number;
  currency: string;
  booking_data: any;
  created_at: string;
}

export function BookingConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const paymentIntentId = searchParams.get('payment_intent');
  const bookingId = searchParams.get('booking_id');

  useEffect(() => {
    if (!paymentIntentId || !bookingId) {
      setError('Missing booking information');
      setLoading(false);
      return;
    }

    completeBooking();
  }, [paymentIntentId, bookingId]);

  const completeBooking = async () => {
    try {
      setLoading(true);
      logger.info('Starting booking completion process', { paymentIntentId, bookingId });

      // Call booking completion workflow
      const { data: completionResult, error: completionError } = await supabase.functions.invoke(
        'booking-completion-workflow',
        {
          body: {
            bookingId,
            paymentIntentId,
            correlationId: `confirmation-${Date.now()}`
          }
        }
      );

      if (completionError) {
        throw new Error(completionError.message);
      }

      if (!completionResult.success) {
        throw new Error(completionResult.error || 'Booking completion failed');
      }

      // Fetch final booking details
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (bookingError || !booking) {
        throw new Error('Failed to retrieve booking details');
      }

      setBookingDetails(booking);
      
      toast({
        title: "Booking Confirmed!",
        description: "Your booking has been successfully confirmed. Confirmation details have been sent to your email.",
        duration: 5000,
      });

      logger.info('Booking completion successful', { 
        bookingId, 
        confirmationNumber: completionResult.confirmationNumber 
      });

    } catch (error) {
      logger.error('Booking completion failed', { error, paymentIntentId, bookingId });
      setError(error.message || 'Failed to complete booking');
      
      toast({
        title: "Booking Error",
        description: "There was an issue completing your booking. Our team has been notified and will contact you shortly.",
        variant: "destructive",
        duration: 8000,
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadVoucher = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-booking-voucher', {
        body: { bookingId }
      });

      if (error) throw error;

      // Create and download PDF
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `booking-${bookingDetails?.booking_reference}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download Started",
        description: "Your booking voucher is being downloaded.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Unable to download voucher. Please contact support.",
        variant: "destructive",
      });
    }
  };

  const resendConfirmation = async () => {
    try {
      const { error } = await supabase.functions.invoke('send-booking-confirmation', {
        body: { bookingId }
      });

      if (error) throw error;

      toast({
        title: "Email Sent",
        description: "Confirmation email has been resent to your email address.",
      });
    } catch (error) {
      toast({
        title: "Email Failed",
        description: "Unable to send confirmation email. Please contact support.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Processing Your Booking</h2>
            <p className="text-muted-foreground">Please wait while we confirm your booking with our partners...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-destructive/5 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-destructive">Booking Error</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="space-y-2">
              <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                Return to Home
              </Button>
              <p className="text-sm text-muted-foreground">
                If payment was processed, our support team will contact you within 24 hours.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!bookingDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Booking Not Found</h2>
            <p className="text-muted-foreground mb-4">Unable to retrieve booking details.</p>
            <Button onClick={() => navigate('/')} className="w-full">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency || 'AUD'
    }).format(amount);
  };

  const getBookingTypeIcon = (type: string) => {
    switch (type) {
      case 'flight': return '✈️';
      case 'hotel': return '🏨';
      case 'activity': return '🎯';
      default: return '📋';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Success Header */}
        <Card className="mb-8 border-success/20 bg-success/5">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-success mb-2">Booking Confirmed!</h1>
            <p className="text-xl text-muted-foreground mb-4">
              Confirmation Number: <span className="font-mono font-semibold text-foreground">{bookingDetails.booking_reference}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Your booking has been successfully confirmed with our travel partners.
              Confirmation details have been sent to your email.
            </p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Booking Summary */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                {getBookingTypeIcon(bookingDetails.booking_type)} Booking Summary
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground">Booking Type</span>
                  <span className="font-medium capitalize">{bookingDetails.booking_type}</span>
                </div>
                
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium text-success capitalize">{bookingDetails.status}</span>
                </div>
                
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-semibold text-lg">
                    {formatAmount(bookingDetails.total_amount, bookingDetails.currency)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground">Booking Date</span>
                  <span className="font-medium">
                    {new Date(bookingDetails.created_at).toLocaleDateString('en-AU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                {/* Provider Confirmation Details */}
                {bookingDetails.booking_data?.providerConfirmation && (
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Provider Details</h3>
                    <div className="text-sm space-y-1">
                      <div>Provider: {bookingDetails.booking_data.providerConfirmation.provider}</div>
                      {bookingDetails.booking_data.providerConfirmation.confirmationNumber && (
                        <div>Provider Reference: {bookingDetails.booking_data.providerConfirmation.confirmationNumber}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              
              <div className="space-y-3">
                <Button onClick={downloadVoucher} className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Voucher/Ticket
                </Button>
                
                <Button onClick={resendConfirmation} className="w-full" variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Resend Confirmation Email
                </Button>
                
                <Button 
                  onClick={() => navigate('/bookings')} 
                  className="w-full"
                  variant="outline"
                >
                  View All Bookings
                </Button>
                
                <Button onClick={() => navigate('/')} className="w-full">
                  Book Another Trip
                </Button>
              </div>

              {/* Support Contact */}
              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Need Help?
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Our support team is here to help with any questions about your booking.
                </p>
                <div className="text-sm space-y-1">
                  <div>📞 +61 2 8000 8000</div>
                  <div>✉️ support@maku.travel</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Available 24/7 for urgent travel assistance
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Important Information */}
        <Card className="mt-6 border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3 text-amber-800 dark:text-amber-200">Important Information</h3>
            <div className="text-sm text-amber-700 dark:text-amber-300 space-y-2">
              <p>• Please check your email for detailed booking information and any required documentation.</p>
              <p>• For international travel, ensure your passport is valid for at least 6 months from your travel date.</p>
              <p>• Check-in online when available to save time at the airport or hotel.</p>
              <p>• Keep your booking reference handy when contacting support or checking in.</p>
              {bookingDetails.booking_type === 'flight' && (
                <p>• Arrive at the airport at least 2 hours early for domestic flights, 3 hours for international.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}