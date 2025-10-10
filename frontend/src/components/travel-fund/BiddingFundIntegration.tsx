import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Clock, 
  TrendingDown, 
  Lock, 
  Unlock, 
  Target, 
  Wallet,
  AlertCircle,
  CheckCircle,
  Timer
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTravelFunds } from '@/hooks/useTravelFunds';

interface BiddingDeal {
  id: string;
  title: string;
  originalPrice: number;
  currentBid: number;
  minimumBid: number;
  timeRemaining: number; // in seconds
  dealType: 'flash' | 'auction' | 'negotiation';
  location: string;
  participants: number;
  yourRank?: number;
}

interface LockedFund {
  fundId: string;
  fundName: string;
  lockedAmount: number;
  lockDuration: number;
  lockExpiry: Date;
}

interface BiddingFundIntegrationProps {
  deal: BiddingDeal;
  onBidPlaced: (bidData: {
    amount: number;
    fundLocks: LockedFund[];
    autoBidEnabled: boolean;
    maxAutoBid: number;
  }) => void;
  onDealWon: (dealId: string, finalPrice: number) => void;
  onDealLost: (dealId: string) => void;
}

export const BiddingFundIntegration: React.FC<BiddingFundIntegrationProps> = ({
  deal,
  onBidPlaced,
  onDealWon,
  onDealLost
}) => {
  const { toast } = useToast();
  const { funds } = useTravelFunds();
  
  const [bidAmount, setBidAmount] = useState(deal.currentBid + 50);
  const [selectedFunds, setSelectedFunds] = useState<Record<string, number>>({});
  const [autoBidEnabled, setAutoBidEnabled] = useState(false);
  const [maxAutoBid, setMaxAutoBid] = useState(deal.currentBid + 500);
  const [bidStrategy, setBidStrategy] = useState<'conservative' | 'aggressive' | 'maximum'>('conservative');
  const [timeRemaining, setTimeRemaining] = useState(deal.timeRemaining);
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [lockedFunds, setLockedFunds] = useState<LockedFund[]>([]);

  const totalFundBalance = funds.reduce((total, fund) => total + fund.balance, 0);
  const totalSelectedAmount = Object.values(selectedFunds).reduce((total, amount) => total + amount, 0);
  const savingsAmount = deal.originalPrice - bidAmount;
  const fundCoverage = (totalSelectedAmount / bidAmount) * 100;

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-bid strategy calculation
  const getStrategySettings = () => {
    const availableBalance = totalFundBalance;
    switch (bidStrategy) {
      case 'conservative':
        return {
          maxUsage: availableBalance * 0.3,
          incrementAmount: 25,
          description: 'Use up to 30% of your fund balance'
        };
      case 'aggressive':
        return {
          maxUsage: availableBalance * 0.7,
          incrementAmount: 50,
          description: 'Use up to 70% of your fund balance'
        };
      case 'maximum':
        return {
          maxUsage: availableBalance * 0.95,
          incrementAmount: 100,
          description: 'Use almost all available funds'
        };
    }
  };

  const strategySettings = getStrategySettings();

  const handleFundAllocation = (strategy: 'auto' | 'manual') => {
    if (strategy === 'auto') {
      // Smart allocation based on fund balances
      let remainingBid = bidAmount;
      const newAllocation: Record<string, number> = {};
      
      const sortedFunds = [...funds].sort((a, b) => b.balance - a.balance);
      
      for (const fund of sortedFunds) {
        if (remainingBid <= 0) break;
        
        const useAmount = Math.min(fund.balance, remainingBid);
        if (useAmount > 0) {
          newAllocation[fund.id] = useAmount;
          remainingBid -= useAmount;
        }
      }
      
      setSelectedFunds(newAllocation);
      
      toast({
        title: "Funds allocated for bidding",
        description: `$${totalSelectedAmount.toFixed(2)} locked for your bid`,
      });
    }
  };

  const handlePlaceBid = async () => {
    if (totalSelectedAmount < bidAmount) {
      toast({
        title: "Insufficient fund allocation",
        description: "Please allocate enough funds to cover your bid amount",
        variant: "destructive"
      });
      return;
    }

    setIsPlacingBid(true);

    try {
      // Create fund locks for bidding
      const fundLocks: LockedFund[] = Object.entries(selectedFunds).map(([fundId, amount]) => {
        const fund = funds.find(f => f.id === fundId)!;
        return {
          fundId,
          fundName: fund.name,
          lockedAmount: amount,
          lockDuration: Math.max(timeRemaining, 900), // At least 15 minutes
          lockExpiry: new Date(Date.now() + Math.max(timeRemaining * 1000, 900000))
        };
      });

      // Lock funds and place bid
      await Promise.all(fundLocks.map(async (lock) => {
        // Mock API call to lock funds
        const response = await fetch(`/api/travel-funds/${lock.fundId}/bidding/lock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: lock.lockedAmount,
            bid_id: deal.id,
            lock_duration: lock.lockDuration
          })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to lock fund: ${lock.fundName}`);
        }
      }));

      setLockedFunds(fundLocks);

      onBidPlaced({
        amount: bidAmount,
        fundLocks: fundLocks,
        autoBidEnabled: autoBidEnabled,
        maxAutoBid: maxAutoBid
      });

      toast({
        title: "Bid placed successfully!",
        description: `$${bidAmount.toLocaleString()} bid placed with fund backing`,
      });

    } catch (error) {
      toast({
        title: "Bid failed",
        description: error instanceof Error ? error.message : "Failed to place bid",
        variant: "destructive"
      });
    } finally {
      setIsPlacingBid(false);
    }
  };

  const formatTimeRemaining = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Deal Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-blue-600" />
            Smart Deal Bidding
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Original Price</p>
              <p className="text-xl font-bold line-through text-gray-400">
                ${deal.originalPrice.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Current Bid</p>
              <p className="text-xl font-bold text-blue-600">
                ${deal.currentBid.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Your Savings</p>
              <p className="text-xl font-bold text-green-600">
                ${savingsAmount.toLocaleString()}
              </p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-sm text-gray-600">Time Left</p>
              <div className="flex items-center gap-1">
                <Timer className="h-4 w-4 text-orange-500" />
                <p className="text-xl font-bold text-orange-600">
                  {formatTimeRemaining(timeRemaining)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bidding Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Configure Your Bid</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Bid Amount Input */}
          <div className="space-y-2">
            <Label>Bid Amount</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(Number(e.target.value))}
                min={deal.minimumBid}
                max={totalFundBalance}
                className="text-lg font-semibold"
              />
              <Button 
                variant="outline"
                onClick={() => setBidAmount(deal.currentBid + 100)}
              >
                +$100
              </Button>
              <Button 
                variant="outline"
                onClick={() => setBidAmount(Math.min(totalFundBalance, deal.currentBid + 500))}
              >
                Competitive
              </Button>
            </div>
          </div>

          {/* Fund Allocation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Fund Allocation</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleFundAllocation('auto')}
              >
                Auto Allocate
              </Button>
            </div>
            
            {funds.map((fund) => (
              <div key={fund.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{fund.name}</p>
                  <p className="text-sm text-gray-600">Available: ${fund.balance}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={selectedFunds[fund.id] || ''}
                    onChange={(e) => {
                      const amount = Number(e.target.value) || 0;
                      if (amount <= fund.balance) {
                        setSelectedFunds(prev => ({ ...prev, [fund.id]: amount }));
                      }
                    }}
                    className="w-24"
                    max={fund.balance}
                  />
                  {selectedFunds[fund.id] > 0 && (
                    <Lock className="h-4 w-4 text-orange-500" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Fund Coverage Indicator */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between text-sm mb-2">
              <span>Fund Coverage</span>
              <span className="font-semibold">
                {fundCoverage >= 100 ? '100%' : `${Math.round(fundCoverage)}%`}
              </span>
            </div>
            <Progress value={Math.min(fundCoverage, 100)} className="h-2" />
            <p className="text-xs text-gray-600 mt-1">
              {fundCoverage >= 100 
                ? 'Fully covered by your travel funds'
                : `$${(bidAmount - totalSelectedAmount).toFixed(2)} additional funding needed`
              }
            </p>
          </div>

          {/* Auto-Bidding Configuration */}
          <div className="space-y-3 p-4 border border-blue-200 rounded-lg bg-blue-50">
            <div className="flex items-center justify-between">
              <Label htmlFor="autoBid" className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-600" />
                Enable Auto-Bidding
              </Label>
              <Switch
                id="autoBid"
                checked={autoBidEnabled}
                onCheckedChange={setAutoBidEnabled}
              />
            </div>
            
            {autoBidEnabled && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Bidding Strategy</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {['conservative', 'aggressive', 'maximum'].map((strategy) => (
                      <Button
                        key={strategy}
                        size="sm"
                        variant={bidStrategy === strategy ? 'default' : 'outline'}
                        onClick={() => setBidStrategy(strategy as any)}
                        className="capitalize text-xs"
                      >
                        {strategy}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600">
                    {strategySettings.description}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Maximum Auto-Bid</Label>
                  <Input
                    type="number"
                    value={maxAutoBid}
                    onChange={(e) => setMaxAutoBid(Number(e.target.value))}
                    max={strategySettings.maxUsage}
                    min={bidAmount}
                  />
                  <p className="text-xs text-gray-600">
                    System will bid up to this amount automatically
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Locked Funds Display */}
          {lockedFunds.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <Lock className="h-5 w-5" />
                  Funds Locked for Bidding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lockedFunds.map((lock) => (
                    <div key={lock.fundId} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div>
                        <p className="font-medium text-sm">{lock.fundName}</p>
                        <p className="text-xs text-gray-600">
                          Expires: {lock.lockExpiry.toLocaleTimeString()}
                        </p>
                      </div>
                      <Badge className="bg-orange-500 text-white">
                        ${lock.lockedAmount} Locked
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bid Summary */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Your Bid:</span>
              <span className="text-xl font-bold text-blue-600">${bidAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Fund Coverage:</span>
              <span className={`font-medium ${fundCoverage >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
                ${totalSelectedAmount.toLocaleString()} ({Math.round(fundCoverage)}%)
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Potential Savings:</span>
              <span className="font-medium text-green-600">${savingsAmount.toLocaleString()}</span>
            </div>
            {autoBidEnabled && (
              <div className="flex justify-between text-sm">
                <span>Max Auto-Bid:</span>
                <span className="font-medium text-purple-600">${maxAutoBid.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Warnings */}
          {timeRemaining < 300 && ( // Less than 5 minutes
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-700">
                <span className="font-medium">Auction ending soon!</span> 
                Less than 5 minutes remaining.
              </p>
            </div>
          )}

          {fundCoverage < 100 && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <p className="text-sm text-amber-700">
                <span className="font-medium">Partial fund coverage.</span> 
                ${(bidAmount - totalSelectedAmount).toFixed(2)} will be charged to your card if you win.
              </p>
            </div>
          )}

          {/* Action Button */}
          <Button
            onClick={handlePlaceBid}
            disabled={totalSelectedAmount === 0 || timeRemaining === 0 || isPlacingBid}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-lg py-6"
          >
            {isPlacingBid ? (
              <>
                <Clock className="h-5 w-5 mr-2 animate-spin" />
                Placing Bid...
              </>
            ) : timeRemaining === 0 ? (
              'Auction Ended'
            ) : (
              <>
                <Zap className="h-5 w-5 mr-2" />
                Place Bid: ${bidAmount.toLocaleString()}
                {autoBidEnabled && <span className="text-sm ml-2">(Auto-Bid Active)</span>}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Deal Status Tracking */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {deal.participants} active bidders
              </span>
              {deal.yourRank && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm font-medium">
                    You're #{deal.yourRank}
                  </span>
                </>
              )}
            </div>
            
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {deal.dealType.toUpperCase()}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BiddingFundIntegration;