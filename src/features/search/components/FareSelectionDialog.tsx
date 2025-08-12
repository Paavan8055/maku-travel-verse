
import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Check, Info } from "lucide-react";
import { useCurrency } from "@/features/currency/CurrencyProvider";
import { RealBookingButton } from "@/components/RealBookingButton";

interface Flight {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  aircraft: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  stops: string;
  price: number;
  currency: string;
  availableSeats: number;
  cabin: string;
  baggage: {
    carry: boolean;
    checked: boolean;
  };
}

interface FareSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flight: Flight;
  outbound?: Flight; // NEW: optional departing flight to combine totals and build roundtrip booking
}

export const FareSelectionDialog: React.FC<FareSelectionDialogProps> = ({ open, onOpenChange, flight, outbound }) => {
  const { convert, formatCurrency, selectedCurrency } = useCurrency();
  const [selection, setSelection] = useState<"basic" | "flex">("basic");

  // Inbound (current dialog flight) pricing
  const pricing = useMemo(() => {
    const baseLocal = convert(flight.price, flight.currency);
    const flexDiffOriginalCcy = Math.max(Math.round(flight.price * 0.15), 15); // +15% or min 15 in original ccy
    const flexDiffLocal = convert(flexDiffOriginalCcy, flight.currency);
    const totals = {
      basic: baseLocal,
      flex: baseLocal + flexDiffLocal,
    };
    return { baseLocal, flexDiffLocal, totals };
  }, [convert, flight.price, flight.currency]);

  // Outbound pricing (assume Basic fare by default for simplicity)
  const outboundLocal = useMemo(() => {
    if (!outbound) return 0;
    return convert(outbound.price, outbound.currency);
  }, [outbound, convert]);

  // Combined total if outbound is present
  const selectedInboundTotal = selection === "flex" ? pricing.totals.flex : pricing.totals.basic;
  const combinedTotal = outbound ? outboundLocal + selectedInboundTotal : selectedInboundTotal;

  const inclusions = (
    <ul className="space-y-2 text-sm text-muted-foreground">
      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 1 carry-on bag</li>
      {flight.baggage.checked && (
        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Checked bag(s) included</li>
      )}
    </ul>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Fare Selection</DialogTitle>
          <DialogDescription>
            {outbound ? (
              <>
                Departing: {outbound.origin} → {outbound.destination} · {outbound.airline} {outbound.flightNumber} (Basic)
                <br />
                Returning: {flight.origin} → {flight.destination}
              </>
            ) : (
              <>Departure: {flight.origin} to {flight.destination}</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 border rounded-lg p-3 bg-background">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center" aria-hidden>
            <span className="text-sm font-semibold text-primary">{flight.airlineCode}</span>
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">{flight.airline}</p>
            <p className="text-sm text-muted-foreground">
              {flight.departureTime} → {flight.arrivalTime} · {flight.stops === "0" ? "Direct" : `${flight.stops} stop${flight.stops === "1" ? "" : "s"}`}
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0">{flight.cabin}</Badge>
        </div>

        <RadioGroup value={selection} onValueChange={(v) => setSelection(v as any)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Basic */}
          <Card className={selection === "basic" ? "ring-2 ring-primary shadow-sm" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-foreground">Basic</div>
                <RadioGroupItem value="basic" id="fare-basic" />
              </div>
              <div className="mb-3">
                <div className="text-xs font-medium text-muted-foreground mb-2">Inclusions per passenger</div>
                {inclusions}
              </div>
              <div className="mt-4 text-right font-semibold text-primary">
                +{formatCurrency(0, selectedCurrency)}
              </div>
            </CardContent>
          </Card>

          {/* Flex */}
          <Card className={selection === "flex" ? "ring-2 ring-primary shadow-sm" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-foreground">Flex</div>
                <RadioGroupItem value="flex" id="fare-flex" />
              </div>
              <div className="mb-3">
                <div className="text-xs font-medium text-muted-foreground mb-2">Inclusions per passenger</div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 1 carry-on bag</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Checked bag(s) included</li>
                </ul>
                <div className="mt-3">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Flexibility</div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Changeable</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Refundable</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 text-right font-semibold text-primary">
                +{formatCurrency(pricing.flexDiffLocal, selectedCurrency)}
              </div>
            </CardContent>
          </Card>
        </RadioGroup>

        <div className="flex flex-col md:flex-row items-center justify-between gap-3 border-t pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            Total amount
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xl font-bold text-foreground">
              {formatCurrency(combinedTotal, selectedCurrency)}
            </div>
            <RealBookingButton
              bookingType="flight"
              bookingData={
                outbound
                  ? {
                      outbound: { ...outbound, fareType: "basic" },
                      inbound: { ...flight, fareType: selection },
                    }
                  : { ...flight, fareType: selection }
              }
              amount={combinedTotal}
              currency={selectedCurrency}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
