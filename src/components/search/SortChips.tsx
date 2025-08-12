import React from "react";
import { Badge } from "@/components/ui/badge";

interface SortChipsProps {
  filters: {
    priceRange: [number, number];
    starRating: string[];
    guestRating: [number, number];
    amenities: string[];
    propertyTypes: string[];
    distanceFromCenter: number;
  };
  onFiltersChange: (f: SortChipsProps["filters"]) => void;
}

const chipCls = "cursor-pointer select-none px-3 py-1.5 rounded-full border bg-card hover:bg-accent/30 transition-all text-sm";

const SortChips: React.FC<SortChipsProps> = ({ filters, onFiltersChange }) => {
  const toggleAmenity = (a: string) => {
    const has = filters.amenities.includes(a);
    onFiltersChange({ ...filters, amenities: has ? filters.amenities.filter(x => x !== a) : [...filters.amenities, a] });
  };
  const toggleStars = (min: number) => {
    const stars = ["5","4","3","2","1"].filter(s => parseInt(s) >= min);
    const isSame = stars.every(s => filters.starRating.includes(s)) && filters.starRating.length === stars.length;
    onFiltersChange({ ...filters, starRating: isSame ? [] : stars });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button className={chipCls} onClick={() => toggleAmenity("Breakfast")}>Free breakfast</button>
      <button className={chipCls} onClick={() => toggleAmenity("Pool")}>Pool</button>
      <button className={chipCls} onClick={() => toggleAmenity("WiFi")}>Free Wi‑Fi</button>
      <button className={chipCls} onClick={() => toggleStars(4)}>4+ stars</button>
      <button className={chipCls} onClick={() => onFiltersChange({ ...filters, distanceFromCenter: 3 })}>Central (≤ 3km)</button>
      {filters.amenities.length + filters.starRating.length > 0 && (
        <Badge variant="secondary" className="ml-1">Refined</Badge>
      )}
    </div>
  );
};

export default SortChips;
