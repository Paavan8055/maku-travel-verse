// Conversion optimization components: urgency badges, fund balance, save search
import React, { useState } from "react";
import { Clock, Wallet, Heart, Mail, TrendingDown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface UrgencyBadgeProps {
  type: "rooms_left" | "flash_deal" | "high_demand" | "last_booking";
  value?: number;
  endTime?: Date;
}

export const UrgencyBadge = ({ type, value, endTime }: UrgencyBadgeProps) => {
  const [timeLeft, setTimeLeft] = useState("");

  // Update countdown timer
  React.useEffect(() => {
    if (type === "flash_deal" && endTime) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const distance = endTime.getTime() - now;
        
        if (distance > 0) {
          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);
          setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        } else {
          setTimeLeft("EXPIRED");
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [type, endTime]);

  const getBadgeContent = () => {
    switch (type) {
      case "rooms_left":
        return {
          text: `Only ${value} rooms left!`,
          variant: "destructive" as const,
          icon: <Users className="h-3 w-3" />
        };
      case "flash_deal":
        return {
          text: `Flash deal ends in ${timeLeft}`,
          variant: "secondary" as const,
          icon: <Clock className="h-3 w-3" />
        };
      case "high_demand":
        return {
          text: "High demand - book now!",
          variant: "destructive" as const,
          icon: <TrendingDown className="h-3 w-3" />
        };
      case "last_booking":
        return {
          text: `Booked ${value} times in last 24h`,
          variant: "secondary" as const,
          icon: <Users className="h-3 w-3" />
        };
      default:
        return null;
    }
  };

  const badgeContent = getBadgeContent();
  if (!badgeContent) return null;

  return (
    <Badge variant={badgeContent.variant} className="flex items-center space-x-1 animate-pulse">
      {badgeContent.icon}
      <span className="text-xs font-medium">{badgeContent.text}</span>
    </Badge>
  );
};

interface TravelFundBalanceProps {
  balance: number;
  currency: string;
  onApplyFund: (applied: boolean) => void;
  isApplied: boolean;
}

export const TravelFundBalance = ({ balance, currency, onApplyFund, isApplied }: TravelFundBalanceProps) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Wallet className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-blue-900">Travel Fund Balance</p>
            <p className="text-lg font-bold text-blue-600">{currency}{balance.toFixed(2)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="apply-fund"
            checked={isApplied}
            onCheckedChange={onApplyFund}
          />
          <Label htmlFor="apply-fund" className="text-sm text-blue-900">
            Apply to booking
          </Label>
        </div>
      </div>
      {isApplied && (
        <p className="text-xs text-blue-700 mt-2">
          ✓ Fund will be applied at checkout
        </p>
      )}
    </div>
  );
};

interface SaveSearchProps {
  searchCriteria: {
    destination: string;
    checkIn: string;
    checkOut: string;
    rooms: any[];
  };
}

export const SaveSearchActions = ({ searchCriteria }: SaveSearchProps) => {
  const [isSaved, setIsSaved] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [email, setEmail] = useState("");

  const handleSaveSearch = () => {
    // In production, save to user's saved searches
    setIsSaved(true);
    toast.success("Search saved! We'll notify you of price changes.");
  };

  const handleEmailAlerts = () => {
    if (!email) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    // In production, set up email alerts
    toast.success("Email alerts set up! We'll send you the best deals.");
    setEmailDialogOpen(false);
    setEmail("");
  };

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant={isSaved ? "default" : "outline"}
        size="sm"
        onClick={handleSaveSearch}
        className="flex items-center space-x-1"
      >
        <Heart className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
        <span>{isSaved ? "Saved" : "Save Search"}</span>
      </Button>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center space-x-1">
            <Mail className="h-4 w-4" />
            <span>Email Deals</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Get the Best Deals by Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We'll monitor prices for your search and send you alerts when we find great deals.
            </p>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <h4 className="font-medium text-sm mb-1">Your Search:</h4>
              <p className="text-sm text-muted-foreground">
                {searchCriteria.destination} • {searchCriteria.checkIn} to {searchCriteria.checkOut} • {searchCriteria.rooms.length} room(s)
              </p>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleEmailAlerts} className="flex-1">
                Set Up Alerts
              </Button>
              <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface GuestReviewSnippetProps {
  review: {
    author: string;
    rating: number;
    text: string;
    verified: boolean;
  };
}

export const GuestReviewSnippet = ({ review }: GuestReviewSnippetProps) => {
  return (
    <div className="bg-muted/50 border rounded-lg p-3">
      <div className="flex items-center space-x-2 mb-2">
        <div className="flex">
          {Array.from({ length: 5 }, (_, i) => (
            <span
              key={i}
              className={`text-xs ${i < review.rating ? "text-yellow-400" : "text-gray-300"}`}
            >
              ★
            </span>
          ))}
        </div>
        <span className="text-xs font-medium">{review.author}</span>
        {review.verified && (
          <Badge variant="outline" className="text-xs">
            ✓ Verified
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2">
        "{review.text}"
      </p>
    </div>
  );
};

export const BestPriceGuarantee = () => {
  return (
    <div className="flex items-center space-x-2 p-2 bg-green-50 border border-green-200 rounded-lg">
      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
        <span className="text-white text-xs font-bold">✓</span>
      </div>
      <div>
        <p className="text-xs font-medium text-green-800">Best Price Guarantee</p>
        <p className="text-xs text-green-600">We'll match any lower price</p>
      </div>
    </div>
  );
};