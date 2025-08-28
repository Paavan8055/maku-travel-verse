import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Gift, CreditCard, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const GiftCards = () => {
  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [redeemCode, setRedeemCode] = useState<string>('');

  const predefinedAmounts = [50, 100, 250, 500, 1000];

  const handlePurchaseGiftCard = async () => {
    const amount = customAmount ? parseFloat(customAmount) : selectedAmount;
    if (amount < 25) {
      toast.error('Minimum gift card amount is $25');
      return;
    }
    toast.success(`Gift card for $${amount} purchased successfully!`);
  };

  const handleRedeemGiftCard = async () => {
    if (!redeemCode) {
      toast.error('Please enter a gift card code');
      return;
    }
    toast.success('Gift card redeemed successfully!');
    setRedeemCode('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              MAKU Gift Cards
            </h1>
            <p className="text-lg text-muted-foreground">
              Give the gift of travel with MAKU gift cards
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Purchase Gift Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Purchase Gift Card
                </CardTitle>
                <CardDescription>
                  Perfect for birthdays, holidays, or any special occasion
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-3 block">
                    Select Amount
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {predefinedAmounts.map((amount) => (
                      <Button
                        key={amount}
                        variant={selectedAmount === amount ? "default" : "outline"}
                        onClick={() => {
                          setSelectedAmount(amount);
                          setCustomAmount('');
                        }}
                        className="h-12"
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Or enter custom amount
                    </label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      min="25"
                    />
                  </div>
                </div>

                <div className="bg-secondary/50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span>Gift Card Value:</span>
                    <span className="font-semibold">
                      ${customAmount || selectedAmount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>You Pay:</span>
                    <span className="font-bold text-lg">
                      ${customAmount || selectedAmount}
                    </span>
                  </div>
                </div>

                <Button 
                  onClick={handlePurchaseGiftCard}
                  className="w-full"
                  size="lg"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Purchase Gift Card
                </Button>
              </CardContent>
            </Card>

            {/* Redeem Gift Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Redeem Gift Card
                </CardTitle>
                <CardDescription>
                  Enter your gift card code to add funds to your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Gift Card Code
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter gift card code"
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                    className="font-mono"
                  />
                </div>

                <Button 
                  onClick={handleRedeemGiftCard}
                  className="w-full"
                  size="lg"
                >
                  Redeem Gift Card
                </Button>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">How to redeem:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Enter your 12-digit gift card code</li>
                    <li>• Funds will be added to your MAKU account</li>
                    <li>• Use at checkout for any booking</li>
                    <li>• No expiration date</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GiftCards;