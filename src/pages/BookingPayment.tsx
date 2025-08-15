import { useState, useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { ChevronLeft, CreditCard, Shield, Check, Coins, BadgeDollarSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Navbar from "@/components/Navbar";
import { useBookingPayment } from "@/features/booking/hooks/useBookingPayment";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FlightBookingSummary } from "@/features/booking/components/FlightBookingSummary";
import TestModeIndicator from "@/components/TestModeIndicator";

const StripeCardForm: React.FC<{ setConfirm: Dispatch<SetStateAction<(() => Promise<any>) | null>> }> = ({ setConfirm }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    console.log('StripeCardForm effect - stripe:', !!stripe, 'elements:', !!elements);
    
    if (stripe && elements) {
      // Provide a stable function value to React state setter
      const confirmFunction = async () => {
        console.log('Confirming payment with Stripe...');
        if (!stripe || !elements) throw new Error('Stripe not ready');
        
        const result = await stripe.confirmPayment({ 
          elements, 
          redirect: 'if_required',
          confirmParams: {
            return_url: window.location.origin + '/booking/confirmation'
          }
        });
        
        console.log('Stripe confirmation result:', result);
        
        if ((result as any).error) {
          console.error('Stripe error:', (result as any).error);
          throw new Error((result as any).error.message || 'Payment failed');
        }
        return result;
      };
      
      setConfirm(() => confirmFunction);
      setIsReady(true);
      console.log('Stripe card form is ready');
    } else {
      setConfirm(null);
      setIsReady(false);
    }

    // Cleanup: unset confirm function on unmount or when deps change
    return () => {
      setConfirm(null);
      setIsReady(false);
    };
  }, [stripe, elements, setConfirm]);

  return (
    <div className="space-y-4">
      <PaymentElement 
        options={{ 
          layout: 'tabs',
          paymentMethodOrder: ['card', 'link', 'us_bank_account'],
          fields: {
            billingDetails: 'auto'
          },
          wallets: {
            applePay: 'auto',
            googlePay: 'auto'
          }
        }} 
        onReady={() => {
          console.log('PaymentElement is ready');
          setIsReady(true);
        }}
      />
      {!isReady && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading secure payment form...
        </div>
      )}
    </div>
  );
};

