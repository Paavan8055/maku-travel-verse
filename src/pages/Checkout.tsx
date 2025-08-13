
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const CheckoutPage = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Parse URL to detect booking type and redirect to appropriate checkout
    const urlParams = new URLSearchParams(window.location.search);
    const params = new URLSearchParams(window.location.search);
    
    // Check for flight-specific parameters
    const hasFlightId = params.get('flightId');
    const hasTripType = params.get('tripType');
    const hasOutboundId = params.get('outboundId');
    const hasInboundId = params.get('inboundId');
    const hasAnyFare = params.get('fareType') || params.get('outboundFare') || params.get('inboundFare');

    // Check for hotel-specific parameters
    const hasHotelParam = urlParams.get('hotel');
    const hasHotelDates = urlParams.get('checkin') || urlParams.get('checkIn');
    
    // Determine booking type and redirect
    const isFlightBooking = Boolean(hasFlightId || hasTripType || hasOutboundId || hasInboundId || hasAnyFare);
    const isHotelBooking = Boolean(hasHotelParam || hasHotelDates);
    
    console.log('Checkout router - detecting booking type:', {
      isFlightBooking,
      isHotelBooking,
      hasFlightId,
      hasTripType,
      hasHotelParam,
      hasHotelDates
    });
    
    if (isFlightBooking) {
      console.log('Redirecting to flight checkout');
      navigate(`/booking/checkout/flight${window.location.search}`, { replace: true });
    } else if (isHotelBooking) {
      console.log('Redirecting to hotel checkout');
      navigate(`/booking/checkout/hotel${window.location.search}`, { replace: true });
    } else {
      console.log('No specific booking type detected, staying on generic checkout');
      // Could redirect to a default or show an error
    }
  }, [navigate]);

  // This component now acts as a router - the actual content is handled by useEffect

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
};

export default CheckoutPage;
