import { useMemo } from "react";
import { Users, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ActivityParticipantSelectorProps {
  adults: number;
  children: number;
  onChange: (next: { adults: number; children: number }) => void;
  className?: string;
}

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

const Row = ({
  label,
  sublabel,
  value,
  setValue,
  min = 0,
  max = 20,
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
        disabled={value <= min}
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
        disabled={value >= max}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  </div>
);

export const ActivityParticipantSelector = ({
  adults,
  children,
  onChange,
  className,
}: ActivityParticipantSelectorProps) => {
  const total = adults + children;
  const label = useMemo(() => {
    const parts: string[] = [];
    if (adults > 0) parts.push(`${adults} Adult${adults > 1 ? "s" : ""}`);
    if (children > 0) parts.push(`${children} Child${children > 1 ? "ren" : ""}`);
    return parts.join(", ") || "Participants";
  }, [adults, children]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={`search-input justify-start ${className || ""}`}>
          <Users className="mr-2 h-4 w-4" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <div className="space-y-2">
          <Row
            label="Adults"
            sublabel="Age 18+"
            value={adults}
            setValue={(v) => onChange({ adults: clamp(v, 1, 20), children })}
            min={1}
            max={20}
          />
          <Row
            label="Children"
            sublabel="Age 3-17"
            value={children}
            setValue={(v) => onChange({ adults, children: clamp(v, 0, 15) })}
            min={0}
            max={15}
          />
          <div className="pt-2 text-xs text-muted-foreground">
            Some activities may have age restrictions.
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};