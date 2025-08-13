import { useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Shield, Calendar, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import ActivityGuestForm, { ActivityGuestFormData } from "@/features/booking/components/ActivityGuestForm";

const ActivityCheckout = () => {
  const [guestValid, setGuestValid] = useState(false);
  const [guest, setGuest] = useState<ActivityGuestFormData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Extract booking details from URL params
  const bookingDetails = {
    type: searchParams.get('type') || 'activity',
    activityId: searchParams.get('activityId') || '',
    title: searchParams.get('title') || 'Activity Booking',
    date: searchParams.get('date') || '',
    time: searchParams.get('time') || '',
    participants: parseInt(searchParams.get('participants') || '1'),
    total: parseFloat(searchParams.get('total') || '0')
  };

  const goToPayment = () => {
    const paymentData = {
      ...Object.fromEntries(searchParams),
      booking_type: 'activity',
      activity_id: bookingDetails.activityId,
      guest_data: JSON.stringify(guest),
    };

    const currentSearch = new URLSearchParams(paymentData).toString();
    navigate(`/booking/payment?${currentSearch}`);
  };

  const handleContinue = useCallback(() => {
    if (isLoading) return;
    
    console.log('Continue button clicked for activity', {
      guestValid,
      guest: !!guest,
      bookingDetails
    });

    if (!guestValid) {
      toast({
        title: "Please complete participant details",
        description: "All participant information is required to continue",
        variant: "destructive",
      });
      return;
    }

    if (!guest) {
      toast({
        title: "Participant information missing", 
        description: "Please fill in the participant details",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    console.log('Activity booking - validation passed, proceeding to payment');
    goToPayment();
  }, [isLoading, guestValid, guest, bookingDetails, toast, goToPayment]);

  const isButtonDisabled = !guestValid || !guest || isLoading;

  // Memoize the form change handler to prevent infinite loops
  const handleGuestFormChange = useCallback((valid: boolean, data: ActivityGuestFormData) => {
    console.log('Guest form change:', { valid, data });
    setGuest(data);
    setGuestValid(valid);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Activity Checkout</h1>
              <p className="text-sm text-muted-foreground">Complete your activity booking</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Guest Form */}
          <div className="lg:col-span-2 space-y-6">
            <div id="guest-details">
              <ActivityGuestForm 
                onChange={handleGuestFormChange}
                participantCount={bookingDetails.participants}
              />
            </div>

            {/* Payment CTA */}
            <Card className="lg:hidden">
              <CardContent className="p-6">
                <Button 
                  onClick={handleContinue}
                  className="w-full btn-primary h-12"
                  size="lg"
                  disabled={isButtonDisabled}
                >
                  {isLoading ? "Processing..." : "Continue to Payment"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Activity Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Activity Details */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">{bookingDetails.title}</h3>
                  
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{bookingDetails.date}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{bookingDetails.time}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>Downtown Historic District</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Booking Details */}
                <div className="space-y-3">
                  <h4 className="font-medium">Booking Details</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Participants:</span>
                      <span>{bookingDetails.participants} adult{bookingDetails.participants > 1 ? 's' : ''}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Price per person:</span>
                      <span>${(bookingDetails.total / bookingDetails.participants).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${bookingDetails.total.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Taxes & fees:</span>
                    <span>$0.00</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>${bookingDetails.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Cancellation Policy */}
                <div className="bg-muted p-3 rounded-lg">
                  <h5 className="font-medium text-sm mb-1">Cancellation Policy</h5>
                  <p className="text-xs text-muted-foreground">
                    Free cancellation up to 24 hours before the activity starts. 
                    Cancellations within 24 hours are non-refundable.
                  </p>
                </div>

                {/* Continue Button */}
                <Button 
                  onClick={handleContinue}
                  className="w-full btn-primary h-12 mt-6"
                  size="lg"
                  disabled={isButtonDisabled}
                >
                  {isLoading ? "Processing..." : "Continue to Payment"}
                </Button>

                {/* Security Note */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3" />
                  <span>Your personal information is secure and encrypted</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityCheckout;