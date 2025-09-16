import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft } from "lucide-react";

export default function BookingSelect() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const hotelId = searchParams.get("hotelId")!;
  const offerId = searchParams.get("offerId")!;
  const checkIn = searchParams.get("checkIn")!;
  const checkOut = searchParams.get("checkOut")!;
  const adults = searchParams.get("adults") || "2";
  const children = searchParams.get("children") || "0";
  const rooms = searchParams.get("rooms") || "1";

  // Optional UX: allow bed preference / special requests
  const [bedPref, setBedPref] = useState("any");
  const [note, setNote] = useState("");

  const proceed = () => {
    const params = new URLSearchParams({
      hotelId,
      offerId,
      checkIn,
      checkOut,
      adults,
      children,
      rooms,
      bedPref,
      note: encodeURIComponent(note)
    });
    
    navigate(`/booking/extras?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-4 space-y-4 pt-24">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Hotel Details
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Room Selection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
              <strong>Selected Offer:</strong> {offerId}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Bed Preference</label>
              <select
                className="w-full border rounded-md p-2"
                value={bedPref}
                onChange={(e) => setBedPref(e.target.value)}
              >
                <option value="any">Any bed type</option>
                <option value="king">King bed</option>
                <option value="queen">Queen bed</option>
                <option value="twin">Twin beds</option>
                <option value="double">Double bed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Special Requests</label>
              <Input 
                value={note} 
                onChange={(e) => setNote(e.target.value)} 
                placeholder="High floor, early check-in, etc. (optional)" 
              />
              <p className="text-xs text-muted-foreground mt-1">
                Requests are subject to availability and hotel approval
              </p>
            </div>

            <Button onClick={proceed} className="w-full mt-6">
              Continue to Extras
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}