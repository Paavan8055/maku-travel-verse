import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { PerformanceWrapper } from "@/components/PerformanceWrapper";
import OneClickBooking from "@/features/bookingEnhancements/components/OneClickBooking";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BookingEnhancedPage = () => {
  const [searchParams] = useSearchParams();
  
  // Extract booking data from URL params
  const bookingData = {
    destination: searchParams.get("destination") || "",
    checkIn: searchParams.get("checkIn") || "",
    checkOut: searchParams.get("checkOut") || "",
    guests: parseInt(searchParams.get("guests") || "1"),
    hotelId: searchParams.get("hotelId") || "",
    hotelName: searchParams.get("hotelName") || "",
    price: parseFloat(searchParams.get("price") || "0")
  };

  const handleBookingComplete = (bookingId: string) => {
    // Redirect to booking confirmation
    window.location.href = `/booking-confirmation?id=${bookingId}`;
  };

  return (
    <PerformanceWrapper componentName="BookingEnhancedPage">
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Enhanced Booking Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Complete your booking with our streamlined one-click process or continue with the full booking flow.
                </p>
              </CardContent>
            </Card>
            
            <OneClickBooking
              bookingData={bookingData}
              onBookingComplete={handleBookingComplete}
            />
          </div>
        </div>
      </div>
    </PerformanceWrapper>
  );
};

export default BookingEnhancedPage;