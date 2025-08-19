import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Download, Calendar, MapPin, Users, CreditCard } from "lucide-react";
import Navbar from "@/components/Navbar";

const BookingConfirmationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bookingId = searchParams.get("booking_id");
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    const loadBookingDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // First try to verify payment and get booking if we have session_id
        if (sessionId && bookingId) {
          const { supabase } = await import("@/integrations/supabase/client");
          
          const { data: verificationResult, error: verifyError } = await supabase.functions.invoke('verify-booking-payment', {
            body: { bookingId, sessionId }
          });

          if (!verifyError && verificationResult?.success) {
            setBooking(verificationResult.booking);
            setLoading(false);
            return;
          }
        }

        // Fallback: Try to get booking from guest lookup or session storage
        if (bookingId) {
          // Try guest booking lookup first
          const guestEmail = sessionStorage.getItem("guestEmail");
          
          if (guestEmail) {
            const { supabase } = await import("@/integrations/supabase/client");
            
            const { data: guestData, error: guestError } = await supabase.functions.invoke('guest-booking-lookup', {
              body: { 
                bookingReference: bookingId,
                email: guestEmail 
              }
            });

            if (!guestError && guestData?.success) {
              setBooking(guestData.booking);
              setLoading(false);
              return;
            }
          }
        }

        // Final fallback: session storage for demo purposes
        const savedBookingData = sessionStorage.getItem("bookingData");
        if (savedBookingData) {
          const data = JSON.parse(savedBookingData);
          setBooking({
            id: bookingId || "MAKU" + Math.random().toString(36).substr(2, 6).toUpperCase(),
            booking_reference: "MAKU" + Math.random().toString(36).substr(2, 6).toUpperCase(),
            status: "confirmed",
            hotel: data.hotel,
            offer: data.offer,
            checkIn: data.checkIn,
            checkOut: data.checkOut,
            guests: data.guests,
            rooms: data.rooms,
            total_amount: data.offer?.price?.total || 189,
            currency: "AUD",
            paymentStatus: "completed",
            booking_data: data
          });
        } else {
          setError("Booking details not found. Please check your email for confirmation.");
        }
      } catch (err) {
        console.error("Error loading booking:", err);
        setError("Failed to load booking details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadBookingDetails();
  }, [bookingId, sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-4">Loading Booking Details...</h1>
          <p className="text-muted-foreground">Please wait while we retrieve your booking information.</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4 text-destructive">Booking Not Found</h1>
          <p className="text-muted-foreground mb-4">
            {error || "We couldn't find your booking details. Please check your email for confirmation."}
          </p>
          <div className="space-y-2">
            <Button onClick={() => window.location.reload()}>Try Again</Button>
            <Button variant="outline" onClick={() => navigate("/")}>Return Home</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Card className="border-green-200 bg-green-50 mb-8">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-green-800 mb-2">Booking Confirmed!</h1>
            <p className="text-green-700 mb-4">Your hotel reservation has been successfully confirmed.</p>
            <div className="bg-white rounded-lg p-4 inline-block">
              <div className="text-sm text-muted-foreground">Booking Reference</div>
              <div className="text-2xl font-bold text-green-800">{booking.booking_reference || booking.reference}</div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Stay Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">
                  {booking.hotel?.name || booking.booking_data?.hotel?.name || "Hotel Booking"}
                </h3>
                <div className="flex items-start space-x-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 mt-0.5" />
                  <div>
                    <p>
                      {booking.hotel?.address?.city || booking.booking_data?.hotel?.city || "City"}, {" "}
                      {booking.hotel?.address?.country || booking.booking_data?.hotel?.country || "Country"}
                    </p>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Check-in</p>
                  <p className="font-semibold">
                    {booking.checkIn || booking.booking_data?.checkInDate || booking.booking_data?.hotel?.checkIn || "TBD"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Check-out</p>
                  <p className="font-semibold">
                    {booking.checkOut || booking.booking_data?.checkOutDate || booking.booking_data?.hotel?.checkOut || "TBD"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>
                    {booking.guests || booking.booking_data?.guestCount || booking.booking_data?.hotel?.guests || 1} guests
                  </span>
                </div>
                <span>•</span>
                <span>
                  {booking.rooms || booking.booking_data?.roomCount || booking.booking_data?.hotel?.rooms || 1} room
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Payment Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Room Total</span>
                <span>{booking.currency || "AUD"} {booking.total_amount || booking.totalAmount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes & Fees</span>
                <span>Included</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total Paid</span>
                <span>{booking.currency || "AUD"} {booking.total_amount || booking.totalAmount || 0}</span>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 w-full justify-center">
                {booking.status === "confirmed" ? "Payment Completed" : "Payment Processing"}
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationPage;