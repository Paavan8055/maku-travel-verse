import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import heroImg from "@/assets/hero-2.jpg";

interface MapPreviewCardProps {
  destination?: string;
}

const MapPreviewCard: React.FC<MapPreviewCardProps> = ({ destination }) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{destination ? `Map – ${destination}` : "Map preview"}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative h-40">
          <img src={heroImg} alt="Map preview of hotels" loading="lazy" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
          <div className="absolute bottom-2 right-2">
            <a href="#" className="px-3 py-1.5 rounded-full bg-background/80 border text-sm story-link">Open full map</a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MapPreviewCard;
