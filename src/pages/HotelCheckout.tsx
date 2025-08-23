import { useState, useCallback, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { ChevronLeft, Shield, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navbar from "@/components/Navbar";
import HotelGuestForm, { HotelGuestFormData } from "@/features/booking/components/HotelGuestForm";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logger from "@/utils/logger";

// Dynamic Stripe loading
let stripePromise: Promise<Stripe | null> | null = null;

const getStripe = async () => {
  if (!stripePromise) {
    stripePromise = (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-stripe-publishable-key');
        
        if (error || !data?.publishable_key) {
          logger.error('Failed to get Stripe publishable key:', error);
          throw new Error('Failed to load payment system');
        }
        
        console.log('✅ Loading Stripe with key:', data.publishable_key.substring(0, 20) + '...');
        const stripeInstance = await loadStripe(data.publishable_key);
        console.log('✅ Stripe loaded successfully:', !!stripeInstance);
        return stripeInstance;
      } catch (error) {
        logger.error('Stripe initialization error:', error);
        return null;
      }
    })();
  }
  return stripePromise;
};

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
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

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
      if (!hotelId || !offerId || !checkIn || !checkOut) {
        console.log('❌ Missing required parameters:', { hotelId, offerId, checkIn, checkOut });
        setPaymentError('Missing booking parameters. Please return to hotel search.');
        setIsInitializing(false);
        return;
      }

      try {
        setPaymentError(null);
        console.log('🔍 Creating hotel booking with parameters:', { 
          hotelId, offerId, checkIn, checkOut, adults, children, rooms, addons, bedPref, note 
        });

        // First check if we can get Stripe key
        console.log('🔍 Testing Stripe publishable key...');
        const { data: stripeData, error: stripeError } = await supabase.functions.invoke('get-stripe-publishable-key');
        
        if (stripeError) {
          console.log('❌ Stripe key retrieval failed:', stripeError);
          setPaymentError('Payment system configuration error. Please contact support.');
          setIsInitializing(false);
          return;
        }
        
        if (!stripeData?.publishable_key) {
          console.log('❌ No publishable key returned:', stripeData);
          setPaymentError('Payment system not configured. Please contact support.');
          setIsInitializing(false);
          return;
        }
        
        console.log('✅ Stripe key retrieved successfully');

        // Get pricing from sessionStorage
        const offerData = JSON.parse(sessionStorage.getItem('selectedOffer') || '{}');
        const addOnsData = JSON.parse(sessionStorage.getItem('selectedAddOns') || '[]');
        
        // Calculate nights for add-ons pricing
        const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
        
        // Calculate total amount with proper add-ons pricing
        const baseAmount = parseFloat(offerData?.price?.total || '299.99');
        const addOnsAmount = addOnsData.reduce((total: number, addon: any) => {
          const addonPrice = addon.perNight ? addon.price * nights : addon.price;
          return total + addonPrice;
        }, 0);
        const totalAmount = baseAmount + addOnsAmount;
        
        console.log('💰 Pricing breakdown:', {
          baseAmount,
          addOnsAmount,
          totalAmount,
          currency: offerData?.price?.currency || 'USD'
        });

        // Create payment intent for hotel booking
        const { data, error } = await supabase.functions.invoke("create-booking-payment", {
          body: { 
            booking_type: 'hotel',
            amount: totalAmount,
            currency: offerData?.price?.currency || 'USD',
            metadata: {
              hotelId, 
              offerId, 
              checkIn, 
              checkOut, 
              adults, 
              children, 
              rooms, 
              addons,
              bedPref,
              note,
              baseAmount,
              addOnsAmount,
              selectedAddOns: addOnsData
            }
          }
        });

        console.log('📋 Booking creation response:', { data, error });

        if (error) {
          logger.error('Booking creation error:', error);
          if (error.message?.includes('STRIPE_SECRET_KEY')) {
            setPaymentError('Payment system configuration error. Our technical team has been notified. Please try again in a few minutes or contact support.');
          } else if (error.message?.includes('Authentication')) {
            setPaymentError('Session expired. Please refresh the page and try again.');
          } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
            setPaymentError('Network connectivity issue. Please check your internet connection and try again.');
          } else if (error.message?.includes('rate limit')) {
            setPaymentError('Too many requests. Please wait a moment before trying again.');
          } else {
            setPaymentError(`Booking preparation failed: ${error.message || error}. Please refresh the page or try a different payment method.`);
          }
          throw error;
        }

        if (data?.success && data.clientSecret) {
          console.log('✅ Booking created successfully with client secret');
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
          const errorMsg = data?.error || 'Failed to create booking - no client secret received';
          console.log('❌ Booking creation failed:', data);
          setPaymentError(errorMsg);
          throw new Error(errorMsg);
        }
      } catch (err: any) {
        logger.error('Error creating booking:', err);
        const errorMessage = err.message || 'Failed to prepare booking';
        setPaymentError(errorMessage);
        toast({
          title: "Booking error",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        setIsInitializing(false);
      }
    };

    createBooking();
  }, [hotelId, offerId, checkIn, checkOut, adults, children, rooms, addons, bedPref, note, toast]);

  // Calculate display values
  const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
  const totalGuests = adults + children;
  
  // Get pricing breakdown from sessionStorage
  const offerData = JSON.parse(sessionStorage.getItem('selectedOffer') || '{}');
  const addOnsData = JSON.parse(sessionStorage.getItem('selectedAddOns') || '[]');
  
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
          return_url: `${window.location.origin}/payment-success?booking_id=${bookingData?.booking_id}&type=hotel`,
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

  const isButtonDisabled = !guestValid || !guest || isLoading || !clientSecret || !!paymentError;

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
                {paymentError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {paymentError}
                    </AlertDescription>
                  </Alert>
                ) : clientSecret ? (
                  <PaymentElement />
                ) : isInitializing ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Preparing payment...</p>
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Payment system not ready. Please refresh the page.
                    </AlertDescription>
                  </Alert>
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
                  
                  {/* Add-ons Display */}
                  {addOnsData.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Selected Add-ons</h4>
                      {addOnsData.map((addon: any) => (
                        <div key={addon.id} className="flex justify-between text-sm">
                          <span>{addon.name} {addon.perNight ? `(${nights} nights)` : ''}</span>
                          <span>{offerData?.price?.currency || 'USD'} {(addon.price * (addon.perNight ? nights : 1)).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Price Display */}
                  {bookingData && (
                    <div className="border-t pt-4 space-y-2">
                      {offerData?.price?.total && (
                        <div className="flex justify-between">
                          <span>Room Rate ({nights} nights)</span>
                          <span>{offerData.price.currency} {parseFloat(offerData.price.total).toFixed(2)}</span>
                        </div>
                      )}
                      {addOnsData.length > 0 && (
                        <div className="flex justify-between">
                          <span>Add-ons</span>
                          <span>{offerData?.price?.currency || bookingData.currency} {addOnsData.reduce((total: number, addon: any) => total + (addon.price * (addon.perNight ? nights : 1)), 0).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
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
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);

  useEffect(() => {
    const initializeStripe = async () => {
      try {
        const stripeInstance = await getStripe();
        if (stripeInstance) {
          setStripe(stripeInstance);
          console.log('✅ Stripe initialized successfully');
        } else {
          setStripeError('Failed to initialize payment system');
        }
      } catch (error) {
        console.error('Stripe initialization error:', error);
        setStripeError('Failed to load payment system');
      }
    };

    initializeStripe();
  }, []);

  const options = useMemo(() => ({ 
    appearance: { theme: 'stripe' as const } 
  }), []);

  if (stripeError) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 px-6">
          <div className="max-w-2xl mx-auto">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {stripeError}. Please refresh the page or contact support.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  if (!stripe) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading payment system...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <Elements stripe={stripe} options={options}>
      <CheckoutInner />
    </Elements>
  );
}
