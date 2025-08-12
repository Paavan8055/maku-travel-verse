
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { PassengerDetailsForm, PassengerFormData } from "@/features/booking/components/PassengerDetailsForm";

const CheckoutPage = () => {
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

  // Updated flight params parsing to support roundtrip and cases where flightId may be empty
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const rawTripType = (params.get('tripType') || '').toLowerCase();
  const hasOutboundId = params.get('outboundId');
  const hasInboundId = params.get('inboundId');
  const hasFlightId = params.get('flightId');
  const hasAnyFare =
    params.get('fareType') || params.get('outboundFare') || params.get('inboundFare');

  // Consider this a flight checkout if we have any flight-identifying params
  const isFlightCheckout = Boolean(
    hasFlightId || rawTripType || hasOutboundId || hasInboundId || hasAnyFare
  );

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

  const goToPayment = () => {
    try {
      if (passengerValid && passenger) {
        sessionStorage.setItem('passengerInfo', JSON.stringify(passenger));
      }
    } catch (e) {
      // no-op
    }
    const search = typeof window !== 'undefined' ? window.location.search : '';
    
    navigate(`/booking/payment${search}`);
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
                    {flightParams.isRoundtrip ? (
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium">Outbound {flightParams.outbound.id ? `#${flightParams.outbound.id}` : ""}</h4>
                          <p className="text-sm text-muted-foreground">
                            {flightParams.outbound.fareType
                              ? `Fare: ${flightParams.outbound.fareType.toUpperCase()}`
                              : "Fare: —"}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium">Inbound {flightParams.inbound.id ? `#${flightParams.inbound.id}` : ""}</h4>
                          <p className="text-sm text-muted-foreground">
                            {flightParams.inbound.fareType
                              ? `Fare: ${flightParams.inbound.fareType.toUpperCase()}`
                              : "Fare: —"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-medium">Flight {flightParams.flightId ? `#${flightParams.flightId}` : ""}</h4>
                        <p className="text-sm text-muted-foreground">
                          {flightParams.fareType
                            ? `Fare: ${flightParams.fareType.toUpperCase()}`
                            : "Fare: —"}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Carry-on</p>
                        <p className="font-medium">
                          {flightParams.carryOn ? flightParams.carryOn.replace(/_/g, " ") : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Checked bags</p>
                        <p className="font-medium">
                          {flightParams.checked ? flightParams.checked.replace(/_/g, " ") : "—"}
                        </p>
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
                  onClick={goToPayment}
                  className="w-full mt-6 btn-primary h-12"
                >
                  Continue to Payment
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
