import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { fetchUserPreferences, saveUserPreferences, fetchPassportInfo, fetchPaymentMethods } from "@/lib/bookingDataClient";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, CreditCard, CheckCircle, Zap, Users } from "lucide-react";
import logger from "@/utils/logger";

interface BookingFormData {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  roomType?: string;
  preferences?: any;
}

interface OneClickBookingProps {
  bookingData: BookingFormData;
  onBookingComplete?: (bookingId: string) => void;
}

export default function OneClickBooking({ bookingData, onBookingComplete }: OneClickBookingProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [canOneClick, setCanOneClick] = useState(false);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [passportInfo, setPassportInfo] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [prefilledData, setPrefilledData] = useState<BookingFormData>({
    destination: "",
    checkIn: "",
    checkOut: "",
    guests: 1
  });

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  useEffect(() => {
    // Merge booking data with prefilled data
    setPrefilledData(prev => ({
      ...prev,
      ...bookingData
    }));
  }, [bookingData]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      const [preferences, passport, payments] = await Promise.all([
        fetchUserPreferences(user.id),
        fetchPassportInfo(user.id),
        fetchPaymentMethods(user.id)
      ]);

      setUserPreferences(preferences);
      setPassportInfo(passport);
      setPaymentMethods(payments);

      // Check if one-click booking is possible
      const hasVerifiedPassport = passport?.verified === true;
      const hasPaymentMethod = payments && payments.length > 0;
      setCanOneClick(hasVerifiedPassport && hasPaymentMethod);

    } catch (error) {
      logger.error('Error loading user data:', error);
    }
  };

  const handleOneClickBook = async () => {
    if (!user || !canOneClick) return;

    setLoading(true);
    
    try {
      // Step 1: Create hotel booking with real supplier API
      const bookingPayload = {
        hotelId: sessionStorage.getItem('selectedHotelId') || 'HOTEL001',
        offerId: sessionStorage.getItem('selectedOfferId') || `offer_${Date.now()}`,
        checkIn: prefilledData.checkIn,
        checkOut: prefilledData.checkOut,
        adults: prefilledData.guests,
        children: 0,
        rooms: 1,
        addons: [],
        bedPref: userPreferences?.bed_preference || 'any',
        note: userPreferences?.special_requests || ''
      };

      logger.info('Starting one-click hotel booking:', bookingPayload);

      // Create hotel booking with real price confirmation and payment
      const { data: bookingResult, error: bookingError } = await supabase.functions.invoke('create-hotel-booking', {
        body: bookingPayload
      });

      if (bookingError || !bookingResult?.success) {
        throw new Error(bookingResult?.error || 'Hotel booking failed');
      }

  // Step 2: Complete booking with supplier after payment intent created
      if (bookingResult.clientSecret) {
        // In production, this would redirect to Stripe checkout
        // For now, we'll simulate successful payment and immediate booking confirmation
        const { data: verifyResult, error: verifyError } = await supabase.functions.invoke('verify-payment-and-complete-booking', {
          body: {
            booking_id: bookingResult.booking_id,
            payment_intent_id: bookingResult.clientSecret.split('_secret_')[0]
          }
        });

        if (verifyError || !verifyResult?.success) {
          logger.error('Payment verification failed:', verifyError);
          throw new Error('Payment processing failed. Please try again or contact support.');
        }

        toast({
          title: "Booking confirmed! 🎉",
          description: `Hotel booking confirmed. Reference: ${verifyResult.confirmation_number}`,
        });

        onBookingComplete?.(bookingResult.booking_id);
      } else {
        throw new Error('Payment setup failed');
      }

    } catch (error) {
      logger.error('One-click booking error:', error);
      toast({
        title: "Booking failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegularBooking = () => {
    // Navigate to the hotel checkout flow instead of showing a toast
    const params = new URLSearchParams({
      destination: prefilledData.destination,
      checkIn: prefilledData.checkIn,
      checkOut: prefilledData.checkOut,
      guests: prefilledData.guests.toString(),
      hotelId: sessionStorage.getItem('selectedHotelId') || '',
      hotelName: sessionStorage.getItem('selectedHotelName') || prefilledData.destination
    });
    
    window.location.href = `/hotel-checkout?${params.toString()}`;
  };

  if (!user) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please sign in to continue with booking.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Complete Your Booking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Booking Summary */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Booking Summary
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Destination:</span>
              <p className="font-medium">{prefilledData.destination || "Not selected"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Dates:</span>
              <p className="font-medium">
                {prefilledData.checkIn && prefilledData.checkOut 
                  ? `${prefilledData.checkIn} - ${prefilledData.checkOut}`
                  : "Not selected"
                }
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Guests:</span>
              <p className="font-medium flex items-center gap-1">
                <Users className="h-3 w-3" />
                {prefilledData.guests}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Room Type:</span>
              <p className="font-medium capitalize">
                {userPreferences?.room_type || "Standard"}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Setup Form for missing data */}
        {(!prefilledData.destination || !prefilledData.checkIn || !prefilledData.checkOut) && (
          <div className="space-y-4">
            <h3 className="font-semibold">Complete Your Trip Details</h3>
            
            <div className="space-y-3">
              <Input
                placeholder="Where are you going?"
                value={prefilledData.destination}
                onChange={(e) => setPrefilledData(prev => ({ ...prev, destination: e.target.value }))}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground">Check-in</label>
                <Input
                  type="date"
                  value={prefilledData.checkIn}
                  onChange={(e) => setPrefilledData(prev => ({ ...prev, checkIn: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Check-out</label>
                <Input
                  type="date"
                  value={prefilledData.checkOut}
                  onChange={(e) => setPrefilledData(prev => ({ ...prev, checkOut: e.target.value }))}
                />
              </div>
            </div>

            <Select
              value={prefilledData.guests.toString()}
              onValueChange={(value) => setPrefilledData(prev => ({ ...prev, guests: parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1,2,3,4,5,6].map(num => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} Guest{num > 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Readiness Status */}
        <div className="space-y-3">
          <h3 className="font-semibold">Booking Readiness</h3>
          
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {passportInfo?.verified ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-muted" />
              )}
              <span className="text-sm">
                Passport verified
                {!passportInfo?.verified && (
                  <Badge variant="outline" className="ml-2">Setup needed</Badge>
                )}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              {paymentMethods.length > 0 ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-muted" />
              )}
              <span className="text-sm">
                Payment method saved
                {paymentMethods.length === 0 && (
                  <Badge variant="outline" className="ml-2">Setup needed</Badge>
                )}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              {userPreferences ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-muted" />
              )}
              <span className="text-sm">
                Preferences set
                {!userPreferences && (
                  <Badge variant="outline" className="ml-2">Optional</Badge>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Booking Actions */}
        <div className="space-y-3">
          {canOneClick && prefilledData.destination && prefilledData.checkIn && prefilledData.checkOut ? (
            <Button
              onClick={handleOneClickBook}
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold"
              size="lg"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  One-Click Book Now
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleRegularBooking}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Continue with Full Booking
            </Button>
          )}
          
          {canOneClick && (
            <p className="text-xs text-center text-muted-foreground">
              ⚡ One-click booking enabled with verified passport and saved payment method
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}