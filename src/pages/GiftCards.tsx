import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gift, CreditCard, CheckCircle, Clock, Plane, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/currency';
import GiftCardPreview from '@/components/GiftCardPreview';
import ThemeSelector, { Theme } from '@/components/ThemeSelector';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import heroMaldives from '@/assets/hero-maldives.jpg';
import heroSwissAlps from '@/assets/hero-swiss-alps.jpg';
import heroTokyo from '@/assets/hero-tokyo.jpg';
import heroSydney from '@/assets/hero-sydney.jpg';

const GiftCards = () => {
  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [redeemCode, setRedeemCode] = useState<string>('');
  
  const predefinedAmounts = [100, 250, 500, 1000, 5000, 10000];
  
  const themes: Theme[] = [
    {
      id: 'maldives',
      name: 'Maldives Paradise',
      image: heroMaldives,
      gradient: 'linear-gradient(135deg, hsl(195, 100%, 45%), hsl(200, 100%, 70%))'
    },
    {
      id: 'swiss-alps',
      name: 'Swiss Alps Adventure',
      image: heroSwissAlps,
      gradient: 'linear-gradient(135deg, hsl(135, 60%, 40%), hsl(200, 100%, 70%))'
    },
    {
      id: 'tokyo',
      name: 'Tokyo Experience',
      image: heroTokyo,
      gradient: 'linear-gradient(135deg, hsl(280, 100%, 70%), hsl(330, 90%, 70%))'
    },
    {
      id: 'sydney',
      name: 'Sydney Harbour',
      image: heroSydney,
      gradient: 'linear-gradient(135deg, hsl(200, 100%, 70%), hsl(45, 100%, 55%))'
    }
  ];
  
  const [selectedTheme, setSelectedTheme] = useState<Theme>(themes[0]);

  const handlePurchaseGiftCard = async () => {
    const amount = customAmount ? parseFloat(customAmount) : selectedAmount;
    if (amount < 25) {
      toast.error('Minimum gift card amount is $25 AUD');
      return;
    }
    toast.success(`Gift card for ${formatCurrency(amount, 'AUD')} purchased successfully!`);
  };

  const handleRedeemGiftCard = async () => {
    if (!redeemCode) {
      toast.error('Please enter a gift card code');
      return;
    }
    toast.success('Gift card redeemed successfully!');
    setRedeemCode('');
  };

  const currentAmount = customAmount ? parseFloat(customAmount) : selectedAmount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-6">
              MAKU Gift Cards
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Give the gift of unforgettable adventures. Perfect for birthdays, holidays, or any special occasion.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left Column - Purchase Gift Card */}
            <div className="space-y-8">
              <Card className="travel-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <Gift className="w-6 h-6 text-primary" />
                    Purchase Gift Card
                  </CardTitle>
                  <CardDescription className="text-base">
                    Choose your amount and destination theme
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Theme Selection */}
                  <ThemeSelector
                    themes={themes}
                    selectedTheme={selectedTheme}
                    onThemeSelect={setSelectedTheme}
                  />

                  {/* Amount Selection */}
                  <div>
                    <label className="text-sm font-medium mb-4 block text-foreground">
                      Select Amount (AUD)
                    </label>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {predefinedAmounts.map((amount) => (
                        <Button
                          key={amount}
                          variant={selectedAmount === amount ? "default" : "outline"}
                          onClick={() => {
                            setSelectedAmount(amount);
                            setCustomAmount('');
                          }}
                          className="h-14 text-base font-semibold"
                        >
                          {formatCurrency(amount, 'AUD', { showCode: false })}
                        </Button>
                      ))}
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-3 block text-foreground">
                        Or enter custom amount
                      </label>
                      <Input
                        type="number"
                        placeholder="Enter amount (min $25 AUD)"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        min="25"
                        className="h-12 text-base"
                      />
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 rounded-xl border border-primary/20">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-foreground font-medium">Gift Card Value:</span>
                      <span className="font-bold text-lg text-foreground">
                        {formatCurrency(currentAmount, 'AUD')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-foreground font-medium">You Pay:</span>
                      <span className="font-bold text-2xl text-primary">
                        {formatCurrency(currentAmount, 'AUD')}
                      </span>
                    </div>
                  </div>

                  <Button 
                    onClick={handlePurchaseGiftCard}
                    className="w-full h-14 text-lg font-semibold"
                    size="lg"
                  >
                    <CreditCard className="w-5 h-5 mr-3" />
                    Purchase Gift Card
                  </Button>
                </CardContent>
              </Card>

              {/* Redeem Gift Card */}
              <Card className="travel-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <CheckCircle className="w-6 h-6 text-accent" />
                    Redeem Gift Card
                  </CardTitle>
                  <CardDescription>
                    Enter your gift card code to add funds to your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-3 block text-foreground">
                      Gift Card Code
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter gift card code"
                      value={redeemCode}
                      onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                      className="font-mono h-12 text-base"
                    />
                  </div>

                  <Button 
                    onClick={handleRedeemGiftCard}
                    className="w-full h-12"
                    size="lg"
                    variant="secondary"
                  >
                    Redeem Gift Card
                  </Button>

                  <div className="bg-muted/50 p-4 rounded-lg border">
                    <h4 className="font-medium mb-2 text-foreground">How to redeem:</h4>
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

            {/* Right Column - Gift Card Preview & Benefits */}
            <div className="space-y-8">
              {/* Gift Card Preview */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">Gift Card Preview</h3>
                <GiftCardPreview
                  amount={currentAmount}
                  theme={selectedTheme}
                />
              </div>

              {/* Why Choose Our Gift Cards */}
              <Card className="travel-card">
                <CardHeader>
                  <CardTitle className="text-xl text-foreground">Why Choose Our Gift Cards?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Never Expires</h4>
                      <p className="text-muted-foreground text-sm">
                        Your gift card maintains its full value forever. No rush, no pressure.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Plane className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Global Adventures</h4>
                      <p className="text-muted-foreground text-sm">
                        Use for flights, hotels, activities, and complete travel packages worldwide.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Zap className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Instant Delivery</h4>
                      <p className="text-muted-foreground text-sm">
                        Digital delivery means your gift is ready immediately. Perfect for last-minute gifts.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default GiftCards;