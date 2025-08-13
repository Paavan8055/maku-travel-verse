
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { PassengerDetailsForm, PassengerFormData } from "@/features/booking/components/PassengerDetailsForm";
import HotelGuestForm, { HotelGuestFormData } from "@/features/booking/components/HotelGuestForm";
import { FlightBookingSummary } from "@/features/booking/components/FlightBookingSummary";
import { useToast } from "@/hooks/use-toast";

const CheckoutPage = () => {
  const [passengerValid, setPassengerValid] = useState(false);
  const [passenger, setPassenger] = useState<PassengerFormData | null>(null);
  const [guestValid, setGuestValid] = useState(false);
  const [guest, setGuest] = useState<HotelGuestFormData | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Parse hotel data from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const hotelParam = urlParams.get('hotel');
  
  let hotelData: any = null;
  if (hotelParam) {
    try {
      hotelData = JSON.parse(decodeURIComponent(hotelParam));
    } catch (error) {
      console.error('Failed to parse hotel data from URL:', error);
    }
  }
  
  // Extract search parameters for dates and guests
  const checkInParam = urlParams.get('checkin') || urlParams.get('checkIn');
  const checkOutParam = urlParams.get('checkout') || urlParams.get('checkOut');
  const roomsParam = urlParams.get('rooms');
  const adultsParam = urlParams.get('adults');
  const childrenParam = urlParams.get('children');
  
  // Parse dates
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
  
  // Build booking details for hotel flow from URL hotel data and stored selections
  let selection: any = null;
  try { 
    selection = JSON.parse(sessionStorage.getItem('hotelBookingSelections') || 'null'); 
  } catch {}

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
    currency: hotelData?.currency || '$'
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

  // NEW: detect if we're on the return leg step (even if not fully roundtrip params)
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

  // New: derive passengers for summary (defaults to 1)
  const passengers = Number(params.get('passengers') || '1');

  const goToPayment = () => {
    console.log('goToPayment called', { isFlightCheckout, passenger, guest });
    
    try {
      if (isFlightCheckout && passenger) {
        sessionStorage.setItem('passengerInfo', JSON.stringify(passenger));
        console.log('Saved passenger info to session storage');
      } else if (!isFlightCheckout && guest) {
        sessionStorage.setItem('guestInfo', JSON.stringify(guest));
        console.log('Saved guest info to session storage');
      }
    } catch (e) {
      console.error('Session storage error:', e);
    }
    
    const search = typeof window !== 'undefined' ? window.location.search : '';
    console.log('Navigating to payment with search:', search);
    
    navigate(`/booking/payment${search}`);
  };

  // Simplified continue handler - remove validation issues
  const handleContinue = () => {
    console.log('Continue button clicked', {
      isFlightCheckout,
      passengerValid,
      passenger,
      guestValid,
      guest
    });

    // For hotel bookings, proceed directly
    if (!isFlightCheckout) {
      console.log('Hotel booking - proceeding to payment');
      goToPayment();
      return;
    }

    // For flight bookings, check if we have passenger data
    if (!passenger) {
      console.log('Flight validation failed, showing toast');
      
      toast({
        title: `Complete passenger details`,
        description: `Please fill all required fields before continuing.`,
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

  // Calculate button disabled state more simply
  const isButtonDisabled = isFlightCheckout ? !passenger : !guest;

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
          
          <h1 className="text-3xl font-bold mb-2">Complete your <span className="hero-text">Travel Booking</span></h1>
          <p className="text-muted-foreground">
            Review your details and confirm your reservation
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Form Details - conditional based on booking type */}
            {isFlightCheckout ? (
              <div id="passenger-details">
                <PassengerDetailsForm onChange={(data, valid) => { 
                  console.log('Passenger form change:', { data, valid });
                  setPassenger(data); 
                  setPassengerValid(valid); 
                }} />
              </div>
            ) : (
              <div id="guest-details">
                <HotelGuestForm onChange={(valid, data) => { 
                  console.log('Guest form change:', { valid, data });
                  setGuest(data); 
                  setGuestValid(valid); 
                }} />
              </div>
            )}

            {/* Payment Method */}
            {/* Next step CTA: Payment */}
            <Card className="travel-card">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-2">Next: Payment</h2>
                <p className="text-muted-foreground mb-4">Continue to secure payment to complete your booking.</p>
                <Button 
                  onClick={() => {
                    console.log('Button clicked - main button');
                    console.log('Button disabled state:', isButtonDisabled);
                    console.log('Guest data:', guest);
                    console.log('Passenger data:', passenger);
                    handleContinue();
                  }} 
                  className="btn-primary h-12" 
                  size="lg"
                  disabled={isButtonDisabled}
                >
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
                    currentLeg={isReturnLeg ? 'inbound' : 'outbound'} // NEW
                  />
                ) : (
                  <div className="space-y-4">
                    {/* Hotel Details */}
                    <div>
                      <h4 className="font-medium">{bookingDetails.hotel}</h4>
                      <p className="text-sm text-muted-foreground">{bookingDetails.room}</p>
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
                        <span>{bookingDetails.currency}{bookingDetails.basePrice}</span>
                      </div>
                      {bookingDetails.extrasPrice > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Extras & Services</span>
                          <span>{bookingDetails.currency}{bookingDetails.extrasPrice}</span>
                        </div>
                      )}
                      {bookingDetails.fundContribution > 0 && (
                        <div className="flex justify-between text-sm text-primary">
                          <span>Fund Contribution</span>
                          <span>+{bookingDetails.currency}{bookingDetails.fundContribution}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg pt-2 border-t">
                        <span>Total</span>
                        <span>{bookingDetails.currency}{bookingDetails.total}</span>
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
                  onClick={() => {
                    console.log('Button clicked - sidebar button');
                    console.log('Current URL:', window.location.href);
                    console.log('isFlightCheckout:', isFlightCheckout);
                    console.log('Button disabled state:', isButtonDisabled);
                    handleContinue();
                  }}
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

export default CheckoutPage;
