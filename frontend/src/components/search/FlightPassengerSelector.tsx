import { useMemo } from "react";
import { Users, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface FlightPassengerSelectorProps {
  adults: number;
  children: number;
  infants: number;
  onChange: (next: { adults: number; children: number; infants: number }) => void;
  className?: string;
}

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

const Row = ({
  label,
  sublabel,
  value,
  setValue,
  min = 0,
  max = 9,
}: {
  label: string;
  sublabel: string;
  value: number;
  setValue: (v: number) => void;
  min?: number;
  max?: number;
}) => (
  <div className="flex items-center justify-between py-2">
    <div>
      <div className="text-sm font-medium">{label}</div>
      <div className="text-xs text-muted-foreground">{sublabel}</div>
    </div>
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => setValue(clamp(value - 1, min, max))}
        aria-label={`Decrease ${label}`}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="w-6 text-center text-sm tabular-nums">{value}</span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => setValue(clamp(value + 1, min, max))}
        aria-label={`Increase ${label}`}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  </div>
);

export default function FlightPassengerSelector({
  adults,
  children,
  infants,
  onChange,
  className,
}: FlightPassengerSelectorProps) {
  const total = adults + children + infants;
  const label = useMemo(() => {
    const parts: string[] = [];
    if (adults > 0) parts.push(`${adults} Adult${adults > 1 ? "s" : ""}`);
    if (children > 0) parts.push(`${children} Child${children > 1 ? "ren" : ""}`);
    if (infants > 0) parts.push(`${infants} Infant${infants > 1 ? "s" : ""}`);
    return parts.join(", ") || "Passengers";
  }, [adults, children, infants]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={`search-input justify-start ${className || ""}`}>
          <Users className="mr-2 h-4 w-4" />
          <span className="truncate">{label || `${total} Passenger${total !== 1 ? "s" : ""}`}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <div className="space-y-2">
          <Row
            label="Adults"
            sublabel="12+ years"
            value={adults}
            setValue={(v) => onChange({ adults: clamp(v, 1, 9), children, infants })}
            min={1}
            max={9}
          />
          <Row
            label="Children"
            sublabel="2–11 years"
            value={children}
            setValue={(v) => onChange({ adults, children: clamp(v, 0, 9), infants })}
            min={0}
            max={9}
          />
          <Row
            label="Infants"
            sublabel="Under 2 years"
            value={infants}
            setValue={(v) => onChange({ adults, children, infants: clamp(v, 0, adults) })}
            min={0}
            max={adults}
          />
          <div className="pt-2 text-xs text-muted-foreground">
            Infants cannot exceed number of adults.
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
