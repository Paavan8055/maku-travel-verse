import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const BookingCancelledPage = () => {
  useEffect(() => {
    document.title = "Payment Canceled | Maku Travel";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-6 px-6 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Payment canceled</h1>
          <p className="text-muted-foreground">No worries. You can try again or review your details.</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 pb-20">
        <Card className="travel-card">
          <CardContent className="p-6 flex gap-3">
            <Button asChild variant="secondary">
              <Link to="/booking/payment">Back to payment</Link>
            </Button>
            <Button asChild className="btn-primary">
              <Link to="/booking/checkout">Review details</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BookingCancelledPage;
