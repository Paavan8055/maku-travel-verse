
import { Shield, Plane, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FlightLeg {
  id?: string;
  fareType?: string;
}

interface FlightBookingSummaryProps {
  tripType: string;
  isRoundtrip: boolean;
  outbound?: FlightLeg;
  inbound?: FlightLeg;
  amount: number;
  currency: string;
  carryOn?: string;
  checked?: string;
  passengers?: number;
  currentLeg?: "outbound" | "inbound"; // NEW: indicate if we're on return leg in a non-roundtrip view
}

export const FlightBookingSummary = ({
  tripType,
  isRoundtrip,
  outbound,
  inbound,
  amount,
  currency,
  carryOn,
  checked,
  passengers = 1,
  currentLeg,
}: FlightBookingSummaryProps) => {
  const formatBagText = (text?: string) => (text ? text.replace(/_/g, " ") : "—");

  // Adjust label: Roundtrip > Return flight (when leg=inbound) > One-way
  const tripLabel =
    isRoundtrip || tripType === "roundtrip"
      ? "Roundtrip"
      : currentLeg === "inbound"
      ? "Return flight"
      : "One-way";

  return (
    <div className="space-y-4">
      {/* Trip overview */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plane className="h-5 w-5 text-primary" />
          <span className="font-medium text-foreground">Trip</span>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="uppercase tracking-wide">{tripLabel}</Badge>
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 mr-1" />
            <span>
              {passengers} {passengers === 1 ? "traveller" : "travellers"}
            </span>
          </div>
        </div>
      </div>

      {/* Flight legs */}
      {isRoundtrip ? (
        <div className="space-y-3">
          <div>
            <h4 className="font-medium">
              Outbound {outbound?.id ? `#${outbound.id}` : ""}
            </h4>
            <p className="text-sm text-muted-foreground">
              Fare: {outbound?.fareType ? outbound.fareType.toUpperCase() : "—"}
            </p>
          </div>
          <div>
            <h4 className="font-medium">
              Inbound {inbound?.id ? `#${inbound.id}` : ""}
            </h4>
            <p className="text-sm text-muted-foreground">
              Fare: {inbound?.fareType ? inbound.fareType.toUpperCase() : "—"}
            </p>
          </div>
        </div>
      ) : (
        <div>
          <h4 className="font-medium">
            {currentLeg === "inbound" ? "Return Flight" : "Flight"} {outbound?.id ? `#${outbound.id}` : ""}
          </h4>
          <p className="text-sm text-muted-foreground">
            Fare: {outbound?.fareType ? outbound.fareType.toUpperCase() : "—"}
          </p>
        </div>
      )}

      {/* Baggage */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Carry-on</p>
          <p className="font-medium">{formatBagText(carryOn)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Checked bags</p>
          <p className="font-medium">{formatBagText(checked)}</p>
        </div>
      </div>

      {/* Totals */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between font-bold text-lg pt-2">
          <span>Total</span>
          <span>
            {currency} {amount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Security */}
      <div className="bg-green-50 p-3 rounded-lg flex items-center space-x-2">
        <Shield className="h-5 w-5 text-green-600" />
        <div>
          <p className="text-sm font-medium text-green-800">Secure Payment</p>
          <p className="text-xs text-green-600">256-bit SSL encryption</p>
        </div>
      </div>
    </div>
  );
};

export default FlightBookingSummary;
