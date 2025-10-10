import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Wallet, 
  CreditCard, 
  Zap, 
  Target, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  Sparkles,
  Brain,
  Coins
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTravelFunds } from '@/hooks/useTravelFunds';

interface TravelFund {
  id: string;
  name: string;
  balance: number;
  currency: string;
  destination?: string;
  fund_type: 'personal' | 'group' | 'family';
}

interface BiddingData {
  enabled: boolean;
  currentBid: number;
  minimumBid: number;
  originalPrice: number;
  timeRemaining: number;
  dealType: 'flash' | 'auction' | 'negotiation';
}

interface EnhancedCheckoutIntegrationProps {
  bookingData: {
    destination: string;
    amount: number;
    type: 'hotel' | 'flight' | 'activity';
    dates: { checkIn: string; checkOut: string; };
  };
  biddingData?: BiddingData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentMethodSelected: (method: {
    fundUsage: Array<{ fundId: string; amount: number; }>;
    cardPayment: number;
    biddingAmount?: number;
    totalCovered: number;
  }) => void;
}

export const EnhancedCheckoutIntegration: React.FC<EnhancedCheckoutIntegrationProps> = ({
  bookingData,
  biddingData,
  open,
  onOpenChange,
  onPaymentMethodSelected
}) => {
  const { toast } = useToast();
  const { funds } = useTravelFunds();
  const [paymentMode, setPaymentMode] = useState<'funds' | 'bidding' | 'hybrid'>('funds');
  const [selectedFunds, setSelectedFunds] = useState<Record<string, number>>({});
  const [bidAmount, setBidAmount] = useState(biddingData?.minimumBid || 0);
  const [autoBidEnabled, setAutoBidEnabled] = useState(false);
  
  const totalFundBalance = funds.reduce((total, fund) => total + fund.balance, 0);
  const totalSelectedFundAmount = Object.values(selectedFunds).reduce((total, amount) => total + amount, 0);
  const remainingCardPayment = Math.max(0, bookingData.amount - totalSelectedFundAmount);
  
  // Smart fund matching based on destination
  const getSmartFundSuggestions = () => {
    return funds
      .filter(fund => 
        fund.destination?.toLowerCase().includes(bookingData.destination.toLowerCase()) ||
        fund.balance >= bookingData.amount * 0.25 // At least 25% coverage
      )
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 3);
  };

  const smartSuggestions = getSmartFundSuggestions();
  const canFullyCover = totalFundBalance >= bookingData.amount;

  const handleSmartFundAllocation = () => {
    let remainingAmount = bookingData.amount;
    const newSelectedFunds: Record<string, number> = {};
    
    for (const suggestion of smartSuggestions) {
      if (remainingAmount <= 0) break;
      
      const useAmount = Math.min(suggestion.balance, remainingAmount);
      if (useAmount > 0) {
        newSelectedFunds[suggestion.id] = useAmount;
        remainingAmount -= useAmount;
      }
    }
    
    setSelectedFunds(newSelectedFunds);
    toast({
      title: "Smart allocation applied",
      description: `Optimized fund usage for your ${bookingData.destination} booking`,
    });
  };

  const handleConfirmPayment = () => {
    const fundUsageArray = Object.entries(selectedFunds)
      .filter(([_, amount]) => amount > 0)
      .map(([fundId, amount]) => ({ fundId, amount }));

    const paymentMethod = {
      fundUsage: fundUsageArray,
      cardPayment: remainingCardPayment,
      biddingAmount: paymentMode === 'bidding' ? bidAmount : undefined,
      totalCovered: totalSelectedFundAmount + (paymentMode === 'bidding' ? bidAmount : 0)
    };

    onPaymentMethodSelected(paymentMethod);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-orange-500" />
            Enhanced Payment Options
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Smart Fund Suggestions */}
          {smartSuggestions.length > 0 && (
            <Card className="bg-gradient-to-r from-orange-50 to-green-50 border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="h-5 w-5 text-orange-600" />
                  Smart Fund Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {smartSuggestions.map((fund) => (
                    <div key={fund.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div>
                        <h4 className="font-medium text-gray-900">{fund.name}</h4>
                        <p className="text-sm text-gray-600">
                          ${fund.balance} available {fund.destination && `• ${fund.destination}`}
                        </p>
                      </div>
                      <Badge className="bg-orange-100 text-orange-600">
                        {fund.destination?.toLowerCase().includes(bookingData.destination.toLowerCase()) 
                          ? 'Perfect Match' 
                          : 'Good Option'}
                      </Badge>
                    </div>
                  ))}
                  
                  <Button 
                    onClick={handleSmartFundAllocation}
                    className="w-full bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Apply Smart Allocation
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Mode Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card 
              className={`cursor-pointer transition-all ${paymentMode === 'funds' ? 'ring-2 ring-orange-500 bg-orange-50' : 'hover:bg-gray-50'}`}
              onClick={() => setPaymentMode('funds')}
            >
              <CardContent className="p-4 text-center">
                <Wallet className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                <h3 className="font-medium">Travel Funds</h3>
                <p className="text-sm text-gray-600">Use saved money</p>
              </CardContent>
            </Card>

            {biddingData?.enabled && (
              <Card 
                className={`cursor-pointer transition-all ${paymentMode === 'bidding' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                onClick={() => setPaymentMode('bidding')}
              >
                <CardContent className="p-4 text-center">
                  <Zap className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <h3 className="font-medium">Smart Bidding</h3>
                  <p className="text-sm text-gray-600">Lock deal with bid</p>
                </CardContent>
              </Card>
            )}

            <Card 
              className={`cursor-pointer transition-all ${paymentMode === 'hybrid' ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:bg-gray-50'}`}
              onClick={() => setPaymentMode('hybrid')}
            >
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <h3 className="font-medium">Hybrid</h3>
                <p className="text-sm text-gray-600">Funds + Bidding</p>
              </CardContent>
            </Card>
          </div>

          {/* Bidding Interface (when enabled) */}
          {paymentMode === 'bidding' && biddingData && (
            <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  Smart Bidding with Funds
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Original Price</p>
                    <p className="text-xl font-bold line-through text-gray-400">
                      ${biddingData.originalPrice.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Current Bid</p>
                    <p className="text-xl font-bold text-blue-600">
                      ${biddingData.currentBid.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Your Bid Amount</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(Number(e.target.value))}
                      min={biddingData.minimumBid}
                      max={totalFundBalance}
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => setBidAmount(Math.min(totalFundBalance, biddingData.currentBid + 100))}
                    >
                      Competitive
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-100 rounded-lg">
                  <span className="text-sm font-medium">Fund Coverage</span>
                  <span className="text-lg font-bold text-blue-600">
                    {totalFundBalance >= bidAmount ? '100%' : `${Math.round((totalFundBalance / bidAmount) * 100)}%`}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Clock className="h-4 w-4" />
                  <span>{Math.round(biddingData.timeRemaining / 60)} minutes remaining</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fund Selection Interface */}
          {(paymentMode === 'funds' || paymentMode === 'hybrid') && (
            <Card>
              <CardHeader>
                <CardTitle>Select Travel Funds</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {funds.map((fund) => (
                  <div key={fund.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{fund.name}</h4>
                        <p className="text-sm text-gray-600">
                          Available: ${fund.balance} {fund.destination && `• ${fund.destination}`}
                        </p>
                      </div>
                      <Badge variant="secondary">{fund.fund_type}</Badge>
                    </div>
                    
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Amount to use"
                        value={selectedFunds[fund.id] || ''}
                        onChange={(e) => {
                          const amount = Number(e.target.value) || 0;
                          if (amount <= fund.balance) {
                            setSelectedFunds(prev => ({ ...prev, [fund.id]: amount }));
                          }
                        }}
                        max={fund.balance}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const maxUsable = Math.min(
                            fund.balance, 
                            bookingData.amount - totalSelectedFundAmount + (selectedFunds[fund.id] || 0)
                          );
                          setSelectedFunds(prev => ({ ...prev, [fund.id]: maxUsable }));
                        }}
                      >
                        Max
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Payment Summary */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Booking Amount:</span>
                  <span className="font-medium">${bookingData.amount.toLocaleString()}</span>
                </div>
                
                {totalSelectedFundAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Wallet className="h-3 w-3 text-green-500" />
                      Fund Payment:
                    </span>
                    <span className="font-medium text-green-600">
                      -${totalSelectedFundAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                
                {paymentMode === 'bidding' && bidAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-blue-500" />
                      Bid Amount:
                    </span>
                    <span className="font-medium text-blue-600">
                      ${bidAmount.toLocaleString()}
                    </span>
                  </div>
                )}
                
                {remainingCardPayment > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <CreditCard className="h-3 w-3 text-gray-500" />
                      Card Payment:
                    </span>
                    <span className="font-medium">${remainingCardPayment.toFixed(2)}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>${bookingData.amount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warnings & Tips */}
          {!canFullyCover && paymentMode === 'funds' && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">Partial Fund Coverage</p>
                <p className="text-amber-700">
                  Your funds can cover ${totalSelectedFundAmount.toFixed(2)}. 
                  Consider creating a fund for future {bookingData.destination} trips!
                </p>
              </div>
            </div>
          )}

          {biddingData?.enabled && paymentMode === 'bidding' && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Zap className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800">Smart Bidding Active</p>
                <p className="text-blue-700">
                  Save ${(biddingData.originalPrice - bidAmount).toLocaleString()} with strategic bidding. 
                  Your funds will be temporarily locked during the bid.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleConfirmPayment}
              disabled={paymentMode === 'funds' && totalSelectedFundAmount === 0}
              className="flex-1 bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white"
            >
              {paymentMode === 'bidding' 
                ? `Place Bid: $${bidAmount.toLocaleString()}`
                : `Confirm Payment: $${(totalSelectedFundAmount || bookingData.amount).toFixed(2)}`
              }
            </Button>
            
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedCheckoutIntegration;