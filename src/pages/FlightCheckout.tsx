import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { PassengerDetailsForm, PassengerFormData } from "@/features/booking/components/PassengerDetailsForm";
import { FlightBookingSummary } from "@/features/booking/components/FlightBookingSummary";
import { useToast } from "@/hooks/use-toast";

const FlightCheckout = () => {
  const [passengerValid, setPassengerValid] = useState(false);
  const [passenger, setPassenger] = useState<PassengerFormData | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Parse flight params from URL
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const rawTripType = (params.get('tripType') || '').toLowerCase();
  const hasOutboundId = params.get('outboundId');
  const hasInboundId = params.get('inboundId');
  const hasFlightId = params.get('flightId');
  const hasSegments = params.get('segments');

  // Detect if we're on the return leg step
  const legParam = (params.get('leg') || params.get('phase') || params.get('step') || '').toLowerCase();
  const isReturnLeg = ['return', 'inbound'].includes(legParam) || Boolean(params.get('inboundId') || params.get('inboundFare'));

  // Parse multi-city segments if available
  const parseSegments = () => {
    try {
      return hasSegments ? JSON.parse(decodeURIComponent(hasSegments)) : [];
    } catch {
      return [];
    }
  };

  const flightParams = {
    tripType: rawTripType || (hasOutboundId && hasInboundId ? 'roundtrip' : hasSegments ? 'multicity' : 'oneway'),
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
    // Multi-city segments
    segments: parseSegments(),
    amount: Number(params.get('amount')) || 0,
    currency: params.get('currency') || 'USD',
    carryOn: params.get('carryOn') || '',
    checked: params.get('checked') || ''
  };

  const passengers = Number(params.get('passengers') || '1');

  const goToPayment = () => {
    console.log('goToPayment called for flight booking', { passenger });
    
    try {
      if (passenger) {
        sessionStorage.setItem('passengerInfo', JSON.stringify(passenger));
        console.log('Saved passenger info to session storage');
      }
    } catch (e) {
      console.error('Session storage error:', e);
    }
    
    const search = typeof window !== 'undefined' ? window.location.search : '';
    console.log('Navigating to payment with search:', search);
    
    navigate(`/booking/payment${search}`);
  };

  const handleContinue = () => {
    console.log('Continue button clicked for flight', {
      passengerValid,
      passenger: !!passenger
    });

    if (!passenger || !passengerValid) {
      console.log('Flight validation failed - missing passenger data');
      
      toast({
        title: 'Complete passenger details',
        description: 'Please fill all required fields before continuing.',
        variant: "destructive",
      });
      
      const anchor = document.getElementById("passenger-details");
      if (anchor && typeof anchor.scrollIntoView === "function") {
        anchor.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }
    
    console.log('Flight validation passed, proceeding to payment');
    goToPayment();
  };

  const isButtonDisabled = !passengerValid || !passenger;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Header */}
      <div className="pt-24 pb-6 px-6 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Search
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Complete your <span className="hero-text">Flight Booking</span></h1>
          <p className="text-muted-foreground">
            Enter passenger details and confirm your reservation
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Passenger Form */}
          <div className="lg:col-span-2 space-y-6">
            <div id="passenger-details">
              <PassengerDetailsForm onChange={(data, valid) => { 
                console.log('Passenger form change:', { data, valid });
                setPassenger(data); 
                setPassengerValid(valid); 
              }} />
            </div>

            {/* Payment CTA */}
            <Card className="travel-card">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-2">Next: Payment</h2>
                <p className="text-muted-foreground mb-4">Continue to secure payment to complete your booking.</p>
                <Button 
                  onClick={handleContinue} 
                  className="btn-primary h-12" 
                  size="lg"
                  disabled={isButtonDisabled}
                >
                  Continue to Payment
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Flight Booking Summary */}
          <div>
            <Card className="travel-card sticky top-24">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">Flight Booking Summary</h3>
                <FlightBookingSummary
                  tripType={flightParams.tripType}
                  isRoundtrip={flightParams.isRoundtrip}
                  outbound={flightParams.outbound}
                  inbound={flightParams.inbound}
                  segments={flightParams.segments}
                  amount={flightParams.amount}
                  currency={flightParams.currency}
                  carryOn={flightParams.carryOn}
                  checked={flightParams.checked}
                  passengers={passengers}
                  currentLeg={isReturnLeg ? 'inbound' : 'outbound'}
                />

                <Button 
                  onClick={handleContinue}
                  className="w-full mt-6 btn-primary h-12"
                  disabled={isButtonDisabled}
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

export default FlightCheckout;