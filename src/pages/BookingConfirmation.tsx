import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { Check, Loader2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const BookingConfirmationPage = () => {
  const [params] = useSearchParams();
  const bookingId = params.get("booking_id");
  const sessionId = params.get("session_id");

  const [isVerifying, setIsVerifying] = useState<boolean>(!!sessionId);
  const [verified, setVerified] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Booking Confirmed | Maku Travel";
  }, []);

  useEffect(() => {
    const verify = async () => {
      if (!sessionId || !bookingId) return;
      setIsVerifying(true);
      try {
        const { data, error } = await supabase.functions.invoke("verify-booking-payment", {
          body: { bookingId, sessionId },
        });
        if (error || !data?.success) {
          console.error("Verification failed", error || data);
          toast({
            title: "Finalizing payment",
            description: "We’re confirming your payment. This may take a moment.",
          });
          setVerified(false);
        } else {
          setVerified(true);
          toast({ title: "Payment confirmed", description: "Your booking is finalized." });
        }
      } catch (e) {
        console.error("Verification exception", e);
      } finally {
        setIsVerifying(false);
      }
    };
    verify();
  }, [sessionId, bookingId]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-6 px-6 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-4xl mx-auto">
<h1 className="text-3xl font-bold mb-2">Booking Confirmed</h1>
<p className="text-muted-foreground flex items-center gap-2">
  {isVerifying ? (
    <>
      <Loader2 className="h-4 w-4 animate-spin" /> Finalizing your booking...
    </>
  ) : (
    "Thank you! Your payment was successful."
  )}
</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 pb-20">
        <Card className="travel-card">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Reference</p>
                <p className="font-semibold">{bookingId || "—"}</p>
                {sessionId && (
                  <p className="text-xs text-muted-foreground mt-1">Stripe session: {sessionId}</p>
                )}
                <div className="mt-6 flex gap-3">
                  {bookingId ? (
                    <Button asChild className="btn-primary">
                      <Link to={`/dashboard/bookings/${bookingId}`}>View booking details</Link>
                    </Button>
                  ) : (
                    <Button asChild className="btn-primary">
                      <Link to="/dashboard">Go to dashboard</Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BookingConfirmationPage;
