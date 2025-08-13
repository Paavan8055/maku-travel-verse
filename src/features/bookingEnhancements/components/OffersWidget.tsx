import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listDynamicOffers } from "@/lib/bookingDataClient";
import { Tag, Clock, Zap } from "lucide-react";
interface DynamicOffer {
  id: string;
  route: string;
  hotel_chain?: string;
  airline?: string;
  discount_pct: number;
  offer_type: string;
  description: string;
  valid_until: string;
  created_at: string;
}
interface OffersWidgetProps {
  route?: string;
  limit?: number;
}
export default function OffersWidget({
  route,
  limit = 3
}: OffersWidgetProps) {
  const [offers, setOffers] = useState<DynamicOffer[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadOffers();
  }, [route]);
  const loadOffers = async () => {
    setLoading(true);
    try {
      const data = await listDynamicOffers({
        route,
        limit
      });
      setOffers(data);
    } catch (error) {
      console.error('Error loading offers:', error);
    } finally {
      setLoading(false);
    }
  };
  const getOfferTypeColor = (type: string) => {
    switch (type) {
      case 'flash_sale':
        return 'destructive';
      case 'early_bird':
        return 'default';
      case 'weekend_special':
        return 'secondary';
      default:
        return 'outline';
    }
  };
  const getTimeRemaining = (validUntil: string) => {
    const now = new Date();
    const expiry = new Date(validUntil);
    const diff = expiry.getTime() - now.getTime();
    if (diff <= 0) return 'Expired';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff % (1000 * 60 * 60 * 24) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };
  if (loading) {
    return <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Special Offers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}
          </div>
        </CardContent>
      </Card>;
  }
  if (offers.length === 0) {
    return;
  }
  return <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Special Offers
          <Zap className="h-4 w-4 text-yellow-500" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {offers.map(offer => <div key={offer.id} className="p-4 border rounded-lg bg-gradient-to-r from-primary/5 to-secondary/5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant={getOfferTypeColor(offer.offer_type)}>
                    {offer.discount_pct}% OFF
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {offer.route}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {getTimeRemaining(offer.valid_until)}
                </div>
              </div>
              
              <h4 className="font-semibold text-sm mb-1">
                {offer.hotel_chain || offer.airline} Special
              </h4>
              
              <p className="text-sm text-muted-foreground mb-3">
                {offer.description}
              </p>
              
              <Button size="sm" className="w-full">
                Apply Offer
              </Button>
            </div>)}
        </div>
        
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <Zap className="h-3 w-3" />
            Offers are automatically applied at checkout when booking eligible items.
          </p>
        </div>
      </CardContent>
    </Card>;
}