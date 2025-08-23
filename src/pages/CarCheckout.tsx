import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar, Clock, MapPin, Car, User } from 'lucide-react';

const getStripe = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('get-stripe-publishable-key');
    if (error) throw error;
    return await loadStripe(data.publishableKey);
  } catch (error) {
    console.error('Error loading Stripe:', error);
    return null;
  }
};

interface DriverDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  licenseNumber: string;
  licenseCountry: string;
  licenseExpiry: string;
}

const CheckoutInner: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const stripe = useStripe();
  const elements = useElements();

  const [isLoading, setIsLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [driverDetails, setDriverDetails] = useState<DriverDetails>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    licenseNumber: '',
    licenseCountry: 'AU',
    licenseExpiry: ''
  });

  // Extract booking data from URL params
  const carId = searchParams.get('carId') || '';
  const carMake = searchParams.get('carMake') || '';
  const carModel = searchParams.get('carModel') || '';
  const carCategory = searchParams.get('carCategory') || '';
  const pickupLocation = searchParams.get('pickupLocation') || '';
  const dropoffLocation = searchParams.get('dropoffLocation') || '';
  const pickupDateTime = searchParams.get('pickupDateTime') || '';
  const dropoffDateTime = searchParams.get('dropoffDateTime') || '';
  const price = parseFloat(searchParams.get('price') || '0');
  const currency = searchParams.get('currency') || 'AUD';

  useEffect(() => {
    if (!carId || !pickupDateTime || !dropoffDateTime || !price) return;

    const createBooking = async () => {
      try {
        setIsLoading(true);

        const { data, error } = await supabase.functions.invoke('create-car-booking', {
          body: {
            carOffer: {
              id: carId,
              vehicleInfo: {
                category: carCategory,
                type: 'car',
                make: carMake,
                model: carModel,
                transmission: 'Automatic',
                fuel: 'Petrol',
                airConditioning: true,
                doors: 4,
                seats: 5
              },
              rateInfo: {
                totalPrice: price,
                currency,
                dailyRate: price / 7 // Assuming weekly rate
              },
              pickupLocation: {
                code: 'SYD',
                name: pickupLocation,
                address: pickupLocation
              },
              dropoffLocation: {
                code: 'SYD',
                name: dropoffLocation,
                address: dropoffLocation
              },
              pickupDateTime,
              dropoffDateTime
            },
            driverDetails,
            customerInfo: {
              email: driverDetails.email || 'guest@example.com',
              firstName: driverDetails.firstName || 'Guest',
              lastName: driverDetails.lastName || 'User',
              phone: driverDetails.phone
            },
            amount: price,
            currency,
            paymentMethod: 'card'
          }
        });

        if (error) throw error;

        if (data.success) {
          setClientSecret(data.payment.client_secret);
        } else {
          throw new Error(data.error || 'Failed to create booking');
        }
      } catch (error) {
        console.error('Error creating booking:', error);
        toast({
          title: "Booking Error",
          description: "Failed to create car booking. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Only create booking if we have driver details
    if (driverDetails.firstName && driverDetails.lastName && driverDetails.email) {
      createBooking();
    }
  }, [carId, pickupDateTime, dropoffDateTime, price, driverDetails, carMake, carModel, carCategory, pickupLocation, dropoffLocation, currency, toast]);

  const handleDriverDetailsChange = (field: keyof DriverDetails, value: string) => {
    setDriverDetails(prev => ({ ...prev, [field]: value }));
  };

  const handlePayment = async () => {
    if (!stripe || !elements || !clientSecret) return;

    setIsLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success?type=car`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred during payment.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = driverDetails.firstName && driverDetails.lastName && 
                     driverDetails.email && driverDetails.phone && 
                     driverDetails.dateOfBirth && driverDetails.licenseNumber && 
                     driverDetails.licenseExpiry;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Booking Summary */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Car Rental Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  {carMake} {carModel}
                </h3>
                <p className="text-muted-foreground text-sm">{carCategory}</p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <div className="text-sm">
                    <div>Pickup: {pickupLocation}</div>
                    <div>Dropoff: {dropoffLocation}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <div className="text-sm">
                    <div>From: {new Date(pickupDateTime).toLocaleDateString()}</div>
                    <div>To: {new Date(dropoffDateTime).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <div className="text-sm">
                    <div>{new Date(pickupDateTime).toLocaleTimeString()}</div>
                    <div>{new Date(dropoffDateTime).toLocaleTimeString()}</div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>{currency} ${price.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Driver Details & Payment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Driver Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Driver Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={driverDetails.firstName}
                    onChange={(e) => handleDriverDetailsChange('firstName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={driverDetails.lastName}
                    onChange={(e) => handleDriverDetailsChange('lastName', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={driverDetails.email}
                    onChange={(e) => handleDriverDetailsChange('email', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={driverDetails.phone}
                    onChange={(e) => handleDriverDetailsChange('phone', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={driverDetails.dateOfBirth}
                  onChange={(e) => handleDriverDetailsChange('dateOfBirth', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="licenseNumber">License Number</Label>
                  <Input
                    id="licenseNumber"
                    value={driverDetails.licenseNumber}
                    onChange={(e) => handleDriverDetailsChange('licenseNumber', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="licenseCountry">License Country</Label>
                  <Input
                    id="licenseCountry"
                    value={driverDetails.licenseCountry}
                    onChange={(e) => handleDriverDetailsChange('licenseCountry', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="licenseExpiry">License Expiry Date</Label>
                <Input
                  id="licenseExpiry"
                  type="date"
                  value={driverDetails.licenseExpiry}
                  onChange={(e) => handleDriverDetailsChange('licenseExpiry', e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment */}
          {clientSecret && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <PaymentElement />
                <Button 
                  onClick={handlePayment}
                  disabled={isLoading || !isFormValid}
                  className="w-full mt-6"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay ${currency} $${price.toFixed(2)}`
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

const CarCheckout: React.FC = () => {
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);

  useEffect(() => {
    setStripePromise(getStripe());
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {stripePromise ? (
        <Elements stripe={stripePromise}>
          <CheckoutInner />
        </Elements>
      ) : (
        <div className="container mx-auto px-4 py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading payment system...</p>
        </div>
      )}
    </div>
  );
};

export default CarCheckout;