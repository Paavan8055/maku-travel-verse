import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Wallet, CreditCard, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { TravelFund } from '@/lib/travelFundClient';

interface FundUsageDialogProps {
  funds: TravelFund[];
  bookingAmount: number;
  currency: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (selectedFunds: { fundId: string; amount: number }[], remainingAmount: number) => void;
}

export const FundUsageDialog: React.FC<FundUsageDialogProps> = ({
  funds,
  bookingAmount,
  currency,
  open,
  onOpenChange,
  onConfirm
}) => {
  const { toast } = useToast();
  const [selectedFunds, setSelectedFunds] = useState<Record<string, number>>({});
  
  const totalAvailableBalance = funds.reduce((total, fund) => total + fund.balance, 0);
  const totalSelectedAmount = Object.values(selectedFunds).reduce((total, amount) => total + amount, 0);
  const remainingAmount = Math.max(0, bookingAmount - totalSelectedAmount);
  const canCoverFull = totalAvailableBalance >= bookingAmount;

  const handleFundAmountChange = (fundId: string, amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    const fund = funds.find(f => f.id === fundId);
    
    if (fund && numAmount <= fund.balance) {
      setSelectedFunds(prev => ({
        ...prev,
        [fundId]: numAmount
      }));
    }
  };

  const handleMaxAmount = (fundId: string) => {
    const fund = funds.find(f => f.id === fundId);
    if (!fund) return;

    const maxUsable = Math.min(fund.balance, remainingAmount + (selectedFunds[fundId] || 0));
    setSelectedFunds(prev => ({
      ...prev,
      [fundId]: maxUsable
    }));
  };

  const handleConfirm = () => {
    const fundUsageArray = Object.entries(selectedFunds)
      .filter(([_, amount]) => amount > 0)
      .map(([fundId, amount]) => ({ fundId, amount }));

    if (fundUsageArray.length === 0) {
      toast({
        title: "No funds selected",
        description: "Please select at least one fund to use for payment.",
        variant: "destructive"
      });
      return;
    }

    onConfirm(fundUsageArray, remainingAmount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Use Travel Funds
          </DialogTitle>
          <DialogDescription>
            Select which travel funds to use for this ${bookingAmount} {currency} booking
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Booking Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Booking Amount:</span>
                <span className="text-lg font-bold">${bookingAmount} {currency}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Fund Payment:</span>
                <span className="text-lg font-bold text-green-600">
                  ${totalSelectedAmount.toFixed(2)} {currency}
                </span>
              </div>
              {remainingAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="font-medium flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Card Payment:
                  </span>
                  <span className="text-lg font-bold">${remainingAmount.toFixed(2)} {currency}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fund Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Available Travel Funds</Label>
            
            {funds.map(fund => (
              <Card key={fund.id} className="relative">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium">{fund.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Available: ${fund.balance} {fund.currency}
                      </p>
                    </div>
                    <Badge variant="secondary">{fund.fund_type}</Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-xs">Amount to use</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        min="0"
                        max={fund.balance}
                        step="0.01"
                        value={selectedFunds[fund.id] || ''}
                        onChange={(e) => handleFundAmountChange(fund.id, e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex flex-col justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMaxAmount(fund.id)}
                        disabled={fund.balance === 0}
                      >
                        Max
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Warnings */}
          {!canCoverFull && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="text-amber-800 font-medium">Partial Payment</p>
                <p className="text-amber-700">
                  Your travel funds can't cover the full amount. The remaining ${remainingAmount.toFixed(2)} will be charged to your card.
                </p>
              </div>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleConfirm}
              className="flex-1"
              disabled={totalSelectedAmount === 0}
            >
              {remainingAmount > 0 
                ? `Pay $${totalSelectedAmount.toFixed(2)} from Funds`
                : `Pay Full Amount from Funds`
              }
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};