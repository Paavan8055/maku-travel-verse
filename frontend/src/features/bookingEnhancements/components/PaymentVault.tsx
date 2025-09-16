import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { fetchPaymentMethods } from "@/lib/bookingDataClient";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { CreditCard, Plus, Trash2, Star } from "lucide-react";
import logger from "@/utils/logger";

interface PaymentMethod {
  id: string;
  type: string;
  provider: string;
  last4?: string;
  expiry_month?: number;
  expiry_year?: number;
  is_default: boolean;
  created_at: string;
}

export default function PaymentVault() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadPaymentMethods();
    }
  }, [user]);

  const loadPaymentMethods = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const methods = await fetchPaymentMethods(user.id);
      setPaymentMethods(methods);
    } catch (error) {
      logger.error('Error loading payment methods:', error);
      toast({
        title: "Error",
        description: "Failed to load payment methods.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCardIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
        return '💳';
      case 'paypal':
        return '🅿️';
      default:
        return '💳';
    }
  };

  const formatExpiry = (month?: number, year?: number) => {
    if (!month || !year) return '';
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Methods
          </div>
          <Button size="sm" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : paymentMethods.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No payment methods saved yet.</p>
            <p className="text-sm">Add a payment method for faster checkout.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {getCardIcon(method.provider)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">
                        {method.provider}
                      </span>
                      {method.type && (
                        <Badge variant="secondary" className="text-xs">
                          {method.type}
                        </Badge>
                      )}
                      {method.is_default && (
                        <Badge variant="default" className="text-xs flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          Default
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {method.last4 && `•••• ${method.last4}`}
                      {method.expiry_month && method.expiry_year && (
                        <span className="ml-2">
                          Expires {formatExpiry(method.expiry_month, method.expiry_year)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {paymentMethods.length > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              💡 Your payment methods are encrypted and securely stored. 
              Set a default method for one-click checkout.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}