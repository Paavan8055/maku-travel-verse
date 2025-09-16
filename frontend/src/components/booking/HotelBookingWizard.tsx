import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookingProgress } from './BookingProgress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/use-currency';
import { useBookingPayment } from '@/features/booking/hooks/useBookingPayment';
import { 
  Calendar, 
  Users, 
  Hotel, 
  MapPin,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Star,
  Wifi,
  Car,
  Coffee,
  Utensils,
  Waves
} from 'lucide-react';
import { format } from 'date-fns';

interface HotelData {
  hotel: any;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  guestCount: number;
  roomCount: number;
  totalAmount: number;
  currency: string;
}

interface GuestData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialRequests?: string;
  roomPreferences?: string[];
  arrivalTime?: string;
}

interface SelectedAddOn {
  id: string;
  name: string;
  price: number;
  quantity: number;
  description: string;
}

const steps = ['Review', 'Guest Details', 'Room Preferences', 'Payment', 'Confirmation'];

const availableAddOns = [
  {
    id: 'early-checkin',
    name: 'Early Check-in',
    description: 'Check in before 3 PM',
    price: 25,
    icon: <CheckCircle className="w-4 h-4" />
  },
  {
    id: 'late-checkout',
    name: 'Late Check-out',
    description: 'Check out after 11 AM',
    price: 30,
    icon: <CheckCircle className="w-4 h-4" />
  },
  {
    id: 'breakfast',
    name: 'Breakfast Package',
    description: 'Daily breakfast for all guests',
    price: 35,
    icon: <Utensils className="w-4 h-4" />
  },
  {
    id: 'spa-access',
    name: 'Spa Access',
    description: 'Full spa and wellness center access',
    price: 85,
    icon: <Waves className="w-4 h-4" />
  },
  {
    id: 'airport-transfer',
    name: 'Airport Transfer',
    description: 'Private transfer from/to airport',
    price: 55,
    icon: <Car className="w-4 h-4" />
  },
  {
    id: 'welcome-package',
    name: 'Welcome Package',
    description: 'Champagne and fruit basket on arrival',
    price: 45,
    icon: <Coffee className="w-4 h-4" />
  },
];

const roomPreferences = [
  'High floor',
  'Low floor',
  'Quiet location',
  'City view',
  'Ocean view',
  'Balcony',
  'King bed',
  'Twin beds',
  'Non-smoking',
  'Accessible room',
  'Connecting rooms',
  'Away from elevator'
];