const BookingPaymentPage = () => {
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [paymentGateway, setPaymentGateway] = useState<"stripe" | "card" | "afterpay" | "crypto">("stripe");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const { createBookingPayment, isLoading } = useBookingPayment();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [confirmFn, setConfirmFn] = useState<null | (() => Promise<any>)>(null);
  const { toast } = useToast();
  const [isInitializingPI, setIsInitializingPI] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [isTestMode, setIsTestMode] = useState(false);

  useEffect(() => {
    document.title = "Payment | Maku Travel";
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await supabase.functions.invoke('get-stripe-publishable-key');
        if (data?.publishableKey) {
          const { loadStripe } = await import('@stripe/stripe-js');
          setIsTestMode(data.isTestMode || false);
          setStripePromise(loadStripe(data.publishableKey));
        }
      } catch (e) {
        console.error('Stripe init error', e);
      }
    };
    init();
  }, []);

  // Parse URL parameters to determine booking type and data
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  
  // Determine booking type
  const bookingType = params.get('booking_type') || params.get('type') || 'hotel';
  const isActivityBooking = bookingType === 'activity';
  
  // Extract search parameters for dates and guests (standardized to camelCase)
  const checkInParam = params.get('checkIn') || params.get('checkin');
  const checkOutParam = params.get('checkOut') || params.get('checkout');
  const roomsParam = params.get('rooms');
  const adultsParam = params.get('adults');
  const childrenParam = params.get('children');
  
  // Parse hotel data from URL params
  const hotelParam = params.get('hotel');
  let hotelData: any = null;
  if (hotelParam) {
    try {
      hotelData = JSON.parse(decodeURIComponent(hotelParam));
    } catch (error) {
      console.error('Failed to parse hotel data from URL:', error);
    }
  }

  // Parse dates and calculate nights
  let checkInDate = "Mar 15, 2025";
  let checkOutDate = "Mar 22, 2025";
  let nights = 7;
  let totalGuests = 2;
  
  if (checkInParam && checkOutParam) {
    try {
      checkInDate = new Date(checkInParam).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      checkOutDate = new Date(checkOutParam).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      
      const checkIn = new Date(checkInParam);
      const checkOut = new Date(checkOutParam);
      nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    } catch (error) {
      console.error('Failed to parse dates:', error);
    }
  }
  
  if (adultsParam) {
    totalGuests = parseInt(adultsParam) + (childrenParam ? parseInt(childrenParam) : 0);
  }

  // Get booking selections from session storage
  let selection: any = null;
  try { 
    selection = JSON.parse(sessionStorage.getItem('hotelBookingSelections') || 'null'); 
  } catch {}

  // Build booking details for hotel flow
  const baseNightly = hotelData?.pricePerNight || Number(selection?.nightlyPrice || 450);
  const basePrice = baseNightly * nights;
  const extrasPrice = (Number(selection?.extraBeds || 0) * 25) + (selection?.rollaway ? 30 : 0) + (selection?.sofaBed ? 40 : 0);
  const fundContribution = Number(selection?.fundContribution || 50);
  
  const bookingDetails = {
    hotel: hotelData?.name || selection?.hotelName || "Ocean Breeze Resort",
    room: selection?.roomName || "Deluxe Ocean View",
    bedType: selection?.bedType as string | undefined,
    extraBeds: Number(selection?.extraBeds || 0),
    rollaway: Boolean(selection?.rollaway),
    sofaBed: Boolean(selection?.sofaBed),
    checkIn: checkInDate,
    checkOut: checkOutDate,
    nights,
    guests: totalGuests,
    basePrice,
    extrasPrice,
    fundContribution,
    total: basePrice + extrasPrice + fundContribution,
  };

  // Activity booking details
  const activityDetails = {
    activityId: params.get('activityId') || '',
    title: params.get('title') || 'Activity Booking',
    date: params.get('date') || '',
    time: params.get('time') || '',
    participants: parseInt(params.get('participants') || '1'),
    total: parseFloat(params.get('total') || '0'),
    location: params.get('location') || 'Activity Location',
    duration: params.get('duration') || '2 hours',
    description: params.get('description') || 'Activity experience'
  };

  // Flight params parsing
  const rawTripType = (params.get('tripType') || '').toLowerCase();
  const hasOutboundId = params.get('outboundId');
  const hasInboundId = params.get('inboundId');
  const hasFlightId = params.get('flightId');
  const hasAnyFare = params.get('fareType') || params.get('outboundFare') || params.get('inboundFare');

  const isFlightCheckout = Boolean(
    hasFlightId || rawTripType || hasOutboundId || hasInboundId || hasAnyFare
  );

  const legParam = (params.get('leg') || params.get('phase') || params.get('step') || '').toLowerCase();
  const isReturnLeg = ['return', 'inbound'].includes(legParam) || Boolean(params.get('inboundId') || params.get('inboundFare'));

  const flightParams = {
    tripType: rawTripType || (hasOutboundId && hasInboundId ? 'roundtrip' : 'oneway'),
    isRoundtrip: rawTripType === 'roundtrip' || Boolean(hasOutboundId && hasInboundId),
    // One-way fallback values
    flightId: params.get('flightId') || '',
    fareType: params.get('fareType') || '',
    // Roundtrip-capable fields
    outbound: {
      id: params.get('outboundId') || params.get('flightId') || '',
      fareType: params.get('outboundFare') || params.get('fareType') || ''
    },
    inbound: {
      id: params.get('inboundId') || '',
      fareType: params.get('inboundFare') || ''
    },
    amount: Number(params.get('amount')) || 0,
    currency: params.get('currency') || 'USD',
    carryOn: params.get('carryOn') || '',
    checked: params.get('checked') || ''
  };

  const passengers = Number(params.get('passengers') || '1');

  console.log('Payment page booking data:', {
    isFlightCheckout,
    isActivityBooking,
    bookingDetails,
    activityDetails,
    flightParams,
    urlParams: Object.fromEntries(params.entries())
  });

  const ensurePaymentIntent = async () => {
    try {
      if (clientSecret && bookingId) {
        console.log('Payment intent already exists, skipping creation');
        return;
      }
      
      setIsInitializingPI(true);
      setInitError(null);
      console.log('Creating payment intent...');

      let passenger: any = null;
      let guest: any = null;
      let activityGuest: any = null;
      try {
        passenger = JSON.parse(sessionStorage.getItem('passengerInfo') || 'null');
        guest = JSON.parse(sessionStorage.getItem('guestInfo') || 'null');
        activityGuest = JSON.parse(params.get('guest_data') || 'null');
      } catch {}

      const person = passenger || guest || activityGuest;
      if (!person) {
        throw new Error('No customer information available. Please go back and complete the booking form.');
      }

      const customerInfo = {
        email: person?.email || 'guest@example.com',
        firstName: person?.firstName || 'GUEST',
        lastName: person?.lastName || 'USER',
        phone: person?.phone,
      };

      // Fix amount calculation - ensure we're using the correct value
      const bookingAmount = isFlightCheckout ? flightParams.amount : 
                           isActivityBooking ? activityDetails.total : 
                           bookingDetails.total;
      
      const currentBookingType = isFlightCheckout ? 'flight' : isActivityBooking ? 'activity' : 'hotel';
      const currentBookingData = isFlightCheckout ? { flight: flightParams } : 
                                 isActivityBooking ? { activity: activityDetails } :
                                 { hotel: bookingDetails };
      
      console.log('Payment intent data (before API call):', {
        bookingType: currentBookingType,
        bookingAmount,
        bookingData: currentBookingData,
        currency: isFlightCheckout ? flightParams.currency : 'USD',
        customerInfo
      });

      const { data, error } = await supabase.functions.invoke('create-card-payment-intent', {
        body: {
          bookingType: currentBookingType,
          bookingData: currentBookingData,
          amount: bookingAmount,
          currency: isFlightCheckout ? flightParams.currency : 'USD',
          customerInfo,
        },
      });

      console.log('Payment intent response:', { data, error });

      if (error || !data?.success) {
        const message = error?.message || data?.error || 'Failed to create payment';
        console.error('Payment intent error:', message);
        setInitError(message);
        toast({ title: 'Payment setup failed', description: message, variant: 'destructive' });
        return;
      }

      console.log('Payment intent created successfully:', data);
      setClientSecret(data.payment.clientSecret);
      setBookingId(data.booking.id);
      
      toast({ 
        title: 'Payment ready', 
        description: 'You can now complete your payment', 
        variant: 'default' 
      });
    } catch (e: any) {
      console.error('ensurePaymentIntent error', e);
      const message = e?.message || 'Unexpected error while preparing payment';
      setInitError(message);
      toast({ title: 'Payment setup failed', description: message, variant: 'destructive' });
    } finally {
      setIsInitializingPI(false);
    }
  };

  useEffect(() => {
    if (paymentGateway === 'stripe' && !clientSecret && stripePromise) {
      ensurePaymentIntent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentGateway, stripePromise]);

  // Reset confirm function when payment context changes
  useEffect(() => {
    setConfirmFn(null);
  }, [clientSecret, paymentGateway]);

  const handleCheckout = async () => {
    console.log('handleCheckout called');
    
    if (!agreeToTerms) {
      toast({ title: 'Terms required', description: 'Please agree to the terms and conditions', variant: 'destructive' });
      return;
    }

    let passenger: any = null;
    let guest: any = null;
    let activityGuest: any = null;
    try {
      passenger = JSON.parse(sessionStorage.getItem('passengerInfo') || 'null');
      guest = JSON.parse(sessionStorage.getItem('guestInfo') || 'null');
      activityGuest = JSON.parse(params.get('guest_data') || 'null');
    } catch {}

    const person = passenger || guest || activityGuest;
    const customerInfo = {
      email: person?.email || 'guest@example.com',
      firstName: person?.firstName || 'GUEST',
      lastName: person?.lastName || 'USER',
      phone: person?.phone,
    };

    console.log('Payment gateway:', paymentGateway, 'Customer info:', customerInfo);

    // If using Stripe Elements payment
    if (paymentGateway === 'stripe') {
      try {
        console.log('Using Stripe payment, clientSecret:', !!clientSecret, 'bookingId:', !!bookingId, 'confirmFn:', !!confirmFn);
        
        if (!clientSecret || !bookingId) {
          console.log('Missing payment intent, creating...');
          await ensurePaymentIntent();
          toast({ title: 'Payment initialized', description: 'Please click Continue to Payment again to proceed', variant: 'default' });
          return;
        }

        if (!confirmFn) {
          console.log('Card form not ready, confirmFn is null');
          toast({ title: 'Card form not ready', description: 'Please wait for the card form to load completely', variant: 'destructive' });
          return;
        }

        console.log('Confirming payment...');
        const result: any = await confirmFn();
        console.log('Payment confirmation result:', result);
        
        if (result.error) {
          throw new Error(result.error.message || 'Payment confirmation failed');
        }
        
        const piId = result?.paymentIntent?.id;
        if (!piId || result?.paymentIntent?.status !== 'succeeded') {
          throw new Error('Payment was not completed successfully');
        }
        
        console.log('Verifying payment with booking...');
        const verifyOptions: any = {
          body: { bookingId, paymentIntentId: piId },
        };
        
        const verifyResult = await supabase.functions.invoke('verify-booking-payment', verifyOptions);
        
        console.log('Verification result:', verifyResult);
        
        if (verifyResult.error || !verifyResult.data?.success) {
          throw new Error(verifyResult.error?.message || 'Payment verification failed');
        }
        
        toast({ title: 'Payment successful!', description: 'Redirecting to confirmation...', variant: 'default' });
        window.location.href = `/booking/confirmation?booking_id=${bookingId}`;
        return;
      } catch (err: any) {
        console.error('Stripe payment failed', err);
        const message = err?.message || 'Payment failed';
        toast({ title: 'Payment failed', description: message, variant: 'destructive' });
        return;
      }
    }

    // Fallback to redirect-based flow
    const currentBookingType = isFlightCheckout ? 'flight' : isActivityBooking ? 'activity' : 'hotel';
    const currentBookingData = isFlightCheckout ? { flight: flightParams } : 
                               isActivityBooking ? { activity: activityDetails } :
                               { hotel: bookingDetails };
    const currentAmount = isFlightCheckout ? flightParams.amount : 
                         isActivityBooking ? activityDetails.total : 
                         bookingDetails.total;
    
    const result = await createBookingPayment({
      bookingType: currentBookingType,
      bookingData: currentBookingData,
      amount: currentAmount,
      currency: isFlightCheckout ? flightParams.currency : 'USD',
      customerInfo,
      paymentMethod: paymentMethod as 'card' | 'fund' | 'split',
    });

    if (result.success && result.booking?.status === 'confirmed') {
      window.location.href = `/booking/confirmation?booking_id=${result.booking.id}`;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <div className="pt-24 pb-6 px-6 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="mb-4"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          <h1 className="text-3xl font-bold mb-2">
            Complete your <span className="hero-text">Payment</span>
          </h1>
          <p className="text-muted-foreground">
            Select a payment method and confirm your reservation
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-20">
        {/* Test Mode Indicator */}
        <TestModeIndicator 
          isVisible={isTestMode} 
          className="mb-6"
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Method */}
            <Card className="travel-card">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Payment Method</h2>

                <div className="space-y-4">
                  {/* Payment Options */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {/* Credit/Debit Card */}
                    <div
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentGateway === 'stripe' ? 'border-primary bg-primary/5' : 'border-border'}`}
                      onClick={() => { setPaymentGateway('stripe'); setPaymentMethod('stripe'); }}
                    >
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-5 w-5" />
                        <span className="font-medium">Credit/Debit Card</span>
                      </div>
                    </div>

                    {/* Afterpay - Coming soon */}
                    <div className="p-4 border-2 rounded-xl relative transition-all opacity-60 cursor-not-allowed border-border">
                      <div className="flex items-center space-x-3">
                        <BadgeDollarSign className="h-5 w-5" />
                        <span className="font-medium">Afterpay</span>
                      </div>
                      <span className="absolute top-2 right-2 text-xs text-muted-foreground">Coming soon</span>
                    </div>

                    {/* Crypto.com - Coming soon */}
                    <div className="p-4 border-2 rounded-xl relative transition-all opacity-60 cursor-not-allowed border-border">
                      <div className="flex items-center space-x-3">
                        <Coins className="h-5 w-5" />
                        <span className="font-medium">Crypto.com</span>
                      </div>
                      <span className="absolute top-2 right-2 text-xs text-muted-foreground">Coming soon</span>
                    </div>
                  </div>

                  {/* Card Details via Stripe Elements */}
                  {paymentGateway === "stripe" && (
                    <div className="space-y-4 mt-6">
                      {isInitializingPI ? (
                        <div className="flex items-center gap-2 text-muted-foreground p-6 bg-muted/50 rounded-lg">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Preparing secure payment form...
                        </div>
                      ) : initError ? (
                        <div className="space-y-2 p-6 bg-destructive/10 rounded-lg">
                          <p className="text-destructive font-medium">{initError}</p>
                          <Button variant="outline" size="sm" onClick={ensurePaymentIntent}>
                            Retry Payment Setup
                          </Button>
                        </div>
                      ) : clientSecret && stripePromise ? (
                        <div className="p-6 bg-muted/30 rounded-lg">
                          <Elements 
                            stripe={stripePromise} 
                            options={{ 
                              clientSecret,
                              appearance: {
                                theme: 'stripe',
                                variables: {
                                  colorPrimary: 'hsl(var(--primary))',
                                }
                              }
                            }}
                          >
                            <StripeCardForm setConfirm={setConfirmFn} />
                          </Elements>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground p-6 bg-muted/50 rounded-lg">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Initializing payment system...
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fund Balance Info */}
                  {(paymentMethod === "fund" || paymentMethod === "split") && (
                    <div className="bg-muted p-4 rounded-xl">
                      <div className="flex justify-between items-center mb-2">
                        <span>Available Fund Balance:</span>
                        <span className="font-bold text-primary">$1,250</span>
                      </div>
                      {paymentMethod === "fund" && bookingDetails.total > 1250 && (
                        <p className="text-sm text-destructive">
                          Insufficient funds. Please add more to your travel fund or
                          choose split payment.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Terms & Conditions */}
            <Card className="travel-card">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={agreeToTerms}
                    onCheckedChange={(checked) => setAgreeToTerms(checked === true)}
                  />
                  <div className="flex-1">
                    <label htmlFor="terms" className="text-sm cursor-pointer">
                      I agree to the{" "}
                      <Button variant="link" className="h-auto p-0 text-primary underline">
                        Terms & Conditions
                      </Button>{" "}
                      and{" "}
                      <Button variant="link" className="h-auto p-0 text-primary underline">
                        Privacy Policy
                      </Button>
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      By proceeding, you acknowledge that you have read and
                      understood our cancellation policy.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div>
            <Card className="travel-card sticky top-24">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">Booking Summary</h3>
                {isFlightCheckout ? (
                  <FlightBookingSummary
                    tripType={flightParams.tripType}
                    isRoundtrip={flightParams.isRoundtrip}
                    outbound={flightParams.outbound}
                    inbound={flightParams.inbound}
                    amount={flightParams.amount}
                    currency={flightParams.currency}
                    carryOn={flightParams.carryOn}
                    checked={flightParams.checked}
                    passengers={passengers}
                    currentLeg={isReturnLeg ? 'inbound' : 'outbound'}
                  />
                ) : (
                  <div className="space-y-4">
                    {/* Hotel Details */}
                    <div>
                      <h4 className="font-medium">{bookingDetails.hotel}</h4>
                      <p className="text-sm text-muted-foreground">
                        {bookingDetails.room}
                      </p>
                      {bookingDetails.bedType && (
                        <p className="text-xs text-muted-foreground">
                          Bed: {bookingDetails.bedType}
                          {bookingDetails.extraBeds ? ` + ${bookingDetails.extraBeds} extra` : ''}
                          {bookingDetails.rollaway ? ' + rollaway' : ''}
                          {bookingDetails.sofaBed ? ' + sofa bed' : ''}
                        </p>
                      )}
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Check-in</p>
                        <p className="font-medium">{bookingDetails.checkIn}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Check-out</p>
                        <p className="font-medium">{bookingDetails.checkOut}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Duration</p>
                        <p className="font-medium">{bookingDetails.nights} nights</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Guests</p>
                        <p className="font-medium">{bookingDetails.guests} {bookingDetails.guests === 1 ? 'guest' : 'guests'}</p>
                      </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Room ({bookingDetails.nights} nights)</span>
                        <span>${bookingDetails.basePrice}</span>
                      </div>
                      {bookingDetails.extrasPrice > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Extras & Services</span>
                          <span>${bookingDetails.extrasPrice}</span>
                        </div>
                      )}
                      {bookingDetails.fundContribution > 0 && (
                        <div className="flex justify-between text-sm text-primary">
                          <span>Fund Contribution</span>
                          <span>+${bookingDetails.fundContribution}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg pt-2 border-t">
                        <span>Total</span>
                        <span>${bookingDetails.total}</span>
                      </div>
                    </div>

                    {/* Security Badge */}
                    <div className="bg-green-50 p-3 rounded-lg flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          Secure Payment
                        </p>
                        <p className="text-xs text-green-600">
                          256-bit SSL encryption
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleCheckout}
                  disabled={!agreeToTerms || isLoading || paymentGateway === "afterpay" || paymentGateway === "crypto" || (paymentGateway === 'stripe' && (!confirmFn || !clientSecret))}
                  className="w-full mt-6 btn-primary h-12"
                >
                  {isLoading ? (
                    <>Processing...</>
                  ) : (paymentGateway === 'stripe' && (!confirmFn || !clientSecret) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Preparing payment...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Confirm & Pay ${isFlightCheckout ? flightParams.amount.toFixed(2) : bookingDetails.total}
                    </>
                  ))}
                </Button>
              </CardContent>
            </Card>

            <Card className="travel-card mt-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">Fare Rules</h3>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="cancellation">
                    <AccordionTrigger>Cancellation</AccordionTrigger>
                    <AccordionContent>
                      {isFlightCheckout ? (
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                          <li>{flightParams.fareType ? `${flightParams.fareType.toUpperCase()} fare` : 'Selected fare'} may be non-refundable after 24 hours from booking.</li>
                          <li>Refunds, if permitted, are processed to the original payment method.</li>
                        </ul>
                      ) : (
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                          <li>Free cancellation up to 48 hours before check-in.</li>
                          <li>Within 48 hours, one night charge may apply.</li>
                        </ul>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="changes">
                    <AccordionTrigger>Changes</AccordionTrigger>
                    <AccordionContent>
                      {isFlightCheckout ? (
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                          <li>Flight changes subject to airline rules and fare difference.</li>
                          <li>Name changes are generally not permitted.</li>
                        </ul>
                      ) : (
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                          <li>Room/date changes subject to availability and rate differences.</li>
                        </ul>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="baggage">
                    <AccordionTrigger>{isFlightCheckout ? 'Baggage' : 'Additional Policies'}</AccordionTrigger>
                    <AccordionContent>
                      {isFlightCheckout ? (
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                          <li>Carry-on: {flightParams.carryOn ? flightParams.carryOn.replace(/_/g, ' ') : 'per airline policy'}.</li>
                          <li>Checked bags: {flightParams.checked ? flightParams.checked.replace(/_/g, ' ') : 'fees may apply'}.</li>
                        </ul>
                      ) : (
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                          <li>Government ID required at check-in.</li>
                          <li>Property-specific rules may apply.</li>
                        </ul>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPaymentPage;
