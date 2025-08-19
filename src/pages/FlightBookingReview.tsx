import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronDown, ChevronUp, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { FlightBookingProgress } from "@/components/flight/FlightBookingProgress";
import { useCurrency } from "@/features/currency/CurrencyProvider";
import { useToast } from "@/hooks/use-toast";

interface FlightDetails {
  id: string;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  stops: number;
  fareType: string;
  price: number;
  date: string;
}

const FlightBookingReview = () => {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();
  const [expandedOutbound, setExpandedOutbound] = useState(false);
  const [expandedInbound, setExpandedInbound] = useState(false);
  const [outboundFlight, setOutboundFlight] = useState<FlightDetails | null>(null);
  const [inboundFlight, setInboundFlight] = useState<FlightDetails | null>(null);
  const [tripType, setTripType] = useState<string>('oneway');
  const [totalAmount, setTotalAmount] = useState<number>(0);

  useEffect(() => {
    // Get flight data from session storage or URL params
    const params = new URLSearchParams(window.location.search);
    const storedOutbound = sessionStorage.getItem('selectedOutboundFlight');
    const storedInbound = sessionStorage.getItem('selectedInboundFlight');
    const storedTripType = sessionStorage.getItem('tripType') || params.get('tripType') || 'oneway';
    
    setTripType(storedTripType);

    if (storedOutbound) {
      try {
        const outbound = JSON.parse(storedOutbound);
        setOutboundFlight(outbound);
      } catch (error) {
        console.error('Error parsing outbound flight:', error);
      }
    }

    if (storedInbound && storedTripType === 'roundtrip') {
      try {
        const inbound = JSON.parse(storedInbound);
        setInboundFlight(inbound);
      } catch (error) {
        console.error('Error parsing inbound flight:', error);
      }
    }

    // Calculate total amount
    const outboundPrice = outboundFlight?.price || 0;
    const inboundPrice = inboundFlight?.price || 0;
    setTotalAmount(outboundPrice + inboundPrice);
  }, [outboundFlight?.price, inboundFlight?.price]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStopsText = (stops: number) => {
    if (stops === 0) return "Direct";
    return `${stops} stop${stops > 1 ? 's' : ''}`;
  };

  const handleContinue = () => {
    if (!outboundFlight) {
      toast({
        title: "No flight selected",
        description: "Please go back and select a flight.",
        variant: "destructive",
      });
      return;
    }

    // Prepare query parameters for checkout
    const queryParams = new URLSearchParams();
    queryParams.set('tripType', tripType);
    
    if (tripType === 'roundtrip' && outboundFlight && inboundFlight) {
      queryParams.set('outboundId', outboundFlight.id);
      queryParams.set('outboundFare', outboundFlight.fareType);
      queryParams.set('inboundId', inboundFlight.id);
      queryParams.set('inboundFare', inboundFlight.fareType);
      queryParams.set('amount', totalAmount.toString());
    } else if (outboundFlight) {
      queryParams.set('flightId', outboundFlight.id);
      queryParams.set('fareType', outboundFlight.fareType);
      queryParams.set('amount', outboundFlight.price.toString());
    }

    queryParams.set('currency', 'AUD');
    queryParams.set('passengers', '1');

    navigate(`/flight-checkout?${queryParams.toString()}`);
  };

  const handleGoBack = () => {
    navigate('/search/flights');
  };

  const FlightDetailsCard = ({ 
    flight, 
    title, 
    expanded, 
    onToggle 
  }: { 
    flight: FlightDetails; 
    title: string; 
    expanded: boolean; 
    onToggle: () => void;
  }) => (
    <Card className="border border-border/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="text-destructive hover:text-destructive/80"
          >
            Flight details
            {expanded ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
          </Button>
        </div>

        <div className="space-y-4">
          {/* Flight Number Badges - TWO red badges like Air India */}
          <div className="flex items-center space-x-3">
            <div className="flex space-x-2">
              <Badge className="bg-red-600 text-white">
                {flight.flightNumber}
              </Badge>
              <Badge className="bg-red-600 text-white">
                {flight.flightNumber}
              </Badge>
            </div>
            <span className="font-medium">{flight.airline}</span>
          </div>

          {/* Route and Times */}
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-2xl font-bold">{flight.departureTime}</div>
              <div className="text-sm text-muted-foreground">{flight.origin}</div>
            </div>
            
            <div className="flex-1 flex flex-col items-center px-4">
              <div className="text-sm text-muted-foreground mb-1">{formatDuration(flight.duration)}</div>
              <div className="w-full border-t-2 border-dotted border-border relative">
                <Plane className="h-4 w-4 text-muted-foreground absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2 bg-background px-1 rotate-90" />
              </div>
              <div className="text-sm text-muted-foreground mt-1">{getStopsText(flight.stops)}</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{flight.arrivalTime}</div>
              <div className="text-sm text-muted-foreground">{flight.destination}</div>
            </div>
          </div>

          {/* Fare Type */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Fare Type:</span>
            <span className="font-medium capitalize">{flight.fareType}</span>
          </div>

          {expanded && (
            <div className="pt-4 border-t border-border space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Flight Date:</span>
                <span>{flight.date}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Aircraft:</span>
                <span>Boeing 737-800</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Baggage:</span>
                <span>7kg cabin + 23kg checked</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <FlightBookingProgress currentStep={2} steps={["1 FLIGHTS", "2 JOURNEY DETAILS", "3 REVIEW & PAYMENT"]} />
      
      {/* Header */}
      <div className="pt-6 pb-6 px-6 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-6xl mx-auto">
          <Button variant="ghost" size="sm" onClick={handleGoBack} className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Flight Search
          </Button>
          
          <h1 className="text-3xl font-bold">Review Your <span className="hero-text">Booking</span></h1>
          <p className="text-muted-foreground mt-2">
            Please review your flight details before proceeding to passenger information
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Flight Details */}
          <div className="lg:col-span-2 space-y-6">
            {outboundFlight && (
              <FlightDetailsCard
                flight={outboundFlight}
                title={tripType === 'roundtrip' ? 'Outbound Flight' : 'Your Flight'}
                expanded={expandedOutbound}
                onToggle={() => setExpandedOutbound(!expandedOutbound)}
              />
            )}

            {tripType === 'roundtrip' && inboundFlight && (
              <FlightDetailsCard
                flight={inboundFlight}
                title="Return Flight"
                expanded={expandedInbound}
                onToggle={() => setExpandedInbound(!expandedInbound)}
              />
            )}

            {!outboundFlight && (
              <Card className="border-dashed border-2 border-border/50">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No flight selected. Please go back and select a flight.</p>
                  <Button onClick={handleGoBack} className="mt-4">
                    Select Flight
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Fare Summary */}
          <div>
            <Card className="travel-card sticky top-24">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">Fare Summary</h3>
                
                <div className="space-y-4">
                  {outboundFlight && (
                    <div className="flex justify-between">
                      <span className="text-sm">
                        {tripType === 'roundtrip' ? 'Outbound' : 'Flight'} ({outboundFlight.fareType})
                      </span>
                      <span className="font-medium">{formatCurrency(outboundFlight.price)}</span>
                    </div>
                  )}
                  
                  {tripType === 'roundtrip' && inboundFlight && (
                    <div className="flex justify-between">
                      <span className="text-sm">Return ({inboundFlight.fareType})</span>
                      <span className="font-medium">{formatCurrency(inboundFlight.price)}</span>
                    </div>
                  )}

                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total Amount</span>
                      <span className="text-xl font-bold text-foreground">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">per person, includes taxes</p>
                  </div>
                </div>

                <Button 
                  onClick={handleContinue}
                  className="w-full mt-6 btn-primary h-12"
                  disabled={!outboundFlight}
                >
                  CONTINUE
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightBookingReview;