
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import HotelGuestForm, { HotelGuestFormData } from "@/features/booking/components/HotelGuestForm";
import { useToast } from "@/hooks/use-toast";

const HotelCheckout = () => {
  const [guestValid, setGuestValid] = useState(false);
  const [guest, setGuest] = useState<HotelGuestFormData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
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
  
  // Extract search parameters for dates and guests (standardized to camelCase)
  const checkInParam = urlParams.get('checkIn') || urlParams.get('checkin');
  const checkOutParam = urlParams.get('checkOut') || urlParams.get('checkout');
  const adultsParam = urlParams.get('adults') || '2';
  const childrenParam = urlParams.get('children') || '0';
  
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
  
  // Build booking details from URL hotel data and stored selections
  let selection: any = null;
  try { 
    selection = JSON.parse(sessionStorage.getItem('hotelBookingSelections') || 'null'); 
  } catch {}

  const baseNightly = hotelData?.pricePerNight || Number(selection?.nightlyPrice || 450);
  const basePrice = baseNightly * nights;
  const extrasPrice = (Number(selection?.extraBeds || 0) * 25) + (selection?.rollaway ? 30 : 0) + (selection?.sofaBed ? 40 : 0);
  const fundContribution = Number(selection?.fundContribution || 50);
  
  const bookingDetails = {
    hotel: hotelData?.name || selection?.hotelName || "Unknown Hotel",
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

  const goToPayment = () => {
    console.log('goToPayment called for hotel booking', { guest });
    
    try {
      if (guest) {
        sessionStorage.setItem('guestInfo', JSON.stringify(guest));
        console.log('Saved guest info to session storage');
      }
    } catch (e) {
      console.error('Session storage error:', e);
    }
    
    // Ensure we navigate to the payment page with all current URL parameters
    const currentSearch = window.location.search;
    console.log('Navigating to payment with search:', currentSearch);
    
    navigate(`/booking/payment${currentSearch}`);
  };

  const handleContinue = useCallback(() => {
    if (isLoading) return;
    
    console.log('Continue button clicked for hotel', {
      guestValid,
      guest: !!guest,
      bookingDetails
    });

    if (!guest || !guestValid) {
      console.log('Hotel validation failed - missing guest data');
      toast({
        title: 'Complete guest details',
        description: 'Please fill all required fields before continuing.',
        variant: "destructive",
      });
      
      const anchor = document.getElementById("guest-details");
      if (anchor && typeof anchor.scrollIntoView === "function") {
        anchor.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }
    
    setIsLoading(true);
    console.log('Hotel booking - validation passed, proceeding to payment');
    goToPayment();
  }, [isLoading, guestValid, guest, bookingDetails, toast, goToPayment]);

  const isButtonDisabled = !guestValid || !guest || isLoading;
  
  console.log('Hotel checkout button state:', { 
    guestValid, 
    hasGuest: !!guest, 
    isLoading, 
    isButtonDisabled,
    guest: guest ? Object.keys(guest) : null
  });

  // Memoize the form change handler to prevent infinite loops
  const handleGuestFormChange = useCallback((data: HotelGuestFormData, valid: boolean) => {
    console.log('Guest form change:', { valid, data });
    setGuest(data);
    setGuestValid(valid);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Header */}
      <div className="pt-24 pb-6 px-6 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Room Selection
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Complete your <span className="hero-text">Hotel Booking</span></h1>
          <p className="text-muted-foreground">
            Enter guest details and confirm your reservation
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Guest Form */}
          <div className="lg:col-span-2 space-y-6">
            <div id="guest-details">
              <HotelGuestForm onChange={handleGuestFormChange} />
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
                  {isLoading ? "Processing..." : "Continue to Payment"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div>
            <Card className="travel-card sticky top-24">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">Hotel Booking Summary</h3>
                
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

                <Button 
                  onClick={handleContinue}
                  className="w-full mt-6 btn-primary h-12"
                  disabled={isButtonDisabled}
                >
                  {isLoading ? "Processing..." : "Continue to Payment"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelCheckout;
