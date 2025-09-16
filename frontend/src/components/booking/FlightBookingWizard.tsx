import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookingProgress } from './BookingProgress';
import { PassengerDetailsForm } from './PassengerDetailsForm';
import { AncillaryServices } from './AncillaryServices';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/use-currency';
import { useBookingPayment } from '@/features/booking/hooks/useBookingPayment';
import { 
  Calendar, 
  Clock, 
  Users, 
  Plane, 
  MapPin,
  CreditCard,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';

interface FlightData {
  outbound: any;
  inbound?: any;
  tripType: string;
  totalAmount: number;
  currency: string;
  passengerCount: number;
}

interface PassengerData {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'M' | 'F' | 'X';
  title: 'Mr' | 'Mrs' | 'Ms' | 'Miss' | 'Dr';
  passportNumber: string;
  passportExpiry: Date;
  nationality: string;
  seatPreference?: 'aisle' | 'window' | 'middle' | 'none';
  mealPreference?: 'standard' | 'vegetarian' | 'vegan' | 'kosher' | 'halal' | 'gluten-free' | 'none';
  frequentFlyerNumber?: string;
  knownTravelerNumber?: string;
}

interface SelectedService {
  serviceId: string;
  passengerIndex?: number;
  optionId?: string;
  quantity: number;
}

const steps = ['Review', 'Passengers', 'Services', 'Payment', 'Confirmation'];

export const FlightBookingWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [flightData, setFlightData] = useState<FlightData | null>(null);
  const [passengers, setPassengers] = useState<PassengerData[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [isVerifyingPrice, setIsVerifyingPrice] = useState(false);
  const [priceVerified, setPriceVerified] = useState(false);
  const [priceChanged, setPriceChanged] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const { createBookingPayment, isLoading: isPaymentLoading } = useBookingPayment();

  useEffect(() => {
    // Load flight data from session storage
    const storedFlightData = sessionStorage.getItem('selectedFlightOffer');
    if (storedFlightData) {
      try {
        const parsed = JSON.parse(storedFlightData);
        setFlightData(parsed);
      } catch (error) {
        console.error('Error parsing flight data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load flight information. Please start over.',
          variant: 'destructive',
        });
        navigate('/search/flights');
      }
    } else {
      toast({
        title: 'No flight selected',
        description: 'Please select a flight first.',
        variant: 'destructive',
      });
      navigate('/search/flights');
    }
  }, [navigate, toast]);

  useEffect(() => {
    if (flightData && currentStep === 1 && !priceVerified) {
      verifyPrice();
    }
  }, [flightData, currentStep, priceVerified]);

  const verifyPrice = async () => {
    if (!flightData) return;
    
    setIsVerifyingPrice(true);
    try {
      // Call price verification API
      const response = await fetch('/api/verify-flight-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flightOfferId: flightData.outbound.id,
          originalPrice: flightData.totalAmount
        })
      });

      const result = await response.json();
      
      if (result.priceChanged) {
        setPriceChanged(true);
        setFlightData(prev => prev ? { ...prev, totalAmount: result.newPrice } : null);
        toast({
          title: 'Price Updated',
          description: `The flight price has changed to ${formatPrice(result.newPrice, flightData.currency)}`,
          variant: 'default',
        });
      }
      
      setPriceVerified(true);
    } catch (error) {
      console.error('Price verification failed:', error);
      toast({
        title: 'Price Verification Failed',
        description: 'Unable to verify current prices. Prices may have changed.',
        variant: 'destructive',
      });
    } finally {
      setIsVerifyingPrice(false);
    }
  };

  const calculateTotalAmount = () => {
    if (!flightData) return 0;
    
    const basePrice = flightData.totalAmount;
    const servicesTotal = selectedServices.reduce((total, service) => {
      // This would need to be calculated based on actual service prices
      return total + (service.quantity * 50); // Placeholder calculation
    }, 0);
    
    return basePrice + servicesTotal;
  };

  const handlePassengerSubmit = (passengerData: PassengerData[]) => {
    setPassengers(passengerData);
    setCurrentStep(3);
  };

  const handleServicesChange = (services: SelectedService[]) => {
    setSelectedServices(services);
  };

  const handlePayment = async () => {
    if (!flightData) return;

    try {
      const bookingData = {
        flightData,
        passengers,
        selectedServices,
        totalAmount: calculateTotalAmount()
      };

      const result = await createBookingPayment({
        bookingType: 'flight',
        bookingData,
        amount: calculateTotalAmount(),
        currency: flightData.currency,
        customerInfo: {
          email: passengers[0]?.firstName ? `${passengers[0].firstName.toLowerCase()}@example.com` : 'guest@example.com',
          firstName: passengers[0]?.firstName || 'Guest',
          lastName: passengers[0]?.lastName || 'User'
        },
        paymentMethod: 'card'
      });

      if (result.success && result.payment?.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = result.payment.checkoutUrl;
      } else {
        throw new Error(result.error || 'Payment setup failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Error',
        description: 'Failed to process payment. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const renderFlightSummary = () => {
    if (!flightData) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5" />
            Flight Summary
            {priceChanged && (
              <Badge variant="secondary">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Price Updated
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Outbound Flight */}
          <div className="space-y-2">
            <h4 className="font-semibold">Outbound Flight</h4>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="font-medium">{flightData.outbound.departure?.iataCode}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(flightData.outbound.departure?.at), 'HH:mm')}
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-full border-t border-dashed" />
                  <Plane className="w-4 h-4 mx-2 text-muted-foreground" />
                  <div className="w-full border-t border-dashed" />
                </div>
                <div className="text-center">
                  <div className="font-medium">{flightData.outbound.arrival?.iataCode}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(flightData.outbound.arrival?.at), 'HH:mm')}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Duration</div>
                <div className="font-medium">{flightData.outbound.duration}</div>
              </div>
            </div>
          </div>

          {/* Inbound Flight */}
          {flightData.inbound && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold">Return Flight</h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="font-medium">{flightData.inbound.departure?.iataCode}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(flightData.inbound.departure?.at), 'HH:mm')}
                      </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <div className="w-full border-t border-dashed" />
                      <Plane className="w-4 h-4 mx-2 text-muted-foreground" />
                      <div className="w-full border-t border-dashed" />
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{flightData.inbound.arrival?.iataCode}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(flightData.inbound.arrival?.at), 'HH:mm')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Duration</div>
                    <div className="font-medium">{flightData.inbound.duration}</div>
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />
          
          {/* Booking Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>{flightData.passengerCount} Passenger{flightData.passengerCount > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{flightData.tripType === 'roundtrip' ? 'Round Trip' : 'One Way'}</span>
            </div>
          </div>

          <Separator />

          {/* Price Summary */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Flight Total:</span>
              <span className="font-medium">
                {formatPrice(flightData.totalAmount, flightData.currency)}
              </span>
            </div>
            {selectedServices.length > 0 && (
              <div className="flex justify-between">
                <span>Add-ons:</span>
                <span className="font-medium">
                  {formatPrice(calculateTotalAmount() - flightData.totalAmount, flightData.currency)}
                </span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total Amount:</span>
              <span>{formatPrice(calculateTotalAmount(), flightData.currency)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderStepContent = () => {
    if (!flightData) return null;

    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Review Your Flight</h2>
              <p className="text-muted-foreground">
                Please review your flight details before proceeding.
              </p>
            </div>
            
            {renderFlightSummary()}
            
            {isVerifyingPrice && (
              <Card>
                <CardContent className="py-6">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                    <span>Verifying current prices...</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => navigate('/search/flights')}>
                Back to Search
              </Button>
              <Button 
                onClick={() => setCurrentStep(2)} 
                disabled={isVerifyingPrice || !priceVerified}
              >
                Continue to Passenger Details
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <PassengerDetailsForm
            passengerCount={flightData.passengerCount}
            onSubmit={handlePassengerSubmit}
            onBack={() => setCurrentStep(1)}
            initialData={passengers}
          />
        );

      case 3:
        return (
          <AncillaryServices
            passengerCount={flightData.passengerCount}
            onSelectionChange={handleServicesChange}
            onContinue={() => setCurrentStep(4)}
            onBack={() => setCurrentStep(2)}
            initialSelection={selectedServices}
          />
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Payment</h2>
              <p className="text-muted-foreground">
                Complete your booking by processing payment.
              </p>
            </div>

            {renderFlightSummary()}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  You will be redirected to our secure payment processor to complete your booking.
                </p>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(3)}>
                    Back
                  </Button>
                  <Button 
                    onClick={handlePayment}
                    disabled={isPaymentLoading}
                    className="min-w-[120px]"
                  >
                    {isPaymentLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Processing...
                      </div>
                    ) : (
                      'Pay Now'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  if (!flightData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <BookingProgress currentStep={currentStep} steps={steps} />
      {renderStepContent()}
    </div>
  );
};