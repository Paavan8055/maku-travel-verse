import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertCircle, CreditCard, Wallet, Gift } from 'lucide-react';

interface BookingFlowManagerProps {
  bookingType: 'flight' | 'hotel' | 'activity' | 'package';
  bookingData: any;
  customerInfo: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  onComplete?: (booking: any) => void;
}

interface CrossSellRecommendations {
  bundles: any[];
  insurance: any;
  transfers: any;
  activities: any[];
  upgrades: any[];
  addons: any[];
}

const BookingFlowManager: React.FC<BookingFlowManagerProps> = ({
  bookingType,
  bookingData,
  customerInfo,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState<string>();
  const [recommendations, setRecommendations] = useState<CrossSellRecommendations | null>(null);
  const [selectedItems, setSelectedItems] = useState<{
    insurance: boolean;
    transfers: boolean;
    activities: string[];
    upgrades: string[];
    addons: string[];
  }>({
    insurance: false,
    transfers: false,
    activities: [],
    upgrades: [],
    addons: []
  });
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'fund' | 'split'>('card');
  const [fundBalance, setFundBalance] = useState(0);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  
  const { toast } = useToast();

  const steps = [
    'Select Extras',
    'Choose Payment',
    'Confirm Booking',
    'Complete'
  ];

  React.useEffect(() => {
    loadRecommendations();
    loadUserBalance();
    loadLoyaltyPoints();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('cross-sell-engine', {
        body: {
          bookingType,
          bookingData,
          location: {
            destination: bookingData.destination || bookingData.cityCode || 'SYD',
            departureDate: bookingData.departureDate || bookingData.checkInDate,
            returnDate: bookingData.returnDate || bookingData.checkOutDate
          }
        }
      });

      if (error) throw error;
      setRecommendations(data.recommendations);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      toast({
        title: "Unable to load recommendations",
        description: "Continuing with basic booking flow",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserBalance = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-user-fund-balance');
      if (!error && data) {
        setFundBalance(data.balance || 0);
      }
    } catch (error) {
      console.error('Failed to load fund balance:', error);
    }
  };

  const loadLoyaltyPoints = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('loyalty-points-manager', {
        body: { action: 'check_balance', userId: 'current' }
      });
      if (!error && data) {
        setLoyaltyPoints(data.balance || 0);
      }
    } catch (error) {
      console.error('Failed to load loyalty points:', error);
    }
  };

  const calculateTotal = () => {
    let total = bookingData.price?.amount || bookingData.totalPrice || 0;
    
    if (selectedItems.insurance && recommendations?.insurance) {
      total += recommendations.insurance.price;
    }
    
    if (selectedItems.transfers && recommendations?.transfers) {
      total += recommendations.transfers.price;
    }
    
    selectedItems.activities.forEach(activityId => {
      const activity = recommendations?.activities.find(a => a.id === activityId);
      if (activity) total += activity.price.amount;
    });
    
    selectedItems.upgrades.forEach(upgradeId => {
      const upgrade = recommendations?.upgrades.find(u => u.type === upgradeId);
      if (upgrade) total += upgrade.price;
    });
    
    selectedItems.addons.forEach(addonId => {
      const addon = recommendations?.addons.find(a => a.type === addonId);
      if (addon) total += addon.price;
    });
    
    return total;
  };

  const initiateBooking = async () => {
    try {
      setLoading(true);
      
      const crossSellItems = {
        insurance: selectedItems.insurance,
        transfers: selectedItems.transfers,
        activities: selectedItems.activities.map(id => 
          recommendations?.activities.find(a => a.id === id)
        ).filter(Boolean)
      };

      const { data, error } = await supabase.functions.invoke('booking-flow-manager', {
        body: {
          step: 'initiate',
          bookingType,
          bookingData,
          customerInfo,
          paymentMethod,
          fundAmount: paymentMethod === 'fund' ? Math.min(fundBalance, calculateTotal()) : 
                     paymentMethod === 'split' ? Math.min(fundBalance, calculateTotal()) : 0,
          selectedAddons: [...selectedItems.upgrades, ...selectedItems.addons],
          crossSellItems
        }
      });

      if (error) throw error;
      
      setBookingId(data.booking.id);
      
      if (data.payment.clientSecret) {
        // Redirect to Stripe for card payment
        window.location.href = `https://checkout.stripe.com/pay/${data.payment.clientSecret}`;
      } else {
        // Fund payment completed, proceed to confirmation
        setCurrentStep(3);
      }
      
    } catch (error) {
      console.error('Booking initiation failed:', error);
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Enhance Your Trip</h3>
            
            {/* Travel Insurance */}
            {recommendations?.insurance && (
              <Card className={selectedItems.insurance ? 'ring-2 ring-primary' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{recommendations.insurance.title}</h4>
                      <p className="text-sm text-muted-foreground">{recommendations.insurance.description}</p>
                      {recommendations.insurance.recommended && (
                        <Badge variant="secondary" className="mt-2">Recommended</Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${recommendations.insurance.price} {recommendations.insurance.currency}</p>
                      <Button
                        variant={selectedItems.insurance ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedItems(prev => ({ ...prev, insurance: !prev.insurance }))}
                      >
                        {selectedItems.insurance ? 'Added' : 'Add'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Airport Transfers */}
            {recommendations?.transfers && (
              <Card className={selectedItems.transfers ? 'ring-2 ring-primary' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{recommendations.transfers.title}</h4>
                      <p className="text-sm text-muted-foreground">{recommendations.transfers.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${recommendations.transfers.price} {recommendations.transfers.currency}</p>
                      <Button
                        variant={selectedItems.transfers ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedItems(prev => ({ ...prev, transfers: !prev.transfers }))}
                      >
                        {selectedItems.transfers ? 'Added' : 'Add'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Activities */}
            {recommendations?.activities && recommendations.activities.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Popular Activities</h4>
                <div className="grid gap-3">
                  {recommendations.activities.slice(0, 3).map((activity: any) => (
                    <Card key={activity.id} className={selectedItems.activities.includes(activity.id) ? 'ring-2 ring-primary' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium">{activity.name}</h5>
                            <p className="text-sm text-muted-foreground">{activity.description}</p>
                            <p className="text-sm text-muted-foreground">{activity.duration}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${activity.price.amount} {activity.price.currency}</p>
                            <Button
                              variant={selectedItems.activities.includes(activity.id) ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedItems(prev => ({
                                ...prev,
                                activities: prev.activities.includes(activity.id)
                                  ? prev.activities.filter(id => id !== activity.id)
                                  : [...prev.activities, activity.id]
                              }))}
                            >
                              {selectedItems.activities.includes(activity.id) ? 'Added' : 'Add'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Upgrades & Add-ons */}
            {recommendations?.upgrades && recommendations.upgrades.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Upgrades & Add-ons</h4>
                <div className="grid gap-3">
                  {recommendations.upgrades.map((upgrade: any) => (
                    <Card key={upgrade.type} className={selectedItems.upgrades.includes(upgrade.type) ? 'ring-2 ring-primary' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium">{upgrade.title}</h5>
                            <p className="text-sm text-muted-foreground">{upgrade.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${upgrade.price}</p>
                            <Button
                              variant={selectedItems.upgrades.includes(upgrade.type) ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedItems(prev => ({
                                ...prev,
                                upgrades: prev.upgrades.includes(upgrade.type)
                                  ? prev.upgrades.filter(t => t !== upgrade.type)
                                  : [...prev.upgrades, upgrade.type]
                              }))}
                            >
                              {selectedItems.upgrades.includes(upgrade.type) ? 'Added' : 'Add'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold">Total: ${calculateTotal()}</span>
                <Button onClick={() => setCurrentStep(2)} disabled={loading}>
                  Continue to Payment
                </Button>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Choose Payment Method</h3>
            
            <div className="grid gap-4">
              {/* Card Payment */}
              <Card className={paymentMethod === 'card' ? 'ring-2 ring-primary' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-5 w-5" />
                    <div className="flex-1">
                      <h4 className="font-medium">Credit/Debit Card</h4>
                      <p className="text-sm text-muted-foreground">Pay securely with your card</p>
                    </div>
                    <Button
                      variant={paymentMethod === 'card' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPaymentMethod('card')}
                    >
                      Select
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Fund Payment */}
              {fundBalance > 0 && (
                <Card className={paymentMethod === 'fund' ? 'ring-2 ring-primary' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Wallet className="h-5 w-5" />
                      <div className="flex-1">
                        <h4 className="font-medium">Account Funds</h4>
                        <p className="text-sm text-muted-foreground">
                          Available: ${fundBalance}
                          {fundBalance < calculateTotal() && (
                            <span className="text-destructive"> (Insufficient funds)</span>
                          )}
                        </p>
                      </div>
                      <Button
                        variant={paymentMethod === 'fund' ? "default" : "outline"}
                        size="sm"
                        disabled={fundBalance < calculateTotal()}
                        onClick={() => setPaymentMethod('fund')}
                      >
                        Select
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Split Payment */}
              {fundBalance > 0 && fundBalance < calculateTotal() && (
                <Card className={paymentMethod === 'split' ? 'ring-2 ring-primary' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Gift className="h-5 w-5" />
                      <div className="flex-1">
                        <h4 className="font-medium">Split Payment</h4>
                        <p className="text-sm text-muted-foreground">
                          ${fundBalance} from funds + ${calculateTotal() - fundBalance} from card
                        </p>
                      </div>
                      <Button
                        variant={paymentMethod === 'split' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPaymentMethod('split')}
                      >
                        Select
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Loyalty Points Display */}
            {loyaltyPoints > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Loyalty Points</h4>
                      <p className="text-sm text-muted-foreground">You have {loyaltyPoints} points</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Earn {Math.floor(calculateTotal())} more points</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="pt-4 border-t">
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Back
                </Button>
                <Button onClick={initiateBooking} disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Proceed to Payment
                </Button>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h3 className="text-xl font-semibold">Booking Confirmed!</h3>
            <p className="text-muted-foreground">
              Your booking has been confirmed and you'll receive a confirmation email shortly.
            </p>
            
            {loyaltyPoints > 0 && (
              <Card>
                <CardContent className="p-4">
                  <p className="font-medium">🎉 You earned {Math.floor(calculateTotal())} loyalty points!</p>
                </CardContent>
              </Card>
            )}

            <Button onClick={() => onComplete?.(bookingId)}>
              View Booking Details
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading && !recommendations) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading booking options...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Booking</CardTitle>
        <div className="flex items-center space-x-4">
          <Progress value={(currentStep / steps.length) * 100} className="flex-1" />
          <span className="text-sm text-muted-foreground">
            Step {currentStep} of {steps.length}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          {steps.map((step, index) => (
            <span
              key={step}
              className={`${
                index + 1 <= currentStep ? 'text-primary font-medium' : 'text-muted-foreground'
              }`}
            >
              {step}
            </span>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {renderStepContent()}
      </CardContent>
    </Card>
  );
};

export default BookingFlowManager;