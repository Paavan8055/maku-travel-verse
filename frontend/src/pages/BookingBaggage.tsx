import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Luggage, ChevronLeft } from "lucide-react";

const BookingBaggagePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const flightId = searchParams.get("flightId") || "";
  const fareType = searchParams.get("fareType") || "basic";
  const amount = parseFloat(searchParams.get("amount") || "0");
  const currency = searchParams.get("currency") || "USD";
  // Roundtrip-capable params
  const tripType = (searchParams.get("tripType") || "").toLowerCase();
  const outboundId = searchParams.get("outboundId") || "";
  const inboundId = searchParams.get("inboundId") || "";
  const outboundFare = searchParams.get("outboundFare") || "";
  const inboundFare = searchParams.get("inboundFare") || "";
  const passengers = searchParams.get("passengers") || "1";
  const isRoundtrip = tripType === "roundtrip" || (!!outboundId && !!inboundId);

  // Simple local selection state for baggage
  const [carryOn, setCarryOn] = useState("1_cabin");
  const [checked, setChecked] = useState("1_checked");

  useEffect(() => {
    const title = `Add baggage | Maku.travel`;
    const description = `Customize your trip by selecting baggage for your flight.`;
    document.title = title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);
    let canon = document.querySelector('link[rel="canonical"]');
    if (!canon) {
      canon = document.createElement('link');
      canon.setAttribute('rel', 'canonical');
      document.head.appendChild(canon);
    }
    canon.setAttribute('href', window.location.origin + '/booking/baggage');
  }, []);

  const handleNext = () => {
    const params = new URLSearchParams();
    // Common fields
    params.set('amount', String(amount));
    params.set('currency', currency);
    params.set('carryOn', carryOn);
    params.set('checked', checked);
    params.set('passengers', passengers);

    if (isRoundtrip) {
      params.set('tripType', 'roundtrip');
      if (outboundId) params.set('outboundId', outboundId);
      if (outboundFare) params.set('outboundFare', outboundFare);
      if (inboundId) params.set('inboundId', inboundId);
      if (inboundFare) params.set('inboundFare', inboundFare);
      // Indicate we're proceeding with the return leg summary on checkout
      params.set('leg', 'inbound');
    } else {
      if (flightId) params.set('flightId', flightId);
      if (fareType) params.set('fareType', fareType);
    }

    navigate(`/booking/flight?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-6 px-6 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-3xl font-bold mb-2">Customize your trip</h1>
          <p className="text-muted-foreground">Add baggage for Passenger 1 (Adult)</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-20 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="travel-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Luggage className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold">Add Baggage</h2>
                </div>
                <Badge variant="secondary">Passenger 1 (Adult)</Badge>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Carry-on baggage</div>
                  <RadioGroup value={carryOn} onValueChange={setCarryOn} className="space-y-2">
                    <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="1_cabin" id="carry-1" />
                        <span>1 x Cabin bag</span>
                      </div>
                      <span className="text-sm font-medium">{currency} 0</span>
                    </label>
                    <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="0_cabin" id="carry-0" />
                        <span>No carry-on</span>
                      </div>
                      <span className="text-sm font-medium">{currency} 0</span>
                    </label>
                  </RadioGroup>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground mb-2">Checked baggage</div>
                  <RadioGroup value={checked} onValueChange={setChecked} className="space-y-2">
                    <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="1_checked" id="checked-1" />
                        <span>1 x Checked bag</span>
                      </div>
                      <span className="text-sm font-medium">{currency} 0</span>
                    </label>
                    <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="0_checked" id="checked-0" />
                        <span>No checked bag</span>
                      </div>
                      <span className="text-sm font-medium">{currency} 0</span>
                    </label>
                  </RadioGroup>
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={() => window.history.back()}>Back</Button>
                <Button className="btn-primary" onClick={handleNext}>Next</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column summary */}
        <div>
          <Card className="travel-card sticky top-24">
            <CardContent className="p-6 space-y-3">
              <h3 className="text-lg font-bold">Booking Price</h3>
              <div className="flex justify-between text-sm">
                <span>1 × Passenger</span>
                <span>
                  {currency} {amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Taxes and charges</span>
                <span>{currency} 0.00</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-semibold">
                <span>Total Charge</span>
                <span className="text-primary">
                  {currency} {amount.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookingBaggagePage;
