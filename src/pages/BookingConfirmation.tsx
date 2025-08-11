import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { Check, Loader2, Printer, Download } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/features/auth/hooks/useAuth";

const BookingConfirmationPage = () => {
  const [params] = useSearchParams();
  const bookingId = params.get("booking_id");
  const sessionId = params.get("session_id");

  const [isVerifying, setIsVerifying] = useState<boolean>(!!sessionId);
  const [verified, setVerified] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(0);
  const [confirmation, setConfirmation] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    document.title = "Booking Confirmation | Maku Travel";
  }, []);

  useEffect(() => {
    const verify = async () => {
      if (!sessionId && !bookingId) return;
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
          setConfirmation(data);
          // Persist a lightweight receipt for quick display
          try {
            localStorage.setItem(
              `receipt:${bookingId}`,
              JSON.stringify({
                booking: data.booking,
                payment: data.payment,
                saved_at: new Date().toISOString(),
              })
            );
          } catch {}
          toast({ title: "Payment confirmed", description: "Your booking is finalized." });
        }
      } catch (e) {
        console.error("Verification exception", e);
      } finally {
        setIsVerifying(false);
      }
    };

    if (!verified && (sessionId || bookingId)) {
      verify();
      if (attempts < 5) {
        const t = setTimeout(() => setAttempts((a) => a + 1), 2000);
        return () => clearTimeout(t);
      }
    }
  }, [sessionId, bookingId, attempts, verified]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-6 px-6 bg-gradient-to-b from-muted/30 to-background" role="region" aria-label="Booking confirmation header">
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Booking Confirmation</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Finalizing your booking...
                </>
              ) : verified ? (
                "Thank you! Your payment was successful."
              ) : attempts > 4 ? (
                "We’re still processing your payment. Please refresh in a moment."
              ) : (
                "Confirming payment status..."
              )}
            </p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 pb-20">
        <Card className="travel-card" role="article" aria-label="Booking confirmation letter">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Reference</p>
                <p className="font-semibold">{confirmation?.booking?.booking_reference || bookingId || "—"}</p>
                {sessionId && (
                  <p className="text-xs text-muted-foreground mt-1">Stripe session: {sessionId}</p>
                )}

                {confirmation?.booking && (
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Booking status</p>
                      <p className="font-medium capitalize">{confirmation.booking.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-medium">
                        {confirmation.booking.currency} {Number(confirmation.payment?.amount ?? confirmation.booking.total_amount ?? 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="font-medium">{new Date(confirmation.booking.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  {user && bookingId ? (
                    <Button asChild className="btn-primary">
                      <Link to={`/dashboard/bookings/${bookingId}`}>View booking details</Link>
                    </Button>
                  ) : (
                    <Button asChild className="btn-primary">
                      <Link to="/dashboard">Go to dashboard</Link>
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => window.print()} className="inline-flex items-center gap-2">
                    <Printer className="h-4 w-4" /> Print / Save PDF
                  </Button>
                </div>
              </div>
            </div>
        </Card>
      </div>
    </div>
  );
};

export default BookingConfirmationPage;
