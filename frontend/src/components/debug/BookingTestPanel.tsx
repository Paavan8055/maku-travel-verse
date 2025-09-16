import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, Users, CreditCard } from 'lucide-react';

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
          <Button 
            onClick={onTestHotelBooking}
            className="w-full"
            variant="outline"
          >
            Test Complete Hotel Booking Flow
          </Button>
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
          <Button 
            onClick={onTestFlightBooking}
            className="w-full"
            variant="outline"
          >
            Test Complete Flight Booking Flow
          </Button>
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
          <Button 
            onClick={onTestActivityBooking}
            className="w-full"
            variant="outline"
          >
            Test Complete Activity Booking Flow
          </Button>
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