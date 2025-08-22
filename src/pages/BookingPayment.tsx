import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { ChevronLeft, Shield, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LoadingState } from "@/components/ui/enhanced-loading";
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

function PaymentInner() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState<any>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Extract parameters
  const bookingType = searchParams.get("booking_type") || searchParams.get("tripType") || "hotel";
  const amount = parseFloat(searchParams.get("amount") || "0");
  const currency = searchParams.get("currency") || "AUD";

  // Create payment intent based on booking type
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        setPaymentError(null);
        console.log('🔍 Creating payment intent for:', { bookingType, amount, currency });

        let createBookingFunction = '';
        let bookingParams: any = {};

        // For payment flow, we need to get customer details from session storage
        let customerInfo = null;
        try {
          const guestInfo = sessionStorage.getItem('guestInfo');
          const passengerInfo = sessionStorage.getItem('passengerInfo');
          customerInfo = guestInfo ? JSON.parse(guestInfo) : (passengerInfo ? JSON.parse(passengerInfo) : null);
        } catch (e) {
          console.warn('Failed to parse customer info from session storage');
        }

        // Determine which booking function to call based on booking type
        if (bookingType === 'hotel') {
          createBookingFunction = 'create-hotel-booking';
          bookingParams = {
            hotelId: searchParams.get("hotelId"),
            offerId: searchParams.get("offerId"),
            checkIn: searchParams.get("checkIn"),
            checkOut: searchParams.get("checkOut"),
            adults: parseInt(searchParams.get("adults") || "2"),
            children: parseInt(searchParams.get("children") || "0"),
            rooms: parseInt(searchParams.get("rooms") || "1"),
            addons: (searchParams.get("addons") || "").split(",").filter(Boolean),
            bedPref: searchParams.get("bedPref") || "",
            note: searchParams.get("note") || "",
            customerInfo: customerInfo
          };
        } else if (bookingType === 'flight' || bookingType === 'roundtrip' || bookingType === 'oneway') {
          // For flights, create a generic payment intent with all flight data
          createBookingFunction = 'create-payment-intent';
          
          // Get passenger details from session storage
          let passengerInfo = null;
          try {
            const storedPassenger = sessionStorage.getItem('passengerInfo');
            passengerInfo = storedPassenger ? JSON.parse(storedPassenger) : null;
          } catch (e) {
            console.warn('Failed to parse passenger info from session storage');
          }
          
          bookingParams = {
            booking_type: 'flight',
            amount: amount,
            currency: currency,
            booking_data: {
              flight: {
                tripType: bookingType,
                flightId: searchParams.get("flightId"),
                outboundId: searchParams.get("outboundId"),
                inboundId: searchParams.get("inboundId"),
                outboundOfferId: searchParams.get("outboundOfferId"),
                inboundOfferId: searchParams.get("inboundOfferId"),
                fareType: searchParams.get("fareType"),
                passengers: Number(searchParams.get("passengers")) || 1,
                carryOn: searchParams.get("carryOn"),
                checked: searchParams.get("checked"),
                segments: searchParams.get("segments")
              },
              customerInfo: customerInfo
            }
          };
        } else if (bookingType === 'activity') {
          createBookingFunction = 'create-activity-booking';
          bookingParams = {
            activityId: searchParams.get("activity_id"),
            amount: amount,
            currency: currency
          };
        } else {
          // Generic payment intent for other booking types
          createBookingFunction = 'create-payment-intent';
          bookingParams = {
            booking_type: bookingType,
            amount: amount,
            currency: currency
          };
        }

        console.log('📋 Creating booking with function:', createBookingFunction, bookingParams);

        const { data, error } = await supabase.functions.invoke(createBookingFunction, {
          body: bookingParams
        });

        console.log('📋 Booking creation response:', { data, error });

        if (error) {
          logger.error('Booking creation error:', error);
          if (error.message?.includes('STRIPE_SECRET_KEY')) {
            setPaymentError('Payment system not configured on server. Please contact support.');
          } else if (error.message?.includes('Authentication')) {
            setPaymentError('Authentication error. Please try refreshing the page.');
          } else {
            setPaymentError(`Failed to prepare booking: ${error.message || error}`);
          }
          throw error;
        }

        if (data?.success && data.clientSecret) {
          console.log('✅ Payment intent created successfully');
          setClientSecret(data.clientSecret);
          setBookingData({
            booking_id: data.booking_id,
            total_amount: data.total_amount || amount,
            currency: data.currency || currency,
            amount_cents: data.amount_cents
          });
          toast({
            title: "Payment ready",
            description: "Complete your payment to confirm the booking"
          });
        } else {
          const errorMsg = data?.error || 'Failed to create payment intent';
          console.log('❌ Payment intent creation failed:', data);
          setPaymentError(errorMsg);
          throw new Error(errorMsg);
        }
      } catch (err: any) {
        logger.error('Error creating payment intent:', err);
        const errorMessage = err.message || 'Failed to prepare payment';
        setPaymentError(errorMessage);
        toast({
          title: "Payment error",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        setIsInitializing(false);
      }
    };

    createPaymentIntent();
  }, [bookingType, amount, currency, searchParams, toast]);

  const handlePayment = async () => {
    if (!stripe || !elements || !clientSecret) return;
    
    setIsLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success?booking_id=${bookingData?.booking_id}&type=${bookingType}`,
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

  const isButtonDisabled = isLoading || !clientSecret || !!paymentError;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Header */}
      <div className="pt-24 pb-6 px-6 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Complete your <span className="hero-text">Payment</span></h1>
          <p className="text-muted-foreground">
            Secure payment processing for your {bookingType} booking
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
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
                  <LoadingState 
                    type="payment" 
                    title="Preparing payment..."
                    description="Setting up secure payment for your booking"
                    className="py-8"
                  />
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Payment system not ready. Please refresh the page.
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={handlePayment} 
                  className="btn-primary h-12 w-full" 
                  size="lg"
                  disabled={isButtonDisabled}
                >
                  {isLoading ? "Processing Payment..." : "Pay Now"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Payment Summary */}
          <div>
            <Card className="travel-card sticky top-24">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">Payment Summary</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="capitalize">{bookingType} Booking</span>
                    <span className="font-medium">
                      {currency} {(bookingData?.total_amount || amount).toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total Amount</span>
                      <span className="text-xl font-bold text-foreground">
                        {currency} {(bookingData?.total_amount || amount).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">includes taxes and fees</p>
                  </div>
                </div>
                
                {/* Security Badge */}
                <div className="bg-green-50 p-3 rounded-lg flex items-center space-x-2 mt-6">
                  <Shield className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Secure Payment</p>
                    <p className="text-xs text-green-600">256-bit SSL encryption</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingPayment() {
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
          <div className="max-w-2xl mx-auto">
            <LoadingState 
              type="payment"
              title="Loading payment system..."
              description="Initializing secure payment processing"
            />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <Elements stripe={stripe} options={options}>
      <PaymentInner />
    </Elements>
  );
}