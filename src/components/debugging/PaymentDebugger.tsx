import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function PaymentDebugger() {
  const [isTestingStripe, setIsTestingStripe] = useState(false);
  const [isTestingBooking, setIsTestingBooking] = useState(false);
  const [stripeResult, setStripeResult] = useState<any>(null);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const { toast } = useToast();

  const testStripeKey = async () => {
    setIsTestingStripe(true);
    try {
      console.log('🔍 Testing Stripe publishable key retrieval...');
      const { data, error } = await supabase.functions.invoke('get-stripe-publishable-key');
      
      console.log('Stripe key test result:', { data, error });
      setStripeResult({ data, error, timestamp: new Date().toISOString() });
      
      if (error) {
        toast({
          title: "Stripe Key Test Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Stripe Key Test Success",
          description: "Publishable key retrieved successfully"
        });
      }
    } catch (err) {
      console.error('Stripe key test error:', err);
      setStripeResult({ error: err, timestamp: new Date().toISOString() });
    } finally {
      setIsTestingStripe(false);
    }
  };

  const testBookingCreation = async () => {
    setIsTestingBooking(true);
    try {
      console.log('🔍 Testing hotel booking creation...');
      const testData = {
        hotelId: 'TEST_HOTEL',
        offerId: 'TEST_OFFER',
        checkIn: '2024-02-01',
        checkOut: '2024-02-03',
        adults: 2,
        children: 0,
        rooms: 1,
        addons: [],
        bedPref: 'king',
        note: 'Test booking for debugging'
      };
      
      const { data, error } = await supabase.functions.invoke('create-hotel-booking', {
        body: testData
      });
      
      console.log('Booking test result:', { data, error });
      setBookingResult({ data, error, testData, timestamp: new Date().toISOString() });
      
      if (error) {
        toast({
          title: "Booking Test Failed",
          description: error.message,
          variant: "destructive"
        });
      } else if (data?.success) {
        toast({
          title: "Booking Test Success",
          description: "Test booking created successfully"
        });
      } else {
        toast({
          title: "Booking Test Issue",
          description: data?.error || "Unknown error",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Booking test error:', err);
      setBookingResult({ error: err, timestamp: new Date().toISOString() });
    } finally {
      setIsTestingBooking(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment System Debugger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={testStripeKey} 
              disabled={isTestingStripe}
              variant="outline"
            >
              {isTestingStripe ? 'Testing...' : 'Test Stripe Key'}
            </Button>
            
            <Button 
              onClick={testBookingCreation} 
              disabled={isTestingBooking}
              variant="outline"
            >
              {isTestingBooking ? 'Testing...' : 'Test Booking Creation'}
            </Button>
          </div>
          
          {stripeResult && (
            <div className="border rounded p-4 bg-muted/50">
              <h4 className="font-semibold mb-2">Stripe Key Test Result:</h4>
              <pre className="text-xs overflow-auto bg-background p-2 rounded">
                {JSON.stringify(stripeResult, null, 2)}
              </pre>
            </div>
          )}
          
          {bookingResult && (
            <div className="border rounded p-4 bg-muted/50">
              <h4 className="font-semibold mb-2">Booking Test Result:</h4>
              <pre className="text-xs overflow-auto bg-background p-2 rounded">
                {JSON.stringify(bookingResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}