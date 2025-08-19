import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Expand, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface HotelPhoto {
  url: string;
  title: string;
  category?: string;
  width?: number;
  height?: number;
}

interface HotelPhotosGalleryProps {
  hotelId: string;
  hotelName: string;
  fallbackImages: string[];
  className?: string;
}

export const HotelPhotosGallery = ({ 
  hotelId, 
  hotelName, 
  fallbackImages, 
  className 
}: HotelPhotosGalleryProps) => {
  const [photos, setPhotos] = useState<HotelPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [useRealPhotos, setUseRealPhotos] = useState(false);

  useEffect(() => {
    const fetchHotelPhotos = async () => {
      if (!hotelId) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('amadeus-hotel-photos', {
          body: { hotelId }
        });

        if (!error && data?.success && data.photos?.length > 0) {
          setPhotos(data.photos);
          setUseRealPhotos(true);
        } else {
          console.log('No hotel photos available from API');
          setPhotos([]);
          setUseRealPhotos(false);
        }
      } catch (err) {
        console.error("Failed to fetch hotel photos:", err);
        setPhotos([]);
        setUseRealPhotos(false);
      } finally {
        setLoading(false);
      }
    };

    fetchHotelPhotos();
  }, [hotelId, hotelName, fallbackImages]);

  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-muted-foreground">Loading photos...</span>
        </CardContent>
      </Card>
    );
  }

  if (photos.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <p>No photos available</p>
            <p className="text-sm mt-1">Photos will be available once connected to hotel API</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <div className="relative">
          {/* Main Photo */}
          <div className="relative h-64 md:h-80 overflow-hidden rounded-t-lg">
            <img
              src={photos[currentIndex]?.url || "/placeholder.svg"}
              alt={photos[currentIndex]?.title || hotelName}
              className="w-full h-full object-cover"
            />
            
            {/* Real Photos Badge */}
            {useRealPhotos && (
              <div className="absolute top-3 left-3">
                <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                  ✓ Real Photos
                </span>
              </div>
            )}

            {/* Navigation */}
            {photos.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                  onClick={prevPhoto}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                  onClick={nextPhoto}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Full Screen Button */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute bottom-3 right-3 bg-black/50 hover:bg-black/70 text-white"
                >
                  <Expand className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl p-0">
                <div className="relative">
                  <img
                    src={photos[currentIndex]?.url || "/placeholder.svg"}
                    alt={photos[currentIndex]?.title || hotelName}
                    className="w-full h-auto max-h-[80vh] object-contain"
                  />
                </div>
              </DialogContent>
            </Dialog>

            {/* Photo Counter */}
            {photos.length > 1 && (
              <div className="absolute bottom-3 left-3 bg-black/50 text-white px-2 py-1 rounded text-xs">
                {currentIndex + 1} / {photos.length}
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {photos.length > 1 && (
            <div className="flex space-x-2 p-3 overflow-x-auto">
              {photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-colors ${
                    index === currentIndex 
                      ? "border-primary" 
                      : "border-transparent hover:border-muted-foreground"
                  }`}
                >
                  <img
                    src={photo.url}
                    alt={`${hotelName} thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};