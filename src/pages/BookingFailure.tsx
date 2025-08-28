import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, RefreshCw, Home, Phone } from 'lucide-react';

export default function BookingFailure() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const errorCode = searchParams.get('error_code');
  const errorMessage = searchParams.get('error_message');
  const bookingId = searchParams.get('booking_id');

  const getErrorDetails = () => {
    switch (errorCode) {
      case 'payment_failed':
        return {
          title: 'Payment Failed',
          description: 'Your payment could not be processed. Please check your payment details and try again.',
          suggestion: 'Verify your card details and ensure you have sufficient funds.'
        };
      case 'booking_unavailable':
        return {
          title: 'Booking Unavailable',
          description: 'The selected option is no longer available. Prices and availability change frequently.',
          suggestion: 'Please search again for current availability and pricing.'
        };
      case 'session_expired':
        return {
          title: 'Session Expired',
          description: 'Your booking session has expired for security reasons.',
          suggestion: 'Please start a new search and complete your booking within the time limit.'
        };
      default:
        return {
          title: 'Booking Failed',
          description: errorMessage || 'An unexpected error occurred while processing your booking.',
          suggestion: 'Please try again or contact our support team for assistance.'
        };
    }
  };

  const errorDetails = getErrorDetails();

  const retryBooking = () => {
    if (bookingId) {
      // Navigate back to the booking page with the same parameters
      navigate(`/booking-review?booking_id=${bookingId}`);
    } else {
      // Go back to search
      navigate('/');
    }
  };

  const contactSupport = () => {
    // Open support chat or navigate to contact page
    window.open('mailto:support@maku.travel?subject=Booking Issue&body=Booking ID: ' + (bookingId || 'N/A') + '%0AError Code: ' + (errorCode || 'N/A'));
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto py-8">
        <Card className="mb-8">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <XCircle className="h-16 w-16 text-destructive" />
            </div>
            <CardTitle className="text-2xl text-destructive">{errorDetails.title}</CardTitle>
            <p className="text-muted-foreground">
              {errorDetails.description}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {bookingId && (
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Reference</h3>
                <p className="text-sm font-mono text-muted-foreground">
                  {bookingId}
                </p>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">What to do next</h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {errorDetails.suggestion}
              </p>
            </div>

            <div className="space-y-3 pt-6 border-t">
              <Button 
                className="w-full"
                onClick={retryBooking}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={contactSupport}
              >
                <Phone className="mr-2 h-4 w-4" />
                Contact Support
              </Button>

              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => navigate('/')}
              >
                <Home className="mr-2 h-4 w-4" />
                Start New Search
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">Frequently Asked Questions</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium">Why did my payment fail?</p>
                <p className="text-muted-foreground">
                  Payment failures can occur due to insufficient funds, incorrect card details, 
                  bank restrictions, or security checks. Please verify your information and try again.
                </p>
              </div>
              
              <div>
                <p className="font-medium">Will I be charged if the booking failed?</p>
                <p className="text-muted-foreground">
                  No charges are made for failed bookings. Any authorization holds will be 
                  automatically released by your bank within 1-3 business days.
                </p>
              </div>
              
              <div>
                <p className="font-medium">How can I get help?</p>
                <p className="text-muted-foreground">
                  Our support team is available 24/7 to assist you. Contact us via email, 
                  phone, or live chat for immediate assistance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}