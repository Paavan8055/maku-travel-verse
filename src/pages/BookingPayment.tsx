import { useState, useEffect, useRef } from "react";
import { ChevronLeft, CreditCard, Shield, Check, Coins, BadgeDollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Navbar from "@/components/Navbar";
import { useBookingPayment } from "@/features/booking/hooks/useBookingPayment";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { supabase } from "@/integrations/supabase/client";

const StripeCardForm: React.FC<{ setConfirm: (fn: () => Promise<any>) => void }> = ({ setConfirm }) => {
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    setConfirm(async () => {
      if (!stripe || !elements) throw new Error('Stripe not ready');
      const result = await stripe.confirmPayment({ elements, redirect: 'if_required' });
      if ((result as any).error) {
        throw new Error((result as any).error.message || 'Payment failed');
      }
      return result;
    });
  }, [stripe, elements, setConfirm]);

  return <PaymentElement options={{ layout: 'tabs' }} />;
};


const BookingPaymentPage = () => {
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [paymentGateway, setPaymentGateway] = useState<"stripe" | "card" | "afterpay" | "crypto">("stripe");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const { createBookingPayment, isLoading } = useBookingPayment();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [confirmFn, setConfirmFn] = useState<null | (() => Promise<any>)>(null);


  useEffect(() => {
    document.title = "Payment | Maku Travel";
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await supabase.functions.invoke('get-stripe-publishable-key');
        if (data?.publishableKey) {
          const { loadStripe } = await import('@stripe/stripe-js');
          setStripePromise(loadStripe(data.publishableKey));
        }
      } catch (e) {
        console.error('Stripe init error', e);
      }
    };
    init();
  }, []);


  // Booking details (hotel fallback) and flight params from URL
  const bookingDetails = {
    hotel: "Ocean Breeze Resort",
    room: "Deluxe Ocean View",
    checkIn: "Mar 15, 2025",
    checkOut: "Mar 22, 2025",
    nights: 7,
    guests: 2,
    basePrice: 3150,
    extrasPrice: 244,
    fundContribution: 50,
    total: 3444,
  };

  const params = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const isFlightCheckout = Boolean(params.get("flightId"));
  const flightParams = {
    flightId: params.get("flightId") || "",
    fareType: params.get("fareType") || "",
    amount: Number(params.get("amount")) || 0,
    currency: params.get("currency") || "USD",
    carryOn: params.get("carryOn") || "",
    checked: params.get("checked") || "",
  };

  const ensurePaymentIntent = async () => {
    try {
      if (clientSecret && bookingId) return;

      let passenger: any = null;
      try {
        passenger = JSON.parse(sessionStorage.getItem('passengerInfo') || 'null');
      } catch {}

      const customerInfo = {
        email: passenger?.email || 'guest@example.com',
        firstName: passenger?.firstName || 'GUEST',
        lastName: passenger?.lastName || 'USER',
        phone: passenger?.phone,
      };

      const { data, error } = await supabase.functions.invoke('create-card-payment-intent', {
        body: {
          bookingType: isFlightCheckout ? 'flight' : 'hotel',
          bookingData: isFlightCheckout ? { flight: flightParams } : { hotel: bookingDetails },
          amount: isFlightCheckout ? flightParams.amount : bookingDetails.total,
          currency: isFlightCheckout ? flightParams.currency : 'USD',
          customerInfo,
        },
      });

      if (error || !data?.success) {
        console.error(error?.message || data?.error || 'Failed to create payment');
        return;
      }

      setClientSecret(data.payment.clientSecret);
      setBookingId(data.booking.id);
    } catch (e) {
      console.error('ensurePaymentIntent error', e);
    }
  };

  useEffect(() => {
    if ((paymentGateway === 'card' || paymentGateway === 'stripe') && !clientSecret && stripePromise) {
      ensurePaymentIntent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentGateway, stripePromise]);

  const handleCheckout = async () => {
    if (!agreeToTerms) return;

    let passenger: any = null;
    try {
      passenger = JSON.parse(sessionStorage.getItem('passengerInfo') || 'null');
    } catch {}

    const customerInfo = {
      email: passenger?.email || 'guest@example.com',
      firstName: passenger?.firstName || 'GUEST',
      lastName: passenger?.lastName || 'USER',
      phone: passenger?.phone,
    };

    // If using on-site card collection (Stripe Elements)
    if ((paymentGateway === 'card' || paymentGateway === 'stripe')) {
      try {
        if (!clientSecret || !bookingId) {
          await ensurePaymentIntent();
          return; // Let the card form mount; user can click again to confirm
        }

        if (!confirmFn) throw new Error('Card form not ready');
        const result: any = await confirmFn();
        const piId = result?.paymentIntent?.id;
        if (!piId || !bookingId) throw new Error('Missing payment intent or booking');
        // Verify and finalize booking
        await supabase.functions.invoke('verify-booking-payment', {
          body: { bookingId, paymentIntentId: piId },
        });
        window.location.href = `/booking/confirmation?booking_id=${bookingId}`;
        return;
      } catch (err) {
        console.error('Card confirmation failed', err);
        return;
      }
    }

    // Fallback to redirect-based flow
    const result = await createBookingPayment({
      bookingType: isFlightCheckout ? 'flight' : 'hotel',
      bookingData: isFlightCheckout ? { flight: flightParams } : { hotel: bookingDetails },
      amount: isFlightCheckout ? flightParams.amount : bookingDetails.total,
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
                    {/* Stripe */}
                    <div
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentGateway === 'stripe' ? 'border-primary bg-primary/5' : 'border-border'}`}
                      onClick={() => { setPaymentGateway('stripe'); setPaymentMethod('card'); }}
                    >
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-5 w-5" />
                        <span className="font-medium">Stripe</span>
                      </div>
                    </div>

                    {/* Credit/Debit Card */}
                    <div
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentGateway === 'card' ? 'border-primary bg-primary/5' : 'border-border'}`}
                      onClick={() => { setPaymentGateway('card'); setPaymentMethod('card'); }}
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
                  {(paymentMethod === "card" || paymentMethod === "split") && (
                    <div className="space-y-4 mt-6">
                      {clientSecret && stripePromise ? (
                        <Elements stripe={stripePromise} options={{ clientSecret }}>
                          <StripeCardForm setConfirm={setConfirmFn} />
                        </Elements>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Secure card form is loading...
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
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">
                        Flight #{flightParams.flightId || "—"}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {flightParams.fareType
                          ? `Fare: ${flightParams.fareType.toUpperCase()}`
                          : "Fare: —"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Carry-on</p>
                        <p className="font-medium">
                          {flightParams.carryOn
                            ? flightParams.carryOn.replace(/_/g, " ")
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Checked bags</p>
                        <p className="font-medium">
                          {flightParams.checked
                            ? flightParams.checked.replace(/_/g, " ")
                            : "—"}
                        </p>
                      </div>
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between font-bold text-lg pt-2">
                        <span>Total</span>
                        <span>
                          {flightParams.currency} {flightParams.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>

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
                ) : (
                  <div className="space-y-4">
                    {/* Hotel Details */}
                    <div>
                      <h4 className="font-medium">{bookingDetails.hotel}</h4>
                      <p className="text-sm text-muted-foreground">
                        {bookingDetails.room}
                      </p>
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
                        <p className="font-medium">{bookingDetails.guests} adults</p>
                      </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Room ({bookingDetails.nights} nights)</span>
                        <span>${bookingDetails.basePrice}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Extras & Services</span>
                        <span>${bookingDetails.extrasPrice}</span>
                      </div>
                      <div className="flex justify-between text-sm text-primary">
                        <span>Fund Contribution</span>
                        <span>+${bookingDetails.fundContribution}</span>
                      </div>
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
                  disabled={!agreeToTerms || isLoading || paymentGateway === "afterpay" || paymentGateway === "crypto" || ((paymentGateway === 'card' || paymentGateway === 'stripe') && (!confirmFn))}
                  className="w-full mt-6 btn-primary h-12"
                >
                  {isLoading ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Confirm & Pay ${isFlightCheckout ? flightParams.amount.toFixed(2) : bookingDetails.total}
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