export const HotelBookingWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [hotelData, setHotelData] = useState<HotelData | null>(null);
  const [guestData, setGuestData] = useState<GuestData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialRequests: '',
    roomPreferences: [],
    arrivalTime: ''
  });
  const [selectedAddOns, setSelectedAddOns] = useState<SelectedAddOn[]>([]);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [isVerifyingRate, setIsVerifyingRate] = useState(false);
  const [rateVerified, setRateVerified] = useState(false);
  const [rateChanged, setRateChanged] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const { createBookingPayment, isLoading: isPaymentLoading } = useBookingPayment();

  useEffect(() => {
    // Load hotel data from session storage
    const storedHotelData = sessionStorage.getItem('selectedHotelOffer');
    if (storedHotelData) {
      try {
        const parsed = JSON.parse(storedHotelData);
        setHotelData(parsed);
      } catch (error) {
        console.error('Error parsing hotel data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load hotel information. Please start over.',
          variant: 'destructive',
        });
        navigate('/search/hotels');
      }
    } else {
      toast({
        title: 'No hotel selected',
        description: 'Please select a hotel first.',
        variant: 'destructive',
      });
      navigate('/search/hotels');
    }
  }, [navigate, toast]);

  useEffect(() => {
    if (hotelData && currentStep === 1 && !rateVerified) {
      verifyRate();
    }
  }, [hotelData, currentStep, rateVerified]);

  const verifyRate = async () => {
    if (!hotelData) return;
    
    setIsVerifyingRate(true);
    try {
      // Call rate verification API
      const response = await fetch('/api/verify-hotel-rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelId: hotelData.hotel.id,
          checkInDate: hotelData.checkInDate,
          checkOutDate: hotelData.checkOutDate,
          originalRate: hotelData.totalAmount
        })
      });

      const result = await response.json();
      
      if (result.rateChanged) {
        setRateChanged(true);
        setHotelData(prev => prev ? { ...prev, totalAmount: result.newRate } : null);
        toast({
          title: 'Rate Updated',
          description: `The hotel rate has changed to ${formatPrice(result.newRate, hotelData.currency)}`,
          variant: 'default',
        });
      }
      
      setRateVerified(true);
    } catch (error) {
      console.error('Rate verification failed:', error);
      toast({
        title: 'Rate Verification Failed',
        description: 'Unable to verify current rates. Rates may have changed.',
        variant: 'destructive',
      });
    } finally {
      setIsVerifyingRate(false);
    }
  };

  const calculateTotalAmount = () => {
    if (!hotelData) return 0;
    
    const basePrice = hotelData.totalAmount;
    const addOnsTotal = selectedAddOns.reduce((total, addOn) => {
      return total + (addOn.price * addOn.quantity);
    }, 0);
    
    return basePrice + addOnsTotal;
  };

  const handleGuestDetailsSubmit = () => {
    if (!guestData.firstName || !guestData.lastName || !guestData.email) {
      toast({
        title: 'Incomplete Information',
        description: 'Please fill in all required guest details.',
        variant: 'destructive',
      });
      return;
    }
    setCurrentStep(3);
  };

  const handlePreferencesSubmit = () => {
    setCurrentStep(4);
  };

  const toggleAddOn = (addOn: typeof availableAddOns[0]) => {
    const existing = selectedAddOns.find(item => item.id === addOn.id);
    if (existing) {
      setSelectedAddOns(prev => prev.filter(item => item.id !== addOn.id));
    } else {
      setSelectedAddOns(prev => [...prev, {
        id: addOn.id,
        name: addOn.name,
        price: addOn.price,
        quantity: 1,
        description: addOn.description
      }]);
    }
  };

  const handlePayment = async () => {
    if (!hotelData) return;

    try {
      const bookingData = {
        hotelData,
        guestData,
        selectedAddOns,
        selectedPreferences,
        totalAmount: calculateTotalAmount()
      };

      const result = await createBookingPayment({
        bookingType: 'hotel',
        bookingData,
        amount: calculateTotalAmount(),
        currency: hotelData.currency,
        customerInfo: {
          email: guestData.email,
          firstName: guestData.firstName,
          lastName: guestData.lastName
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

  const renderHotelSummary = () => {
    if (!hotelData) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hotel className="w-5 h-5" />
            Hotel Summary
            {rateChanged && (
              <Badge variant="secondary">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Rate Updated
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Hotel Details */}
          <div className="flex gap-4">
            {hotelData.hotel.photos?.[0] && (
              <img
                src={hotelData.hotel.photos[0]}
                alt={hotelData.hotel.name}
                className="w-24 h-24 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{hotelData.hotel.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center">
                  {Array.from({ length: hotelData.hotel.rating || 0 }, (_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                {hotelData.hotel.category && (
                  <Badge variant="outline">{hotelData.hotel.category}</Badge>
                )}
              </div>
              {hotelData.hotel.address && (
                <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>{hotelData.hotel.address.countryCode}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Stay Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Check-in</div>
                <div>{format(new Date(hotelData.checkInDate), 'MMM d, yyyy')}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Check-out</div>
                <div>{format(new Date(hotelData.checkOutDate), 'MMM d, yyyy')}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>{hotelData.guestCount} Guest{hotelData.guestCount > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <Hotel className="w-4 h-4 text-muted-foreground" />
              <span>{hotelData.nights} Night{hotelData.nights > 1 ? 's' : ''}</span>
            </div>
          </div>

          <Separator />

          {/* Price Summary */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Hotel Total ({hotelData.nights} nights):</span>
              <span className="font-medium">
                {formatPrice(hotelData.totalAmount, hotelData.currency)}
              </span>
            </div>
            {selectedAddOns.length > 0 && (
              <>
                {selectedAddOns.map((addOn) => (
                  <div key={addOn.id} className="flex justify-between text-sm">
                    <span>{addOn.name} × {addOn.quantity}:</span>
                    <span>{formatPrice(addOn.price * addOn.quantity, hotelData.currency)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm">
                  <span>Add-ons Total:</span>
                  <span className="font-medium">
                    {formatPrice(selectedAddOns.reduce((total, addOn) => total + (addOn.price * addOn.quantity), 0), hotelData.currency)}
                  </span>
                </div>
              </>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total Amount:</span>
              <span>{formatPrice(calculateTotalAmount(), hotelData.currency)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderStepContent = () => {
    if (!hotelData) return null;

    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Review Your Hotel Booking</h2>
              <p className="text-muted-foreground">
                Please review your hotel details before proceeding.
              </p>
            </div>
            
            {renderHotelSummary()}
            
            {isVerifyingRate && (
              <Card>
                <CardContent className="py-6">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                    <span>Verifying current rates...</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => navigate('/search/hotels')}>
                Back to Search
              </Button>
              <Button 
                onClick={() => setCurrentStep(2)} 
                disabled={isVerifyingRate || !rateVerified}
              >
                Continue to Guest Details
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Guest Details</h2>
              <p className="text-muted-foreground">
                Please provide guest information for your reservation.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Primary Guest Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={guestData.firstName}
                      onChange={(e) => setGuestData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={guestData.lastName}
                      onChange={(e) => setGuestData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={guestData.email}
                      onChange={(e) => setGuestData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={guestData.phone}
                      onChange={(e) => setGuestData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="arrivalTime">Expected Arrival Time</Label>
                  <Select value={guestData.arrivalTime} onValueChange={(value) => setGuestData(prev => ({ ...prev, arrivalTime: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select arrival time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning (8:00 - 12:00)</SelectItem>
                      <SelectItem value="afternoon">Afternoon (12:00 - 17:00)</SelectItem>
                      <SelectItem value="evening">Evening (17:00 - 22:00)</SelectItem>
                      <SelectItem value="late">Late Night (22:00+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="specialRequests">Special Requests</Label>
                  <Textarea
                    id="specialRequests"
                    value={guestData.specialRequests}
                    onChange={(e) => setGuestData(prev => ({ ...prev, specialRequests: e.target.value }))}
                    placeholder="Any special requests or dietary requirements..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Back
              </Button>
              <Button onClick={handleGuestDetailsSubmit}>
                Continue to Preferences
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Room Preferences & Add-ons</h2>
              <p className="text-muted-foreground">
                Customize your stay with additional services and room preferences.
              </p>
            </div>

            {/* Room Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Room Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {roomPreferences.map((preference) => (
                    <div key={preference} className="flex items-center space-x-2">
                      <Checkbox
                        id={preference}
                        checked={selectedPreferences.includes(preference)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPreferences(prev => [...prev, preference]);
                          } else {
                            setSelectedPreferences(prev => prev.filter(p => p !== preference));
                          }
                        }}
                      />
                      <Label htmlFor={preference} className="text-sm">
                        {preference}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Add-ons */}
            <Card>
              <CardHeader>
                <CardTitle>Enhancement Add-ons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableAddOns.map((addOn) => (
                    <div
                      key={addOn.id}
                      className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleAddOn(addOn)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedAddOns.some(item => item.id === addOn.id)}
                        />
                        <div className="flex items-center gap-2">
                          {addOn.icon}
                          <div>
                            <div className="font-medium">{addOn.name}</div>
                            <div className="text-sm text-muted-foreground">{addOn.description}</div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatPrice(addOn.price, hotelData.currency)}</div>
                        {hotelData.nights > 1 && addOn.id !== 'early-checkin' && addOn.id !== 'late-checkout' && (
                          <div className="text-xs text-muted-foreground">per night</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                Back
              </Button>
              <Button onClick={handlePreferencesSubmit}>
                Continue to Payment
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Payment</h2>
              <p className="text-muted-foreground">
                Complete your hotel booking by processing payment.
              </p>
            </div>

            {renderHotelSummary()}

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

  if (!hotelData) {
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