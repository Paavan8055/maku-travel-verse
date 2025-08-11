import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { DestinationAutocomplete } from "@/components/search/DestinationAutocomplete";
import { format } from "date-fns";

export type Segment = { from: string; to: string; date?: Date };

interface MultiCitySegmentsProps {
  segments: Segment[];
  onChange: (next: Segment[]) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export default function MultiCitySegments({ segments, onChange, onAdd, onRemove }: MultiCitySegmentsProps) {
  const setSeg = (idx: number, patch: Partial<Segment>) => {
    const next = segments.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {segments.map((seg, idx) => (
        <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          <DestinationAutocomplete
            value={seg.from}
            onChange={(v) => setSeg(idx, { from: v })}
            onDestinationSelect={(d) => setSeg(idx, { from: d.code ? `${d.city} (${d.code})` : d.name })}
            placeholder="From"
            className="search-input"
          />
          <DestinationAutocomplete
            value={seg.to}
            onChange={(v) => setSeg(idx, { to: v })}
            onDestinationSelect={(d) => setSeg(idx, { to: d.code ? `${d.city} (${d.code})` : d.name })}
            placeholder="To"
            className="search-input"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="search-input justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {seg.date ? format(seg.date, "MMM dd") : "Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={seg.date}
                onSelect={(d) => setSeg(idx, { date: d })}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          {segments.length > 2 && (
            <div className="md:col-span-3 -mt-2">
              <Button variant="ghost" size="sm" onClick={() => onRemove(idx)} aria-label={`Remove segment ${idx + 1}`}>
                Remove segment
              </Button>
            </div>
          )}
        </div>
      ))}
      <div>
        <Button type="button" variant="outline" onClick={onAdd}>
          + Add segment
        </Button>
      </div>
    </div>
  );
}
