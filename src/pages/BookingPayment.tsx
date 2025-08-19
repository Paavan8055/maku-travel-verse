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
    if (stripe && elements) {
      const confirmFunction = async () => {
        if (!stripe || !elements) throw new Error('Stripe not ready');
        
        const result = await stripe.confirmPayment({ 
          elements, 
          redirect: 'if_required',
          confirmParams: {
            return_url: window.location.origin + '/booking/confirmation'
          }
        });
        
        if ((result as any).error) {
          throw new Error((result as any).error.message || 'Payment failed');
        }
        return result;
      };
      
      setConfirm(() => confirmFunction);
      setIsReady(true);
    } else {
      setConfirm(null);
      setIsReady(false);
    }

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
          paymentMethodOrder: ['card'],
          fields: {
            billingDetails: 'never'
          }
        }} 
        onReady={() => setIsReady(true)}
      />
      {!isReady && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading payment form...
        </div>
      )}
    </div>
  );
};

const BookingPaymentPage = () => {
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const { toast } = useToast();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectError, setRedirectError] = useState<string | null>(null);
  const [isTestMode, setIsTestMode] = useState(false);

  useEffect(() => {
    document.title = "Payment | Maku Travel";
  }, []);

  // Check test mode only
  useEffect(() => {
    const checkTestMode = async () => {
      try {
        const { data } = await supabase.functions.invoke('get-stripe-publishable-key');
        setIsTestMode(data?.isTestMode || false);
      } catch (e) {
        console.error('Test mode check error', e);
      }
    };
    checkTestMode();
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
  
  // Parse hotel data and pricing from URL params
  const hotelParam = params.get('hotel');
  const priceParam = params.get('price');
  const currencyParam = params.get('currency') || 'USD';
  const hotelNameParam = params.get('hotelName');
  
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

  // Build booking details for hotel flow - use actual price from URL
  const actualPrice = priceParam ? parseFloat(priceParam) : null;
  const baseNightly = actualPrice || hotelData?.pricePerNight || Number(selection?.nightlyPrice || 450);
  const basePrice = actualPrice || (baseNightly * nights);
  const extrasPrice = (Number(selection?.extraBeds || 0) * 25) + (selection?.rollaway ? 30 : 0) + (selection?.sofaBed ? 40 : 0);
  const fundContribution = 0; // Fund contribution removed
  
  const bookingDetails = {
    hotel: hotelNameParam || hotelData?.name || selection?.hotelName || "Unknown Hotel",
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
    total: actualPrice || (basePrice + extrasPrice),
    currency: currencyParam
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

  // Simplified checkout flow - direct Stripe redirect only
  const handleStripeCheckout = async () => {
    setIsRedirecting(true);
    setRedirectError(null);

    try {
      let passenger: any = null;
      let guest: any = null;
      let activityGuest: any = null;
      
      try {
        passenger = JSON.parse(sessionStorage.getItem('passengerInfo') || 'null');
        guest = JSON.parse(sessionStorage.getItem('guestInfo') || 'null');
        activityGuest = JSON.parse(params.get('guest_data') || 'null');
      } catch {}

      const person = passenger || guest || activityGuest;
      
      // Redirect to appropriate checkout page if guest data is missing
      if (!person) {
        if (isFlightCheckout) {
          window.location.href = `/flight-checkout${window.location.search}`;
          return;
        } else if (isActivityBooking) {
          window.location.href = `/activity-checkout${window.location.search}`;
          return;
        } else {
          window.location.href = `/hotel-checkout${window.location.search}`;
          return;
        }
      }

      const customerInfo = {
        email: person?.email || 'guest@example.com',
        firstName: person?.firstName || 'GUEST',
        lastName: person?.lastName || 'USER',
        phone: person?.phone,
      };

      const bookingAmount = isFlightCheckout ? flightParams.amount : 
                           isActivityBooking ? activityDetails.total : 
                           bookingDetails.total;
      
      const bookingCurrency = isFlightCheckout ? flightParams.currency : 
                             isActivityBooking ? 'USD' : 
                             bookingDetails.currency;
      
      const currentBookingType = isFlightCheckout ? 'flight' : isActivityBooking ? 'activity' : 'hotel';
      const currentBookingData = isFlightCheckout ? { 
        flight: {
          ...flightParams,
          isRoundtrip: flightParams.isRoundtrip
        },
        passengers: passenger ? [passenger] : null
      } : 
      isActivityBooking ? { 
        activity: activityDetails,
        participants: activityGuest ? [activityGuest] : activityDetails.participants
      } :
      { 
        hotel: bookingDetails,
        guests: guest ? [guest] : null
      };

      const { data, error } = await supabase.functions.invoke('create-booking-payment', {
        body: {
          bookingType: currentBookingType,
          bookingData: currentBookingData,
          amount: bookingAmount,
          currency: bookingCurrency,
          customerInfo,
          paymentMethod: 'card'
        },
      });

      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Failed to create payment');
      }

      if (data.payment?.checkoutUrl) {
        // Direct redirect to Stripe Checkout
        window.location.href = data.payment.checkoutUrl;
      } else {
        throw new Error('No checkout URL received from payment service');
      }
      
    } catch (e: any) {
      const message = e?.message || 'Payment setup failed';
      setRedirectError(message);
      toast({ title: 'Payment Error', description: message, variant: 'destructive' });
    } finally {
      setIsRedirecting(false);
    }
  };

  const handleCheckout = async () => {
    if (!agreeToTerms) {
      toast({ title: 'Terms required', description: 'Please agree to the terms and conditions', variant: 'destructive' });
      return;
    }

    await handleStripeCheckout();
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
            {/* Guest Information Status */}
            {(() => {
              let person: any = null;
              try {
                person = JSON.parse(sessionStorage.getItem(
                  isFlightCheckout ? 'passengerInfo' : 
                  isActivityBooking ? 'activityGuestInfo' : 
                  'guestInfo'
                ) || 'null');
              } catch {}
              
              if (!person) {
                return (
                  <Card className="travel-card border-orange-200 bg-orange-50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <Shield className="h-4 w-4 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-orange-800">Guest Information Required</h3>
                            <p className="text-sm text-orange-600">
                              Please complete your {isFlightCheckout ? 'passenger' : isActivityBooking ? 'participant' : 'guest'} details first.
                            </p>
                          </div>
                        </div>
                        <Button 
                          onClick={() => {
                            const redirectUrl = isFlightCheckout ? `/flight-checkout${window.location.search}` :
                                              isActivityBooking ? `/activity-checkout${window.location.search}` :
                                              `/hotel-checkout${window.location.search}`;
                            window.location.href = redirectUrl;
                          }}
                          className="btn-primary"
                          size="sm"
                        >
                          Complete Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              }
              
              return (
                <Card className="travel-card border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          {person.firstName} {person.lastName} ({person.email})
                        </p>
                        <p className="text-xs text-green-600">Guest details confirmed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {/* Payment Method */}
            <Card className="travel-card">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Payment Method</h2>

                <div className="space-y-4">
                  {isRedirecting ? (
                    <div className="p-8 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                      <h3 className="text-lg font-medium mb-2">Redirecting to payment...</h3>
                      <p className="text-muted-foreground">
                        You will be taken to Stripe's secure checkout page to complete your payment.
                      </p>
                    </div>
                  ) : redirectError ? (
                    <div className="p-6 border rounded-lg bg-destructive/10 border-destructive/20">
                      <h3 className="font-medium text-destructive mb-2">Payment Error</h3>
                      <p className="text-sm text-destructive mb-4">{redirectError}</p>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setRedirectError(null);
                          handleStripeCheckout();
                        }}
                      >
                        Try Again
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 border rounded-lg bg-green-50 border-green-200">
                        <Shield className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="font-medium text-green-900">Secure Stripe Checkout</div>
                          <div className="text-sm text-green-700">
                            Your payment will be processed securely by Stripe
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <p>• SSL encrypted and PCI compliant</p>
                        <p>• Your card details are never stored on our servers</p>
                        <p>• Accepted: Visa, Mastercard, American Express</p>
                      </div>
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
                  disabled={!agreeToTerms || isRedirecting}
                  className="w-full mt-6 btn-primary h-12"
                >
                  {isRedirecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirecting to Payment...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Pay ${isFlightCheckout ? flightParams.amount.toFixed(2) : bookingDetails.total} {bookingDetails.currency || 'USD'}
                    </>
                  )}
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
