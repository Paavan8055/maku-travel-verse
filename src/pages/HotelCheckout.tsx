import { useState, useCallback, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { ChevronLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import HotelGuestForm, { HotelGuestFormData } from "@/features/booking/components/HotelGuestForm";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logger from "@/utils/logger";

// Load Stripe
const stripePromise = loadStripe('pk_test_51QXYwPILlBrPBZqYWJSr9jbQ2zLMlVHwBb7LQI8c7QJ8x9eLqShZ8N2C8p4lJaW1qZQrNxGO2YI9QwV3O8cM2YrM00lV2XFO6W');

function CheckoutInner() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const [guestValid, setGuestValid] = useState(false);
  const [guest, setGuest] = useState<HotelGuestFormData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState<any>(null);

  // Extract parameters
  const hotelId = searchParams.get("hotelId")!;
  const offerId = searchParams.get("offerId")!;
  const checkIn = searchParams.get("checkIn")!;
  const checkOut = searchParams.get("checkOut")!;
  const adults = parseInt(searchParams.get("adults") || "2");
  const children = parseInt(searchParams.get("children") || "0");
  const rooms = parseInt(searchParams.get("rooms") || "1");
  const addons = (searchParams.get("addons") || "").split(",").filter(Boolean);
  const bedPref = searchParams.get("bedPref") || "";
  const note = searchParams.get("note") || "";
  // Create booking and payment intent
  useEffect(() => {
    const createBooking = async () => {
      if (!hotelId || !offerId || !checkIn || !checkOut) return;

      try {
        console.log('Creating hotel booking:', { hotelId, offerId, checkIn, checkOut, adults, children, rooms, addons });

        const { data, error } = await supabase.functions.invoke("create-hotel-booking", {
          body: { 
            hotelId, 
            offerId, 
            checkIn, 
            checkOut, 
            adults, 
            children, 
            rooms, 
            addons,
            bedPref,
            note
          }
        });

        if (error) {
          logger.error('Booking creation error:', error);
          throw error;
        }

        if (data?.success) {
          setClientSecret(data.clientSecret);
          setBookingData({
            booking_id: data.booking_id,
            total_amount: data.total_amount,
            currency: data.currency,
            amount_cents: data.amount_cents
          });
          toast({
            title: "Booking prepared",
            description: "Ready for payment"
          });
        } else {
          throw new Error(data?.error || 'Failed to create booking');
        }
      } catch (err: any) {
        logger.error('Error creating booking:', err);
        toast({
          title: "Booking error",
          description: err.message || 'Failed to prepare booking',
          variant: "destructive"
        });
      }
    };

    createBooking();
  }, [hotelId, offerId, checkIn, checkOut, adults, children, rooms, addons, bedPref, note, toast]);

  // Calculate display values
  const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
  const totalGuests = adults + children;
  
  const checkInDate = new Date(checkIn).toLocaleDateString('en-US', { 
    month: 'short', day: 'numeric', year: 'numeric' 
  });
  const checkOutDate = new Date(checkOut).toLocaleDateString('en-US', { 
    month: 'short', day: 'numeric', year: 'numeric' 
  });

  const handlePayment = async () => {
    if (!stripe || !elements || !clientSecret) return;
    
    setIsLoading(true);

    try {
      // Save guest info
      if (guest) {
        sessionStorage.setItem('guestInfo', JSON.stringify(guest));
      }

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success?booking_id=${bookingData?.booking_id}`,
        },
      });

      if (error) {
        logger.error('Payment error:', error);
        toast({
          title: "Payment failed",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (err) {
      logger.error('Payment processing error:', err);
      toast({
        title: "Payment error", 
        description: "Failed to process payment",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = useCallback(() => {
    if (isLoading || !stripe || !elements) return;
    
    if (!guest || !guestValid) {
      toast({
        title: 'Complete guest details',
        description: 'Please fill all required fields before continuing.',
        variant: "destructive",
      });
      
      const anchor = document.getElementById("guest-details");
      if (anchor && typeof anchor.scrollIntoView === "function") {
        anchor.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }
    
    handlePayment();
  }, [isLoading, guestValid, guest, stripe, elements, handlePayment, toast]);

  const isButtonDisabled = !guestValid || !guest || isLoading || !clientSecret;

  // Memoize the form change handler to prevent infinite loops
  const handleGuestFormChange = useCallback((data: HotelGuestFormData, valid: boolean) => {
    setGuest(data);
    setGuestValid(valid);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Header */}
      <div className="pt-24 pb-6 px-6 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Room Selection
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Complete your <span className="hero-text">Hotel Booking</span></h1>
          <p className="text-muted-foreground">
            Enter guest details and confirm your reservation
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Guest Form */}
          <div className="lg:col-span-2 space-y-6">
            <div id="guest-details">
              <HotelGuestForm onChange={handleGuestFormChange} />
            </div>

            {/* Payment Form */}
            <Card className="travel-card">
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {clientSecret ? (
                  <PaymentElement />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Preparing payment...</p>
                  </div>
                )}
                
                {bookingData && (
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Amount:</span>
                      <span className="font-bold text-lg">
                        {bookingData.currency} {bookingData.total_amount?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleContinue} 
                  className="btn-primary h-12 w-full" 
                  size="lg"
                  disabled={isButtonDisabled}
                >
                  {isLoading ? "Processing Payment..." : "Pay Now"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div>
            <Card className="travel-card sticky top-24">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">Hotel Booking Summary</h3>
                
                <div className="space-y-4">
                  {/* Hotel Details */}
                  <div>
                    <h4 className="font-medium">Hotel Booking</h4>
                    <p className="text-sm text-muted-foreground">Offer ID: {offerId}</p>
                    {bedPref && bedPref !== 'any' && (
                      <p className="text-xs text-muted-foreground">
                        Bed preference: {bedPref}
                      </p>
                    )}
                    {note && (
                      <p className="text-xs text-muted-foreground">
                        Special requests: {note}
                      </p>
                    )}
                  </div>
                  
                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Check-in</p>
                      <p className="font-medium">{checkInDate}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Check-out</p>
                      <p className="font-medium">{checkOutDate}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Duration</p>
                      <p className="font-medium">{nights} nights</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Guests</p>
                      <p className="font-medium">{totalGuests} {totalGuests === 1 ? 'guest' : 'guests'}</p>
                    </div>
                  </div>
                  
                  {/* Price Display */}
                  {bookingData && (
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>{bookingData.currency} {bookingData.total_amount?.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Security Badge */}
                  <div className="bg-green-50 p-3 rounded-lg flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Secure Payment</p>
                      <p className="text-xs text-green-600">256-bit SSL encryption</p>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleContinue}
                  className="w-full mt-6 btn-primary h-12"
                  disabled={isButtonDisabled}
                >
                  {isLoading ? "Processing Payment..." : "Pay Now"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HotelCheckout() {
  const options = useMemo(() => ({ 
    appearance: { theme: 'stripe' as const } 
  }), []);
  
  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutInner />
    </Elements>
  );
}
