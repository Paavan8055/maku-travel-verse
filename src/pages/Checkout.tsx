import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ChevronLeft, CreditCard, Shield, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { PassengerDetailsForm, PassengerFormData } from "@/features/booking/components/PassengerDetailsForm";

const CheckoutPage = () => {
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [passengerValid, setPassengerValid] = useState(false);
  const [passenger, setPassenger] = useState<PassengerFormData | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
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
    total: 3444
  };

  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const isFlightCheckout = Boolean(params.get('flightId'));
  const flightParams = {
    flightId: params.get('flightId') || '',
    fareType: params.get('fareType') || '',
    amount: Number(params.get('amount')) || 0,
    currency: params.get('currency') || 'USD',
    carryOn: params.get('carryOn') || '',
    checked: params.get('checked') || ''
  };

  const goToPayment = () => {
    try {
      if (passengerValid && passenger) {
        sessionStorage.setItem('passengerInfo', JSON.stringify(passenger));
      }
    } catch (e) {
      // no-op
    }
    const search = typeof window !== 'undefined' ? window.location.search : '';
    if (location.pathname.startsWith('/booking/payment')) return;
    navigate(`/booking/payment${search}`);
  };
  const handlePayment = async () => {
    if (!agreeToTerms) return;
    
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      // Redirect to confirmation
      window.location.href = `/dashboard/bookings/confirmed-${Date.now()}`;
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Header */}
      <div className="pt-24 pb-6 px-6 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Extras
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Complete your <span className="hero-text">Flight Booking</span></h1>
          <p className="text-muted-foreground">
            Review your details and confirm your reservation
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Passenger Details */}
            <PassengerDetailsForm onChange={(data, valid) => { setPassenger(data); setPassengerValid(valid); }} />

            {/* Payment Method */}
            {/* Next step CTA: Payment */}
            <Card className="travel-card">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-2">Next: Payment</h2>
                <p className="text-muted-foreground mb-4">Continue to secure payment to complete your booking.</p>
                <Button onClick={goToPayment} className="btn-primary h-12" size="lg">
                  Continue to Payment
                </Button>
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
                      <h4 className="font-medium">Flight #{flightParams.flightId || "—"}</h4>
                      <p className="text-sm text-muted-foreground">
                        {flightParams.fareType ? `Fare: ${flightParams.fareType.toUpperCase()}` : "Fare: —"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Carry-on</p>
                        <p className="font-medium">{flightParams.carryOn ? flightParams.carryOn.replace(/_/g, " ") : "—"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Checked bags</p>
                        <p className="font-medium">{flightParams.checked ? flightParams.checked.replace(/_/g, " ") : "—"}</p>
                      </div>
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between font-bold text-lg pt-2">
                        <span>Total</span>
                        <span>{flightParams.currency} {flightParams.amount.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="bg-green-50 p-3 rounded-lg flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Secure Payment</p>
                        <p className="text-xs text-green-600">256-bit SSL encryption</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Hotel Details */}
                    <div>
                      <h4 className="font-medium">{bookingDetails.hotel}</h4>
                      <p className="text-sm text-muted-foreground">{bookingDetails.room}</p>
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
                        <p className="text-sm font-medium text-green-800">Secure Payment</p>
                        <p className="text-xs text-green-600">256-bit SSL encryption</p>
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handlePayment}
                  disabled={!agreeToTerms || isProcessing || !passengerValid}
                  className="w-full mt-6 btn-primary h-12"
                >
                  {isProcessing ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Confirm & Pay ${bookingDetails.total}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;