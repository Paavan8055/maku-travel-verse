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

  const bookingId = searchParams.get("booking_id");

  useEffect(() => {
    // Get booking data from session storage for demo
    const savedBookingData = sessionStorage.getItem("bookingData");
    if (savedBookingData) {
      const data = JSON.parse(savedBookingData);
      setBooking({
        id: bookingId || "MAKU" + Math.random().toString(36).substr(2, 6).toUpperCase(),
        reference: "MAKU" + Math.random().toString(36).substr(2, 6).toUpperCase(),
        status: "confirmed",
        hotel: data.hotel,
        offer: data.offer,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        guests: data.guests,
        rooms: data.rooms,
        totalAmount: data.offer?.price?.total || 189,
        currency: "AUD",
        paymentStatus: "completed"
      });
    }
  }, [bookingId]);

  if (!booking) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Booking Confirmed!</h1>
          <p className="text-muted-foreground mb-4">Your hotel reservation has been confirmed.</p>
          <Button onClick={() => navigate("/")}>Return Home</Button>
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
              <div className="text-2xl font-bold text-green-800">{booking.reference}</div>
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
                <h3 className="font-semibold text-lg">{booking.hotel?.name}</h3>
                <div className="flex items-start space-x-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 mt-0.5" />
                  <div>
                    <p>{booking.hotel?.address?.city}, {booking.hotel?.address?.country}</p>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Check-in</p>
                  <p className="font-semibold">{booking.checkIn}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Check-out</p>
                  <p className="font-semibold">{booking.checkOut}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{booking.guests} guests</span>
                </div>
                <span>•</span>
                <span>{booking.rooms} room</span>
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
                <span>${booking.totalAmount}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes & Fees</span>
                <span>Included</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total Paid</span>
                <span>{booking.currency} ${booking.totalAmount}</span>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 w-full justify-center">
                Payment Completed
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationPage;