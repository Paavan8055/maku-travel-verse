import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, Users, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BookingTestPanelProps {
  onTestHotelBooking?: () => void;
  onTestFlightBooking?: () => void;
  onTestActivityBooking?: () => void;
}

export const BookingTestPanel: React.FC<BookingTestPanelProps> = ({
  onTestHotelBooking,
  onTestFlightBooking,
  onTestActivityBooking
}) => {
  const [testing, setTesting] = useState(false);

  const testBookingFlow = async (bookingType: 'flight' | 'hotel' | 'activity', useRealProvider = false) => {
    setTesting(true);
    try {
      toast.info(`Testing ${bookingType} booking flow...`);
      
      const { data, error } = await supabase.functions.invoke('test-booking-flow', {
        body: { bookingType, useRealProvider }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`✅ ${bookingType} booking test passed!`, {
          description: `Confirmation: ${data.result?.confirmationCode || 'N/A'}`
        });
        console.log('Test result:', data);
      } else {
        toast.error(`❌ ${bookingType} booking test failed`, {
          description: data.error || 'Unknown error'
        });
      }
    } catch (error) {
      console.error('Booking test error:', error);
      toast.error(`❌ ${bookingType} booking test failed`, {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          End-to-End Booking Test Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Hotel Booking Test */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Hotel Booking Flow</h3>
            <Badge variant="secondary">Test Mode</Badge>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>Test Location: Sydney, Australia</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Test Dates: Check-in Tomorrow, Check-out +2 days</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Test Guests: 2 Adults, 1 Room</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => testBookingFlow('hotel', false)}
              className="flex-1"
              variant="outline"
              disabled={testing}
            >
              Test Demo Flow
            </Button>
            <Button 
              onClick={() => testBookingFlow('hotel', true)}
              className="flex-1"
              variant="outline"
              disabled={testing}
            >
              Test Real Provider
            </Button>
          </div>
        </div>

        <Separator />

        {/* Flight Booking Test */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Flight Booking Flow</h3>
            <Badge variant="secondary">Test Mode</Badge>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>Test Route: SYD → MEL (Sydney to Melbourne)</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Test Date: Tomorrow</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Test Passengers: 1 Adult</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => testBookingFlow('flight', false)}
              className="flex-1"
              variant="outline"
              disabled={testing}
            >
              Test Demo Flow
            </Button>
            <Button 
              onClick={() => testBookingFlow('flight', true)}
              className="flex-1"
              variant="outline"
              disabled={testing}
            >
              Test Real Provider
            </Button>
          </div>
        </div>

        <Separator />

        {/* Activity Booking Test */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Activity Booking Flow</h3>
            <Badge variant="secondary">Test Mode</Badge>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>Test Location: Sydney, Australia</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Test Date: Tomorrow</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Test Participants: 2 Adults</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => testBookingFlow('activity', false)}
              className="flex-1"
              variant="outline"
              disabled={testing}
            >
              Test Demo Flow
            </Button>
            <Button 
              onClick={() => testBookingFlow('activity', true)}
              className="flex-1"
              variant="outline"
              disabled={testing}
            >
              Test Real Provider
            </Button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Test Flow Includes:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Provider rotation and API integration</li>
            <li>• Search results and selection</li>
            <li>• Booking form completion</li>
            <li>• Stripe test payment processing</li>
            <li>• Booking confirmation and database storage</li>
            <li>• Email confirmation (test mode)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};